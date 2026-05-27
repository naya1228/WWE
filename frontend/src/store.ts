import { createSignal } from 'solid-js';
import { ACCENT_COLORS } from './constants';
import type { RoomOut, RoomDetail, Slot } from './api';

// ── 화면 타입 ──────────────────────────────────────────────────────────

export type Screen =
  | 'intro'
  | 'onboard'
  | 'setup'
  | 'landing'
  | 'room'
  | 'room-empty'
  | 'room-availability'
  | 'profile'
  | 'profile-edit';

export const [screen, setScreen] = createSignal<Screen>('intro');

// 재방문 여부 — onboard 이후 setup 건너뛸지 결정
export const [isReturning, setIsReturning] = createSignal(false);

// ── 유저 상태 ──────────────────────────────────────────────────────────

export interface UserState {
  id: string;
  token: string;
  phone: string;
  name: string;
  color: string;
}

const LS_KEY = 'wwe_user';

function loadFromStorage(): UserState | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToStorage(u: UserState) {
  localStorage.setItem(LS_KEY, JSON.stringify(u));
}

export function clearStorage() {
  localStorage.removeItem(LS_KEY);
}

// 앱 시작 시 localStorage 복원
const stored = loadFromStorage();

export const [user, setUserSignal] = createSignal<UserState | null>(stored);

export function saveUser(u: UserState) {
  saveToStorage(u);
  setUserSignal(u);
  setAccentColor(u.color);
}

export function clearUser() {
  clearStorage();
  setUserSignal(null);
}

// 편의 getter
export const userId = () => user()?.id ?? '';
export const userToken = () => user()?.token ?? '';
export const userName = () => user()?.name ?? '';
export const userPhone = () => user()?.phone ?? '';

// ── localStorage 헬퍼 ──────────────────────────────────────────────────

function lsGet<T>(key: string): T | null {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch { return null; }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── 룸 상태 ────────────────────────────────────────────────────────────

const LS_ROOMS = 'wwe_my_rooms';
const _storedRooms = lsGet<RoomOut[]>(LS_ROOMS) ?? [];
const [myRoomsSignal, setMyRoomsSignal] = createSignal<RoomOut[]>(_storedRooms);
export const myRooms = myRoomsSignal;
export function setMyRooms(rooms: RoomOut[]) {
  lsSet(LS_ROOMS, rooms);
  setMyRoomsSignal(rooms);
}

export const [currentRoomId, setCurrentRoomId] = createSignal<string>('');

// ── 룸 캐시 (localStorage 영속) ────────────────────────────────────────

const LS_ROOM   = 'wwe_cached_room';
const LS_SLOTS  = 'wwe_cached_slots';   // { roomId, slots }

const [cachedRoomSignal, setCachedRoomSignal] = createSignal<RoomDetail | null>(lsGet(LS_ROOM));
export const cachedRoom = cachedRoomSignal;
export function setCachedRoom(r: RoomDetail) {
  lsSet(LS_ROOM, r);
  setCachedRoomSignal(r);
}

interface SlotsCache { roomId: string; slots: Slot[] }
const storedSlots = lsGet<SlotsCache>(LS_SLOTS);
const [cachedMySlotsSignal, setCachedMySlotsSignal] = createSignal<Slot[] | null>(
  storedSlots ? storedSlots.slots : null
);
export const cachedMySlots = cachedMySlotsSignal;
export function setCachedMySlots(roomId: string, slots: Slot[]) {
  lsSet(LS_SLOTS, { roomId, slots });
  setCachedMySlotsSignal(slots);
}

/** roomId가 바뀌면 슬롯 캐시 무효화 */
export function invalidateSlotsCache(roomId: string) {
  if (storedSlots?.roomId !== roomId) {
    localStorage.removeItem(LS_SLOTS);
    setCachedMySlotsSignal(null);
  }
}

// ── 색상 ───────────────────────────────────────────────────────────────

export const [accentColor, setAccentColor] = createSignal<string>(
  stored?.color ?? ACCENT_COLORS[0]
);

export function accentSoft(): string {
  const hex = accentColor().replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const mix = (a: number) => Math.round(a * 0.22 + 253 * 0.78);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

// ── 앱 초기화 ──────────────────────────────────────────────────────────

/** localStorage 유저 있으면 landing으로 바로 진입 */
export function initApp() {
  if (stored) {
    setScreen('landing');
  }
}

// ── 가용성 로컬 상태 (룸 연결 전 임시) ────────────────────────────────

export type TimeMap = Record<number, Set<number>>;
export const [availableTimes, setAvailableTimes] = createSignal<TimeMap>({});

export function toggleTime(date: number, hour: number) {
  setAvailableTimes(prev => {
    const next = { ...prev };
    if (!next[date]) next[date] = new Set();
    else next[date] = new Set(next[date]);
    if (next[date].has(hour)) next[date].delete(hour);
    else next[date].add(hour);
    return next;
  });
}

export function myMarks(): Record<number, 'available'> {
  const result: Record<number, 'available'> = {};
  for (const [d, times] of Object.entries(availableTimes())) {
    if ((times as Set<number>).size > 0) result[Number(d)] = 'available';
  }
  return result;
}

// ── 온보딩 임시 전화번호 (Setup으로 전달) ─────────────────────────────
export const [pendingPhone, setPendingPhone] = createSignal('');
