"""
Security & Hardening Test Suite for Quant Research Dashboard.
Verifies security invariants across:
1. SQL Injection Protection (parameterized queries across search, filters, pagination).
2. Input Validation & Bounds Enforcement (UUIDs, string lengths, date ranges, enums).
3. Resource Limits & Denial-of-Service Defense (correlation instrument limits, rolling window limits, pagination bounds).
4. SSRF & Provider Whitelisting (rejection of arbitrary URLs and untrusted provider names).
5. Export Security (path traversal prevention, CSV formula injection defense, PDF restrictions).
6. Security Headers (X-Content-Type-Options, X-Frame-Options, CSP, Referrer-Policy).
7. Rate Limiting & Abuse Prevention (429 Too Many Requests response).
8. Error Information Leakage (clean error envelopes without stack traces or SQL internals).
"""

import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.config import settings
from app.core.middleware import rate_limiter
from app.models.instrument import Instrument
from app.models.enums import AssetType, DataFrequency
from app.export.base import sanitize_filename, ExportMetadata
from app.export.csv_exporter import CSVExporter
from app.export.pdf_exporter import PDFExporter
from app.core.exceptions import (
    AppException,
    ErrorCode,
    ValidationError,
    NotFoundError,
    RateLimitedException,
)


@pytest.fixture(autouse=True)
def reset_rate_limits():
    """Ensure clean rate limiter state for each test."""
    rate_limiter.clear()
    yield
    rate_limiter.clear()


# ---------------------------------------------------------------------------
# 1. SQL Injection Defense Tests
# ---------------------------------------------------------------------------

class TestSQLInjectionDefense:
    SQL_INJECTION_PAYLOADS = [
        "' OR '1'='1",
        "'; DROP TABLE core.instruments; --",
        "\" OR \"\"=\"",
        "1; SELECT * FROM core.portfolios; --",
        "AAPL' UNION SELECT id, name, NULL, NULL FROM core.instruments --",
        "/* comment */ ' OR 1=1 --",
        "admin'--",
    ]

    def test_sql_injection_in_instrument_symbol_search(self, client: TestClient):
        for payload in self.SQL_INJECTION_PAYLOADS:
            response = client.get(f"/api/v1/instruments?symbol={payload}")
            assert response.status_code == 200, f"Failed on payload: {payload}"
            data = response.json()
            # Must return a valid empty items list, never execute SQL injection
            assert "items" in data
            assert len(data["items"]) == 0

    def test_sql_injection_in_market_data_query(self, client: TestClient):
        for payload in self.SQL_INJECTION_PAYLOADS:
            response = client.get(f"/api/v1/market-data?instrument_id={payload}")
            assert response.status_code == 200
            data = response.json()
            assert "items" in data
            assert len(data["items"]) == 0

    def test_sql_injection_in_portfolio_name(self, client: TestClient):
        payload = {
            "name": "Portfolio'; DROP TABLE core.portfolios; --",
            "initial_capital": 50000.0,
            "base_currency": "USD"
        }
        response = client.post("/api/v1/portfolios", json=payload)
        assert response.status_code in (200, 201)
        created = response.json()
        assert created["name"] == "Portfolio'; DROP TABLE core.portfolios; --"


# ---------------------------------------------------------------------------
# 2. Input Validation & Malformed Payload Rejection
# ---------------------------------------------------------------------------

class TestInputValidationAndBounds:
    def test_invalid_uuid_handling(self, client: TestClient):
        response = client.get("/api/v1/instruments/not-a-valid-uuid")
        assert response.status_code in (404, 422)
        data = response.json()
        assert "error" in data or "detail" in data

    def test_date_range_reversal_rejection(self, client: TestClient):
        payload = {
            "symbol": "AAPL",
            "start_date": "2026-12-31T00:00:00Z",
            "end_date": "2026-01-01T00:00:00Z"
        }
        response = client.post("/api/v1/market-data/fetch", json=payload)
        assert response.status_code == 422
        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == "VALIDATION_ERROR"

    def test_excessive_date_range_limit_rejection(self, client: TestClient):
        payload = {
            "symbol": "AAPL",
            "start_date": "1970-01-01T00:00:00Z",
            "end_date": "2030-01-01T00:00:00Z"
        }
        response = client.post("/api/v1/market-data/fetch", json=payload)
        assert response.status_code == 422
        data = response.json()
        assert "error" in data
        assert "35 years" in str(data["error"]["details"])

    def test_oversized_string_rejection(self, client: TestClient):
        oversized_symbol = "A" * 100
        payload = {
            "symbol": oversized_symbol,
            "name": "Oversized Instrument",
            "asset_type": "EQUITY"
        }
        response = client.post("/api/v1/instruments", json=payload)
        assert response.status_code == 422


# ---------------------------------------------------------------------------
# 3. Resource Limits & DoS Defense Tests
# ---------------------------------------------------------------------------

class TestResourceLimitsDefense:
    def test_correlation_maximum_instruments_limit(self, client: TestClient):
        # Request correlation with 25 instruments (> MAX_CORRELATION_INSTRUMENTS = 20)
        query_params = "&".join([f"instrument_ids=inst_id_{i}" for i in range(25)])
        response = client.get(f"/api/v1/correlation?{query_params}")
        assert response.status_code in (400, 422)
        data = response.json()
        assert "Maximum 20 instruments" in data["error"]["message"]

    def test_volatility_rolling_window_bounds(self, client: TestClient, sqlite_db: Session):
        # Create dummy instrument
        inst = Instrument(symbol="SEC_TEST", name="Sec Test", asset_type=AssetType.EQUITY)
        sqlite_db.add(inst)
        sqlite_db.commit()

        # Window < 2
        res_low = client.get(f"/api/v1/volatility?instrument_id={inst.id}&rolling_window=1")
        assert res_low.status_code in (400, 422)
        assert "between 2 and 500" in res_low.json()["error"]["message"]

        # Window > 500
        res_high = client.get(f"/api/v1/volatility?instrument_id={inst.id}&rolling_window=999")
        assert res_high.status_code in (400, 422)
        assert "between 2 and 500" in res_high.json()["error"]["message"]


# ---------------------------------------------------------------------------
# 4. SSRF & Provider Whitelisting Tests
# ---------------------------------------------------------------------------

class TestSSRFAndProviderSafety:
    def test_untrusted_provider_rejection(self, client: TestClient):
        payload = {
            "symbol": "AAPL",
            "provider": "http://169.254.169.254"
        }
        response = client.post("/api/v1/market-data/fetch", json=payload)
        assert response.status_code == 422
        data = response.json()
        assert "error" in data
        assert "not in the trusted allowlist" in str(data["error"]["details"])

    def test_malicious_provider_name_rejection(self, client: TestClient):
        payload = {
            "symbol": "AAPL",
            "provider": "MALICIOUS_CUSTOM_PROVIDER"
        }
        response = client.post("/api/v1/market-data/fetch", json=payload)
        assert response.status_code == 422
        data = response.json()
        assert "not in the trusted allowlist" in str(data["error"]["details"])


# ---------------------------------------------------------------------------
# 5. Export Security (Path Traversal & Formula Injection)
# ---------------------------------------------------------------------------

class TestExportSecurity:
    def test_filename_path_traversal_sanitization(self):
        traversal_names = [
            "../../../../etc/passwd",
            "..\\..\\windows\\system32\\cmd.exe",
            "AAPL/../../secret_data",
            "MSFT\x00_hidden_file",
        ]
        for raw in traversal_names:
            sanitized = sanitize_filename(raw)
            assert "/" not in sanitized
            assert "\\" not in sanitized
            assert ".." not in sanitized
            assert "\x00" not in sanitized

    def test_csv_formula_injection_defense(self):
        exporter = CSVExporter()
        metadata = ExportMetadata(export_type="TEST", symbol="AAPL")
        data = {
            "headers": ["symbol", "formula_col", "number_col"],
            "rows": [
                ["AAPL", "=CMD|' /C calc'!A0", 150.0],
                ["MSFT", "@SUM(1+1)", -0.05],
                ["GOOG", "+12345", 2500.0],
                ["TSLA", "-DDE('cmd';'/c calc';'a')!", 200.0],
                ["NVDA", "\tTAB_INJECT", 120.0],
            ]
        }
        csv_bytes = exporter.export(data, metadata)
        csv_str = csv_bytes.decode("utf-8")

        # Verify formula trigger characters in text strings are safely prepended with single quote
        assert "'=CMD|' /C calc'!A0" in csv_str
        assert "'@SUM(1+1)" in csv_str
        assert "'+12345" in csv_str
        assert "'-DDE('cmd';'/c calc';'a')!" in csv_str
        assert "'\tTAB_INJECT" in csv_str
        # Verify legitimate negative numeric values are NOT corrupted
        assert "-0.05" in csv_str


# ---------------------------------------------------------------------------
# 6. Security Headers Tests
# ---------------------------------------------------------------------------

class TestSecurityHeaders:
    def test_defensive_http_headers_present(self, client: TestClient):
        response = client.get("/health")
        assert response.status_code == 200

        headers = response.headers
        assert headers.get("X-Content-Type-Options") == "nosniff"
        assert headers.get("X-Frame-Options") == "DENY"
        assert headers.get("X-XSS-Protection") == "1; mode=block"
        assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
        assert "Content-Security-Policy" in headers
        assert "Permissions-Policy" in headers
        assert "X-Request-ID" in headers


# ---------------------------------------------------------------------------
# 7. Rate Limiting Middleware Tests
# ---------------------------------------------------------------------------

class TestRateLimiting:
    def test_rate_limiting_triggers_429_on_excessive_traffic(self, client: TestClient):
        # Configure a small temporary threshold for deterministic testing
        settings.RATE_LIMIT_PER_MINUTE_EXPENSIVE = 3
        endpoint = "/api/v1/market-data/fetch"
        payload = {"symbol": "AAPL"}

        # First 3 requests permitted
        for _ in range(3):
            res = client.post(endpoint, json=payload)
            assert res.status_code != 429

        # 4th request must be throttled with HTTP 429
        res_throttled = client.post(endpoint, json=payload)
        assert res_throttled.status_code == 429
        data = res_throttled.json()
        assert data["error"]["code"] == "RATE_LIMITED"
        assert "Retry-After" in res_throttled.headers

        # Restore setting
        settings.RATE_LIMIT_PER_MINUTE_EXPENSIVE = 60


# ---------------------------------------------------------------------------
# 8. Error Information Leakage Tests
# ---------------------------------------------------------------------------

class TestErrorInformationLeakage:
    def test_not_found_error_does_not_leak_internals(self, client: TestClient):
        response = client.get("/api/v1/instruments/nonexistent-id-12345")
        assert response.status_code == 404
        data = response.json()
        assert "error" in data
        assert "Traceback" not in str(data)
        assert "SELECT " not in str(data)
        assert "psycopg" not in str(data)

    def test_validation_error_does_not_leak_environment_secrets(self, client: TestClient):
        response = client.post("/api/v1/market-data/fetch", json={})
        assert response.status_code == 422
        data = response.json()
        assert "DATABASE_URL" not in str(data)
        assert "SECRET_KEY" not in str(data)
        assert "error" in data
