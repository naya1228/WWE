// 빈 룸 — 초대 코드
import Screen from '../components/Screen';
import Button from '../components/Button';
import Card from '../components/Card';
import { setScreen } from '../store';

export default function RoomEmpty() {
  return (
    <Screen title="새 룸">
      <div class="flex flex-col h-full gap-3">
        <button
          onClick={() => setScreen('landing')}
          class="text-sm text-ink-soft cursor-pointer text-left bg-transparent border-0 p-0"
        >
          ← 돌아가기
        </button>

        <p class="text-xs text-ink-soft">1 / 4명 입력 · 친구 기다리는 중</p>

        <Card accent dashed class="-rotate-1 text-center">
          <div class="text-[11px] text-ink-soft">초대 코드</div>
          <div class="font-caveat text-[44px] font-bold tracking-[6px]">K7P2</div>
          <div class="text-[11px] text-ink-faint">또는 링크 공유</div>
        </Card>

        <Button variant="outline" size="md">📋 코드 복사</Button>
        <Button variant="outline" size="md">↗ 링크 공유</Button>

        <p class="mt-auto text-xs text-ink-soft text-center">
          친구가 들어오면 캘린더가 보여요
        </p>

        <Button variant="primary" size="sm" onClick={() => setScreen('room')}>
          (데모) 친구 참여 시뮬레이션 →
        </Button>
      </div>
    </Screen>
  );
}
