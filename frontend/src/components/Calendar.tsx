import { For } from 'solid-js';
import { isAccentDark } from '../store';

interface Props {
  month?: string;
  startDay?: number;
  days?: number;
  marks?: Record<number, 'available' | 'partial' | 'unavailable'>;
  selected?: number | null;
  compact?: boolean;
  onSelect?: (day: number) => void;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function Calendar(props: Props) {
  const month = () => props.month ?? 'November 2026';
  const startDay = () => props.startDay ?? 0;
  const days = () => props.days ?? 30;
  const marks = () => props.marks ?? {};
  const compact = () => props.compact ?? false;

  const cells = (): (number | null)[] => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < startDay(); i++) arr.push(null);
    for (let d = 1; d <= days(); d++) arr.push(d);
    return arr;
  };

  return (
    <div class="w-full">
      <div class="flex justify-between items-center mb-1.5 font-caveat text-base font-bold">
        <span class="text-lg text-ink-soft">‹</span>
        <span>{month()}</span>
        <span class="text-lg text-ink-soft">›</span>
      </div>

      <div class="grid grid-cols-7 gap-0.5 text-xs text-ink-faint mb-0.5">
        <For each={DAY_LABELS}>
          {l => <div class="text-center">{l}</div>}
        </For>
      </div>

      <div class="grid grid-cols-7 gap-0.5">
        <For each={cells()}>
          {d => {
            if (d === null) return <div class={compact() ? 'h-6' : 'h-8'} />;

            const mark = () => marks()[d];
            const isSel = () => props.selected === d;

            const bgClass = () => {
              if (mark() === 'available') return 'bg-accent';
              if (mark() === 'partial') return 'bg-accent-soft';
              return 'bg-transparent';
            };
            const textClass = () => {
              if (mark() === 'unavailable') return 'text-ink-faint';
              if (mark() === 'available') return isAccentDark() ? 'text-white' : 'text-ink';
              return 'text-ink';
            };
            const fwClass = () =>
              isSel() || mark() === 'available' ? 'font-bold' : 'font-normal';

            return (
              <button
                onClick={() => props.onSelect?.(d)}
                class={`
                  ${compact() ? 'h-6' : 'h-8'}
                  flex items-center justify-center rounded-md text-sm font-kalam
                  border-2 ${isSel() ? 'border-ink' : 'border-transparent'}
                  ${props.onSelect ? 'cursor-pointer hover:brightness-95' : 'cursor-default'}
                  ${bgClass()} ${textClass()} ${fwClass()}
                `}
              >
                {d}
              </button>
            );
          }}
        </For>
      </div>
    </div>
  );
}
