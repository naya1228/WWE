// 앱 소개 랜딩 — 첫 화면
import { setScreen, setIsReturning } from "../store";

export default function Intro() {
  function goNew() {
    setIsReturning(false);
    setScreen("onboard");
  }

  function goReturning() {
    setIsReturning(true);
    setScreen("onboard");
  }

  return (
    <div class="min-h-screen w-full max-w-md mx-auto px-5 flex flex-col">
      {/* 상단 여백*/}
      <div class="pt-14">
        <span class="inline-flex items-center gap-1.5 bg-paper border border-ink/20 rounded-full px-3 py-1 text-[11px] text-ink-soft shadow-sketch"></span>
      </div>

      {/* 히어로 */}
      <div class="mt-8 flex-1">
        {/* 타이틀 */}
        <h1 class="font-caveat text-[56px] font-bold leading-[1.05] tracking-tight text-ink">
          When
          <br />
          We
          <br />
          Meet.
        </h1>

        {/* 언더라인 스케치 */}
        <svg class="mt-1 ml-0.5" width="160" height="10" viewBox="0 0 160 10">
          <path
            d="M2 6 Q 20 2, 40 6 T 80 6 T 120 6 T 158 5"
            fill="none"
            stroke="var(--color-accent)"
            stroke-width="2.5"
            stroke-linecap="round"
          />
        </svg>

        {/* 설명 */}
        <p class="mt-5 text-[15px] text-ink-soft leading-relaxed">
          링크 하나 보내면
          <br />
          친구들이 가능한 시간을 체크해요.
          <br />
          서버가 겹치는 시간을 찾아줘요.
        </p>

        {/* 플로우 일러스트 — 손그림 스타일 텍스트 다이어그램 */}
        <div class="mt-8 bg-paper border-2 border-ink rounded-2xl p-4 shadow-sketch-md">
          <div class="flex items-center gap-2 text-sm font-caveat">
            <div class="flex-1 text-center">
              <div class="text-2xl">🔗</div>
              <div class="text-ink font-bold mt-1">링크 공유</div>
            </div>
            <div class="text-ink-faint text-lg">→</div>
            <div class="flex-1 text-center">
              <div class="text-2xl">📅</div>
              <div class="text-ink font-bold mt-1">각자 체크</div>
            </div>
            <div class="text-ink-faint text-lg">→</div>
            <div class="flex-1 text-center">
              <div class="text-2xl">🎉</div>
              <div class="text-ink font-bold mt-1">시간 확정</div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 CTA */}
      <div class="py-8 flex flex-col gap-3">
        <button
          onClick={goNew}
          class="w-full py-4 bg-accent border-2 border-ink rounded-2xl shadow-sketch-md
                 font-kalam font-bold text-[19px] text-ink text-center
                 active:translate-y-[1px] active:shadow-none transition-[transform,box-shadow] duration-75 cursor-pointer"
        >
          시작하기 →
        </button>

        <button
          onClick={goReturning}
          class="w-full py-3 text-[15px] font-kalam text-ink-soft text-center cursor-pointer
                 hover:text-ink transition-colors duration-150"
        >
          써본 적 있다면?{" "}
          <span class="underline underline-offset-2 decoration-dotted">
            전화번호로 불러오기
          </span>
        </button>
      </div>
    </div>
  );
}

