"""add invite_code to rooms

Revision ID: 0002_add_invite_code
Revises: 0001_init
Create Date: 2026-05-27

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002_add_invite_code"
down_revision: Union[str, None] = "0001_init"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "rooms",
        sa.Column("invite_code", sa.String(4), nullable=True),
    )
    # 기존 룸에 코드 채우기
    op.execute("""
        UPDATE rooms
        SET invite_code = substr(md5(random()::text), 1, 4)
        WHERE invite_code IS NULL
    """)
    op.alter_column("rooms", "invite_code", nullable=False)
    op.create_index("ix_rooms_invite_code", "rooms", ["invite_code"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_rooms_invite_code", table_name="rooms")
    op.drop_column("rooms", "invite_code")
