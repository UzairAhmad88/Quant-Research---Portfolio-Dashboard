from datetime import datetime, timezone
import hashlib
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import pandas as pd

from app.db.session import get_db
from app.models.research import Watchlist, WatchlistItem, AlertRule, ResearchExperiment, ResearchNote
from app.models.instrument import Instrument
from app.models.market_data import OHLCV
from app.repositories.market_data_repository import MarketDataRepository
from app.repositories.instrument_repository import InstrumentRepository
from app.analytics.features.feature_engine import FeatureEngine
from app.analytics.risk.risk_engine import RiskEngine
from app.analytics.regime.regime_engine import MarketRegimeEngine
from app.analytics.backtesting.monte_carlo import MonteCarloEngine
from app.analytics.strategies.parameter_lab import ParameterLabEngine
from app.analytics.learning.glossary import QuantLearningEngine
from app.schemas.research_workstation import (
    WatchlistCreate,
    WatchlistResponse,
    WatchlistItemCreate,
    WatchlistItemResponse,
    AlertRuleCreate,
    AlertRuleResponse,
    FeatureExploreRequest,
    RiskAnalysisRequest,
    RegimeDetectionRequest,
    MonteCarloRequest,
    ParameterSweepRequest,
    ResearchExperimentCreate,
    ResearchNoteCreate,
)

router = APIRouter(prefix="/workstation", tags=["Research Workstation"])


def get_ohlcv_dataframe(db: Session, symbol: str) -> pd.DataFrame:
    inst = db.query(Instrument).filter(Instrument.symbol == symbol.upper()).first()
    if not inst:
        raise HTTPException(status_code=404, detail=f"Instrument '{symbol}' not found in database.")
    bars = (
        db.query(OHLCV)
        .filter(OHLCV.instrument_id == inst.id)
        .order_by(OHLCV.timestamp.asc())
        .all()
    )
    if not bars:
        raise HTTPException(status_code=400, detail=f"No market observations ingested for symbol '{symbol}'.")

    data = [
        {
            "timestamp": b.timestamp,
            "open": b.open,
            "high": b.high,
            "low": b.low,
            "close": b.close,
            "volume": b.volume,
        }
        for b in bars
    ]
    df = pd.DataFrame(data)
    df.set_index("timestamp", inplace=True)
    return df


# --- 1. Watchlists ---
@router.get("/watchlists", response_model=List[WatchlistResponse])
def list_watchlists(db: Session = Depends(get_db)):
    watchlists = db.query(Watchlist).all()
    if not watchlists:
        # Seed default Institutional Tech watchlist if empty
        default_wl = Watchlist(name="US Tech Alpha", description="Core mega-cap technology and broad market ETFs", is_default=True)
        db.add(default_wl)
        db.flush()
        for idx, sym in enumerate(["AAPL", "MSFT", "NVDA", "SPY", "QQQ"]):
            db.add(WatchlistItem(watchlist_id=default_wl.id, symbol=sym, display_order=idx))
        db.commit()
        db.refresh(default_wl)
        return [default_wl]
    return watchlists


@router.post("/watchlists", response_model=WatchlistResponse)
def create_watchlist(payload: WatchlistCreate, db: Session = Depends(get_db)):
    wl = Watchlist(name=payload.name, description=payload.description)
    db.add(wl)
    db.flush()
    if payload.symbols:
        for idx, sym in enumerate(payload.symbols):
            db.add(WatchlistItem(watchlist_id=wl.id, symbol=sym.upper(), display_order=idx))
    db.commit()
    db.refresh(wl)
    return wl


@router.post("/watchlists/{watchlist_id}/items", response_model=WatchlistItemResponse)
def add_watchlist_item(watchlist_id: str, payload: WatchlistItemCreate, db: Session = Depends(get_db)):
    wl = db.query(Watchlist).filter(Watchlist.id == watchlist_id).first()
    if not wl:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    item = WatchlistItem(
        watchlist_id=wl.id,
        symbol=payload.symbol.upper(),
        notes=payload.notes,
        display_order=len(wl.items),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


# --- 2. Alerts ---
@router.get("/alerts", response_model=List[AlertRuleResponse])
def list_alerts(db: Session = Depends(get_db)):
    return db.query(AlertRule).order_by(AlertRule.created_at.desc()).all()


@router.post("/alerts", response_model=AlertRuleResponse)
def create_alert(payload: AlertRuleCreate, db: Session = Depends(get_db)):
    alert = AlertRule(
        symbol=payload.symbol.upper(),
        alert_type=payload.alert_type,
        threshold=payload.threshold,
        comparator=payload.comparator,
        message=payload.message or f"Alert triggered when {payload.symbol} {payload.alert_type} {payload.comparator} {payload.threshold}",
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


# --- 3. Feature Explorer ---
@router.post("/features/explore")
def explore_feature(payload: FeatureExploreRequest, db: Session = Depends(get_db)):
    df = get_ohlcv_dataframe(db, payload.symbol)
    return FeatureEngine.explore_feature(df, payload.feature_name, payload.window)


# --- 4. Advanced Risk Engine ---
@router.post("/risk/analyze")
def analyze_risk(payload: RiskAnalysisRequest, db: Session = Depends(get_db)):
    df = get_ohlcv_dataframe(db, payload.symbol or "AAPL")
    ret_series = df["close"].pct_change().dropna()

    bm_series = None
    try:
        bm_df = get_ohlcv_dataframe(db, payload.benchmark_symbol)
        bm_series = bm_df["close"].pct_change().dropna()
    except Exception:
        pass

    return RiskEngine.calculate_portfolio_risk(
        returns=ret_series,
        benchmark_returns=bm_series,
        confidence_level=payload.confidence_level,
        portfolio_value=payload.portfolio_value,
    )


# --- 5. Market Regime Lab ---
@router.post("/regimes/detect")
def detect_regimes(payload: RegimeDetectionRequest, db: Session = Depends(get_db)):
    df = get_ohlcv_dataframe(db, payload.symbol)
    return MarketRegimeEngine.detect_regimes_rule_based(
        df,
        sma_fast=payload.sma_fast,
        sma_slow=payload.sma_slow,
        vol_lookback=payload.vol_lookback,
    )


# --- 6. Monte Carlo Research Lab ---
@router.post("/monte-carlo/simulate")
def simulate_monte_carlo(payload: MonteCarloRequest, db: Session = Depends(get_db)):
    df = get_ohlcv_dataframe(db, payload.symbol)
    ret_series = df["close"].pct_change().dropna().tolist()
    return MonteCarloEngine.run_simulation(
        returns=ret_series,
        initial_capital=payload.initial_capital,
        simulations_count=payload.simulations_count,
        horizon_periods=payload.horizon_periods,
        random_seed=payload.random_seed,
    )


# --- 7. Parameter Sweep & Walk-Forward ---
@router.post("/strategies/parameter-sweep")
def run_parameter_sweep(payload: ParameterSweepRequest, db: Session = Depends(get_db)):
    df = get_ohlcv_dataframe(db, payload.symbol)
    return ParameterLabEngine.run_sma_parameter_sweep(
        df,
        fast_range=payload.fast_range,
        slow_range=payload.slow_range,
        initial_capital=payload.initial_capital,
    )


@router.post("/strategies/walk-forward")
def run_walk_forward(symbol: str = "AAPL", db: Session = Depends(get_db)):
    df = get_ohlcv_dataframe(db, symbol)
    return ParameterLabEngine.run_walk_forward_analysis(df)


# --- 8. Quant Learning Mode & Glossary ---
@router.get("/learning/glossary")
def get_glossary():
    return QuantLearningEngine.get_glossary_terms()


@router.get("/learning/glossary/{term_key}")
def get_glossary_term(term_key: str):
    detail = QuantLearningEngine.get_term_detail(term_key)
    if not detail:
        raise HTTPException(status_code=404, detail="Glossary term not found")
    return detail


# --- 9. Research Experiments & Notes ---
@router.get("/research/experiments")
def list_experiments(db: Session = Depends(get_db)):
    return db.query(ResearchExperiment).order_by(ResearchExperiment.created_at.desc()).all()


@router.post("/research/experiments")
def save_experiment(payload: ResearchExperimentCreate, db: Session = Depends(get_db)):
    # Generate deterministic research fingerprint
    fp_raw = f"{payload.id}:{payload.dataset_identifier}:{payload.strategy_name}:{str(payload.parameters)}"
    fingerprint = hashlib.sha256(fp_raw.encode("utf-8")).hexdigest()[:16]

    exp = ResearchExperiment(
        id=payload.id,
        name=payload.name,
        hypothesis=payload.hypothesis,
        dataset_identifier=payload.dataset_identifier,
        strategy_name=payload.strategy_name,
        parameters=payload.parameters,
        metrics=payload.metrics,
        fingerprint=fingerprint,
        notes=payload.notes,
    )
    db.merge(exp)
    db.commit()
    return exp


@router.get("/research/notes")
def list_notes(db: Session = Depends(get_db)):
    return db.query(ResearchNote).order_by(ResearchNote.created_at.desc()).all()


@router.post("/research/notes")
def create_note(payload: ResearchNoteCreate, db: Session = Depends(get_db)):
    note = ResearchNote(
        title=payload.title,
        research_question=payload.research_question,
        instruments=payload.instruments,
        strategy_ref=payload.strategy_ref,
        backtest_ref=payload.backtest_ref,
        observations=payload.observations,
        conclusion=payload.conclusion,
        tags=payload.tags,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


# --- 10. Data Lineage & Provenance ---
@router.get("/data-lineage/{symbol}")
def get_data_lineage(symbol: str, db: Session = Depends(get_db)):
    inst = db.query(Instrument).filter(Instrument.symbol == symbol.upper()).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Instrument not found")

    count = db.query(OHLCV).filter(OHLCV.instrument_id == inst.id).count()
    latest_bar = (
        db.query(OHLCV)
        .filter(OHLCV.instrument_id == inst.id)
        .order_by(OHLCV.timestamp.desc())
        .first()
    )
    earliest_bar = (
        db.query(OHLCV)
        .filter(OHLCV.instrument_id == inst.id)
        .order_by(OHLCV.timestamp.asc())
        .first()
    )

    return {
        "instrument": {
            "symbol": inst.symbol,
            "name": inst.name,
            "exchange": inst.exchange,
            "asset_type": inst.asset_type,
            "currency": inst.currency,
        },
        "lineage": {
            "provider": "Yahoo Finance Engine (yfinance v0.2+)",
            "retrieval_protocol": "REST / OHLCV Daily Ingestion Pipeline",
            "observation_count": count,
            "date_range": {
                "start": str(earliest_bar.timestamp.date()) if earliest_bar else "N/A",
                "end": str(latest_bar.timestamp.date()) if latest_bar else "N/A",
            },
            "data_quality": "GOOD" if count >= 100 else "PARTIAL",
            "adjustments": "Stock Splits and Cash Dividends Proportionately Adjusted",
            "last_verified_utc": datetime.now(timezone.utc).isoformat(),
        },
    }
