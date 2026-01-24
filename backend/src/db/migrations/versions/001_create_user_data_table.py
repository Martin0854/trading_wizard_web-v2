"""Create user_data table.

Revision ID: 001
Revises:
Create Date: 2026-01-24

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = '001'
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        'user_data',
        sa.Column('user_id_hash', sa.String(64), primary_key=True),
        sa.Column('encrypted_blob', sa.LargeBinary(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_user_data_user_id_hash', 'user_data', ['user_id_hash'])


def downgrade() -> None:
    op.drop_index('ix_user_data_user_id_hash', table_name='user_data')
    op.drop_table('user_data')
