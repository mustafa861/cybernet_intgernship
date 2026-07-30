"""add parent_id to categories for chart of accounts hierarchy

Revision ID: a1b2c3d4e5f6
Revises: 0e3df192f0d7
Create Date: 2026-07-30 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '0e3df192f0d7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('categories', sa.Column('parent_id', sa.Uuid(), nullable=True))
    op.create_foreign_key(
        'fk_categories_parent_id',
        'categories', 'categories',
        ['parent_id'], ['id'],
    )


def downgrade() -> None:
    op.drop_constraint('fk_categories_parent_id', 'categories', type_='foreignkey')
    op.drop_column('categories', 'parent_id')
