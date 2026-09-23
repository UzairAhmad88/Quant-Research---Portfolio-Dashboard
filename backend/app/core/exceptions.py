from typing import Optional, Any, Dict
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel

class ErrorDetailBody(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None

class APIErrorResponse(BaseModel):
    error: ErrorDetailBody

class AppException(Exception):
    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Any] = None
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details
        super().__init__(message)

class NotFoundError(AppException):
    def __init__(self, message: str = "The requested resource was not found.", details: Optional[Any] = None):
        super().__init__(message, code="NOT_FOUND", status_code=status.HTTP_404_NOT_FOUND, details=details)

class ConflictError(AppException):
    def __init__(self, message: str = "Resource conflict or duplicate entry.", details: Optional[Any] = None):
        super().__init__(message, code="CONFLICT", status_code=status.HTTP_409_CONFLICT, details=details)

class ValidationError(AppException):
    def __init__(self, message: str = "Invalid request payload or parameters.", details: Optional[Any] = None):
        super().__init__(message, code="VALIDATION_ERROR", status_code=status.HTTP_400_BAD_REQUEST, details=details)

class DatabaseError(AppException):
    def __init__(self, message: str = "A database operation error occurred.", details: Optional[Any] = None):
        super().__init__(message, code="DATABASE_ERROR", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, details=details)

def setup_exception_handlers(app: FastAPI):
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                }
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Request validation failed.",
                    "details": exc.errors(),
                }
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected server error occurred.",
                    "details": None,
                }
            },
        )
