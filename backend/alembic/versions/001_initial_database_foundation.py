"""001_initial_database_foundation

Revision ID: 001_initial_db
Revises: 
Create Date: 2026-09-23 22:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_db'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Create logical PostgreSQL schemas
    op.execute("CREATE SCHEMA IF NOT EXISTS core")
    op.execute("CREATE SCHEMA IF NOT EXISTS market_data")

    # 2. Create core.instruments table
    op.create_table(
        'instruments',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('symbol', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('asset_type', sa.Enum('EQUITY', 'ETF', 'INDEX', 'CRYPTO', name='assettype', schema='core'), nullable=False),
        sa.Column('exchange', sa.String(length=64), nullable=False, server_default='UNKNOWN'),
        sa.Column('currency', sa.String(length=16), nullable=False, server_default='USD'),
        sa.Column('country', sa.String(length=64), nullable=True),
        sa.Column('provider_symbol', sa.String(length=64), nullable=True),
        sa.Column('active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('symbol', 'exchange', 'asset_type', name='uq_instrument_symbol_exchange_asset'),
        schema='core'
    )
    op.create_index('ix_core_instruments_symbol', 'instruments', ['symbol'], unique=False, schema='core')
    op.create_index('ix_core_instruments_asset_type', 'instruments', ['asset_type'], unique=False, schema='core')

    # 3. Create market_data.ohlcv table
    op.create_table(
        'ohlcv',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('instrument_id', sa.String(length=36), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('frequency', sa.Enum('DAILY', 'HOURLY', 'MINUTE', name='datafrequency', schema='market_data'), nullable=False),
        sa.Column('open', sa.Numeric(precision=18, scale=8), nullable=False),
        sa.Column('high', sa.Numeric(precision=18, scale=8), nullable=False),
        sa.Column('low', sa.Numeric(precision=18, scale=8), nullable=False),
        sa.Column('close', sa.Numeric(precision=18, scale=8), nullable=False),
        sa.Column('adjusted_close', sa.Numeric(precision=18, scale=8), nullable=True),
        sa.Column('volume', sa.Numeric(precision=24, scale=8), nullable=False),
        sa.Column('provider', sa.String(length=64), nullable=False, server_default='ABSTRACT'),
        sa.Column('provider_symbol', sa.String(length=64), nullable=True),
        sa.Column('retrieved_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['instrument_id'], ['core.instruments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('instrument_id', 'timestamp', 'frequency', 'provider', name='uq_ohlcv_inst_ts_freq_prov'),
        sa.CheckConstraint('open > 0', name='ck_ohlcv_open_positive'),
        sa.CheckConstraint('high > 0', name='ck_ohlcv_high_positive'),
        sa.CheckConstraint('low > 0', name='ck_ohlcv_low_positive'),
        sa.CheckConstraint('close > 0', name='ck_ohlcv_close_positive'),
        sa.CheckConstraint('volume >= 0', name='ck_ohlcv_volume_nonnegative'),
        sa.CheckConstraint('high >= low', name='ck_ohlcv_high_gte_low'),
        schema='market_data'
    )
    op.create_index('ix_market_data_ohlcv_instrument_id', 'ohlcv', ['instrument_id'], unique=False, schema='market_data')
    op.create_index('ix_market_data_ohlcv_timestamp', 'ohlcv', ['timestamp'], unique=False, schema='market_data')
    op.create_index('ix_market_data_ohlcv_frequency', 'ohlcv', ['frequency'], unique=False, schema='market_data')
    op.create_index('idx_ohlcv_inst_freq_ts_desc', 'ohlcv', ['instrument_id', 'frequency', 'timestamp'], unique=False, schema='market_data')

def downgrade() -> None:
    op.drop_table('ohlcv', schema='market_data')
    op.drop_table('instruments', schema='core')
    op.execute("DROP TYPE IF EXISTS market_data.datafrequency")
    op.execute("DROP TYPE IF EXISTS core.assettype")
    op.execute("DROP SCHEMA IF EXISTS market_data")
    op.execute("DROP SCHEMA IF EXISTS core")
