import { Switch, Match, createEffect } from 'solid-js';
import { screen, accentColor, accentSoft } from './store';
import OnboardA from './screens/OnboardA';
import SetupA from './screens/SetupA';
import LandingC from './screens/LandingC';
import RoomB from './screens/RoomB';
import RoomEmpty from './screens/RoomEmpty';
import ProfileB from './screens/ProfileB';
import EditA from './screens/EditA';

export default function App() {
  // accent 색상 변경 시 CSS 변수 동기화 → Tailwind 유틸리티(bg-accent 등) 자동 반영
  createEffect(() => {
    document.documentElement.style.setProperty('--color-accent', accentColor());
    document.documentElement.style.setProperty('--color-accent-soft', accentSoft());
  });

  return (
    <Switch>
      <Match when={screen() === 'onboard'}><OnboardA /></Match>
      <Match when={screen() === 'setup'}><SetupA /></Match>
      <Match when={screen() === 'landing'}><LandingC /></Match>
      <Match when={screen() === 'room'}><RoomB /></Match>
      <Match when={screen() === 'room-empty'}><RoomEmpty /></Match>
      <Match when={screen() === 'profile'}><ProfileB /></Match>
      <Match when={screen() === 'profile-edit'}><EditA /></Match>
    </Switch>
  );
}
