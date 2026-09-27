import asyncio
import random
import logging
from typing import Callable, Any, Type, Tuple, Optional
from app.core.exceptions import (
    ProviderException,
    ProviderTimeoutException,
    ProviderUnavailableException,
    RateLimitedException,
    ValidationException,
    NotFoundException,
)

logger = logging.getLogger("quant_api.providers.retry")

DEFAULT_RETRYABLE_EXCEPTIONS: Tuple[Type[Exception], ...] = (
    ProviderTimeoutException,
    ProviderUnavailableException,
    TimeoutError,
    asyncio.TimeoutError,
    ConnectionError,
)

async def execute_with_retry(
    func: Callable[..., Any],
    *args,
    max_attempts: int = 3,
    base_delay: float = 0.5,
    backoff_factor: float = 2.0,
    jitter: bool = True,
    retryable_exceptions: Tuple[Type[Exception], ...] = DEFAULT_RETRYABLE_EXCEPTIONS,
    operation_name: str = "Provider Operation",
    **kwargs
) -> Any:
    """
    Executes an asynchronous provider function with bounded exponential backoff and jitter.

    Policy:
    - Retries only transient failures (e.g., timeouts, 503 unavailable, network connection drops).
    - Never retries permanent errors (404 NotFound, 422 Validation, malformed inputs).
    - Detects HTTP 429 Rate Limits and raises RateLimitedException without exhausting retries prematurely.
    - Max 3 attempts by default to prevent thread pool exhaustion and excessive user wait times.
    """
    attempt = 0
    last_exception: Optional[Exception] = None

    while attempt < max_attempts:
        attempt += 1
        try:
            return await func(*args, **kwargs)
        except (ValidationException, NotFoundException) as permanent_err:
            # Permanent business/input errors must never be retried
            logger.info(f"{operation_name}: Permanent error on attempt {attempt}, skipping retry: {permanent_err}")
            raise permanent_err
        except Exception as exc:
            last_exception = exc
            err_str = str(exc).lower()

            # Detect rate limiting (HTTP 429)
            if "429" in err_str or "too many requests" in err_str or "rate limit" in err_str:
                logger.warning(f"{operation_name}: Provider rate-limited the request on attempt {attempt}: {exc}")
                raise RateLimitedException(
                    message="Provider rate limit exceeded. Please try again later.",
                    details={"provider_error": str(exc), "attempt": attempt}
                )

            # Check if exception is retryable
            is_retryable = isinstance(exc, retryable_exceptions) or any(
                term in err_str for term in ("timeout", "timed out", "503", "502", "connection reset", "connection refused")
            )

            if not is_retryable or attempt >= max_attempts:
                logger.error(
                    f"{operation_name}: Failed after {attempt}/{max_attempts} attempts. "
                    f"Retryable={is_retryable}. Error: {exc}"
                )
                if isinstance(exc, (ProviderException, ProviderTimeoutException, ProviderUnavailableException)):
                    raise exc
                if "timeout" in err_str or "timed out" in err_str or isinstance(exc, (TimeoutError, asyncio.TimeoutError)):
                    raise ProviderTimeoutException(f"Provider timed out during {operation_name}: {exc}")
                raise ProviderException(f"Provider failed during {operation_name}: {exc}", retryable=is_retryable)

            # Calculate backoff delay with jitter
            delay = base_delay * (backoff_factor ** (attempt - 1))
            if jitter:
                delay += random.uniform(0.0, 0.25 * delay)

            logger.warning(
                f"{operation_name}: Transient failure on attempt {attempt}/{max_attempts}: {exc}. "
                f"Retrying in {delay:.2f}s..."
            )
            await asyncio.sleep(delay)

    # Exhausted retries
    if last_exception:
        raise ProviderException(
            f"Exhausted {max_attempts} retry attempts for {operation_name}: {last_exception}",
            retryable=True
        )
