"""Adopt the complete application schema for databases already stamped at the empty baseline.

Revision ID: 20261013_0002
Revises: 1440b25f5ca9
"""
import os
import sys
from typing import Sequence, Union

from alembic import op

revision: str = "20261013_0002"
down_revision: Union[str, Sequence[str], None] = "1440b25f5ca9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create any missing model tables without replacing data in an existing local schema."""
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
    from app.models import Base

    bind = op.get_bind()
    for table in Base.metadata.sorted_tables:
        table.create(bind=bind, checkfirst=True)


def downgrade() -> None:
    """Keep adopted data; schema adoption is intentionally non-destructive."""
