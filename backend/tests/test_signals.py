from datetime import datetime, timedelta
import pytest
from app.models.enums import SignalType, SignalState, SignalSource, StrategyType
from app.models.market_data import OHLCV
from app.repositories.signal_repository import SignalRepository
from app.services.signal_service import SignalService
from app.services.strategy_service import StrategyService


def test_signal_enums():
    assert SignalType.BUY == "BUY"
    assert SignalType.SELL == "SELL"
    assert SignalState.BULLISH == "BULLISH"
    assert SignalState.BEARISH == "BEARISH"
    assert SignalState.NEUTRAL == "NEUTRAL"
    assert SignalSource.STRATEGY_ENGINE == "STRATEGY_ENGINE"
    assert StrategyType.MOVING_AVERAGE == "MOVING_AVERAGE"


def test_signal_repository_idempotency_and_creation(sqlite_db, client):
    # 1. Create instrument
    inst = client.post(
        "/api/v1/instruments",
        json={
            "symbol": "GOOGL",
            "name": "Alphabet Inc",
            "asset_type": "EQUITY",
            "exchange": "NASDAQ",
            "currency": "USD"
        }
    ).json()

    repo = SignalRepository(sqlite_db)
    
    # 2. Get or create strategy configuration
    config1 = repo.get_or_create_configuration(
        instrument_id=inst["id"],
        strategy_type="MOVING_AVERAGE",
        ma_type="SMA",
        fast_window=20,
        slow_window=50,
        price_source="adjusted"
    )
    assert config1.id is not None
    assert config1.configuration_hash is not None

    # 3. Repeat get_or_create_configuration -> must return same config object
    config2 = repo.get_or_create_configuration(
        instrument_id=inst["id"],
        strategy_type="MOVING_AVERAGE",
        ma_type="SMA",
        fast_window=20,
        slow_window=50,
        price_source="adjusted"
    )
    assert config1.id == config2.id
    assert config1.configuration_hash == config2.configuration_hash

    # 4. Bulk create signals
    ts1 = datetime(2026, 1, 15)
    ts2 = datetime(2026, 2, 20)
    signals_data = [
        {
            "timestamp": ts1,
            "signal_type": "BUY",
            "signal_state": "BULLISH",
            "price": 180.50,
            "metadata": {"fast_ma": 181.0, "slow_ma": 180.0}
        },
        {
            "timestamp": ts2,
            "signal_type": "SELL",
            "signal_state": "BEARISH",
            "price": 175.25,
            "metadata": {"fast_ma": 174.5, "slow_ma": 175.0}
        }
    ]

    created, skipped = repo.bulk_create_signals(
        strategy_configuration_id=config1.id,
        instrument_id=inst["id"],
        signals_data=signals_data
    )
    assert created == 2
    assert skipped == 0

    # 5. Repeat bulk create with same data -> must skip duplicates (Idempotency)
    created_again, skipped_again = repo.bulk_create_signals(
        strategy_configuration_id=config1.id,
        instrument_id=inst["id"],
        signals_data=signals_data
    )
    assert created_again == 0
    assert skipped_again == 2

    # 6. Query signals
    signals, total = repo.get_signals(
        instrument_id=inst["id"],
        strategy_configuration_id=config1.id
    )
    assert total == 2
    assert len(signals) == 2
    assert signals[0].signal_type in ("BUY", "SELL")


def test_strategy_execution_signal_persistence_integration(sqlite_db, client):
    # 1. Create instrument
    inst = client.post(
        "/api/v1/instruments",
        json={
            "symbol": "AMZN",
            "name": "Amazon.com Inc",
            "asset_type": "EQUITY",
            "exchange": "NASDAQ",
            "currency": "USD"
        }
    ).json()

    # 2. Populate 70 days market data with crossover behavior
    base_date = datetime(2025, 1, 1)
    bars = []
    price = 100.0
    for i in range(70):
        ts = base_date + timedelta(days=i)
        # Price goes up to trigger BUY, then drops to trigger SELL
        if i < 35:
            price += 2.0
        else:
            price -= 2.0
        bars.append(OHLCV(
            instrument_id=inst["id"],
            timestamp=ts,
            frequency="DAILY",
            open=price,
            high=price + 0.5,
            low=price - 0.5,
            close=price,
            adjusted_close=price,
            volume=2000000.0,
            provider="yahoo_finance"
        ))

    sqlite_db.add_all(bars)
    sqlite_db.commit()

    # 3. Execute strategy service calculation (1st execution)
    strat_service = StrategyService(sqlite_db)
    res1 = strat_service.calculate_moving_average_strategy(
        instrument_id=inst["id"],
        ma_type="sma",
        fast_window=10,
        slow_window=20
    )
    assert res1.is_sufficient is True

    # 4. Check signals created in DB via SignalService
    sig_service = SignalService(sqlite_db)
    sig_resp1 = sig_service.get_signals(instrument_id=inst["id"])
    assert sig_resp1.total > 0
    initial_signal_count = sig_resp1.total

    # 5. Execute strategy calculation a SECOND time (Idempotency test)
    res2 = strat_service.calculate_moving_average_strategy(
        instrument_id=inst["id"],
        ma_type="sma",
        fast_window=10,
        slow_window=20
    )
    assert res2.is_sufficient is True

    sig_resp2 = sig_service.get_signals(instrument_id=inst["id"])
    # Total signals MUST remain identical (0 duplicates created)
    assert sig_resp2.total == initial_signal_count

    # 6. Change strategy configuration parameters (Recomputation/Distinct config test)
    res3 = strat_service.calculate_moving_average_strategy(
        instrument_id=inst["id"],
        ma_type="ema",
        fast_window=5,
        slow_window=15
    )
    assert res3.is_sufficient is True

    sig_resp3 = sig_service.get_signals(instrument_id=inst["id"])
    # Signals count should reflect new configuration events
    assert sig_resp3.total >= initial_signal_count


def test_signals_api_endpoints(client, sqlite_db):
    # 1. Create instrument
    inst = client.post(
        "/api/v1/instruments",
        json={
            "symbol": "TSLA",
            "name": "Tesla Inc",
            "asset_type": "EQUITY",
            "exchange": "NASDAQ",
            "currency": "USD"
        }
    ).json()

    # 2. Add market data and generate signals
    base_date = datetime(2025, 1, 1)
    bars = []
    price = 200.0
    for i in range(60):
        ts = base_date + timedelta(days=i)
        price += 3.0 if i < 30 else -3.0
        bars.append(OHLCV(
            instrument_id=inst["id"],
            timestamp=ts,
            frequency="DAILY",
            open=price,
            high=price + 1.0,
            low=price - 1.0,
            close=price,
            adjusted_close=price,
            volume=3000000.0,
            provider="yahoo_finance"
        ))
    sqlite_db.add_all(bars)
    sqlite_db.commit()

    # Run strategy calculation to persist signals
    client.get(
        "/api/v1/strategies/moving-average",
        params={
            "instrument_id": inst["id"],
            "fast_window": 10,
            "slow_window": 20
        }
    )

    # 3. GET /api/v1/signals
    resp = client.get("/api/v1/signals", params={"instrument_id": inst["id"]})
    assert resp.status_code == 200
    data = resp.json()

    assert "items" in data
    assert "total" in data
    assert data["total"] > 0
    first_signal = data["items"][0]
    assert first_signal["signal_type"] in ("BUY", "SELL")
    assert first_signal["signal_state"] in ("BULLISH", "BEARISH")
    assert first_signal["strategy_type"] == "MOVING_AVERAGE"
    assert "metadata" in first_signal

    # 4. GET /api/v1/signals/{id}
    sig_id = first_signal["id"]
    single_resp = client.get(f"/api/v1/signals/{sig_id}")
    assert single_resp.status_code == 200
    single_data = single_resp.json()
    assert single_data["id"] == sig_id
    assert single_data["instrument_id"] == inst["id"]

    # 5. Filter tests
    buy_resp = client.get("/api/v1/signals", params={"instrument_id": inst["id"], "signal_type": "BUY"})
    assert buy_resp.status_code == 200
    buy_items = buy_resp.json()["items"]
    for item in buy_items:
        assert item["signal_type"] == "BUY"

    # 6. Non-existent signal ID -> 404
    bad_resp = client.get("/api/v1/signals/non-existent-uuid-999")
    assert bad_resp.status_code == 404
