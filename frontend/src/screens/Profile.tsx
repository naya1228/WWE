import { Show, createSignal } from 'solid-js';
import Screen from '../components/Screen';
import Avatar from '../components/Avatar';
import { setScreen, userName, userPhone, user } from '../store';

export default function Profile() {
  return (
    <Screen title="내 프로필" profileActive>
      <div class="flex flex-col h-full gap-4">
        <div class="flex items-center gap-3">
          <Avatar size={56} label={userName().charAt(0) || '?'} accent />
          <div class="flex-1">
            <div class="font-caveat text-xl font-bold">{userName() || '이름 없음'}</div>
            <div class="text-[11px] text-ink-soft">{userPhone() || '전화번호 없음'}</div>
          </div>
          <button
            onClick={() => setScreen('profile-edit')}
            class="text-base text-ink-soft cursor-pointer bg-transparent border-0 p-2"
            aria-label="편집"
          >
            ✎
          </button>
        </div>

        <div
          class="w-full h-10 rounded-xl border-2 border-ink shadow-sketch"
          style={{ background: user()?.color ?? '#ccc' }}
        />
        <p class="text-xs text-ink-soft text-center -mt-2">내 색상</p>

        <div class="mt-auto">
          <button
            onClick={() => setScreen('landing')}
            class="w-full text-sm text-ink-soft text-center cursor-pointer bg-transparent border-0 p-2"
          >
            ← 홈으로
          </button>
        </div>
      </div>
    </Screen>
  );
}
