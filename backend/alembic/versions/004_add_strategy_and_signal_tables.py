"""004_add_strategy_and_signal_tables

Revision ID: 004_strategy_signal_tables
Revises: 003_portfolio_tables
Create Date: 2026-09-24 21:40:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '004_strategy_signal_tables'
down_revision: Union[str, None] = '003_portfolio_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Create logical PostgreSQL schema 'strategy'
    op.execute("CREATE SCHEMA IF NOT EXISTS strategy")

    # 2. Create strategy.strategy_configurations table
    op.create_table(
        'strategy_configurations',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('strategy_type', sa.String(length=64), nullable=False, server_default='MOVING_AVERAGE'),
        sa.Column('instrument_id', sa.String(length=36), nullable=False),
        sa.Column('configuration_hash', sa.String(length=64), nullable=False),
        sa.Column('ma_type', sa.String(length=16), nullable=True),
        sa.Column('fast_window', sa.Integer(), nullable=True),
        sa.Column('slow_window', sa.Integer(), nullable=True),
        sa.Column('price_source', sa.String(length=32), nullable=True),
        sa.Column('configuration_json', sa.JSON(), nullable=False),
        sa.Column('active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['instrument_id'], ['core.instruments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('instrument_id', 'strategy_type', 'configuration_hash', name='uq_strategy_config_inst_type_hash'),
        schema='strategy'
    )
    op.create_index('ix_strategy_strategy_configurations_instrument_id', 'strategy_configurations', ['instrument_id'], unique=False, schema='strategy')
    op.create_index('ix_strategy_strategy_configurations_config_hash', 'strategy_configurations', ['configuration_hash'], unique=False, schema='strategy')

    # 3. Create strategy.signal_events table
    op.create_table(
        'signal_events',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('strategy_configuration_id', sa.String(length=36), nullable=False),
        sa.Column('instrument_id', sa.String(length=36), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('signal_type', sa.String(length=16), nullable=False),
        sa.Column('signal_state', sa.String(length=16), nullable=False),
        sa.Column('price', sa.Numeric(precision=18, scale=8), nullable=False),
        sa.Column('source', sa.String(length=32), nullable=False, server_default='STRATEGY_ENGINE'),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['strategy_configuration_id'], ['strategy.strategy_configurations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['instrument_id'], ['core.instruments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('strategy_configuration_id', 'timestamp', 'signal_type', name='uq_signal_events_config_ts_type'),
        sa.CheckConstraint('price >= 0', name='ck_signal_events_price_nonnegative'),
        schema='strategy'
    )
    op.create_index('ix_strategy_signal_events_strategy_config_id', 'signal_events', ['strategy_configuration_id'], unique=False, schema='strategy')
    op.create_index('ix_strategy_signal_events_instrument_id', 'signal_events', ['instrument_id'], unique=False, schema='strategy')
    op.create_index('ix_strategy_signal_events_timestamp', 'signal_events', ['timestamp'], unique=False, schema='strategy')
    op.create_index('ix_strategy_signal_events_signal_type', 'signal_events', ['signal_type'], unique=False, schema='strategy')
    op.create_index('ix_strategy_signal_events_inst_ts', 'signal_events', ['instrument_id', 'timestamp'], unique=False, schema='strategy')

def downgrade() -> None:
    op.drop_table('signal_events', schema='strategy')
    op.drop_table('strategy_configurations', schema='strategy')
    op.execute("DROP SCHEMA IF EXISTS strategy")
