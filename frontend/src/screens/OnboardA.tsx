// ① 온보딩 — 전화번호 입력
import { createSignal } from 'solid-js';
import Screen from '../components/Screen';
import Button from '../components/Button';
import Input from '../components/Input';
import { setScreen, setUserPhone } from '../store';

export default function OnboardA() {
  const [phone, setPhone] = createSignal('010-1234-5678');

  function handleNext() {
    setUserPhone(phone());
    setScreen('setup');
  }

  return (
    <Screen showProfile={false}>
      <div class="flex flex-col h-full justify-between gap-6">
        <div class="pt-10">
          <h2 class="font-caveat text-4xl font-bold leading-[1.1]">
            안녕!<br/>처음 오셨네요.
          </h2>
          <svg class="block mt-2" width="120" height="8" viewBox="0 0 200 8" preserveAspectRatio="none">
            <path d="M0 4 Q 10 0, 20 4 T 40 4 T 60 4 T 80 4 T 100 4 T 120 4 T 140 4 T 160 4 T 180 4 T 200 4"
              fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          </svg>
          <p class="text-sm text-ink-soft mt-4">
            전화번호로 시작해요.<br/>인증 없이 빠르게 시작.
          </p>
        </div>

        <div class="flex flex-col gap-3.5">
          <Input label="전화번호" value={phone()} onInput={setPhone} type="tel" />
          <Button variant="primary" size="lg" onClick={handleNext}>다음 →</Button>
        </div>

        <p class="text-[11px] text-ink-faint text-center pb-1">
          (인증 X — 친구끼리 약속용)
        </p>
      </div>
    </Screen>
  );
}
