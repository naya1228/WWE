import { For, Show, createResource, createEffect, createSignal } from 'solid-js';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Calendar from '../components/Calendar';
import { setScreen, currentRoomId, userId, userToken, setCachedRoom, setCachedMySlots, cachedRoom, cachedMySlots, invalidateSlotsCache, setMyRooms, myRooms } from '../store';
import { api } from '../api';

function formatHour(h: number) {
  return h < 12 ? `오전 ${h}시` : h === 12 ? '오후 12시' : `오후 ${h - 12}시`;
}

function formatDate(d: string) {
  const date = new Date(d);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${date.getMonth() + 1}/${date.getDate()}(${days[date.getDay()]})`;
}

export default function Room() {
  const myId = userId();
  const roomId = currentRoomId;
  const rid = roomId(); // 마운트 시점 고정

  // 다른 룸이면 캐시 무효화 (고정값 비교 — reactive 루프 없음)
  const hasCachedRoom  = cachedRoom()?.id === rid;
  const hasCachedSlots = cachedMySlots() !== null;
  if (!hasCachedRoom) invalidateSlotsCache(rid);

  const [fetchedRoom] = createResource(
    () => hasCachedRoom ? undefined : rid,
    api.getRoom,
  );
  const room = () => hasCachedRoom ? cachedRoom()! : fetchedRoom();

  const [overlap, { refetch: refetchOverlap }] = createResource(() => rid, (id) => api.getOverlap(id, 1));

  const [fetchedAvail] = createResource(
    () => hasCachedSlots ? undefined : rid,
    api.listAvailabilities,
  );

  createEffect(() => { const r = fetchedRoom(); if (r) setCachedRoom(r); });
  createEffect(() => {
    const all = fetchedAvail();
    if (all) setCachedMySlots(rid, all.find(m => m.user_id === myId)?.slots ?? []);
  });
  function copyCode() {
    navigator.clipboard.writeText(room()?.invite_code ?? '');
  }

  const [leaving, setLeaving] = createSignal(false);
  const [confirmLeave, setConfirmLeave] = createSignal(false);

  async function handleLeave() {
    setLeaving(true);
    try {
      await api.leaveRoom(rid, userToken());
      // 룸 목록 캐시에서 제거
      setMyRooms(myRooms().filter(r => r.id !== rid));
      setScreen('landing');
    } catch {
      setLeaving(false);
      setConfirmLeave(false);
    }
  }

  const [refreshing, setRefreshing] = createSignal(false);
  async function handleRefresh() {
    setRefreshing(true);
    try {
      const [r] = await Promise.all([
        api.getRoom(rid),
        refetchOverlap(),
      ]);
      setCachedRoom(r);
    } catch {
      // 무시
    } finally {
      setRefreshing(false);
    }
  }

  // 상위 3개 슬롯만
  const topSlots = () => (overlap()?.slots ?? []).slice(0, 3);

  const loading = () => !room();

  // 날짜 → "YYYY-MM-DD" 로컬 변환
  const toLocalStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // overlap 기반 캘린더 marks
  const calendarProps = () => {
    const r = room();
    const ov = overlap();
    if (!r) return null;

    const start = new Date(r.date_range_start + 'T00:00');
    const end   = new Date(r.date_range_end   + 'T00:00');
    const year  = start.getFullYear();
    const month = start.getMonth();

    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthLabel  = `${year}년 ${month + 1}월`;

    const total = ov?.total_members ?? 0;

    // 날짜별 최대 count
    const countByDate: Record<string, number> = {};
    for (const s of ov?.slots ?? []) {
      countByDate[s.date] = Math.max(countByDate[s.date] ?? 0, s.count);
    }

    const marks: Record<number, 'available' | 'partial' | 'unavailable'> = {};
    const cur = new Date(start);
    while (cur <= end) {
      if (cur.getMonth() === month) {
        const d   = cur.getDate();
        const cnt = countByDate[toLocalStr(cur)] ?? 0;
        if (cnt === 0)       marks[d] = 'unavailable';
        else if (cnt < total) marks[d] = 'partial';
        else                  marks[d] = 'available';
      }
      cur.setDate(cur.getDate() + 1);
    }

    return { firstDay, daysInMonth, marks, monthLabel };
  };

  return (
    <Screen title={room()?.name ?? '룸'}>
      <div class="flex flex-col h-full gap-3 overflow-y-auto">

        {/* 로딩 중 */}
        <Show when={loading()}>
          <div class="flex-1 flex flex-col items-center justify-center gap-2 text-ink-faint">
            <p class="text-sm">불러오는 중…</p>
          </div>
        </Show>

        <Show when={!loading()}>
          <Show when={room()}>
            {(r) => (
              <div class="flex items-center gap-1.5">
                <p class="text-[11px] text-ink-soft">
                  {r().members.length}명 참여 중
                </p>
                <div class="ml-auto flex items-center gap-1">
                  <button
                    onClick={copyCode}
                    class="text-[11px] text-accent cursor-pointer bg-transparent border border-accent rounded-md px-2 py-0.5"
                  >
                    {r().invite_code} 복사
                  </button>
                  <button
                    onClick={handleRefresh}
                    class={`text-[13px] cursor-pointer bg-transparent border-0 p-1 text-ink-soft ${refreshing() ? 'animate-spin' : ''}`}
                    style={refreshing() ? { "animation-direction": "reverse" } : {}}
                    title="새로고침"
                  >
                    ↺
                  </button>
                </div>
              </div>
            )}
          </Show>

          {/* 추천 슬롯 */}
          <Show when={(topSlots().length) > 0} fallback={
            <p class="text-sm text-ink-faint text-center py-6">
              아직 가용성을 입력한 멤버가 없어요.<br />
              내 시간을 먼저 등록해봐요!
            </p>
          }>
            <h2 class="font-caveat text-lg font-bold">✨ 추천 날짜</h2>
            <For each={topSlots()}>
              {(s, i) => (
                <Card accent={i() === 0}>
                  <div class="flex items-center gap-2.5">
                    <div class="flex-1">
                      <div class="flex items-center gap-1.5">
                        <div class="font-caveat text-[17px] font-bold">
                          {formatDate(s.date)}
                        </div>
                        {i() === 0 && (
                          <span class="text-[9px] bg-ink text-paper px-1.5 py-0.5 rounded">BEST</span>
                        )}
                      </div>
                      <div class="text-[11px] text-ink-soft">{formatHour(s.hour)}</div>
                      <div class="text-[10px] mt-0.5 text-ink">
                        👥 {s.count}/{overlap()?.total_members ?? '?'}명 가능
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </For>
          </Show>

          {/* 멤버 현황 */}
          <Show when={room()}>
            {(r) => (
              <>
                <h2 class="font-caveat text-lg font-bold mt-2">👥 멤버</h2>
                <div class="flex gap-2 flex-wrap">
                  <For each={r().members}>
                    {(m) => (
                      <div class="flex items-center gap-1.5 bg-paper border border-ink/20 rounded-full px-3 py-1">
                        <span
                          class="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ background: m.color }}
                        />
                        <span class="text-sm font-bold">
                          {m.name}{m.user_id === myId ? ' (나)' : ''}
                        </span>
                      </div>
                    )}
                  </For>
                </div>
              </>
            )}
          </Show>

          {/* 가능 날짜 캘린더 */}
          <Show when={calendarProps()}>
            {(cp) => (
              <>
                <h2 class="font-caveat text-lg font-bold mt-2">📅 가능한 날짜</h2>
                <Calendar
                  month={cp().monthLabel}
                  startDay={cp().firstDay}
                  days={cp().daysInMonth}
                  marks={cp().marks}
                />
                <div class="flex gap-3 text-[11px] text-ink-soft">
                  <span class="flex items-center gap-1">
                    <span class="w-2.5 h-2.5 rounded-sm bg-accent inline-block" />모두 가능
                  </span>
                  <span class="flex items-center gap-1">
                    <span class="w-2.5 h-2.5 rounded-sm bg-accent-soft inline-block" />일부 가능
                  </span>
                </div>
              </>
            )}
          </Show>

          {/* 룸 나가기 */}
          <div class="mt-4 mb-2 flex justify-center">
            <Show
              when={confirmLeave()}
              fallback={
                <button
                  onClick={() => setConfirmLeave(true)}
                  class="text-xs text-ink-faint cursor-pointer bg-transparent border-0 p-0 underline underline-offset-2"
                >
                  룸 나가기
                </button>
              }
            >
              <div class="flex items-center gap-3">
                <span class="text-xs text-ink-soft">정말 나갈까요?</span>
                <button
                  onClick={handleLeave}
                  class={`text-xs text-red-500 font-bold cursor-pointer bg-transparent border-0 p-0 ${leaving() ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {leaving() ? '나가는 중…' : '나가기'}
                </button>
                <button
                  onClick={() => setConfirmLeave(false)}
                  class="text-xs text-ink-faint cursor-pointer bg-transparent border-0 p-0"
                >
                  취소
                </button>
              </div>
            </Show>
          </div>
        </Show>

        <div class="mt-auto flex items-center justify-between pt-2 shrink-0">
          <button
            onClick={() => setScreen('landing')}
            class="text-sm cursor-pointer text-ink-soft bg-transparent border-0 p-0"
          >
            ← 홈으로
          </button>
          <button
            onClick={() => setScreen('room-availability')}
            class="text-sm font-bold cursor-pointer bg-accent text-ink border-2 border-ink rounded-xl px-4 py-2 shadow-sketch"
          >
            📅 내 시간 설정
          </button>
        </div>
      </div>
    </Screen>
  );
}
