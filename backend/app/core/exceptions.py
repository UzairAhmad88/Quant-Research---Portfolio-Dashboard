import time
import uuid
import logging
from typing import Optional, Any, Dict, List
from enum import Enum
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger("quant_api.errors")

# ---------------------------------------------------------------------------
# 1. Error Taxonomy & Severity Enums
# ---------------------------------------------------------------------------

class ErrorCode(str, Enum):
    VALIDATION_ERROR = "VALIDATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    CONFLICT = "CONFLICT"
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR"
    AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR"
    RATE_LIMITED = "RATE_LIMITED"
    PROVIDER_ERROR = "PROVIDER_ERROR"
    PROVIDER_TIMEOUT = "PROVIDER_TIMEOUT"
    PROVIDER_UNAVAILABLE = "PROVIDER_UNAVAILABLE"
    DATABASE_ERROR = "DATABASE_ERROR"
    DATABASE_TIMEOUT = "DATABASE_TIMEOUT"
    CALCULATION_ERROR = "CALCULATION_ERROR"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"
    DATA_QUALITY_ERROR = "DATA_QUALITY_ERROR"
    EXPORT_ERROR = "EXPORT_ERROR"
    DEPENDENCY_ERROR = "DEPENDENCY_ERROR"
    TIMEOUT = "TIMEOUT"
    INTERNAL_ERROR = "INTERNAL_ERROR"


class ErrorSeverity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


# ---------------------------------------------------------------------------
# 2. Standard API Error Response Schemas
# ---------------------------------------------------------------------------

class ErrorDetailBody(BaseModel):
    code: str = Field(..., description="Machine-readable standardized error code.")
    message: str = Field(..., description="Human-readable explanation of the error.")
    details: Optional[Any] = Field(None, description="Structured error context or diagnostic data.")
    severity: str = Field(default=ErrorSeverity.ERROR.value, description="Impact severity: INFO, WARNING, ERROR, CRITICAL.")
    retryable: bool = Field(default=False, description="Indicates whether client retry may succeed.")


class APIErrorResponse(BaseModel):
    error: ErrorDetailBody
    request_id: Optional[str] = Field(None, description="Unique correlation identifier for log tracing.")
    detail: Optional[str] = Field(None, description="Convenience string mirror for standard HTTP clients.")


# ---------------------------------------------------------------------------
# 3. Centralized Exception Hierarchy
# ---------------------------------------------------------------------------

class AppException(Exception):
    """Base application exception for all domain and operational failures."""

    def __init__(
        self,
        message: str,
        code: ErrorCode = ErrorCode.INTERNAL_ERROR,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Any] = None,
        severity: ErrorSeverity = ErrorSeverity.ERROR,
        retryable: bool = False,
    ):
        self.message = message
        self.code = code.value if isinstance(code, ErrorCode) else str(code)
        self.status_code = status_code
        self.details = details
        self.severity = severity.value if isinstance(severity, ErrorSeverity) else str(severity)
        self.retryable = retryable
        super().__init__(message)


class ValidationException(AppException):
    def __init__(
        self,
        message: str = "Invalid request payload or parameters.",
        details: Optional[Any] = None,
        status_code: int = status.HTTP_400_BAD_REQUEST,
    ):
        super().__init__(
            message=message,
            code=ErrorCode.VALIDATION_ERROR,
            status_code=status_code,
            details=details,
            severity=ErrorSeverity.WARNING,
            retryable=False,
        )


class NotFoundException(AppException):
    def __init__(self, message: str = "The requested resource was not found.", details: Optional[Any] = None):
        super().__init__(
            message=message,
            code=ErrorCode.NOT_FOUND,
            status_code=status.HTTP_404_NOT_FOUND,
            details=details,
            severity=ErrorSeverity.WARNING,
            retryable=False,
        )


class ConflictException(AppException):
    def __init__(self, message: str = "Resource conflict or duplicate entry.", details: Optional[Any] = None):
        super().__init__(
            message=message,
            code=ErrorCode.CONFLICT,
            status_code=status.HTTP_409_CONFLICT,
            details=details,
            severity=ErrorSeverity.WARNING,
            retryable=False,
        )


class AuthenticationException(AppException):
    def __init__(self, message: str = "Authentication credentials required or invalid.", details: Optional[Any] = None):
        super().__init__(
            message=message,
            code=ErrorCode.AUTHENTICATION_ERROR,
            status_code=status.HTTP_401_UNAUTHORIZED,
            details=details,
            severity=ErrorSeverity.ERROR,
            retryable=False,
        )


class AuthorizationException(AppException):
    def __init__(self, message: str = "Action not authorized.", details: Optional[Any] = None):
        super().__init__(
            message=message,
            code=ErrorCode.AUTHORIZATION_ERROR,
            status_code=status.HTTP_403_FORBIDDEN,
            details=details,
            severity=ErrorSeverity.ERROR,
            retryable=False,
        )


class RateLimitedException(AppException):
    def __init__(self, message: str = "Rate limit exceeded. Please throttle requests.", details: Optional[Any] = None, retry_after: Optional[int] = None):
        ext_details = {"retry_after_seconds": retry_after} if retry_after else {}
        if isinstance(details, dict):
            ext_details.update(details)
        super().__init__(
            message=message,
            code=ErrorCode.RATE_LIMITED,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            details=ext_details or details,
            severity=ErrorSeverity.WARNING,
            retryable=True,
        )


class ProviderException(AppException):
    def __init__(self, message: str = "Market data provider error occurred.", details: Optional[Any] = None, retryable: bool = True):
        super().__init__(
            message=message,
            code=ErrorCode.PROVIDER_ERROR,
            status_code=status.HTTP_502_BAD_GATEWAY,
            details=details,
            severity=ErrorSeverity.ERROR,
            retryable=retryable,
        )


class ProviderTimeoutException(AppException):
    def __init__(self, message: str = "Market data provider request timed out.", details: Optional[Any] = None):
        super().__init__(
            message=message,
            code=ErrorCode.PROVIDER_TIMEOUT,
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            details=details,
            severity=ErrorSeverity.ERROR,
            retryable=True,
        )


class ProviderUnavailableException(AppException):
    def __init__(self, message: str = "Market data provider is currently unavailable.", details: Optional[Any] = None):
        super().__init__(
            message=message,
            code=ErrorCode.PROVIDER_UNAVAILABLE,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details=details,
            severity=ErrorSeverity.ERROR,
            retryable=True,
        )


class DatabaseException(AppException):
    def __init__(self, message: str = "A database operation error occurred.", details: Optional[Any] = None):
        super().__init__(
            message=message,
            code=ErrorCode.DATABASE_ERROR,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details,
            severity=ErrorSeverity.CRITICAL,
            retryable=False,
        )


class DatabaseTimeoutException(AppException):
    def __init__(self, message: str = "Database operation timed out.", details: Optional[Any] = None):
        super().__init__(
            message=message,
            code=ErrorCode.DATABASE_TIMEOUT,
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            details=details,
            severity=ErrorSeverity.ERROR,
            retryable=True,
        )


class CalculationException(AppException):
    def __init__(self, message: str = "Financial calculation error occurred.", details: Optional[Any] = None):
        super().__init__(
            message=message,
            code=ErrorCode.CALCULATION_ERROR,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details,
            severity=ErrorSeverity.ERROR,
            retryable=False,
        )


class InsufficientDataException(AppException):
    def __init__(
        self,
        message: str = "Insufficient observations for the requested quantitative calculation.",
        required: Optional[int] = None,
        available: Optional[int] = None,
        details: Optional[Any] = None,
    ):
        ext_details = {}
        if required is not None:
            ext_details["required_observations"] = required
        if available is not None:
            ext_details["available_observations"] = available
        if isinstance(details, dict):
            ext_details.update(details)
        super().__init__(
            message=message,
            code=ErrorCode.INSUFFICIENT_DATA,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=ext_details or details,
            severity=ErrorSeverity.WARNING,
            retryable=False,
        )


class DataQualityException(AppException):
    def __init__(self, message: str = "Market data quality check failed.", details: Optional[Any] = None):
        super().__init__(
            message=message,
            code=ErrorCode.DATA_QUALITY_ERROR,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details,
            severity=ErrorSeverity.ERROR,
            retryable=False,
        )


class ExportException(AppException):
    def __init__(self, message: str = "Export document generation failed.", details: Optional[Any] = None):
        super().__init__(
            message=message,
            code=ErrorCode.EXPORT_ERROR,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details,
            severity=ErrorSeverity.ERROR,
            retryable=False,
        )


class TimeoutException(AppException):
    def __init__(self, message: str = "The operation timed out.", details: Optional[Any] = None):
        super().__init__(
            message=message,
            code=ErrorCode.TIMEOUT,
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            details=details,
            severity=ErrorSeverity.ERROR,
            retryable=True,
        )


class InternalException(AppException):
    def __init__(self, message: str = "An unexpected server error occurred.", details: Optional[Any] = None):
        super().__init__(
            message=message,
            code=ErrorCode.INTERNAL_ERROR,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details,
            severity=ErrorSeverity.CRITICAL,
            retryable=False,
        )


# Backward Compatibility Aliases
NotFoundError = NotFoundException
ValidationError = ValidationException
ConflictError = ConflictException
DatabaseError = DatabaseException
ProviderError = ProviderException


# ---------------------------------------------------------------------------
# 4. Global Exception Handlers Setup
# ---------------------------------------------------------------------------

def _extract_request_id(request: Request) -> str:
    """Helper to extract or create request ID from request state or header."""
    return getattr(request.state, "correlation_id", None) or getattr(request.state, "request_id", None) or request.headers.get("X-Request-ID") or str(uuid.uuid4())


def setup_exception_handlers(app: FastAPI):
    """Register centralized exception handlers on the FastAPI application."""

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        req_id = _extract_request_id(request)
        logger.warning(
            f"AppException: code={exc.code} status={exc.status_code} "
            f"message='{exc.message}' req_id={req_id}"
        )
        return JSONResponse(
            status_code=exc.status_code,
            headers={"X-Request-ID": req_id},
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                    "severity": exc.severity,
                    "retryable": exc.retryable,
                },
                "request_id": req_id,
                "detail": exc.message,
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        req_id = _extract_request_id(request)
        # Format Pydantic errors into clean structured details
        formatted_errors = []
        for err in exc.errors():
            loc = " -> ".join(str(item) for item in err.get("loc", []))
            formatted_errors.append({
                "field": loc,
                "issue": err.get("msg", "Invalid value"),
                "type": err.get("type", "value_error"),
            })
        logger.info(f"RequestValidationError on {request.url.path}: {formatted_errors} req_id={req_id}")
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            headers={"X-Request-ID": req_id},
            content={
                "error": {
                    "code": ErrorCode.VALIDATION_ERROR.value,
                    "message": "Request validation failed. Please check field formats.",
                    "details": formatted_errors,
                    "severity": ErrorSeverity.WARNING.value,
                    "retryable": False,
                },
                "request_id": req_id,
                "detail": "Request validation failed.",
            },
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        req_id = _extract_request_id(request)
        code = ErrorCode.INTERNAL_ERROR.value
        if exc.status_code == 404:
            code = ErrorCode.NOT_FOUND.value
        elif exc.status_code == 400:
            code = ErrorCode.VALIDATION_ERROR.value
        elif exc.status_code == 409:
            code = ErrorCode.CONFLICT.value
        elif exc.status_code == 429:
            code = ErrorCode.RATE_LIMITED.value

        return JSONResponse(
            status_code=exc.status_code,
            headers={"X-Request-ID": req_id},
            content={
                "error": {
                    "code": code,
                    "message": str(exc.detail),
                    "details": None,
                    "severity": ErrorSeverity.WARNING.value if exc.status_code < 500 else ErrorSeverity.ERROR.value,
                    "retryable": exc.status_code in (429, 502, 503, 504),
                },
                "request_id": req_id,
                "detail": str(exc.detail),
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        req_id = _extract_request_id(request)
        # Log with full traceback securely to backend logs only - NEVER leak internal tracebacks to client
        logger.error(
            f"Unhandled exception on {request.method} {request.url.path} (req_id={req_id}): {exc}",
            exc_info=True,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            headers={"X-Request-ID": req_id},
            content={
                "error": {
                    "code": ErrorCode.INTERNAL_ERROR.value,
                    "message": "An unexpected server error occurred. Please try again or provide the request ID to support.",
                    "details": None,
                    "severity": ErrorSeverity.CRITICAL.value,
                    "retryable": False,
                },
                "request_id": req_id,
                "detail": "An unexpected server error occurred.",
            },
        )
