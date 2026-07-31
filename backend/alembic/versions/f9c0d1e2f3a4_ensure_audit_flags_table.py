"""ensure audit_flags table exists (idempotent)

Revision ID: f9c0d1e2f3a4
Revises: f8b9c0d1e2f3
Create Date: 2026-07-31 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = 'f9c0d1e2f3a4'
down_revision: Union[str, None] = 'f8b9c0d1e2f3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # severity is TEXT so it works whether the column is a native enum or varchar.
    op.execute("""
        CREATE TABLE IF NOT EXISTS audit_flags (
            id UUID PRIMARY KEY,
            entry_id UUID NOT NULL REFERENCES entries(id),
            month DATE NOT NULL,
            reason TEXT NOT NULL,
            severity TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_audit_flags_entry_id
        ON audit_flags (entry_id)
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS audit_flags")
