// ⑤ 프로필 — 캘린더 + 날짜 클릭 → 시간별 상세
import { Show, createSignal } from 'solid-js';
import Screen from '../components/Screen';
import Avatar from '../components/Avatar';
import Calendar from '../components/Calendar';
import { setScreen, userName, userPhone, myMarks } from '../store';
import ProfileDetail from './ProfileDetail';

export default function ProfileB() {
  const [detailDate, setDetailDate] = createSignal<number | null>(null);

  return (
    <Show
      when={detailDate() !== null}
      fallback={
        <Screen title="내 프로필" profileActive>
          <div class="flex flex-col h-full gap-2">
            <div class="flex items-center gap-2.5">
              <Avatar size={48} label={userName().charAt(0) || '?'} accent />
              <div class="flex-1">
                <div class="font-caveat text-lg font-bold">
                  {userName() || '이름 없음'}
                </div>
                <div class="text-[11px] text-ink-soft">
                  {userPhone() || '전화번호 없음'}
                </div>
              </div>
              <button
                onClick={() => setScreen('profile-edit')}
                class="text-base text-ink-soft cursor-pointer bg-transparent border-0 p-2"
                aria-label="편집"
              >
                ✎
              </button>
            </div>

            <p class="text-xs text-ink-soft">
              날짜를 탭하면 가능한 시간을 설정할 수 있어요
            </p>

            <Calendar
              month="11월 2026"
              startDay={0}
              days={30}
              marks={myMarks()}
              onSelect={(d) => setDetailDate(d)}
            />

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
      }
    >
      <ProfileDetail date={detailDate()!} onBack={() => setDetailDate(null)} />
    </Show>
  );
}
