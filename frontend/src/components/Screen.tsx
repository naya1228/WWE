import type { JSX } from 'solid-js';
import { setScreen } from '../store';
import ProfileBtn from './ProfileBtn';

interface Props {
  title?: string;
  showProfile?: boolean;
  profileActive?: boolean;
  children: JSX.Element;
}

// 폰 테두리 없는 전체 화면 컨테이너 — 데스크탑에선 모바일 폭으로 중앙 정렬
export default function Screen(props: Props) {
  const showProfile = () => props.showProfile !== false;

  return (
    <div class="min-h-screen w-full max-w-md mx-auto px-5 pt-6 pb-6 flex flex-col">
      {(props.title || showProfile()) && (
        <header class="flex items-center justify-between mb-4 shrink-0">
          <h1 class="font-caveat text-2xl font-bold tracking-wide">
            {props.title}
          </h1>
          {showProfile() && (
            <button
              onClick={() => setScreen('profile')}
              class="cursor-pointer bg-transparent border-0 p-0"
            >
              <ProfileBtn active={props.profileActive} />
            </button>
          )}
        </header>
      )}
      <div class="flex-1 flex flex-col min-h-0">
        {props.children}
      </div>
    </div>
  );
}
