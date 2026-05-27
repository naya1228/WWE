"""init schema: users / rooms / room_members / availabilities

Revision ID: 0001_init
Revises:
Create Date: 2026-05-27

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_init"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── users ──────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("phone", sa.String(20), nullable=False, unique=True),
        sa.Column("name", sa.String(50), nullable=False),
        sa.Column("color", sa.String(7), nullable=False, server_default="#FF6B4A"),
        sa.Column("token", postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_users_phone", "users", ["phone"], unique=True)
    op.create_index("ix_users_token", "users", ["token"], unique=True)

    # ── rooms ───────────────────────────────────────────────────────────
    op.create_table(
        "rooms",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("date_range_start", sa.Date(), nullable=False),
        sa.Column("date_range_end", sa.Date(), nullable=False),
        sa.CheckConstraint(
            "date_range_end >= date_range_start", name="ck_room_date_range"
        ),
    )

    # ── room_members (users ↔ rooms n:m) ────────────────────────────────
    op.create_table(
        "room_members",
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            primary_key=True,
        ),
        sa.Column(
            "room_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("rooms.id", ondelete="CASCADE"),
            nullable=False,
            primary_key=True,
        ),
        sa.Column(
            "joined_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_room_members_room_id", "room_members", ["room_id"])
    op.create_index("ix_room_members_user_id", "room_members", ["user_id"])

    # ── availabilities ──────────────────────────────────────────────────
    op.create_table(
        "availabilities",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("room_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("hour", sa.SmallInteger(), nullable=False),
        # 복합 FK → room_members: 멤버가 아니면 슬롯 등록 불가 (DB 레벨 보장)
        sa.ForeignKeyConstraint(
            ["user_id", "room_id"],
            ["room_members.user_id", "room_members.room_id"],
            ondelete="CASCADE",
            name="fk_avail_member",
        ),
        sa.UniqueConstraint("user_id", "room_id", "date", "hour", name="uq_avail_slot"),
        sa.CheckConstraint("hour >= 0 AND hour <= 23", name="ck_avail_hour"),
    )
    # room 기준 집계 쿼리 최적화 인덱스
    op.create_index("ix_avail_room_date_hour", "availabilities", ["room_id", "date", "hour"])


def downgrade() -> None:
    op.drop_index("ix_avail_room_date_hour", table_name="availabilities")
    op.drop_table("availabilities")

    op.drop_index("ix_room_members_user_id", table_name="room_members")
    op.drop_index("ix_room_members_room_id", table_name="room_members")
    op.drop_table("room_members")

    op.drop_table("rooms")

    op.drop_index("ix_users_phone", table_name="users")
    op.drop_table("users")