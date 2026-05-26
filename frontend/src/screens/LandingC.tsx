// ③ 랜딩 — 위계 + 최근 룸
import { For } from 'solid-js';
import Screen from '../components/Screen';
import Button from '../components/Button';
import Card from '../components/Card';
import { setScreen, userName } from '../store';

const RECENT_ROOMS = [
  { name: '주말 브런치', n: 4, badge: '진행 중' },
  { name: '동창 모임', n: 7, badge: null },
  { name: '여행 계획', n: 3, badge: '결정됨' },
];

export default function LandingC() {
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
          <Button variant="outline" size="md" onClick={() => setScreen('room')}>
            → 룸 참여하기
          </Button>
        </div>

        <div class="mt-6 mb-2 text-sm text-ink-soft">최근 룸</div>
        <div class="flex flex-col gap-2">
          <For each={RECENT_ROOMS}>
            {(r) => (
              <Card onClick={() => setScreen('room')}>
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-accent-soft border-[1.5px] border-ink flex items-center justify-center font-caveat text-sm font-bold">
                    {r.n}
                  </div>
                  <div class="flex-1">
                    <div class="text-sm font-bold">{r.name}</div>
                    {r.badge && (
                      <div class="text-[10px] text-accent">● {r.badge}</div>
                    )}
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
