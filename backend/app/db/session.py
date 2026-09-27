from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine_kwargs = {
    "pool_pre_ping": True,
    "future": True,
}

# Connection pool tuning
if not settings.DATABASE_URL.startswith("sqlite"):
    engine_kwargs.update({
        "pool_size": 20,
        "max_overflow": 30,
        "pool_recycle": 1800,  # Recycle connections after 30 mins to avoid idle drops
        "pool_timeout": 30,    # Max wait time for connection acquisition
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
        cursor.execute("ATTACH DATABASE 'core.db' AS core;")
        cursor.execute("ATTACH DATABASE 'market_data.db' AS market_data;")
        cursor.execute("ATTACH DATABASE 'strategy.db' AS strategy;")
        cursor.execute("ATTACH DATABASE 'backtesting.db' AS backtesting;")
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
