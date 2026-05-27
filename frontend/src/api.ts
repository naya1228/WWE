// API 클라이언트 — 백엔드와 통신하는 모든 fetch 로직

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// ── 타입 ──────────────────────────────────────────────────────────────

export interface UserWithToken {
  id: string;
  phone: string;
  name: string;
  color: string;
  token: string;
  created_at: string;
}

export interface UserOut {
  id: string;
  phone: string;
  name: string;
  color: string;
  created_at: string;
}

export interface RoomOut {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  date_range_start: string;
  date_range_end: string;
}

export interface MemberOut {
  user_id: string;
  name: string;
  color: string;
  joined_at: string;
}

export interface RoomDetail extends RoomOut {
  members: MemberOut[];
}

export interface Slot {
  date: string;
  hour: number;
}

export interface MemberAvailability {
  user_id: string;
  name: string;
  color: string;
  slots: Slot[];
}

export interface OverlapSlot {
  date: string;
  hour: number;
  count: number;
  user_ids: string[];
}

export interface OverlapResponse {
  room_id: string;
  total_members: number;
  slots: OverlapSlot[];
}

// ── 내부 fetch 래퍼 ───────────────────────────────────────────────────

async function req<T>(
  method: string,
  path: string,
  options: { body?: unknown; token?: string } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.token) headers['X-User-Token'] = options.token;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    // FastAPI 422: detail이 배열 [{loc, msg, type}]
    const detail = Array.isArray(err.detail)
      ? err.detail.map((e: any) => e.msg).join(', ')
      : (err.detail ?? '알 수 없는 오류');
    throw Object.assign(new Error(String(detail)), { status: res.status });
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Users ─────────────────────────────────────────────────────────────

export const api = {
  /** 신규 가입 */
  createUser: (phone: string, name: string, color: string) =>
    req<UserWithToken>('POST', '/users', { body: { phone, name, color } }),

  /** 재방문 — 전화번호로 조회 */
  lookupByPhone: (phone: string) =>
    req<UserWithToken>('POST', '/users/by-phone', { body: { phone } }),

  /** 프로필 수정 */
  updateUser: (userId: string, token: string, patch: { name?: string; color?: string }) =>
    req<UserOut>('PATCH', `/users/${userId}`, { body: patch, token }),

  /** 내 룸 목록 */
  listMyRooms: (userId: string) =>
    req<RoomOut[]>('GET', `/users/${userId}/rooms`),

  // ── Rooms ────────────────────────────────────────────────────────────

  /** 룸 생성 (생성자 자동 참여) */
  createRoom: (token: string, name: string, dateStart: string, dateEnd: string) =>
    req<RoomOut>('POST', '/rooms', {
      body: { name, date_range_start: dateStart, date_range_end: dateEnd },
      token,
    }),

  /** 초대 코드로 룸 조회 */
  getRoomByCode: (code: string) =>
    req<RoomOut>('GET', `/rooms/by-code/${code}`),

  /** 룸 상세 (멤버 포함) */
  getRoom: (roomId: string) =>
    req<RoomDetail>('GET', `/rooms/${roomId}`),

  /** 룸 참여 */
  joinRoom: (roomId: string, token: string) =>
    req<MemberOut>('POST', `/rooms/${roomId}/join`, { token }),

  /** 룸 탈퇴 */
  leaveRoom: (roomId: string, token: string) =>
    req<void>('DELETE', `/rooms/${roomId}/leave`, { token }),

  // ── Availabilities ───────────────────────────────────────────────────

  /** 룸 전체 멤버 가용성 */
  listAvailabilities: (roomId: string) =>
    req<MemberAvailability[]>('GET', `/rooms/${roomId}/availabilities`),

  /** 내 가용성 교체 */
  replaceAvailabilities: (roomId: string, token: string, slots: Slot[]) =>
    req<Slot[]>('PUT', `/rooms/${roomId}/availabilities`, { body: { slots }, token }),

  /** 겹치는 시간 */
  getOverlap: (roomId: string, minCount = 1) =>
    req<OverlapResponse>('GET', `/rooms/${roomId}/overlap?min_count=${minCount}`),
};
