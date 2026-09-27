"""005_add_backtesting_tables

Revision ID: 005_backtesting_tables
Revises: 004_strategy_signal_tables
Create Date: 2026-09-24 22:12:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '005_backtesting_tables'
down_revision: Union[str, None] = '004_strategy_signal_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Create logical PostgreSQL schema 'backtesting'
    op.execute("CREATE SCHEMA IF NOT EXISTS backtesting")

    # 2. Create backtesting.backtests table
    op.create_table(
        'backtests',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('strategy_configuration_id', sa.String(length=36), nullable=False),
        sa.Column('instrument_id', sa.String(length=36), nullable=False),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('initial_capital', sa.Numeric(precision=18, scale=4), nullable=False, server_default='100000.0000'),
        sa.Column('execution_timing', sa.String(length=32), nullable=False, server_default='NEXT_OPEN'),
        sa.Column('position_sizing', sa.String(length=32), nullable=False, server_default='FULL_CAPITAL'),
        sa.Column('commission', sa.Numeric(precision=18, scale=8), nullable=False, server_default='0.0'),
        sa.Column('slippage', sa.Numeric(precision=18, scale=8), nullable=False, server_default='0.0'),
        sa.Column('direction', sa.String(length=32), nullable=False, server_default='LONG_ONLY'),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='PENDING'),
        sa.Column('final_cash', sa.Numeric(precision=18, scale=8), nullable=True),
        sa.Column('final_position', sa.Numeric(precision=18, scale=8), nullable=True),
        sa.Column('final_portfolio_value', sa.Numeric(precision=18, scale=8), nullable=True),
        sa.Column('error_message', sa.String(length=512), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['strategy_configuration_id'], ['strategy.strategy_configurations.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['instrument_id'], ['core.instruments.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('initial_capital > 0', name='ck_backtests_capital_positive'),
        schema='backtesting'
    )
    op.create_index('ix_backtesting_backtests_strategy_config_id', 'backtests', ['strategy_configuration_id'], unique=False, schema='backtesting')
    op.create_index('ix_backtesting_backtests_instrument_id', 'backtests', ['instrument_id'], unique=False, schema='backtesting')
    op.create_index('ix_backtesting_backtests_status', 'backtests', ['status'], unique=False, schema='backtesting')

    # 3. Create backtesting.trade_events table
    op.create_table(
        'trade_events',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('backtest_id', sa.String(length=36), nullable=False),
        sa.Column('signal_id', sa.String(length=36), nullable=True),
        sa.Column('instrument_id', sa.String(length=36), nullable=False),
        sa.Column('side', sa.String(length=16), nullable=False),
        sa.Column('signal_timestamp', sa.DateTime(timezone=True), nullable=True),
        sa.Column('execution_timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('execution_reason', sa.String(length=32), nullable=False, server_default='SIGNAL'),
        sa.Column('execution_price', sa.Numeric(precision=18, scale=8), nullable=False),
        sa.Column('quantity', sa.Numeric(precision=18, scale=8), nullable=False),
        sa.Column('notional_value', sa.Numeric(precision=18, scale=8), nullable=False),
        sa.Column('commission', sa.Numeric(precision=18, scale=8), nullable=False, server_default='0.0'),
        sa.Column('slippage', sa.Numeric(precision=18, scale=8), nullable=False, server_default='0.0'),
        sa.Column('cash_after', sa.Numeric(precision=18, scale=8), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['backtest_id'], ['backtesting.backtests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['signal_id'], ['strategy.signal_events.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['instrument_id'], ['core.instruments.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('execution_price > 0', name='ck_trades_price_positive'),
        sa.CheckConstraint('quantity > 0', name='ck_trades_qty_positive'),
        schema='backtesting'
    )
    op.create_index('ix_backtesting_trade_events_backtest_id', 'trade_events', ['backtest_id'], unique=False, schema='backtesting')
    op.create_index('ix_backtesting_trade_events_signal_id', 'trade_events', ['signal_id'], unique=False, schema='backtesting')
    op.create_index('ix_backtesting_trade_events_instrument_id', 'trade_events', ['instrument_id'], unique=False, schema='backtesting')
    op.create_index('ix_backtesting_trade_events_execution_timestamp', 'trade_events', ['execution_timestamp'], unique=False, schema='backtesting')

    # 4. Create backtesting.portfolio_states table
    op.create_table(
        'portfolio_states',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('backtest_id', sa.String(length=36), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('cash', sa.Numeric(precision=18, scale=8), nullable=False),
        sa.Column('position_quantity', sa.Numeric(precision=18, scale=8), nullable=False),
        sa.Column('market_price', sa.Numeric(precision=18, scale=8), nullable=False),
        sa.Column('position_value', sa.Numeric(precision=18, scale=8), nullable=False),
        sa.Column('portfolio_value', sa.Numeric(precision=18, scale=8), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['backtest_id'], ['backtesting.backtests.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        schema='backtesting'
    )
    op.create_index('ix_backtesting_portfolio_states_backtest_id', 'portfolio_states', ['backtest_id'], unique=False, schema='backtesting')
    op.create_index('ix_backtesting_portfolio_states_timestamp', 'portfolio_states', ['timestamp'], unique=False, schema='backtesting')

def downgrade() -> None:
    op.drop_table('portfolio_states', schema='backtesting')
    op.drop_table('trade_events', schema='backtesting')
    op.drop_table('backtests', schema='backtesting')
    op.execute("DROP SCHEMA IF EXISTS backtesting")
