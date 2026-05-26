// ② 프로필 만들기 — 이름 + 색상
import { createSignal, For } from 'solid-js';
import Screen from '../components/Screen';
import Button from '../components/Button';
import Input from '../components/Input';
import Avatar from '../components/Avatar';
import { ACCENT_COLORS } from '../constants';
import { setScreen, setUserName, accentColor, setAccentColor } from '../store';

export default function SetupA() {
  const [name, setName] = createSignal('민지');

  function handleStart() {
    setUserName(name());
    setScreen('landing');
  }

  return (
    <Screen title="프로필 만들기" showProfile={false}>
      <div class="flex flex-col gap-4 h-full">
        <p class="text-sm text-ink-soft">2 / 2 · 마지막 단계!</p>

        <div class="flex justify-center mt-1">
          <div class="relative">
            <Avatar size={80} label={name().charAt(0) || '?'} accent />
            <div class="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-paper border-2 border-ink flex items-center justify-center text-sm font-bold">
              ✎
            </div>
          </div>
        </div>

        <Input label="이름" value={name()} onInput={setName} />

        <div>
          <div class="text-sm text-ink-soft pl-1 mb-1.5">
            내 색상{' '}
            <span class="text-[11px] text-ink-faint">· 룸·캘린더에서 쓰여요</span>
          </div>
          <div class="flex gap-2 justify-between">
            <For each={ACCENT_COLORS}>
              {(c) => (
                <button
                  onClick={() => setAccentColor(c)}
                  class={`w-9 h-9 rounded-full border-2 border-ink cursor-pointer transition-shadow ${accentColor() === c ? 'ring-2 ring-paper ring-offset-2 ring-offset-ink' : 'shadow-sketch'}`}
                  style={{ background: c }}
                  aria-label={`색상 ${c}`}
                />
              )}
            </For>
          </div>
        </div>

        <div class="mt-auto">
          <Button variant="primary" size="lg" onClick={handleStart}>
            시작하기!
          </Button>
        </div>
      </div>
    </Screen>
  );
}
