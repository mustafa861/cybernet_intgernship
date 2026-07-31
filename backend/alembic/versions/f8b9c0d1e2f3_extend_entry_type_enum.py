"""extend entry_type enum with asset, liability, equity

Revision ID: f8b9c0d1e2f3
Revises: f7a8b9c0d1e2
Create Date: 2026-07-31 13:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = 'f8b9c0d1e2f3'
down_revision: Union[str, None] = 'f7a8b9c0d1e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_NEW_VALUES = ("asset", "liability", "equity")


def upgrade() -> None:
    connection = op.get_bind()
    if connection.dialect.name != "postgresql":
        return
    # ALTER TYPE ... ADD VALUE cannot run inside a transaction block,
    # so run each statement in AUTOCOMMIT mode.
    autocommit_conn = connection.execution_options(isolation_level="AUTOCOMMIT")
    for value in _NEW_VALUES:
        autocommit_conn.execute(
            sa.text(f"ALTER TYPE entry_type ADD VALUE IF NOT EXISTS '{value}'")
        )


def downgrade() -> None:
    pass
