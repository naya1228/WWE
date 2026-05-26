// 전역 앱 상태
import { createSignal } from 'solid-js';
import { ACCENT_COLORS } from './constants';

export type Screen =
  | 'onboard'
  | 'setup'
  | 'landing'
  | 'room'
  | 'room-empty'
  | 'profile'
  | 'profile-edit';

export const [screen, setScreen] = createSignal<Screen>('onboard');

export const [userName, setUserName] = createSignal('');
export const [userPhone, setUserPhone] = createSignal('');
export const [accentColor, setAccentColor] = createSignal<string>(ACCENT_COLORS[0]);

export function accentSoft(): string {
  const hex = accentColor().replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const mix = (a: number) => Math.round(a * 0.22 + 253 * 0.78);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

// 가능한 시간 — 날짜별 시간 set
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
