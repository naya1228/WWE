// ④ 룸 — 추천 카드 위 + 미니 캘린더 아래
import { For } from 'solid-js';
import Screen from '../components/Screen';
import Button from '../components/Button';
import Card from '../components/Card';
import Calendar from '../components/Calendar';
import { setScreen } from '../store';

const SUGGESTIONS = [
  { d: '토 11/7', t: '오후 1-5시', who: '4명 다 가능', best: true, rot: '-rotate-[0.5deg]' },
  { d: '일 11/8', t: '오전 11-2시', who: '4명 다 가능', best: false, rot: 'rotate-[0.4deg]' },
  { d: '토 11/15', t: '오후 3-6시', who: '3명 가능', partial: true, rot: '-rotate-[0.2deg]' },
];

const MARKS: Record<number, 'available' | 'partial'> = {
  7: 'available', 8: 'available', 15: 'available', 22: 'partial', 28: 'available',
};

export default function RoomB() {
  return (
    <Screen title="주말 브런치">
      <div class="flex flex-col h-full gap-2.5 overflow-y-auto">
        <div class="flex items-center gap-1.5">
          <p class="text-[11px] text-ink-soft">
            4명 · 코드{' '}
            <span class="bg-accent-soft px-1.5 py-0.5 rounded font-bold">K7P2</span>
          </p>
          <button class="ml-auto text-[11px] text-accent cursor-pointer bg-transparent border-0 p-0">
            ↗ 공유
          </button>
        </div>

        <h2 class="font-caveat text-lg font-bold mt-0.5">✨ 추천 날짜</h2>

        <For each={SUGGESTIONS}>
          {(s) => (
            <Card accent={s.best} class={s.rot}>
              <div class="flex items-center gap-2.5">
                <div class="flex-1">
                  <div class="flex items-center gap-1.5">
                    <div class="font-caveat text-[17px] font-bold">{s.d}</div>
                    {s.best && (
                      <span class="text-[9px] bg-ink text-paper px-1.5 py-0.5 rounded">
                        BEST
                      </span>
                    )}
                  </div>
                  <div class="text-[11px] text-ink-soft">{s.t}</div>
                  <div class={`text-[10px] mt-0.5 ${s.partial ? 'text-ink-faint' : 'text-ink'}`}>
                    👥 {s.who}
                  </div>
                </div>
                <Button variant={s.best ? 'primary' : 'outline'} size="sm" wide={false} class="min-w-[44px]">
                  선택
                </Button>
              </div>
            </Card>
          )}
        </For>

        <div class="mt-auto">
          <p class="text-[11px] text-ink-soft mb-1">달력에서 보기 ↓</p>
          <Calendar month="11월" startDay={0} days={30} compact marks={MARKS} />
        </div>

        <div class="flex gap-2 text-[10px] text-ink-soft">
          <span class="flex items-center gap-1">
            <span class="inline-block w-2 h-2 rounded-sm bg-accent" />모두
          </span>
          <span class="flex items-center gap-1">
            <span class="inline-block w-2 h-2 rounded-sm bg-accent-soft" />일부
          </span>
          <button
            onClick={() => setScreen('landing')}
            class="ml-auto cursor-pointer text-ink-soft bg-transparent border-0 p-0"
          >
            ← 나가기
          </button>
        </div>
      </div>
    </Screen>
  );
}
