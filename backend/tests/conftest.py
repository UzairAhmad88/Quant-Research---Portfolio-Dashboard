import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base

@pytest.fixture(scope="function")
def sqlite_db():
    engine = create_engine("sqlite:///:memory:", echo=False)
    
    # Strip schema specifications for SQLite in-memory compatibility
    for table in Base.metadata.tables.values():
        table.schema = None

    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
