import { createSignal } from 'solid-js';
import { ACCENT_COLORS } from './constants';
import type { RoomOut } from './api';

// ── 화면 타입 ──────────────────────────────────────────────────────────

export type Screen =
  | 'intro'
  | 'onboard'
  | 'setup'
  | 'landing'
  | 'room'
  | 'room-empty'
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

// ── 룸 상태 ────────────────────────────────────────────────────────────

export const [myRooms, setMyRooms] = createSignal<RoomOut[]>([]);
export const [currentRoomId, setCurrentRoomId] = createSignal<string>('');

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
