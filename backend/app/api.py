from collections import defaultdict
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_session
from app.models import Availability, Room, RoomMember, User
from app.schemas import (
    AvailabilityReplace,
    MemberAvailability,
    MemberOut,
    OverlapResponse,
    OverlapSlot,
    PhoneLookup,
    RoomCreate,
    RoomDetail,
    RoomOut,
    Slot,
    UserCreate,
    UserOut,
    UserUpdate,
    UserWithToken,
)

router = APIRouter()


# ── 내부 헬퍼 ──────────────────────────────────────────────────────────

async def _get_authed_user(
    x_user_token: UUID | None,
    db: AsyncSession,
) -> User:
    """X-User-Token 헤더로 사용자 인증. 실패 시 401/403."""
    if x_user_token is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "X-User-Token 헤더가 없어요")
    result = await db.execute(select(User).where(User.token == x_user_token))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "유효하지 않은 토큰이에요")
    return user


async def _get_member(user_id: UUID, room_id: UUID, db: AsyncSession) -> RoomMember:
    """room_members 행 조회. 없으면 404."""
    m = await db.get(RoomMember, (user_id, room_id))
    if m is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "이 룸의 멤버가 아니에요")
    return m


# ── Users ──────────────────────────────────────────────────────────────

@router.post("/users", response_model=UserWithToken, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreate,
    db: AsyncSession = Depends(get_session),
) -> User:
    """신규 사용자 생성. 전화번호 중복이면 409."""
    exists = await db.execute(select(User.id).where(User.phone == payload.phone))
    if exists.scalar_one_or_none() is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "이미 사용 중인 전화번호예요")

    user = User(phone=payload.phone, name=payload.name, color=payload.color)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/users/by-phone", response_model=UserWithToken)
async def lookup_user(
    payload: PhoneLookup,
    db: AsyncSession = Depends(get_session),
) -> User:
    """재방문 — 전화번호로 유저 조회 후 token 포함 반환."""
    result = await db.execute(select(User).where(User.phone == payload.phone))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "등록된 전화번호가 아니에요")
    return user


@router.get("/users/{user_id}", response_model=UserOut)
async def get_user(user_id: UUID, db: AsyncSession = Depends(get_session)) -> User:
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "사용자를 찾을 수 없어요")
    return user


@router.patch("/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id: UUID,
    payload: UserUpdate,
    db: AsyncSession = Depends(get_session),
    x_user_token: UUID | None = Header(default=None),
) -> User:
    """이름 또는 색상 수정. 본인만 가능."""
    user = await _get_authed_user(x_user_token, db)
    if user.id != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "본인 정보만 수정할 수 있어요")

    if payload.name is not None:
        user.name = payload.name
    if payload.color is not None:
        user.color = payload.color

    await db.commit()
    await db.refresh(user)
    return user


# ── Rooms ──────────────────────────────────────────────────────────────

@router.post("/rooms", response_model=RoomOut, status_code=status.HTTP_201_CREATED)
async def create_room(
    payload: RoomCreate,
    db: AsyncSession = Depends(get_session),
    x_user_token: UUID | None = Header(default=None),
) -> Room:
    """룸 생성. 생성자는 자동으로 첫 번째 멤버로 추가."""
    creator = await _get_authed_user(x_user_token, db)

    room = Room(
        name=payload.name,
        date_range_start=payload.date_range_start,
        date_range_end=payload.date_range_end,
    )
    db.add(room)
    await db.flush()  # room.id 확보

    db.add(RoomMember(user_id=creator.id, room_id=room.id))
    await db.commit()
    await db.refresh(room)
    return room


@router.get("/rooms/by-code/{code}", response_model=RoomOut)
async def get_room_by_code(code: str, db: AsyncSession = Depends(get_session)) -> Room:
    """초대 코드로 룸 조회."""
    result = await db.execute(
        select(Room).where(Room.invite_code == code.upper())
    )
    room = result.scalar_one_or_none()
    if room is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "코드가 올바르지 않아요")
    return room


@router.get("/rooms/{room_id}", response_model=RoomDetail)
async def get_room(room_id: UUID, db: AsyncSession = Depends(get_session)) -> Room:
    result = await db.execute(
        select(Room)
        .where(Room.id == room_id)
        .options(selectinload(Room.members).selectinload(RoomMember.user))
    )
    room = result.scalar_one_or_none()
    if room is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "룸을 찾을 수 없어요")
    return room


# ── Room Members ────────────────────────────────────────────────────────

@router.post(
    "/rooms/{room_id}/join",
    response_model=MemberOut,
    status_code=status.HTTP_201_CREATED,
)
async def join_room(
    room_id: UUID,
    db: AsyncSession = Depends(get_session),
    x_user_token: UUID | None = Header(default=None),
) -> RoomMember:
    """룸 참여. 이미 멤버면 200 대신 기존 row 반환."""
    user = await _get_authed_user(x_user_token, db)

    room = await db.get(Room, room_id)
    if room is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "룸을 찾을 수 없어요")

    existing = await db.get(RoomMember, (user.id, room_id))
    if existing:
        return existing

    member = RoomMember(user_id=user.id, room_id=room_id)
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return member


@router.delete("/rooms/{room_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_room(
    room_id: UUID,
    db: AsyncSession = Depends(get_session),
    x_user_token: UUID | None = Header(default=None),
) -> None:
    """룸 탈퇴. 가용성도 CASCADE로 삭제."""
    user = await _get_authed_user(x_user_token, db)
    member = await db.get(RoomMember, (user.id, room_id))
    if member:
        await db.delete(member)
        await db.commit()


# ── Availabilities ──────────────────────────────────────────────────────

@router.get(
    "/rooms/{room_id}/availabilities",
    response_model=list[MemberAvailability],
)
async def list_room_availabilities(
    room_id: UUID, db: AsyncSession = Depends(get_session)
) -> list[MemberAvailability]:
    """룸의 전체 멤버 가용성 반환."""
    room = await db.get(Room, room_id)
    if room is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "룸을 찾을 수 없어요")

    result = await db.execute(
        select(RoomMember)
        .where(RoomMember.room_id == room_id)
        .options(
            selectinload(RoomMember.user),
            selectinload(RoomMember.availabilities),
        )
        .order_by(RoomMember.joined_at)
    )
    out: list[MemberAvailability] = []
    for m in result.scalars():
        out.append(
            MemberAvailability(
                user_id=m.user_id,
                name=m.user.name,
                color=m.user.color,
                slots=sorted(
                    (Slot(date=a.date, hour=a.hour) for a in m.availabilities),
                    key=lambda s: (s.date, s.hour),
                ),
            )
        )
    return out


@router.put(
    "/rooms/{room_id}/availabilities",
    response_model=list[Slot],
)
async def replace_availabilities(
    room_id: UUID,
    payload: AvailabilityReplace,
    db: AsyncSession = Depends(get_session),
    x_user_token: UUID | None = Header(default=None),
) -> list[Slot]:
    """내 가용성 전체 교체 (DELETE + INSERT). 멤버가 아니면 403."""
    user = await _get_authed_user(x_user_token, db)
    await _get_member(user.id, room_id, db)  # 멤버 여부 확인

    room = await db.get(Room, room_id)
    assert room is not None

    for s in payload.slots:
        if s.date < room.date_range_start or s.date > room.date_range_end:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"{s.date} 는 룸의 날짜 범위를 벗어났어요",
            )

    await db.execute(
        delete(Availability).where(
            Availability.user_id == user.id,
            Availability.room_id == room_id,
        )
    )

    unique = {(s.date, s.hour) for s in payload.slots}
    db.add_all(
        [
            Availability(user_id=user.id, room_id=room_id, date=d, hour=h)
            for d, h in unique
        ]
    )
    await db.commit()

    return [Slot(date=d, hour=h) for d, h in sorted(unique)]


# ── Overlap ─────────────────────────────────────────────────────────────

@router.get("/rooms/{room_id}/overlap", response_model=OverlapResponse)
async def overlap(
    room_id: UUID,
    min_count: int = 1,
    db: AsyncSession = Depends(get_session),
) -> OverlapResponse:
    """겹치는 시간 집계. min_count로 최소 인원 필터."""
    room = await db.get(Room, room_id)
    if room is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "룸을 찾을 수 없어요")

    total_result = await db.execute(
        select(RoomMember.user_id).where(RoomMember.room_id == room_id)
    )
    total_count = len(total_result.scalars().all())

    result = await db.execute(
        select(Availability.date, Availability.hour, Availability.user_id)
        .where(Availability.room_id == room_id)
    )

    bucket: dict[tuple, list[UUID]] = defaultdict(list)
    for d, h, uid in result:
        bucket[(d, h)].append(uid)

    slots = [
        OverlapSlot(date=d, hour=h, count=len(uids), user_ids=uids)
        for (d, h), uids in bucket.items()
        if len(uids) >= min_count
    ]
    slots.sort(key=lambda s: (-s.count, s.date, s.hour))

    return OverlapResponse(room_id=room_id, total_members=total_count, slots=slots)


@router.get("/users/{user_id}/rooms", response_model=list[RoomOut])
async def list_user_rooms(
    user_id: UUID, db: AsyncSession = Depends(get_session)
) -> list[Room]:
    """유저가 참여한 룸 목록 (최신순)."""
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "사용자를 찾을 수 없어요")

    result = await db.execute(
        select(Room)
        .join(RoomMember, RoomMember.room_id == Room.id)
        .where(RoomMember.user_id == user_id)
        .order_by(RoomMember.joined_at.desc())
    )
    return list(result.scalars().all())
