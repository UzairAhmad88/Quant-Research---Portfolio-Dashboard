from datetime import datetime, timezone, timedelta
import pytest
from app.services.instrument_service import InstrumentService
from app.services.market_data_service import MarketDataService
from app.schemas.instrument import InstrumentCreate
from app.models.enums import AssetType, DataFrequency

def test_api_get_returns_analysis(client, sqlite_db):
    inst_service = InstrumentService(sqlite_db)
    inst = inst_service.register_instrument(InstrumentCreate(
        symbol="SPY",
        name="SPDR S&P 500 ETF Trust",
        asset_type=AssetType.ETF,
        exchange="NYSE"
    ))

    md_service = MarketDataService(sqlite_db)
    now = datetime.now(timezone.utc)

    # Insert 3 daily bars
    md_service.record_bar(type('OHLCVCreateMock', (), {
        'instrument_id': inst.id,
        'timestamp': now - timedelta(days=3),
        'frequency': DataFrequency.DAILY,
        'open': 400.0,
        'high': 405.0,
        'low': 398.0,
        'close': 400.0,
        'adjusted_close': 400.0,
        'volume': 10000.0,
        'provider': 'yahoo_finance',
        'provider_symbol': 'SPY'
    }))
    md_service.record_bar(type('OHLCVCreateMock', (), {
        'instrument_id': inst.id,
        'timestamp': now - timedelta(days=2),
        'frequency': DataFrequency.DAILY,
        'open': 400.0,
        'high': 412.0,
        'low': 399.0,
        'close': 410.0,
        'adjusted_close': 410.0,
        'volume': 12000.0,
        'provider': 'yahoo_finance',
        'provider_symbol': 'SPY'
    }))
    md_service.record_bar(type('OHLCVCreateMock', (), {
        'instrument_id': inst.id,
        'timestamp': now - timedelta(days=1),
        'frequency': DataFrequency.DAILY,
        'open': 410.0,
        'high': 422.0,
        'low': 408.0,
        'close': 420.0,
        'adjusted_close': 420.0,
        'volume': 15000.0,
        'provider': 'yahoo_finance',
        'provider_symbol': 'SPY'
    }))

    res = client.get(f"/api/v1/returns?instrument_id={inst.id}&price_source=adjusted&return_type=simple")
    assert res.status_code == 200
    data = res.json()

    assert data["instrument_id"] == inst.id
    assert data["symbol"] == "SPY"
    assert data["price_source"] == "adjusted"
    assert data["return_type"] == "simple"
    assert data["summary"]["annualization_factor"] == 252
    assert pytest.approx(data["summary"]["period_return"], 1e-4) == 0.05 # (420/400) - 1 = +5%
    assert len(data["series"]) == 3
    assert data["series"][0]["simple_return"] is None
    assert pytest.approx(data["series"][1]["simple_return"], 1e-4) == 0.025 # 410/400 - 1 = +2.5%
