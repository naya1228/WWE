import { Switch, Match, createEffect, onMount } from 'solid-js';
import { screen, accentColor, accentSoft, initApp } from './store';
import Intro from './screens/Intro';
import Onboard from './screens/Onboard';
import Setup from './screens/Setup';
import Landing from './screens/Landing';
import Room from './screens/Room';
import RoomEmpty from './screens/RoomEmpty';
import RoomAvailability from './screens/RoomAvailability';
import Profile from './screens/Profile';
import Edit from './screens/Edit';

export default function App() {
  onMount(() => initApp());

  createEffect(() => {
    document.documentElement.style.setProperty('--color-accent', accentColor());
    document.documentElement.style.setProperty('--color-accent-soft', accentSoft());
  });

  return (
    <Switch>
      <Match when={screen() === 'intro'}><Intro /></Match>
      <Match when={screen() === 'onboard'}><Onboard /></Match>
      <Match when={screen() === 'setup'}><Setup /></Match>
      <Match when={screen() === 'landing'}><Landing /></Match>
      <Match when={screen() === 'room'}><Room /></Match>
      <Match when={screen() === 'room-empty'}><RoomEmpty /></Match>
      <Match when={screen() === 'room-availability'}><RoomAvailability /></Match>
      <Match when={screen() === 'profile'}><Profile /></Match>
      <Match when={screen() === 'profile-edit'}><Edit /></Match>
    </Switch>
  );
}
