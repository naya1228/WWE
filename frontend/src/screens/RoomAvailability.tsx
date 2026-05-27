import { createSignal, createResource, createEffect, For, Show } from 'solid-js';
import Screen from '../components/Screen';
import Button from '../components/Button';
import Calendar from '../components/Calendar';
import { setScreen, currentRoomId, userId, userToken, cachedRoom, cachedMySlots, setCachedMySlots } from '../store';
import { api, type Slot } from '../api';

const DAY_KO = ['일', '월', '화', '수', '목', '금', '토'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 9); // 9~22시

export default function RoomAvailability() {
  const roomId = currentRoomId();

  // 마운트 시점에 캐시 여부를 고정값으로 확인 (reactive하면 source가 바뀌어 resource 리셋됨)
  const hasCachedRoom  = cachedRoom()?.id === roomId;
  const hasCachedSlots = cachedMySlots() !== null;

  const [fetchedRoom] = createResource(
    () => hasCachedRoom ? undefined : roomId,
    api.getRoom,
  );
  const roomData = () => hasCachedRoom ? cachedRoom()! : fetchedRoom();

  const [fetchedSlots] = createResource(
    () => hasCachedSlots ? undefined : roomId,
    async (id) => {
      const all = await api.listAvailabilities(id);
      return all.find(m => m.user_id === userId())?.slots ?? [];
    }
  );

  // "YYYY-MM-DD|H" 키로 선택 관리
  const key = (date: string, hour: number) => `${date}|${hour}`;

  // 캐시 있으면 즉시 초기화, 없으면 fetch 완료 후 한 번 초기화
  const initialSlots = cachedMySlots();
  const [selected, setSelected] = createSignal<Set<string>>(
    initialSlots ? new Set(initialSlots.map(s => key(s.date, s.hour))) : new Set()
  );
  const [slotsReady, setSlotsReady] = createSignal(hasCachedSlots);

  createEffect(() => {
    const slots = fetchedSlots();
    if (slots !== undefined && !slotsReady()) {
      setCachedMySlots(roomId, slots);
      setSelected(new Set(slots.map(s => key(s.date, s.hour))));
      setSlotsReady(true);
    }
  });

  // 캘린더 → 시간선택 전환
  const [pickerDate, setPickerDate] = createSignal<string | null>(null);

  // Date → "YYYY-MM-DD" 로컬 기준 변환 (toISOString은 UTC라 한국에서 하루 밀림)
  const toLocalStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // 캘린더용: 룸 날짜 범위의 날(day)을 marks로 변환
  const calendarProps = () => {
    const r = roomData();
    if (!r) return null;

    // API 날짜 문자열을 로컬 날짜로 파싱 (UTC 오프셋 방지: T00:00 붙이기)
    const start = new Date(r.date_range_start + 'T00:00');
    const end   = new Date(r.date_range_end   + 'T00:00');
    const year  = start.getFullYear();
    const month = start.getMonth();

    const firstDay   = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const marks: Record<number, 'available' | 'partial'> = {};
    const cur = new Date(start);
    while (cur <= end) {
      if (cur.getMonth() === month) {
        const d = cur.getDate();
        const dateStr = toLocalStr(cur);
        const hasHours = HOURS.some(h => selected().has(key(dateStr, h)));
        marks[d] = hasHours ? 'available' : 'partial';
      }
      cur.setDate(cur.getDate() + 1);
    }

    const monthLabel = `${year}년 ${month + 1}월`;
    return { firstDay, daysInMonth, marks, monthLabel, year, month, start, end };
  };

  function handleDateSelect(day: number) {
    const cp = calendarProps();
    if (!cp) return;
    const date = new Date(cp.year, cp.month, day);
    if (date < cp.start || date > cp.end) return; // 범위 밖
    setPickerDate(toLocalStr(date)); // ← UTC 변환 없이 로컬 날짜 문자열
  }

  function toggle(hour: number) {
    const d = pickerDate()!;
    const k = key(d, hour);
    setSelected(prev => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  }

  const isChecked = (hour: number) => selected().has(key(pickerDate()!, hour));
  const checkedCount = () => pickerDate()
    ? HOURS.filter(h => selected().has(key(pickerDate()!, h))).length
    : 0;

  function handleSave() {
    const slots: Slot[] = [];
    for (const k of selected()) {
      const [date, h] = k.split('|');
      slots.push({ date, hour: parseInt(h) });
    }
    // 즉시 캐시 반영 + 화면 전환
    setCachedMySlots(roomId, slots);
    setScreen('room');
    // API는 백그라운드
    api.replaceAvailabilities(roomId, userToken(), slots).catch(() => {});
  }

  const formatDate = (d: string) => {
    const date = new Date(d);
    return `${date.getMonth() + 1}/${date.getDate()}(${DAY_KO[date.getDay()]})`;
  };

  return (
    <Show
      when={pickerDate()}
      fallback={
        /* ── 캘린더 화면 ── */
        <Screen title="내 가능 시간">
          <div class="flex flex-col h-full gap-4">
            <button onClick={() => setScreen('room')}
              class="text-sm text-ink-soft cursor-pointer text-left bg-transparent border-0 p-0">
              ← 룸으로 돌아가기
            </button>

            <Show when={roomData() && slotsReady()} fallback={
              <p class="text-sm text-ink-faint text-center py-8">불러오는 중…</p>
            }>
              <p class="text-xs text-ink-soft">날짜를 탭해서 가능한 시간을 설정해요</p>

              <Show when={calendarProps()}>
                {(cp) => (
                  <Calendar
                    month={cp().monthLabel}
                    startDay={cp().firstDay}
                    days={cp().daysInMonth}
                    marks={cp().marks}
                    onSelect={handleDateSelect}
                  />
                )}
              </Show>

              <div class="flex gap-3 text-[11px] text-ink-soft">
                <span class="flex items-center gap-1">
                  <span class="w-2.5 h-2.5 rounded-sm bg-accent inline-block" />시간 설정됨
                </span>
                <span class="flex items-center gap-1">
                  <span class="w-2.5 h-2.5 rounded-sm bg-accent-soft inline-block" />선택 가능
                </span>
              </div>

              <div class="mt-auto flex flex-col gap-2">
                <Button variant="primary" size="lg" onClick={handleSave}>
                  저장하기
                </Button>
              </div>
            </Show>
          </div>
        </Screen>
      }
    >
      {/* ── 시간 선택 화면 ── */}
      <Screen title={`${formatDate(pickerDate()!)} 시간 선택`}>
        <div class="flex flex-col h-full gap-2">
          <button onClick={() => setPickerDate(null)}
            class="text-sm text-ink-soft cursor-pointer text-left bg-transparent border-0 p-0 shrink-0">
            ← 캘린더로 돌아가기
          </button>

          <div class="flex items-center justify-between shrink-0">
            <p class="text-xs text-ink-soft">가능한 시간을 탭하세요</p>
            <Show when={checkedCount() > 0}>
              <span class="text-[10px] px-2 py-0.5 bg-accent rounded font-bold">
                {checkedCount()}시간 선택
              </span>
            </Show>
          </div>

          <div class="flex flex-col gap-1 flex-1 overflow-y-auto">
            <For each={HOURS}>
              {(h) => {
                const checked = () => isChecked(h);
                const label = h < 12 ? `오전 ${h}:00` : h === 12 ? '오후 12:00' : `오후 ${h - 12}:00`;
                return (
                  <button onClick={() => toggle(h)}
                    class={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-[1.5px] cursor-pointer text-left transition-colors
                      ${checked() ? 'bg-accent-soft border-ink' : 'bg-paper border-transparent hover:border-ink/30'}`}>
                    <span class={`w-4 h-4 rounded border-2 border-ink flex items-center justify-center shrink-0
                      ${checked() ? 'bg-ink' : 'bg-paper'}`}>
                      <Show when={checked()}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                          stroke="var(--color-paper)" stroke-width="4" stroke-linecap="round">
                          <path d="M5 12 L 10 17 L 19 7" />
                        </svg>
                      </Show>
                    </span>
                    <span class={`text-sm ${checked() ? 'font-bold' : ''}`}>{label}</span>
                  </button>
                );
              }}
            </For>
          </div>

          <Button variant="outline" size="md" onClick={() => setPickerDate(null)}
            class="shrink-0">
            ← 다른 날짜 선택
          </Button>
        </div>
      </Screen>
    </Show>
  );
}
