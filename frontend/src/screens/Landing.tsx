import { For, createResource, Show } from 'solid-js';
import Screen from '../components/Screen';
import Button from '../components/Button';
import Card from '../components/Card';
import { setScreen, userName, userId, setCurrentRoomId } from '../store';
import { api, type RoomOut } from '../api';

export default function Landing() {
  const [rooms, { refetch }] = createResource(() => userId(), (id) =>
    id ? api.listMyRooms(id) : Promise.resolve([])
  );

  function openRoom(room: RoomOut) {
    setCurrentRoomId(room.id);
    setScreen('room');
  }

  return (
    <Screen title="약속">
      <div class="flex flex-col h-full">
        <div>
          <h2 class="font-caveat text-3xl font-bold">
            {userName() ? `안녕, ${userName()}!` : '새 약속 잡기'}
          </h2>
          <p class="text-sm text-ink-soft mt-0.5">
            친구들이 모이는 가장 빠른 길
          </p>
        </div>

        <div class="mt-5 flex flex-col gap-2.5">
          <Button variant="primary" size="lg" onClick={() => setScreen('room-empty')}>
            + 룸 만들기
          </Button>
          <Button variant="outline" size="md" onClick={() => {
            const id = prompt('룸 ID를 입력하세요 (링크에서 복사)');
            if (id?.trim()) {
              setCurrentRoomId(id.trim());
              setScreen('room');
            }
          }}>
            → 룸 참여하기
          </Button>
        </div>

        <div class="mt-6 mb-2 text-sm text-ink-soft flex items-center gap-2">
          내 룸
          <button onClick={refetch} class="text-ink-faint text-xs cursor-pointer">↺</button>
        </div>

        <div class="flex flex-col gap-2 flex-1 overflow-y-auto">
          <Show when={rooms.loading}>
            <p class="text-sm text-ink-faint text-center py-4">불러오는 중…</p>
          </Show>
          <Show when={!rooms.loading && (rooms()?.length ?? 0) === 0}>
            <p class="text-sm text-ink-faint text-center py-8">
              아직 참여한 룸이 없어요.<br />룸을 만들거나 링크로 참여해봐요!
            </p>
          </Show>
          <For each={rooms()}>
            {(r) => (
              <Card onClick={() => openRoom(r)}>
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-accent-soft border-[1.5px] border-ink flex items-center justify-center font-caveat text-sm font-bold">
                    {r.name.charAt(0)}
                  </div>
                  <div class="flex-1">
                    <div class="text-sm font-bold">{r.name}</div>
                    <div class="text-[10px] text-ink-faint">
                      {r.date_range_start} ~ {r.date_range_end}
                    </div>
                  </div>
                  <div class="text-base text-ink-faint">›</div>
                </div>
              </Card>
            )}
          </For>
        </div>
      </div>
    </Screen>
  );
}
