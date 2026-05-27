import random
import string
from datetime import date, datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    SmallInteger,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

# 헷갈리는 문자(0/O, 1/I/L) 제외한 4자리 초대 코드
_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

def _gen_invite_code() -> str:
    return ''.join(random.choices(_CODE_CHARS, k=4))


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    color: Mapped[str] = mapped_column(String(7), nullable=False, default="#FF6B4A")
    # 로그인 없는 soft-auth: 생성 시 발급, localStorage에 저장
    token: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), default=uuid4, unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    memberships: Mapped[list["RoomMember"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Room(Base):
    __tablename__ = "rooms"
    __table_args__ = (
        CheckConstraint("date_range_end >= date_range_start", name="ck_room_date_range"),
    )

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    invite_code: Mapped[str] = mapped_column(
        String(4), unique=True, nullable=False, default=_gen_invite_code
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    date_range_start: Mapped[date] = mapped_column(Date, nullable=False)
    date_range_end: Mapped[date] = mapped_column(Date, nullable=False)

    members: Mapped[list["RoomMember"]] = relationship(
        back_populates="room", cascade="all, delete-orphan"
    )


class RoomMember(Base):
    """users ↔ rooms n:m 중간 테이블"""
    __tablename__ = "room_members"

    user_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    room_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("rooms.id", ondelete="CASCADE"),
        primary_key=True,
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped[User] = relationship(back_populates="memberships")
    room: Mapped[Room] = relationship(back_populates="members")
    availabilities: Mapped[list["Availability"]] = relationship(
        back_populates="member",
        cascade="all, delete-orphan",
        foreign_keys="[Availability.user_id, Availability.room_id]",
    )

    # MemberOut 직렬화용 — user 로드 후 접근
    @property
    def name(self) -> str:
        return self.user.name

    @property
    def color(self) -> str:
        return self.user.color


class Availability(Base):
    __tablename__ = "availabilities"
    __table_args__ = (
        # room_members 복합 FK — 멤버가 아니면 슬롯 등록 불가 (DB 레벨)
        ForeignKeyConstraint(
            ["user_id", "room_id"],
            ["room_members.user_id", "room_members.room_id"],
            ondelete="CASCADE",
            name="fk_avail_member",
        ),
        UniqueConstraint("user_id", "room_id", "date", "hour", name="uq_avail_slot"),
        CheckConstraint("hour >= 0 AND hour <= 23", name="ck_avail_hour"),
        Index("ix_avail_room_date_hour", "room_id", "date", "hour"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False)
    room_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    hour: Mapped[int] = mapped_column(SmallInteger, nullable=False)

    member: Mapped[RoomMember] = relationship(
        back_populates="availabilities",
        foreign_keys=[user_id, room_id],
    )
