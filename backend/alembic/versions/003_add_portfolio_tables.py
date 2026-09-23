"""003_add_portfolio_tables

Revision ID: 003_portfolio_tables
Revises: 002_ingestion_logs
Create Date: 2026-09-24 01:50:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '003_portfolio_tables'
down_revision: Union[str, None] = '002_ingestion_logs'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Create core.portfolios table
    op.create_table(
        'portfolios',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('base_currency', sa.String(length=16), nullable=False, server_default='USD'),
        sa.Column('initial_capital', sa.Numeric(precision=18, scale=4), nullable=False, server_default='100000.0000'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('initial_capital > 0', name='ck_portfolios_initial_capital_positive'),
        schema='core'
    )
    op.create_index('ix_core_portfolios_is_active', 'portfolios', ['is_active'], unique=False, schema='core')

    # 2. Create core.portfolio_holdings table
    op.create_table(
        'portfolio_holdings',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('portfolio_id', sa.String(length=36), nullable=False),
        sa.Column('instrument_id', sa.String(length=36), nullable=False),
        sa.Column('quantity', sa.Numeric(precision=18, scale=8), nullable=False),
        sa.Column('entry_price', sa.Numeric(precision=18, scale=8), nullable=False),
        sa.Column('entry_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('target_weight', sa.Numeric(precision=8, scale=4), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['portfolio_id'], ['core.portfolios.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['instrument_id'], ['core.instruments.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('portfolio_id', 'instrument_id', name='uq_portfolio_holding_inst'),
        sa.CheckConstraint('quantity > 0', name='ck_holding_quantity_positive'),
        sa.CheckConstraint('entry_price > 0', name='ck_holding_entry_price_positive'),
        schema='core'
    )
    op.create_index('ix_core_portfolio_holdings_portfolio_id', 'portfolio_holdings', ['portfolio_id'], unique=False, schema='core')
    op.create_index('ix_core_portfolio_holdings_instrument_id', 'portfolio_holdings', ['instrument_id'], unique=False, schema='core')

def downgrade() -> None:
    op.drop_table('portfolio_holdings', schema='core')
    op.drop_table('portfolios', schema='core')
