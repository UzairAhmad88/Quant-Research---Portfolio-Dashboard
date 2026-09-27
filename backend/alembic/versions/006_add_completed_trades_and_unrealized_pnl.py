"""006_add_completed_trades_and_unrealized_pnl

Revision ID: 006_completed_trades_tables
Revises: 005_backtesting_tables
Create Date: 2026-09-24 23:05:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '006_completed_trades_tables'
down_revision: Union[str, None] = '005_backtesting_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create backtesting.completed_trades table
    op.create_table(
        'completed_trades',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('backtest_id', sa.String(length=36), nullable=False),
        sa.Column('instrument_id', sa.String(length=36), nullable=False),
        sa.Column('entry_signal_id', sa.String(length=36), nullable=True),
        sa.Column('exit_signal_id', sa.String(length=36), nullable=True),
        sa.Column('entry_trade_event_id', sa.String(length=36), nullable=True),
        sa.Column('exit_trade_event_id', sa.String(length=36), nullable=True),
        sa.Column('entry_timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('exit_timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('entry_price', sa.Numeric(precision=18, scale=8), nullable=False),
        sa.Column('exit_price', sa.Numeric(precision=18, scale=8), nullable=False),
        sa.Column('quantity', sa.Numeric(precision=18, scale=8), nullable=False),
        sa.Column('entry_notional', sa.Numeric(precision=18, scale=8), nullable=False),
        sa.Column('exit_notional', sa.Numeric(precision=18, scale=8), nullable=False),
        sa.Column('entry_commission', sa.Numeric(precision=18, scale=8), nullable=False, server_default='0.0'),
        sa.Column('exit_commission', sa.Numeric(precision=18, scale=8), nullable=False, server_default='0.0'),
        sa.Column('entry_slippage', sa.Numeric(precision=18, scale=8), nullable=False, server_default='0.0'),
        sa.Column('exit_slippage', sa.Numeric(precision=18, scale=8), nullable=False, server_default='0.0'),
        sa.Column('total_cost', sa.Numeric(precision=18, scale=8), nullable=False, server_default='0.0'),
        sa.Column('gross_pnl', sa.Numeric(precision=18, scale=8), nullable=False),
        sa.Column('net_pnl', sa.Numeric(precision=18, scale=8), nullable=False),
        sa.Column('trade_return', sa.Numeric(precision=18, scale=8), nullable=False),
        sa.Column('duration_days', sa.Numeric(precision=18, scale=4), nullable=False, server_default='0.0'),
        sa.Column('exit_reason', sa.String(length=32), nullable=False, server_default='SIGNAL'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['backtest_id'], ['backtesting.backtests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['instrument_id'], ['core.instruments.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['entry_signal_id'], ['strategy.signal_events.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['exit_signal_id'], ['strategy.signal_events.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['entry_trade_event_id'], ['backtesting.trade_events.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['exit_trade_event_id'], ['backtesting.trade_events.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        schema='backtesting'
    )

    # Create indexes for completed_trades
    op.create_index(
        'ix_completed_trades_backtest_id',
        'completed_trades',
        ['backtest_id'],
        schema='backtesting'
    )
    op.create_index(
        'ix_completed_trades_instrument_id',
        'completed_trades',
        ['instrument_id'],
        schema='backtesting'
    )
    op.create_index(
        'ix_completed_trades_entry_timestamp',
        'completed_trades',
        ['entry_timestamp'],
        schema='backtesting'
    )

    # 2. Add unrealized_pnl column to backtesting.portfolio_states
    op.add_column(
        'portfolio_states',
        sa.Column('unrealized_pnl', sa.Numeric(precision=18, scale=8), nullable=True, server_default='0.0'),
        schema='backtesting'
    )


def downgrade() -> None:
    op.drop_column('portfolio_states', 'unrealized_pnl', schema='backtesting')
    op.drop_index('ix_completed_trades_entry_timestamp', table_name='completed_trades', schema='backtesting')
    op.drop_index('ix_completed_trades_instrument_id', table_name='completed_trades', schema='backtesting')
    op.drop_index('ix_completed_trades_backtest_id', table_name='completed_trades', schema='backtesting')
    op.drop_table('completed_trades', schema='backtesting')
