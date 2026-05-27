from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


# ── User ───────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    phone: str = Field(min_length=9, max_length=20)
    name: str = Field(min_length=1, max_length=50)
    color: str = Field(pattern=r'^#[0-9A-Fa-f]{6}$')


class PhoneLookup(BaseModel):
    phone: str = Field(min_length=9, max_length=20)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    phone: str
    name: str
    color: str
    created_at: datetime


class UserWithToken(UserOut):
    """생성 및 전화번호 조회 시에만 token 포함해서 반환."""
    token: UUID


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=50)
    color: str | None = Field(default=None, pattern=r'^#[0-9A-Fa-f]{6}$')


# ── Room ────────────────────────────────────────────────────────────────

class RoomCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    date_range_start: date
    date_range_end: date

    @model_validator(mode="after")
    def _check_range(self) -> "RoomCreate":
        if self.date_range_end < self.date_range_start:
            raise ValueError("date_range_end must be >= date_range_start")
        return self


class RoomOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    invite_code: str
    created_at: datetime
    date_range_start: date
    date_range_end: date


class MemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    name: str
    color: str
    joined_at: datetime


class RoomDetail(RoomOut):
    members: list[MemberOut]


# ── Availability ────────────────────────────────────────────────────────

class Slot(BaseModel):
    date: date
    hour: int = Field(ge=0, le=23)


class AvailabilityReplace(BaseModel):
    slots: list[Slot] = Field(max_length=1500)  # 최대 60일 × 24h + 여유


class MemberAvailability(BaseModel):
    user_id: UUID
    name: str
    color: str
    slots: list[Slot]


# ── Overlap ─────────────────────────────────────────────────────────────

class OverlapSlot(BaseModel):
    date: date
    hour: int
    count: int
    user_ids: list[UUID]


class OverlapResponse(BaseModel):
    room_id: UUID
    total_members: int
    slots: list[OverlapSlot]
