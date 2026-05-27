import { createSignal } from "solid-js";
import Screen from "../components/Screen";
import Button from "../components/Button";
import Input from "../components/Input";
import { setScreen, isReturning, saveUser, setPendingPhone } from "../store";
import { api } from "../api";

/** 숫자만 뽑아서 한국 전화번호 형식으로 포맷 */
function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.startsWith("02")) {
    // 서울 02-XXXX-XXXX
    if (d.length <= 2) return d;
    if (d.length <= 6) return `${d.slice(0, 2)}-${d.slice(2)}`;
    if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`;
  } else {
    // 휴대폰 010-XXXX-XXXX
    if (d.length <= 3) return d;
    if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
  }
}

export default function Onboard() {
  const [phone, setPhone] = createSignal("");
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  function handlePhoneInput(raw: string) {
    setPhone(formatPhone(raw));
  }

  async function handleReturning() {
    const p = phone().trim();
    if (!p) return;
    setError("");
    setLoading(true);
    try {
      const u = await api.lookupByPhone(p);
      saveUser({
        id: u.id,
        token: u.token,
        phone: u.phone,
        name: u.name,
        color: u.color,
      });
      setScreen("landing");
    } catch (e: any) {
      if (e.status === 404) setError("등록된 번호가 없어요. 처음이신가요?");
      else setError(e.message ?? "오류가 발생했어요");
    } finally {
      setLoading(false);
    }
  }

  function handleNew() {
    const p = phone().trim();
    if (!p) {
      setError("전화번호를 입력해주세요");
      return;
    }
    setPendingPhone(p);
    setScreen("setup");
  }

  const handleNext = () => (isReturning() ? handleReturning() : handleNew());

  return (
    <Screen showProfile={false}>
      <div class="flex flex-col h-full justify-between gap-6">
        <div class="pt-10">
          <h2 class="font-caveat text-4xl font-bold leading-[1.1]">
            {isReturning() ? "다시 왔네요!" : "안녕!"}
            <br />
            {isReturning() ? "전화번호를 입력해요." : "처음 오셨네요."}
          </h2>
          <svg
            class="block mt-2"
            width="120"
            height="8"
            viewBox="0 0 200 8"
            preserveAspectRatio="none"
          >
            <path
              d="M0 4 Q 10 0, 20 4 T 40 4 T 60 4 T 80 4 T 100 4 T 120 4 T 140 4 T 160 4 T 180 4 T 200 4"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </svg>
          <p class="text-sm text-ink-soft mt-4">
            {isReturning()
              ? "전화번호로 내 정보를 불러와요."
              : "전화번호로 시작해요."}
          </p>
        </div>

        <div class="flex flex-col gap-3.5">
          {error() && <p class="text-sm text-red-500 pl-1">{error()}</p>}
          <Input
            label="전화번호"
            value={phone()}
            onInput={handlePhoneInput}
            type="tel"
            placeholder="010-0000-0000"
          />
          <Button variant="primary" size="lg" onClick={handleNext}>
            {loading() ? "..." : isReturning() ? "불러오기 →" : "다음 →"}
          </Button>
          <button
            onClick={() => setScreen("intro")}
            class="text-sm text-ink-faint text-center cursor-pointer hover:text-ink-soft transition-colors"
          >
            ← 돌아가기
          </button>
        </div>
      </div>
    </Screen>
  );
}
