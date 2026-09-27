import time
import uuid
import logging
from collections import defaultdict
from typing import Dict, List, Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from fastapi import Request, status

from app.core.config import settings

logger = logging.getLogger("quant_api")

# List of headers whose values must be redacted from diagnostic logs
SENSITIVE_HEADERS = {"authorization", "cookie", "x-api-key", "set-cookie", "proxy-authorization"}

# Sensitive URL path substrings categorized as computationally intensive
EXPENSIVE_ENDPOINT_PREFIXES = (
    f"{settings.API_V1_STR}/market-data/fetch",
    f"{settings.API_V1_STR}/correlation/matrix",
    f"{settings.API_V1_STR}/backtesting/run",
    f"{settings.API_V1_STR}/export",
)


class RequestCorrelationMiddleware(BaseHTTPMiddleware):
    """
    Middleware ensuring every incoming request has a unique correlation/request ID.
    Attaches ID to request.state and response headers for distributed end-to-end tracing.
    Redacts sensitive headers from structured logs.
    """

    async def dispatch(self, request: Request, call_next):
        request_id = (
            request.headers.get("X-Request-ID")
            or request.headers.get("X-Correlation-ID")
            or str(uuid.uuid4())
        )
        request.state.request_id = request_id
        request.state.correlation_id = request_id

        start_time = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception as exc:
            duration_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                f"Unhandled error in pipeline: method={request.method} path={request.url.path} "
                f"duration={duration_ms:.2f}ms req_id={request_id} error={type(exc).__name__}: {exc}"
            )
            raise exc

        duration_ms = (time.perf_counter() - start_time) * 1000
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time-Ms"] = f"{duration_ms:.2f}"

        # Structured diagnostic log entry with redacted headers if debug level
        log_level = (
            logging.INFO
            if response.status_code < 400
            else (logging.WARNING if response.status_code < 500 else logging.ERROR)
        )
        logger.log(
            log_level,
            f"method={request.method} path={request.url.path} status={response.status_code} "
            f"duration={duration_ms:.2f}ms req_id={request_id}"
        )

        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    HTTP Security Hardening Middleware enforcing defensive headers:
    - X-Content-Type-Options: nosniff (prevents MIME type sniffing)
    - X-Frame-Options: DENY (clickjacking protection)
    - X-XSS-Protection: 1; mode=block (legacy browser XSS filter)
    - Referrer-Policy: strict-origin-when-cross-origin
    - Permissions-Policy: Restricts unneeded browser features
    - Content-Security-Policy: Restricts script, style, and asset execution origins
    - Strict-Transport-Security: Enforced in production environments
    """

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Baseline defensive headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=(), payment=()"
        
        # Restrictive Content Security Policy
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*; "
            "frame-ancestors 'none';"
        )

        if settings.is_production():
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"

        return response


class InMemoryRateLimiter:
    """
    Sliding window in-memory rate limiter per IP address with separate standard vs expensive quotas.
    """
    def __init__(self):
        self._requests: Dict[str, List[float]] = defaultdict(list)
        self._expensive_requests: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, client_ip: str, is_expensive: bool = False) -> tuple[bool, int]:
        now = time.time()
        window_seconds = 60.0

        if is_expensive:
            limit = settings.RATE_LIMIT_PER_MINUTE_EXPENSIVE
            history = self._expensive_requests[client_ip]
        else:
            limit = settings.RATE_LIMIT_PER_MINUTE_STANDARD
            history = self._requests[client_ip]

        # Evict timestamps older than 60s
        cutoff = now - window_seconds
        valid_history = [t for t in history if t > cutoff]

        if is_expensive:
            self._expensive_requests[client_ip] = valid_history
        else:
            self._requests[client_ip] = valid_history

        if len(valid_history) >= limit:
            oldest_time = valid_history[0]
            retry_after = max(1, int(oldest_time + window_seconds - now))
            return False, retry_after

        # Record current request timestamp
        valid_history.append(now)
        return True, 0

    def clear(self):
        """Clears rate limit state (used in testing)."""
        self._requests.clear()
        self._expensive_requests.clear()


rate_limiter = InMemoryRateLimiter()


class RateLimitingMiddleware(BaseHTTPMiddleware):
    """
    Rate Limiting Protection Middleware preventing resource exhaustion and API abuse.
    Returns structured JSON 429 Too Many Requests response with Retry-After header.
    """

    async def dispatch(self, request: Request, call_next):
        if not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)

        # Health & docs endpoints are exempt
        path = request.url.path
        if path in ("/health", "/docs", "/redoc", f"{settings.API_V1_STR}/openapi.json"):
            return await call_next(request)

        # Determine client identifier
        client_ip = (
            request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
            or request.headers.get("X-Real-IP")
            or (request.client.host if request.client else "127.0.0.1")
        )

        is_expensive = any(path.startswith(prefix) for prefix in EXPENSIVE_ENDPOINT_PREFIXES)
        allowed, retry_after = rate_limiter.is_allowed(client_ip, is_expensive=is_expensive)

        if not allowed:
            req_id = getattr(request.state, "request_id", str(uuid.uuid4()))
            logger.warning(
                f"Rate limit exceeded: client={client_ip} path={path} "
                f"expensive={is_expensive} retry_after={retry_after}s req_id={req_id}"
            )
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": {
                        "code": "RATE_LIMITED",
                        "message": f"Rate limit exceeded. Please retry after {retry_after} seconds.",
                        "details": {"retry_after_seconds": retry_after, "client_ip": client_ip},
                        "severity": "WARNING",
                        "retryable": True,
                    },
                    "request_id": req_id,
                    "detail": f"Rate limit exceeded. Please retry after {retry_after} seconds.",
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-Request-ID": req_id,
                },
            )

        return await call_next(request)


def get_request_id(request: Request) -> str:
    """Helper to retrieve the current request correlation ID."""
    return getattr(request.state, "request_id", None) or getattr(request.state, "correlation_id", None) or str(uuid.uuid4())
