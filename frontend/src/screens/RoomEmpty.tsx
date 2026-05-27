import { createSignal, Show } from 'solid-js';
import Screen from '../components/Screen';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import { setScreen, userToken, setCurrentRoomId } from '../store';
import { api, type RoomOut } from '../api';

export default function RoomEmpty() {
  const [name, setName] = createSignal('');
  const [dateStart, setDateStart] = createSignal('');
  const [dateEnd, setDateEnd] = createSignal('');
  const [error, setError] = createSignal('');
  const [loading, setLoading] = createSignal(false);
  const [createdRoom, setCreatedRoom] = createSignal<RoomOut | null>(null);

  async function handleCreate() {
    if (!name().trim() || !dateStart() || !dateEnd()) {
      setError('이름과 날짜를 모두 입력해줘요'); return;
    }
    if (dateEnd() < dateStart()) {
      setError('종료일이 시작일보다 빨라요'); return;
    }
    setError('');
    setLoading(true);
    try {
      const room = await api.createRoom(userToken(), name().trim(), dateStart(), dateEnd());
      setCreatedRoom(room);
      setCurrentRoomId(room.id);
    } catch (e: any) {
      setError(e.message ?? '룸 생성에 실패했어요');
    } finally {
      setLoading(false);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(createdRoom()!.invite_code);
  }

  return (
    <Show
      when={createdRoom()}
      fallback={
        <Screen title="새 룸">
          <div class="flex flex-col h-full gap-4">
            <button onClick={() => setScreen('landing')}
              class="text-sm text-ink-soft cursor-pointer text-left bg-transparent border-0 p-0">
              ← 돌아가기
            </button>

            <Input label="룸 이름" value={name()} onInput={setName} placeholder="주말 브런치" />

            <div class="flex flex-col gap-1">
              <span class="text-sm text-ink-soft pl-1">날짜 범위</span>
              <div class="flex gap-2 items-center">
                <input type="date" value={dateStart()}
                  onInput={e => setDateStart(e.currentTarget.value)}
                  class="flex-1 border-2 border-ink rounded-xl px-3 py-2.5 bg-paper font-kalam text-sm shadow-sketch" />
                <span class="text-ink-soft text-sm">~</span>
                <input type="date" value={dateEnd()}
                  onInput={e => setDateEnd(e.currentTarget.value)}
                  class="flex-1 border-2 border-ink rounded-xl px-3 py-2.5 bg-paper font-kalam text-sm shadow-sketch" />
              </div>
            </div>

            {error() && <p class="text-sm text-red-500 pl-1">{error()}</p>}

            <div class="mt-auto">
              <Button variant="primary" size="lg" onClick={handleCreate}
                class={loading() ? 'opacity-60 pointer-events-none' : ''}>
                {loading() ? '...' : '룸 만들기 →'}
              </Button>
            </div>
          </div>
        </Screen>
      }
    >
      {(room) => (
        <Screen title="새 룸">
          <div class="flex flex-col h-full gap-4">
            <button onClick={() => setScreen('landing')}
              class="text-sm text-ink-soft cursor-pointer text-left bg-transparent border-0 p-0">
              ← 돌아가기
            </button>

            <p class="text-sm text-ink-soft">룸이 만들어졌어요! 🎉</p>

            {/* 초대 코드 — 핵심 */}
            <Card accent dashed class="-rotate-1 text-center py-2">
              <div class="text-[11px] text-ink-soft mb-1">초대 코드</div>
              <div class="font-caveat text-[52px] font-bold tracking-[8px] leading-tight">
                {room().invite_code}
              </div>
              <div class="text-[11px] text-ink-faint mt-1">
                친구에게 이 코드를 알려줘요
              </div>
            </Card>

            <div class="text-center text-xs text-ink-soft">
              {room().name} · {room().date_range_start} ~ {room().date_range_end}
            </div>

            <Button variant="outline" size="md" onClick={copyCode}>
              📋 코드 복사
            </Button>
            <Button variant="primary" size="lg" onClick={() => setScreen('room')}>
              룸 들어가기 →
            </Button>
          </div>
        </Screen>
      )}
    </Show>
  );
}
