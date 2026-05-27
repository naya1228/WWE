import { For, Show, createResource } from 'solid-js';
import Screen from '../components/Screen';
import Button from '../components/Button';
import Card from '../components/Card';
import { setScreen, currentRoomId, userId } from '../store';
import { api, type OverlapSlot } from '../api';

function formatHour(h: number) {
  return h < 12 ? `오전 ${h}시` : h === 12 ? '오후 12시' : `오후 ${h - 12}시`;
}

function formatDate(d: string) {
  const date = new Date(d);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${date.getMonth() + 1}/${date.getDate()}(${days[date.getDay()]})`;
}

export default function Room() {
  const roomId = currentRoomId;

  const [room] = createResource(roomId, api.getRoom);
  const [overlap] = createResource(roomId, (id) => api.getOverlap(id, 1));

  const myId = userId();
  const roomLink = () => `${location.origin}/?room=${roomId()}`;

  function copyLink() {
    navigator.clipboard.writeText(roomLink());
  }

  // 상위 3개 슬롯만
  const topSlots = () => (overlap()?.slots ?? []).slice(0, 3);

  return (
    <Screen title={room()?.name ?? '룸'}>
      <div class="flex flex-col h-full gap-3 overflow-y-auto">
        <Show when={room()}>
          {(r) => (
            <div class="flex items-center gap-1.5">
              <p class="text-[11px] text-ink-soft">
                {r().members.length}명 참여 중
              </p>
              <button
                onClick={copyLink}
                class="ml-auto text-[11px] text-accent cursor-pointer bg-transparent border-0 p-0"
              >
                ↗ 링크 복사
              </button>
            </div>
          )}
        </Show>

        {/* 추천 슬롯 */}
        <Show when={(topSlots().length) > 0} fallback={
          <p class="text-sm text-ink-faint text-center py-6">
            아직 가용성을 입력한 멤버가 없어요.<br />
            프로필에서 내 시간을 먼저 등록해봐요!
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

        <div class="mt-auto flex gap-2 text-[10px] text-ink-soft pt-2">
          <button
            onClick={() => setScreen('landing')}
            class="cursor-pointer text-ink-soft bg-transparent border-0 p-0"
          >
            ← 나가기
          </button>
        </div>
      </div>
    </Screen>
  );
}
