import math
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.exceptions import (
    ErrorCode,
    ErrorSeverity,
    AppException,
    ValidationException,
    NotFoundException,
    ConflictException,
    AuthenticationException,
    AuthorizationException,
    RateLimitedException,
    ProviderException,
    ProviderTimeoutException,
    ProviderUnavailableException,
    DatabaseException,
    DatabaseTimeoutException,
    CalculationException,
    InsufficientDataException,
    DataQualityException,
    ExportException,
    TimeoutException,
    InternalException,
    setup_exception_handlers,
)
from app.analytics.resilience import (
    sanitize_non_finite,
    validate_sufficient_observations,
    safe_divide,
)


def test_exception_hierarchy_contracts():
    """Verify all AppException subclasses carry expected status codes, severity, and retryable flags."""
    exc_val = ValidationException("Invalid input", details={"field": "symbol"})
    assert exc_val.status_code in (400, 422)
    assert exc_val.code == ErrorCode.VALIDATION_ERROR.value
    assert exc_val.retryable is False

    exc_nf = NotFoundException("Missing resource")
    assert exc_nf.status_code == 404
    assert exc_nf.code == ErrorCode.NOT_FOUND.value
    assert exc_nf.retryable is False

    exc_rate = RateLimitedException("Throttled", retry_after=30)
    assert exc_rate.status_code == 429
    assert exc_rate.code == ErrorCode.RATE_LIMITED.value
    assert exc_rate.retryable is True
    assert exc_rate.details["retry_after_seconds"] == 30

    exc_prov = ProviderException("Provider failed")
    assert exc_prov.status_code == 502
    assert exc_prov.code == ErrorCode.PROVIDER_ERROR.value
    assert exc_prov.retryable is True

    exc_p_timeout = ProviderTimeoutException("Provider timeout")
    assert exc_p_timeout.status_code == 504
    assert exc_p_timeout.code == ErrorCode.PROVIDER_TIMEOUT.value
    assert exc_p_timeout.retryable is True

    exc_p_unavail = ProviderUnavailableException("Provider down")
    assert exc_p_unavail.status_code == 503
    assert exc_p_unavail.code == ErrorCode.PROVIDER_UNAVAILABLE.value
    assert exc_p_unavail.retryable is True

    exc_db = DatabaseException("DB failure")
    assert exc_db.status_code == 500
    assert exc_db.code == ErrorCode.DATABASE_ERROR.value
    assert exc_db.severity == ErrorSeverity.CRITICAL.value

    exc_insuf = InsufficientDataException("Not enough bars", required=30, available=12)
    assert exc_insuf.status_code == 422
    assert exc_insuf.code == ErrorCode.INSUFFICIENT_DATA.value
    assert exc_insuf.details["required_observations"] == 30
    assert exc_insuf.details["available_observations"] == 12


def test_standard_api_error_envelope(client):
    """Verify standard error envelope contains code, message, request_id, and X-Request-ID header."""
    response = client.get("/api/v1/instruments/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404

    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "NOT_FOUND"
    assert "message" in data["error"]
    assert "request_id" in data
    assert response.headers.get("X-Request-ID") == data["request_id"]


def test_pydantic_validation_error_envelope(client):
    """Verify FastAPI Pydantic schema validation failures format into standard VALIDATION_ERROR envelope."""
    response = client.post("/api/v1/portfolios", json={"malformed_key": 123})
    assert response.status_code == 422

    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert "details" in data["error"]
    assert isinstance(data["error"]["details"], list)
    assert len(data["error"]["details"]) > 0
    assert "request_id" in data


def test_unhandled_exception_returns_safe_500():
    """Verify unexpected server crashes return safe generic message and never expose internal stack traces."""
    test_app = FastAPI()
    setup_exception_handlers(test_app)

    @test_app.get("/trigger-crash")
    def crash_route():
        raise RuntimeError("Secret internal database password or filesystem path /var/data")

    test_client = TestClient(test_app, raise_server_exceptions=False)
    response = test_client.get("/trigger-crash")
    assert response.status_code == 500

    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "INTERNAL_ERROR"
    # Verify sensitive string was NOT leaked to client
    assert "Secret internal" not in data["error"]["message"]
    assert "filesystem path" not in str(data)
    assert "An unexpected server error occurred" in data["error"]["message"]
    assert "request_id" in data


def test_non_finite_protection_sanitization():
    """Verify sanitize_non_finite replaces NaN/Infinity with None in financial results."""
    raw_results = {
        "mean_return": 0.05,
        "undefined_sharpe": float("nan"),
        "infinite_calmar": float("inf"),
        "negative_inf": float("-inf"),
        "nested": {
            "val": float("nan"),
            "valid": 100.0,
        },
        "series": [0.01, float("nan"), 0.03],
    }

    sanitized = sanitize_non_finite(raw_results, strict=False)
    assert sanitized["mean_return"] == 0.05
    assert sanitized["undefined_sharpe"] is None
    assert sanitized["infinite_calmar"] is None
    assert sanitized["negative_inf"] is None
    assert sanitized["nested"]["val"] is None
    assert sanitized["nested"]["valid"] == 100.0
    assert sanitized["series"] == [0.01, None, 0.03]

    # Strict mode should raise CalculationException
    with pytest.raises(CalculationException):
        sanitize_non_finite(float("nan"), strict=True)


def test_insufficient_data_validation():
    """Verify validate_sufficient_observations raises InsufficientDataException when observations are inadequate."""
    # When available >= required, no exception is raised
    validate_sufficient_observations(available=50, required=30, metric_name="volatility")

    # When available < required, raises structured InsufficientDataException
    with pytest.raises(InsufficientDataException) as exc_info:
        validate_sufficient_observations(available=15, required=30, metric_name="volatility")

    assert exc_info.value.code == ErrorCode.INSUFFICIENT_DATA.value
    assert exc_info.value.details["required_observations"] == 30
    assert exc_info.value.details["available_observations"] == 15


def test_safe_divide_zero_and_non_finite_resilience():
    """Verify safe_divide prevents ZeroDivisionError and Infinity in ratio calculations."""
    assert safe_divide(10.0, 2.0) == 5.0
    assert safe_divide(10.0, 0.0) is None
    assert safe_divide(10.0, 0.0, default=0.0) == 0.0
    assert safe_divide(None, 5.0) is None
    assert safe_divide(5.0, None) is None
    assert safe_divide(float("nan"), 5.0) is None
    assert safe_divide(5.0, float("inf")) is None
