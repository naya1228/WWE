import {
  For,
  createResource,
  Show,
  createSignal,
  createEffect,
} from "solid-js";
import Screen from "../components/Screen";
import Button from "../components/Button";
import Card from "../components/Card";
import {
  setScreen,
  userName,
  userId,
  setCurrentRoomId,
  userToken,
  myRooms,
  setMyRooms,
} from "../store";
import { api, type RoomOut } from "../api";

export default function Landing() {
  // 캐시(store)에 이미 있으면 바로 표시, 백그라운드로도 최신화
  const [fetchedRooms, { refetch }] = createResource(
    () => userId(),
    (id) => (id ? api.listMyRooms(id) : Promise.resolve([])),
  );

  // fetch 완료되면 store(+localStorage) 갱신
  createEffect(() => {
    const r = fetchedRooms();
    if (r) setMyRooms(r);
  });

  const rooms = myRooms;
  const loading = () => fetchedRooms.loading && myRooms().length === 0;

  const [refreshing, setRefreshing] = createSignal(false);
  function handleRefresh() {
    setRefreshing(true);
    refetch();
  }
  createEffect(() => {
    if (!fetchedRooms.loading) setRefreshing(false);
  });

  // 코드 입력 모달
  const [showJoin, setShowJoin] = createSignal(false);
  const [code, setCode] = createSignal("");
  const [joinError, setJoinError] = createSignal("");
  const [joining, setJoining] = createSignal(false);

  function handleCodeInput(raw: string) {
    setCode(
      raw
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 4),
    );
  }

  async function handleJoin() {
    if (code().length < 4) {
      setJoinError("코드 4자리를 입력해줘요");
      return;
    }
    setJoinError("");
    setJoining(true);
    try {
      const room = await api.getRoomByCode(code());
      await api.joinRoom(room.id, userToken());
      setCurrentRoomId(room.id);
      setShowJoin(false);
      setScreen("room");
    } catch (e: any) {
      if (e.status === 404) setJoinError("코드가 올바르지 않아요");
      else setJoinError(e.message ?? "오류가 발생했어요");
    } finally {
      setJoining(false);
    }
  }

  function openRoom(room: RoomOut) {
    setCurrentRoomId(room.id);
    setScreen("room");
  }

  return (
    <Screen title="약속">
      <div class="flex flex-col h-full">
        <div>
          <h2 class="font-caveat text-3xl font-bold">
            {userName() ? ` ${userName()}!` : "새 약속 잡기"}
          </h2>
        </div>

        <div class="mt-5 flex flex-col gap-2.5">
          <Button
            variant="primary"
            size="lg"
            onClick={() => setScreen("room-empty")}
          >
            + 룸 만들기
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => {
              setCode("");
              setJoinError("");
              setShowJoin(true);
            }}
          >
            → 코드로 참여하기
          </Button>
        </div>

        {/* 코드 입력 패널 */}
        <Show when={showJoin()}>
          <div class="mt-4 bg-paper border-2 border-ink rounded-2xl p-4 shadow-sketch-md flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-bold">초대 코드 입력</span>
              <button
                onClick={() => setShowJoin(false)}
                class="text-ink-faint text-lg cursor-pointer bg-transparent border-0 p-0 leading-none"
              >
                ✕
              </button>
            </div>
            <input
              type="text"
              value={code()}
              onInput={(e) => handleCodeInput(e.currentTarget.value)}
              placeholder="A1B2"
              class="w-full text-center font-caveat text-4xl font-bold tracking-[10px] border-2 border-ink rounded-xl py-3 bg-bg shadow-sketch outline-none"
            />
            {joinError() && (
              <p class="text-sm text-red-500 text-center">{joinError()}</p>
            )}
            <Button
              variant="primary"
              size="md"
              onClick={handleJoin}
              class={joining() ? "opacity-60 pointer-events-none" : ""}
            >
              {joining() ? "..." : "참여하기 →"}
            </Button>
          </div>
        </Show>

        <div class="mt-6 mb-2 text-sm text-ink-soft flex items-center gap-2">
          내 룸
          <button
            onClick={handleRefresh}
            class={`text-ink-faint text-[13px] cursor-pointer bg-transparent border-0 p-0 ${refreshing() ? "animate-spin" : ""}`}
            style={refreshing() ? { "animation-direction": "reverse" } : {}}
          >
            ↺
          </button>
        </div>

        <div class="flex flex-col gap-2 flex-1 overflow-y-auto">
          <Show when={loading()}>
            <p class="text-sm text-ink-faint text-center py-4">불러오는 중…</p>
          </Show>
          <Show when={!loading() && rooms().length === 0}>
            <p class="text-sm text-ink-faint text-center py-8">
              아직 참여한 룸이 없어요.
              <br />
              룸을 만들거나 코드로 참여해봐요!
            </p>
          </Show>
          <For each={rooms()}>
            {(r) => (
              <Card onClick={() => openRoom(r)}>
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-accent-soft border-[1.5px] border-ink flex items-center justify-center font-caveat text-sm font-bold">
                    {r.invite_code}
                  </div>
                  <div class="flex-1">
                    <div class="text-sm font-bold">{r.name}</div>
                    <div class="text-[10px] text-ink-faint">
                      {r.date_range_start} ~ {r.date_range_end}
                    </div>
                  </div>
                  <div class="text-base text-ink-faint">›</div>
                </div>
              </Card>
            )}
          </For>
        </div>
      </div>
    </Screen>
  );
}
