import io
import csv
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status, Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.backtest_service import BacktestService
from app.analytics.backtesting.report_service import ReportService
from app.analytics.backtesting.report_pdf_generator import generate_backtest_pdf_report
from app.schemas.report import BacktestReportResponse
from app.schemas.backtest import (
    BacktestCreate,
    BacktestResponse,
    BacktestListResponse,
    TradeEventResponse,
    CompletedTradeResponse,
    PortfolioStateResponse,
    BacktestPerformanceResponse,
    BacktestEquityResponse,
    BacktestDrawdownSeriesResponse,
    BacktestDrawdownPeriodsResponse,
)

router = APIRouter(prefix="/backtests", tags=["Backtesting"])


@router.post(
    "",
    response_model=BacktestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Execute a historical backtest simulation for an instrument and strategy configuration"
)
def create_backtest(
    payload: BacktestCreate,
    db: Session = Depends(get_db)
):
    service = BacktestService(db)
    return service.run_backtest(payload)


@router.get(
    "",
    response_model=BacktestListResponse,
    summary="List historical backtests with optional instrument and configuration filters"
)
def list_backtests(
    instrument_id: Optional[str] = Query(None, description="Instrument UUID filter"),
    strategy_configuration_id: Optional[str] = Query(None, description="Strategy Configuration UUID filter"),
    limit: int = Query(50, ge=1, le=500, description="Max records to return"),
    offset: int = Query(0, ge=0, description="Records offset"),
    db: Session = Depends(get_db)
):
    service = BacktestService(db)
    return service.list_backtests(
        instrument_id=instrument_id,
        strategy_configuration_id=strategy_configuration_id,
        limit=limit,
        offset=offset
    )


@router.get(
    "/{backtest_id}",
    response_model=BacktestResponse,
    summary="Get details and simulation metadata for a specific backtest by UUID"
)
def get_backtest_by_id(
    backtest_id: str,
    db: Session = Depends(get_db)
):
    service = BacktestService(db)
    return service.get_backtest_by_id(backtest_id)


@router.get(
    "/{backtest_id}/trades",
    response_model=List[TradeEventResponse],
    summary="Get simulated trade execution events for a specific backtest"
)
def get_backtest_trades(
    backtest_id: str,
    limit: int = Query(500, ge=1, le=5000, description="Max trades to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db)
):
    service = BacktestService(db)
    return service.get_trade_events(backtest_id=backtest_id, limit=limit, offset=offset)


@router.get(
    "/{backtest_id}/completed-trades",
    response_model=List[CompletedTradeResponse],
    summary="Get completed round-trip trades (entry/exit P&L economics) for a specific backtest"
)
def get_backtest_completed_trades(
    backtest_id: str,
    limit: int = Query(500, ge=1, le=5000, description="Max completed trades to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db)
):
    service = BacktestService(db)
    return service.get_completed_trades(backtest_id=backtest_id, limit=limit, offset=offset)


@router.get(
    "/{backtest_id}/states",
    response_model=List[PortfolioStateResponse],
    summary="Get chronological portfolio valuation state history for a specific backtest"
)
def get_backtest_states(
    backtest_id: str,
    limit: int = Query(2000, ge=1, le=10000, description="Max states to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db)
):
    service = BacktestService(db)
    return service.get_portfolio_states(backtest_id=backtest_id, limit=limit, offset=offset)


@router.get(
    "/{backtest_id}/performance",
    response_model=BacktestPerformanceResponse,
    summary="Get comprehensive quantitative performance evaluation metrics for a completed backtest"
)
def get_backtest_performance(
    backtest_id: str,
    risk_free_rate: float = Query(0.0, ge=0.0, le=1.0, description="Annualized risk-free rate (e.g. 0.0)"),
    db: Session = Depends(get_db)
):
    service = BacktestService(db)
    return service.get_backtest_performance(backtest_id=backtest_id, risk_free_rate=risk_free_rate)


@router.get(
    "/{backtest_id}/equity",
    response_model=BacktestEquityResponse,
    summary="Get detailed portfolio equity curve and drawdown time series for a completed backtest"
)
def get_backtest_equity(
    backtest_id: str,
    db: Session = Depends(get_db)
):
    service = BacktestService(db)
    return service.get_backtest_equity(backtest_id=backtest_id)


@router.get(
    "/{backtest_id}/drawdown",
    response_model=BacktestDrawdownSeriesResponse,
    summary="Get underwater drawdown time series and running peak history for a completed backtest"
)
def get_backtest_drawdown_series(
    backtest_id: str,
    db: Session = Depends(get_db)
):
    service = BacktestService(db)
    return service.get_backtest_drawdown_series(backtest_id=backtest_id)


@router.get(
    "/{backtest_id}/drawdown-periods",
    response_model=BacktestDrawdownPeriodsResponse,
    summary="Get detected discrete drawdown periods (Peak -> Trough -> Recovery) for a completed backtest"
)
def get_backtest_drawdown_periods(
    backtest_id: str,
    db: Session = Depends(get_db)
):
    service = BacktestService(db)
    return service.get_backtest_drawdown_periods(backtest_id=backtest_id)


@router.get(
    "/{backtest_id}/report",
    response_model=BacktestReportResponse,
    summary="Generate a comprehensive, structured quantitative research report for a completed backtest"
)
def get_backtest_report(
    backtest_id: str,
    db: Session = Depends(get_db)
):
    report_service = ReportService(db)
    return report_service.generate_report(backtest_id)


@router.get(
    "/{backtest_id}/report/export",
    summary="Export the structured backtest research report in JSON, CSV, or PDF format"
)
def export_backtest_report(
    backtest_id: str,
    format: str = Query("pdf", description="Export format: 'pdf', 'csv', or 'json'"),
    db: Session = Depends(get_db)
):
    from app.export import ExportService, ExportMetadata

    report_service = ReportService(db)
    report = report_service.generate_report(backtest_id)

    export_service = ExportService()
    metadata = ExportMetadata(
        export_type="BACKTEST_REPORT",
        instrument=report.configuration.instrument_id,
        symbol=report.executive_summary.symbol,
        date_range=f"{report.configuration.start_date.isoformat() if report.configuration.start_date else 'START'}_{report.configuration.end_date.isoformat() if report.configuration.end_date else 'END'}",
        extra={
            "backtest_id": backtest_id,
            "report_version": report.report_version,
            "strategy": report.executive_summary.strategy_name,
            "configuration_hash": report.configuration_hash,
        }
    )

    fmt = format.lower().strip()
    if fmt == "pdf":
        prefix = f"{report.executive_summary.symbol or 'inst'}_backtest_{backtest_id[:8]}_report"
        return export_service.create_export_response(
            data=report,
            metadata=metadata,
            format_str="pdf",
            filename_prefix=prefix
        )
    elif fmt == "csv":
        # Structured research summary CSV
        output = io.StringIO()
        writer = csv.writer(output, lineterminator="\n")

        writer.writerow(["QUANT RESEARCH DASHBOARD - BACKTEST RESEARCH REPORT"])
        writer.writerow(["Report Version", report.report_version])
        writer.writerow(["Backtest ID", report.backtest_id])
        writer.writerow(["Configuration Hash", report.configuration_hash])
        writer.writerow(["Generated UTC", report.generated_at.isoformat()])
        writer.writerow([])

        writer.writerow(["EXECUTIVE SUMMARY"])
        writer.writerow(["Symbol", report.executive_summary.symbol])
        writer.writerow(["Strategy Name", report.executive_summary.strategy_name])
        writer.writerow(["Start Date", report.executive_summary.start_date])
        writer.writerow(["End Date", report.executive_summary.end_date])
        writer.writerow(["Initial Capital", report.executive_summary.initial_capital])
        writer.writerow(["Final Equity", report.executive_summary.final_portfolio_value])
        writer.writerow(["Total Return", report.executive_summary.total_return])
        writer.writerow(["Annualized Return (CAGR)", report.executive_summary.annualized_return])
        writer.writerow(["Annualized Volatility", report.executive_summary.annualized_volatility])
        writer.writerow(["Sharpe Ratio", report.executive_summary.sharpe_ratio])
        writer.writerow(["Sortino Ratio", report.executive_summary.sortino_ratio])
        writer.writerow(["Maximum Drawdown", report.executive_summary.max_drawdown])
        writer.writerow(["Trade Count", report.executive_summary.trade_count])
        writer.writerow(["Win Rate", report.executive_summary.win_rate])
        writer.writerow([])

        writer.writerow(["DRAWDOWN PERIODS"])
        writer.writerow(["Peak Timestamp", "Trough Timestamp", "Recovery Timestamp", "Drawdown %", "Drawdown Amount", "Duration (Days)", "Recovery Duration (Days)", "Status"])
        for p in report.drawdown_summary.periods:
            writer.writerow([
                p.peak_timestamp,
                p.trough_timestamp,
                p.recovery_timestamp or "",
                p.drawdown_percentage,
                p.drawdown_amount,
                p.duration_days,
                p.recovery_duration_days or "",
                p.status
            ])
        writer.writerow([])

        writer.writerow(["REPRODUCIBILITY SPECIFICATION"])
        writer.writerow(["Parameter", "Value"])
        writer.writerow(["Backtest ID", report.reproducibility.backtest_id])
        writer.writerow(["Strategy Config ID", report.reproducibility.strategy_configuration_id])
        writer.writerow(["Instrument ID", report.reproducibility.instrument_id])
        writer.writerow(["Provider", report.reproducibility.provider])
        writer.writerow(["Frequency", report.reproducibility.data_frequency])
        writer.writerow(["Price Source", report.reproducibility.price_source])
        writer.writerow(["Execution Timing", report.reproducibility.execution_timing])
        writer.writerow(["Position Sizing", report.reproducibility.position_sizing])
        writer.writerow(["Commission Rate", report.reproducibility.commission])
        writer.writerow(["Slippage Rate", report.reproducibility.slippage])
        writer.writerow(["Configuration Hash", report.reproducibility.configuration_hash])

        csv_bytes = output.getvalue().encode("utf-8")
        prefix = f"{report.executive_summary.symbol or 'inst'}_backtest_{backtest_id[:8]}_report"
        filename = f"{prefix}.csv"
        return Response(
            content=csv_bytes,
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{filename}"', "Access-Control-Expose-Headers": "Content-Disposition"}
        )
    else:
        # Default JSON
        prefix = f"{report.executive_summary.symbol or 'inst'}_backtest_{backtest_id[:8]}_report"
        return export_service.create_export_response(
            data=report,
            metadata=metadata,
            format_str="json",
            filename_prefix=prefix
        )


@router.get(
    "/{backtest_id}/export",
    summary="Unified Backtest Export for Research Report, Trades, Equity, Drawdown, or Portfolio States"
)
def export_backtest_data(
    backtest_id: str,
    data_type: str = Query("report", description="Export type: 'report', 'trades', 'equity', 'drawdown', or 'states'"),
    format: str = Query("csv", description="Format: 'csv', 'json', or 'pdf' (pdf only for report)"),
    db: Session = Depends(get_db)
):
    dt = data_type.lower().strip()
    if dt == "report":
        return export_backtest_report(backtest_id=backtest_id, format=format, db=db)

    from app.export import ExportService, ExportMetadata
    from app.repositories.backtest_repository import BacktestRepository
    from app.repositories.instrument_repository import InstrumentRepository
    from app.core.exceptions import ValidationError, NotFoundError

    export_service = ExportService()
    backtest_repo = BacktestRepository(db)
    backtest = backtest_repo.get_backtest_by_id(backtest_id)
    if not backtest:
        raise NotFoundError(f"Backtest with ID '{backtest_id}' was not found.")

    inst = InstrumentRepository(db).get_by_id(backtest.instrument_id)
    symbol = inst.symbol if inst else "INSTRUMENT"

    metadata = ExportMetadata(
        export_type=f"BACKTEST_{dt.upper()}",
        instrument=str(backtest.instrument_id),
        symbol=symbol,
        date_range=f"{backtest.start_date.isoformat() if backtest.start_date else 'START'}_{backtest.end_date.isoformat() if backtest.end_date else 'END'}",
        extra={"backtest_id": backtest_id}
    )

    fmt_lower = format.lower().strip()

    if dt == "trades":
        trades, _ = backtest_repo.get_completed_trades(backtest.id, limit=10000)
        if fmt_lower == "json":
            data = [
                {
                    "trade_id": str(t.id),
                    "entry_timestamp": t.entry_timestamp.isoformat() if t.entry_timestamp else None,
                    "exit_timestamp": t.exit_timestamp.isoformat() if t.exit_timestamp else None,
                    "entry_price": float(t.entry_price),
                    "exit_price": float(t.exit_price),
                    "quantity": float(t.quantity),
                    "direction": str(t.direction),
                    "gross_pnl": float(t.gross_pnl),
                    "net_pnl": float(t.net_pnl),
                    "return_percentage": float(t.return_percentage),
                    "total_commission": float(t.total_commission),
                    "total_slippage": float(t.total_slippage),
                    "holding_period_days": t.holding_period_days,
                }
                for t in trades
            ]
        else:
            headers = [
                "trade_id", "entry_timestamp", "exit_timestamp", "entry_price", "exit_price",
                "quantity", "direction", "gross_pnl", "net_pnl", "return_percentage",
                "total_commission", "total_slippage", "holding_period_days"
            ]
            rows = [
                [
                    t.id, t.entry_timestamp, t.exit_timestamp, float(t.entry_price), float(t.exit_price),
                    float(t.quantity), t.direction, float(t.gross_pnl), float(t.net_pnl), float(t.return_percentage),
                    float(t.total_commission), float(t.total_slippage), t.holding_period_days
                ]
                for t in trades
            ]
            data = {"headers": headers, "rows": rows}
        prefix = f"{symbol}_backtest_{backtest_id[:8]}_trades"

    elif dt == "equity":
        service = BacktestService(db)
        equity_res = service.get_backtest_equity(backtest.id)
        if fmt_lower == "json":
            data = equity_res.model_dump(mode="json")
        else:
            headers = ["timestamp", "cash", "position_value", "total_equity", "unrealized_pnl"]
            rows = [
                [p.timestamp, p.cash, p.position_value, p.total_equity, p.unrealized_pnl]
                for p in equity_res.equity_curve
            ]
            data = {"headers": headers, "rows": rows}
        prefix = f"{symbol}_backtest_{backtest_id[:8]}_equity"

    elif dt == "drawdown":
        service = BacktestService(db)
        dd_res = service.get_backtest_drawdown_series(backtest.id)
        if fmt_lower == "json":
            data = dd_res.model_dump(mode="json")
        else:
            headers = ["timestamp", "portfolio_value", "running_peak", "drawdown_amount", "drawdown_percentage"]
            rows = [
                [p.timestamp, p.portfolio_value, p.running_peak, p.drawdown_amount, p.drawdown_percentage]
                for p in dd_res.drawdown_series
            ]
            data = {"headers": headers, "rows": rows}
        prefix = f"{symbol}_backtest_{backtest_id[:8]}_drawdown"

    elif dt == "states":
        states, _ = backtest_repo.get_portfolio_states(backtest.id, limit=10000)
        if fmt_lower == "json":
            data = [
                {
                    "timestamp": s.timestamp.isoformat() if s.timestamp else None,
                    "cash": float(s.cash),
                    "position_quantity": float(s.position_quantity),
                    "position_value": float(s.position_value),
                    "portfolio_value": float(s.portfolio_value),
                    "unrealized_pnl": float(s.unrealized_pnl),
                }
                for s in states
            ]
        else:
            headers = ["timestamp", "cash", "position_quantity", "position_value", "portfolio_value", "unrealized_pnl"]
            rows = [
                [s.timestamp, float(s.cash), float(s.position_quantity), float(s.position_value), float(s.portfolio_value), float(s.unrealized_pnl)]
                for s in states
            ]
            data = {"headers": headers, "rows": rows}
        prefix = f"{symbol}_backtest_{backtest_id[:8]}_states"

    else:
        raise ValidationError(f"Unknown data_type '{data_type}'. Supported: 'report', 'trades', 'equity', 'drawdown', 'states'.")

    return export_service.create_export_response(
        data=data,
        metadata=metadata,
        format_str=format,
        filename_prefix=prefix
    )

