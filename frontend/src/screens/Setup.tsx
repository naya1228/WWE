import { createSignal, For } from 'solid-js';
import Screen from '../components/Screen';
import Button from '../components/Button';
import Input from '../components/Input';
import Avatar from '../components/Avatar';
import { ACCENT_COLORS } from '../constants';
import { setScreen, saveUser, accentColor, setAccentColor, pendingPhone } from '../store';
import { api } from '../api';

export default function Setup() {
  const [name, setName] = createSignal('');
  const [color, setColor] = createSignal(accentColor());
  const [error, setError] = createSignal('');
  const [loading, setLoading] = createSignal(false);

  async function handleStart() {
    const n = name().trim();
    if (!n) { setError('이름을 입력해줘요'); return; }
    const phone = pendingPhone();
    if (!phone) { setError('전화번호가 없어요. 돌아가서 다시 입력해주세요'); return; }
    setError('');
    setLoading(true);
    try {
      const u = await api.createUser(phone, n, color());
      saveUser({ id: u.id, token: u.token, phone: u.phone, name: u.name, color: u.color });
      setScreen('landing');
    } catch (e: any) {
      if (e.status === 409) setError('이미 사용 중인 전화번호예요. 돌아가서 "써본 적 있다면?"을 눌러보세요.');
      else setError(e.message ?? '오류가 발생했어요');
    } finally {
      setLoading(false);
    }
  }

  function pickColor(c: string) {
    setColor(c);
    setAccentColor(c);
  }

  return (
    <Screen title="프로필 만들기" showProfile={false}>
      <div class="flex flex-col gap-4 h-full">
        <p class="text-sm text-ink-soft">마지막 단계!</p>

        <div class="flex justify-center mt-1">
          <Avatar size={80} label={name().charAt(0) || '?'} accent />
        </div>

        <Input label="이름" value={name()} onInput={setName} placeholder="홍길동" />

        <div>
          <div class="text-sm text-ink-soft pl-1 mb-1.5">
            내 색상 <span class="text-[11px] text-ink-faint">· 룸·캘린더에서 쓰여요</span>
          </div>
          <div class="flex gap-2 justify-between">
            <For each={ACCENT_COLORS}>
              {(c) => (
                <button
                  onClick={() => pickColor(c)}
                  class={`w-9 h-9 rounded-full border-2 border-ink cursor-pointer transition-shadow ${color() === c ? 'ring-2 ring-paper ring-offset-2 ring-offset-ink' : 'shadow-sketch'}`}
                  style={{ background: c }}
                  aria-label={`색상 ${c}`}
                />
              )}
            </For>
          </div>
        </div>

        {error() && <p class="text-sm text-red-500 pl-1">{error()}</p>}

        <div class="mt-auto">
          <Button
            variant="primary"
            size="lg"
            onClick={handleStart}
            class={loading() ? 'opacity-60 pointer-events-none' : ''}
          >
            {loading() ? '...' : '시작하기!'}
          </Button>
        </div>
      </div>
    </Screen>
  );
}
