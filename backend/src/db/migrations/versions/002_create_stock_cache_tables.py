"""Create stock cache tables.

Revision ID: 002
Revises: 001
Create Date: 2026-01-24

Tables:
- stock_price_history: OHLCV data for persistent caching
- stock_cache_metadata: Cache freshness tracking
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = '002'
down_revision: str | None = '001'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Create stock_price_history table
    op.create_table(
        'stock_price_history',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('symbol', sa.String(20), nullable=False),
        sa.Column('trade_date', sa.Date(), nullable=False),
        sa.Column('open', sa.Float(), nullable=False),
        sa.Column('high', sa.Float(), nullable=False),
        sa.Column('low', sa.Float(), nullable=False),
        sa.Column('close', sa.Float(), nullable=False),
        sa.Column('volume', sa.BigInteger(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_stock_price_history_symbol', 'stock_price_history', ['symbol'])
    op.create_index(
        'ix_stock_price_history_symbol_date',
        'stock_price_history',
        ['symbol', 'trade_date'],
        unique=True
    )

    # Create stock_cache_metadata table
    op.create_table(
        'stock_cache_metadata',
        sa.Column('symbol', sa.String(20), nullable=False),
        sa.Column('last_fetched_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('period_start', sa.Date(), nullable=False),
        sa.Column('period_end', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('symbol'),
    )


def downgrade() -> None:
    op.drop_table('stock_cache_metadata')
    op.drop_index('ix_stock_price_history_symbol_date', table_name='stock_price_history')
    op.drop_index('ix_stock_price_history_symbol', table_name='stock_price_history')
    op.drop_table('stock_price_history')
