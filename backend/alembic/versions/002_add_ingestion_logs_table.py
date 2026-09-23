"""002_add_ingestion_logs_table

Revision ID: 002_ingestion_logs
Revises: 001_initial_db
Create Date: 2026-09-23 22:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002_ingestion_logs'
down_revision: Union[str, None] = '001_initial_db'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table(
        'ingestion_logs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('instrument_id', sa.String(length=36), nullable=True),
        sa.Column('provider', sa.String(length=64), nullable=False),
        sa.Column('requested_start', sa.DateTime(timezone=True), nullable=False),
        sa.Column('requested_end', sa.DateTime(timezone=True), nullable=False),
        sa.Column('actual_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('actual_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('frequency', sa.Enum('DAILY', 'HOURLY', 'MINUTE', name='datafrequency', schema='market_data'), nullable=False),
        sa.Column('rows_received', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('rows_inserted', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('rows_skipped', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('rows_invalid', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('duration_ms', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('status', sa.Enum('PENDING', 'RUNNING', 'COMPLETED', 'COMPLETED_WITH_WARNINGS', 'FAILED', name='ingestionstatus', schema='market_data'), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['instrument_id'], ['core.instruments.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        schema='market_data'
    )
    op.create_index('idx_ingestion_logs_inst_created', 'ingestion_logs', ['instrument_id', 'created_at'], schema='market_data')

def downgrade() -> None:
    op.drop_index('idx_ingestion_logs_inst_created', table_name='ingestion_logs', schema='market_data')
    op.drop_table('ingestion_logs', schema='market_data')
    op.execute("DROP TYPE IF EXISTS market_data.ingestionstatus")
