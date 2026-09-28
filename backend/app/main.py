import logging
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.core.middleware import (
    RequestCorrelationMiddleware,
    SecurityHeadersMiddleware,
    RateLimitingMiddleware,
)
from app.core.exceptions import setup_exception_handlers
from app.api.v1.router import api_router
from app.api.v1.health import get_readiness, get_version

logger = logging.getLogger("quant_api.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Enforce security validation & log start
    settings.validate_production_security()
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]")
    yield
    # Graceful shutdown hook
    logger.info(f"Shutting down {settings.PROJECT_NAME} gracefully...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Institutional Quantitative Finance Research and Portfolio Analysis Platform API.",
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if not settings.is_production() else None,
    docs_url="/docs" if not settings.is_production() else None,
    redoc_url="/redoc" if not settings.is_production() else None,
    lifespan=lifespan,
)

# Exception Handlers
setup_exception_handlers(app)

# Defensive Middleware Pipeline (Registered inside-out)
app.add_middleware(RequestCorrelationMiddleware)
app.add_middleware(RateLimitingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Request-ID", "X-Correlation-ID", "Accept", "Origin"],
)
app.add_middleware(SecurityHeadersMiddleware)

# Root level health & version endpoints for orchestration probes
@app.get("/health", tags=["Health"], summary="Root Liveness Probe")
def root_health():
    return {
        "status": "ok",
        "service": "quant-research-backend",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

@app.get("/health/ready", tags=["Health"], summary="Root Readiness Probe")
def root_ready(db: Session = Depends(get_db)):
    return get_readiness(db)

@app.get("/version", tags=["Health"], summary="Root Version Endpoint")
def root_version():
    return get_version()

from fastapi import WebSocket, WebSocketDisconnect
from app.core.websocket_manager import ws_manager

@app.websocket("/ws/market-data")
async def websocket_market_data(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                import json
                msg = json.loads(data)
                if msg.get("action") == "subscribe" and "symbols" in msg:
                    ws_manager.subscribe(websocket, msg["symbols"])
            except Exception:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

# Mount Versioned API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
