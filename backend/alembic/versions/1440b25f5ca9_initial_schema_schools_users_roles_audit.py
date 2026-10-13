"""initial_schema_schools_users_roles_audit

Revision ID: 1440b25f5ca9
Revises: 
Create Date: 2026-10-12 16:34:24.828155

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1440b25f5ca9'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the initial application schema, adopting tables made by older local runs."""
    import os
    import sys

    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
    from app.models import Base

    bind = op.get_bind()
    for table in Base.metadata.sorted_tables:
        table.create(bind=bind, checkfirst=True)


def downgrade() -> None:
    """The initial schema is retained to avoid destructive data loss."""
