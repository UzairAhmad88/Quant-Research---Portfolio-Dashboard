-- Initial database schema placeholder.
-- Add SQLAlchemy/Alembic migrations here when database models are finalized.

CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(255),
    asset_type VARCHAR(32),
    exchange VARCHAR(64),
    currency VARCHAR(16)
);
