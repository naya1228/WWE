import { createSignal, For } from 'solid-js';
import Screen from '../components/Screen';
import Button from '../components/Button';
import Input from '../components/Input';
import Avatar from '../components/Avatar';
import { ACCENT_COLORS } from '../constants';
import { setScreen, user, saveUser, userToken, setAccentColor } from '../store';
import { api } from '../api';

export default function Edit() {
  const [name, setName] = createSignal(user()?.name ?? '');
  const [color, setColor] = createSignal(user()?.color ?? ACCENT_COLORS[0]);

  function pickColor(c: string) {
    setColor(c);
    setAccentColor(c);
  }

  function handleSave() {
    const u = user();
    if (!u) return;
    const newName = name();
    const newColor = color();

    // 즉시 반영 후 화면 전환
    saveUser({ ...u, name: newName, color: newColor });
    setScreen('profile');

    // API는 백그라운드 — 실패 시 롤백
    api.updateUser(u.id, userToken(), { name: newName, color: newColor })
      .catch(() => {
        saveUser(u);
        setAccentColor(u.color);
      });
  }

  return (
    <Screen title="프로필 편집" profileActive>
      <div class="flex flex-col h-full gap-5">
        <div class="flex justify-center mt-2">
          <Avatar size={80} label={name().charAt(0) || '?'} accent />
        </div>

        <Input label="이름" value={name()} onInput={setName} />

        <div>
          <div class="text-sm text-ink-soft pl-1 mb-1.5">색상</div>
          <div class="flex gap-2 justify-between">
            <For each={ACCENT_COLORS}>
              {(c) => (
                <button
                  onClick={() => pickColor(c)}
                  class={`w-8 h-8 rounded-full border-2 border-ink cursor-pointer ${color() === c ? 'ring-2 ring-paper ring-offset-2 ring-offset-ink' : ''}`}
                  style={{ background: c }}
                  aria-label={`색상 ${c}`}
                />
              )}
            </For>
          </div>
        </div>

        <p class="text-[11px] text-ink-faint text-center">이름과 색상만 변경할 수 있어요</p>

        <div class="mt-auto flex gap-2">
          <Button variant="outline" size="md" onClick={() => setScreen('profile')}>취소</Button>
          <Button variant="primary" size="md" onClick={handleSave}>
            저장
          </Button>
        </div>
      </div>
    </Screen>
  );
}
