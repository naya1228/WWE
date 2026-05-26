// 프로필 날짜 상세 — 시간별 체크박스
import { For } from 'solid-js';
import Screen from '../components/Screen';
import Button from '../components/Button';
import { availableTimes, toggleTime } from '../store';

const HOUR_SLOTS = [
  '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00',
  '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00',
  '17:00 - 18:00', '18:00 - 19:00', '19:00 - 20:00', '20:00 - 21:00',
];

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

interface Props {
  date: number;
  onBack: () => void;
}

export default function ProfileDetail(props: Props) {
  const checkedHours = () => availableTimes()[props.date] ?? new Set<number>();
  const checkedCount = () => checkedHours().size;
  const dayOfWeek = () => DAY_NAMES[new Date(2026, 10, props.date).getDay()];

  return (
    <Screen title={`11월 ${props.date}일 (${dayOfWeek()})`} profileActive>
      <div class="flex flex-col h-full gap-1">
        <div class="flex items-center justify-between mb-1">
          <button
            onClick={props.onBack}
            class="text-[11px] text-ink-soft cursor-pointer bg-transparent border-0 p-0"
          >
            ← 캘린더로 돌아가기
          </button>
          {checkedCount() > 0 && (
            <span class="text-[10px] px-2 py-0.5 bg-accent rounded font-bold">
              {checkedCount()}시간 가능
            </span>
          )}
        </div>

        <p class="text-[11px] text-ink-soft mb-0.5">
          가능한 시간을 탭하세요
        </p>

        <div class="flex flex-col gap-0.5 overflow-auto flex-1">
          <For each={HOUR_SLOTS}>
            {(slot, i) => {
              const hour = 9 + i();
              const isChecked = () => checkedHours().has(hour);

              return (
                <button
                  onClick={() => toggleTime(props.date, hour)}
                  class={`flex items-center gap-2.5 px-2 py-1.5 rounded-md border-[1.5px] cursor-pointer text-left bg-transparent ${isChecked() ? 'bg-accent-soft border-ink' : 'border-transparent'}`}
                >
                  <span
                    class={`w-4 h-4 rounded border-2 border-ink flex items-center justify-center shrink-0 ${isChecked() ? 'bg-ink' : 'bg-paper'}`}
                  >
                    {isChecked() && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                        stroke="var(--color-paper)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M5 12 L 10 17 L 19 7" />
                      </svg>
                    )}
                  </span>
                  <span class={`text-[13px] ${isChecked() ? 'font-bold' : ''}`}>{slot}</span>
                </button>
              );
            }}
          </For>
        </div>

        <Button variant="primary" size="sm" onClick={props.onBack} class="mt-auto shrink-0">
          저장
        </Button>
      </div>
    </Screen>
  );
}
