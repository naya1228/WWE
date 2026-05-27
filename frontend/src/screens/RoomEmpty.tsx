import { createSignal } from 'solid-js';
import Screen from '../components/Screen';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import { setScreen, userToken, setCurrentRoomId } from '../store';
import { api } from '../api';

export default function RoomEmpty() {
  const [name, setName] = createSignal('');
  const [dateStart, setDateStart] = createSignal('');
  const [dateEnd, setDateEnd] = createSignal('');
  const [error, setError] = createSignal('');
  const [loading, setLoading] = createSignal(false);
  const [createdId, setCreatedId] = createSignal('');

  const roomLink = () => `${location.origin}/?room=${createdId()}`;

  async function handleCreate() {
    if (!name().trim() || !dateStart() || !dateEnd()) {
      setError('이름과 날짜를 모두 입력해줘요');
      return;
    }
    if (dateEnd() < dateStart()) {
      setError('종료일이 시작일보다 빨라요');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const room = await api.createRoom(userToken(), name().trim(), dateStart(), dateEnd());
      setCreatedId(room.id);
      setCurrentRoomId(room.id);
    } catch (e: any) {
      setError(e.message ?? '룸 생성에 실패했어요');
    } finally {
      setLoading(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(roomLink());
  }

  // 생성 완료 화면
  if (createdId()) {
    return (
      <Screen title="새 룸">
        <div class="flex flex-col h-full gap-4">
          <button
            onClick={() => setScreen('landing')}
            class="text-sm text-ink-soft cursor-pointer text-left bg-transparent border-0 p-0"
          >
            ← 돌아가기
          </button>

          <Card accent dashed class="-rotate-1 text-center">
            <div class="text-[11px] text-ink-soft mb-1">룸이 만들어졌어요!</div>
            <div class="font-caveat text-lg font-bold">{name()}</div>
            <div class="text-[11px] text-ink-faint mt-1 break-all">{roomLink()}</div>
          </Card>

          <Button variant="outline" size="md" onClick={copyLink}>
            📋 링크 복사
          </Button>
          <Button variant="primary" size="md" onClick={() => setScreen('room')}>
            룸 들어가기 →
          </Button>
        </div>
      </Screen>
    );
  }

  // 생성 폼
  return (
    <Screen title="새 룸">
      <div class="flex flex-col h-full gap-4">
        <button
          onClick={() => setScreen('landing')}
          class="text-sm text-ink-soft cursor-pointer text-left bg-transparent border-0 p-0"
        >
          ← 돌아가기
        </button>

        <Input label="룸 이름" value={name()} onInput={setName} placeholder="주말 브런치" />

        <div class="flex flex-col gap-1">
          <span class="text-sm text-ink-soft pl-1">날짜 범위</span>
          <div class="flex gap-2 items-center">
            <input
              type="date"
              value={dateStart()}
              onInput={e => setDateStart(e.currentTarget.value)}
              class="flex-1 border-2 border-ink rounded-xl px-3 py-2.5 bg-paper font-kalam text-sm shadow-sketch"
            />
            <span class="text-ink-soft text-sm">~</span>
            <input
              type="date"
              value={dateEnd()}
              onInput={e => setDateEnd(e.currentTarget.value)}
              class="flex-1 border-2 border-ink rounded-xl px-3 py-2.5 bg-paper font-kalam text-sm shadow-sketch"
            />
          </div>
        </div>

        {error() && <p class="text-sm text-red-500 pl-1">{error()}</p>}

        <div class="mt-auto">
          <Button variant="primary" size="lg" onClick={handleCreate}>
            {loading() ? '...' : '룸 만들기 →'}
          </Button>
        </div>
      </div>
    </Screen>
  );
}
