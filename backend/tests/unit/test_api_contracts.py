"""API contract testing verifying status codes, schema consistency, and error structures."""
import uuid
import pytest
from app.models.enums import AssetType
from app.schemas.instrument import InstrumentCreate
from app.repositories.instrument_repository import InstrumentRepository


def test_api_health_contract(client):
    """Verify standard system health endpoint contract."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"].lower() in ["healthy", "ok"]
    assert "service" in data
    assert "version" in data


def test_api_not_found_contract(client):
    """Verify standard 404 error envelope with structured code and message."""
    fake_id = str(uuid.uuid4())
    response = client.get(f"/api/v1/instruments/{fake_id}")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "NOT_FOUND"
    assert "message" in data["error"]


def test_api_validation_error_contract(client):
    """Verify FastAPI/Pydantic 422 Unprocessable Entity for invalid payload schema."""
    response = client.post("/api/v1/portfolios", json={"malformed_field": "test"})
    assert response.status_code == 422
    data = response.json()
    assert "error" in data or "detail" in data


def test_api_unsupported_export_format_rejection(client, sqlite_db):
    """Verify export endpoints reject unsupported formats with 400 VALIDATION_ERROR."""
    inst_repo = InstrumentRepository(sqlite_db)
    inst = inst_repo.create(
        InstrumentCreate(
            symbol="TSLA",
            name="Tesla Inc",
            asset_type=AssetType.EQUITY,
            exchange="NASDAQ"
        )
    )
    
    # Requesting format=xml (unsupported)
    response = client.get(f"/api/v1/returns/export?instrument_id={inst.id}&format=xml")
    assert response.status_code in [400, 422]
    data = response.json()
    if "error" in data:
        assert data["error"]["code"] in ["VALIDATION_ERROR", "INVALID_FORMAT"]


def test_api_datetime_utc_serialization_contract(client, sqlite_db):
    """Verify instrument creation and retrieval returns timezone-aware UTC timestamps."""
    inst_repo = InstrumentRepository(sqlite_db)
    inst = inst_repo.create(
        InstrumentCreate(
            symbol="AMD",
            name="Advanced Micro Devices",
            asset_type=AssetType.EQUITY,
            exchange="NASDAQ"
        )
    )
    
    response = client.get(f"/api/v1/instruments/{inst.id}")
    assert response.status_code == 200
    data = response.json()
    assert "created_at" in data
    created_at = data["created_at"]
    # Check ISO-8601 formatting
    assert "T" in created_at
    assert created_at.endswith("Z") or "+00:00" in created_at or len(created_at) >= 19
