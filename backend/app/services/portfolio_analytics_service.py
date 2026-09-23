from datetime import datetime
from typing import Optional, List, Dict, Tuple
from sqlalchemy.orm import Session
import pandas as pd

from app.models.enums import DataFrequency
from app.repositories.portfolio_repository import PortfolioRepository
from app.repositories.market_data_repository import MarketDataRepository
from app.services.data_quality_service import DataQualityService
from app.analytics.portfolio import PortfolioCalculator
from app.schemas.portfolio import (
    PortfolioAnalyticsResponse,
    PortfolioSummaryItem,
    HoldingAnalyticsItem,
    AllocationItem,
    PerformancePoint,
)
from app.validators import QualityStatus
from app.core.exceptions import NotFoundError, ValidationError

class PortfolioAnalyticsService:
    def __init__(self, db: Session):
        self.db = db
        self.portfolio_repo = PortfolioRepository(db)
        self.market_repo = MarketDataRepository(db)
        self.quality_service = DataQualityService(db)

    def calculate_analytics(
        self,
        portfolio_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        price_source: str = "adjusted",
        frequency: DataFrequency = DataFrequency.DAILY,
    ) -> PortfolioAnalyticsResponse:
        portfolio = self.portfolio_repo.get_portfolio(portfolio_id)
        if not portfolio or not portfolio.is_active:
            raise NotFoundError(f"Portfolio '{portfolio_id}' was not found.")

        clean_price_source = price_source.lower().strip()
        if clean_price_source not in ("adjusted", "close"):
            raise ValidationError("Price source must be 'adjusted' or 'close'.")

        active_holdings = [h for h in portfolio.holdings if h.is_active]

        # Calculate initial values
        initial_capital = float(portfolio.initial_capital)
        initial_invested = sum(float(h.quantity) * float(h.entry_price) for h in active_holdings)
        cash = max(0.0, initial_capital - initial_invested)

        # Empty holdings case
        if not active_holdings:
            summary = PortfolioSummaryItem(
                initial_capital=initial_capital,
                initial_invested_value=0.0,
                cash=initial_capital,
                current_invested_value=0.0,
                current_portfolio_value=initial_capital,
                total_pnl=0.0,
                total_return=0.0,
            )
            cash_allocation = AllocationItem(
                label="Cash", symbol="CASH", value=initial_capital, weight=100.0, color="#64748B"
            )
            return PortfolioAnalyticsResponse(
                portfolio_id=portfolio.id,
                name=portfolio.name,
                base_currency=portfolio.base_currency,
                price_source=clean_price_source,
                quality_status=QualityStatus.GOOD.value,
                quality_warnings=["Portfolio contains no active holdings."],
                summary=summary,
                holdings=[],
                allocation=[cash_allocation],
                performance_series=[],
            )

        # Gather market data and data quality reports for each instrument
        quality_status = QualityStatus.GOOD.value
        quality_warnings: List[str] = []

        # Map holding_id -> list of (timestamp, price)
        holding_series: Dict[str, List[Tuple[datetime, float]]] = {}
        current_prices: Dict[str, float] = {}

        for h in active_holdings:
            # Data quality check
            q_report = self.quality_service.get_instrument_quality_report(
                instrument_id=h.instrument_id,
                start_date=start_date,
                end_date=end_date,
                frequency=frequency,
            )
            if q_report.status == QualityStatus.INVALID:
                quality_status = QualityStatus.INVALID.value
                quality_warnings.append(
                    f"Instrument '{h.instrument.symbol}' market data is invalid."
                )
            elif q_report.status == QualityStatus.GOOD_WITH_WARNINGS and quality_status != QualityStatus.INVALID.value:
                quality_status = QualityStatus.GOOD_WITH_WARNINGS.value
                quality_warnings.append(
                    f"Instrument '{h.instrument.symbol}' has market data warnings."
                )

            bars = self.market_repo.get_bars(
                instrument_id=h.instrument_id,
                start_date=start_date,
                end_date=end_date,
                frequency=frequency,
                limit=10000,
            )

            if not bars:
                quality_warnings.append(
                    f"No historical price data found for instrument '{h.instrument.symbol}'."
                )
                current_prices[h.id] = float(h.entry_price)
                holding_series[h.id] = []
            else:
                series = []
                for b in bars:
                    p = float(b.adjusted_close) if (clean_price_source == "adjusted" and b.adjusted_close is not None) else float(b.close)
                    series.append((b.timestamp, p))
                series.sort(key=lambda x: x[0])
                holding_series[h.id] = series
                current_prices[h.id] = series[-1][1]

        # Calculate current position analytics
        holding_analytics: List[HoldingAnalyticsItem] = []
        current_invested = 0.0

        for h in active_holdings:
            c_price = current_prices[h.id]
            init_val = PortfolioCalculator.calculate_position_value(float(h.quantity), float(h.entry_price))
            curr_val = PortfolioCalculator.calculate_position_value(float(h.quantity), c_price)
            current_invested += curr_val

        current_portfolio_val = cash + current_invested
        total_pnl = current_portfolio_val - initial_capital
        portfolio_ret = (current_portfolio_val / initial_capital - 1.0) if initial_capital > 0 else 0.0

        for h in active_holdings:
            c_price = current_prices[h.id]
            init_val = PortfolioCalculator.calculate_position_value(float(h.quantity), float(h.entry_price))
            curr_val = PortfolioCalculator.calculate_position_value(float(h.quantity), c_price)

            inv_weight = (init_val / initial_invested * 100.0) if initial_invested > 0 else 0.0
            tot_weight = (curr_val / current_portfolio_val * 100.0) if current_portfolio_val > 0 else 0.0

            pnl_amt = curr_val - init_val
            pnl_pct = (curr_val / init_val - 1.0) * 100.0 if init_val > 0 else 0.0
            # Contribution: weight_in_portfolio * asset_return
            contribution = (inv_weight / 100.0) * pnl_pct

            holding_analytics.append(
                HoldingAnalyticsItem(
                    holding_id=h.id,
                    instrument_id=h.instrument_id,
                    symbol=h.instrument.symbol,
                    name=h.instrument.name,
                    asset_type=h.instrument.asset_type.value,
                    quantity=float(h.quantity),
                    entry_price=float(h.entry_price),
                    current_price=c_price,
                    initial_value=init_val,
                    current_value=curr_val,
                    invested_weight=inv_weight,
                    total_weight=tot_weight,
                    target_weight=float(h.target_weight) if h.target_weight is not None else None,
                    pnl_amount=pnl_amt,
                    pnl_percent=pnl_pct,
                    contribution_percent=contribution,
                )
            )

        # Build Allocation Items (Positions + Cash)
        colors = ["#3B82F6", "#22C55E", "#EAB308", "#A855F7", "#EC4899", "#F97316", "#06B6D4"]
        allocation_items: List[AllocationItem] = []

        for idx, item in enumerate(holding_analytics):
            allocation_items.append(
                AllocationItem(
                    label=item.symbol,
                    symbol=item.symbol,
                    value=item.current_value,
                    weight=item.total_weight,
                    color=colors[idx % len(colors)],
                )
            )

        if cash > 0:
            cash_weight = (cash / current_portfolio_val * 100.0) if current_portfolio_val > 0 else 0.0
            allocation_items.append(
                AllocationItem(
                    label="Cash",
                    symbol="CASH",
                    value=cash,
                    weight=cash_weight,
                    color="#64748B",
                )
            )

        # Calculate Historical Performance Series (Equity Curve)
        # Vectorize time series using Pandas across all timestamps
        performance_series: List[PerformancePoint] = []

        # Collect all timestamps
        all_timestamps = sorted(
            list(set(ts for s in holding_series.values() for ts, _ in s))
        )

        if all_timestamps:
            # Build DataFrame with timestamp index and instrument columns
            df_dict: Dict[str, Dict[datetime, float]] = {}
            for h in active_holdings:
                series_map = {ts: price for ts, price in holding_series[h.id]}
                df_dict[h.id] = series_map

            df = pd.DataFrame(df_dict, index=all_timestamps)
            # Forward-fill and backward-fill missing price points for holdings if any alignment gap exists
            df = df.ffill().bfill()

            for ts, row in df.iterrows():
                invested_t = sum(
                    float(h.quantity) * float(row[h.id])
                    for h in active_holdings
                    if pd.notna(row[h.id])
                )
                port_val_t = cash + invested_t
                cum_ret_t = (port_val_t / initial_capital - 1.0) if initial_capital > 0 else 0.0

                performance_series.append(
                    PerformancePoint(
                        timestamp=ts,  # type: ignore
                        portfolio_value=port_val_t,
                        invested_value=invested_t,
                        cumulative_return=cum_ret_t,
                    )
                )

        summary = PortfolioSummaryItem(
            initial_capital=initial_capital,
            initial_invested_value=initial_invested,
            cash=cash,
            current_invested_value=current_invested,
            current_portfolio_value=current_portfolio_val,
            total_pnl=total_pnl,
            total_return=portfolio_ret,
        )

        return PortfolioAnalyticsResponse(
            portfolio_id=portfolio.id,
            name=portfolio.name,
            base_currency=portfolio.base_currency,
            price_source=clean_price_source,
            quality_status=quality_status,
            quality_warnings=quality_warnings,
            summary=summary,
            holdings=holding_analytics,
            allocation=allocation_items,
            performance_series=performance_series,
        )
