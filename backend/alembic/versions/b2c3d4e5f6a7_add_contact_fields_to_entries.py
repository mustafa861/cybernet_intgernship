"""add contact_name and contact_type to entries for AR/AP

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-07-30 11:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('entries', sa.Column('contact_name', sa.Text(), nullable=True))
    op.add_column('entries', sa.Column('contact_type', sa.Enum('customer', 'vendor', name='contact_type'), nullable=True))


def downgrade() -> None:
    op.drop_column('entries', 'contact_type')
    op.drop_column('entries', 'contact_name')
    op.execute('DROP TYPE IF EXISTS contact_type')
