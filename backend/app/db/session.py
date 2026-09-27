import os
import shutil
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Check if running in serverless environment (read-only root, writable /tmp)
is_serverless = bool(os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME") or "/tmp" in settings.DATABASE_URL)
if is_serverless:
    # Look for preloaded database files across possible root locations
    search_dirs = [
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        os.getcwd(),
        "/var/task",
        "/var/task/backend"
    ]
    for db_name in ["quant_dashboard.db", "core.db", "market_data.db", "strategy.db", "backtesting.db"]:
        dst = os.path.join("/tmp", db_name)
        if not os.path.exists(dst):
            for s_dir in search_dirs:
                src = os.path.join(s_dir, db_name)
                if os.path.exists(src):
                    try:
                        shutil.copy2(src, dst)
                        break
                    except Exception:
                        pass

engine_kwargs = {
    "pool_pre_ping": True,
    "future": True,
}

# Connection pool tuning
if not settings.DATABASE_URL.startswith("sqlite"):
    engine_kwargs.update({
        "pool_size": 20,
        "max_overflow": 30,
        "pool_recycle": 1800,
        "pool_timeout": 30,
    })
else:
    engine_kwargs.update({
        "connect_args": {"check_same_thread": False},
    })

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)

if settings.DATABASE_URL.startswith("sqlite"):
    from sqlalchemy import event
    @event.listens_for(engine, "connect")
    def attach_schemas(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        prefix = "/tmp/" if is_serverless else ""
        cursor.execute(f"ATTACH DATABASE '{prefix}core.db' AS core;")
        cursor.execute(f"ATTACH DATABASE '{prefix}market_data.db' AS market_data;")
        cursor.execute(f"ATTACH DATABASE '{prefix}strategy.db' AS strategy;")
        cursor.execute(f"ATTACH DATABASE '{prefix}backtesting.db' AS backtesting;")
        cursor.close()

# Ensure tables exist
import app.models  # noqa: F401
from app.db.base import Base
Base.metadata.create_all(bind=engine)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
