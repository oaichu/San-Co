"use client";

import Link from "next/link";
import { Nav } from "@/components/Nav";
import { GoBoard } from "@/components/board/GoBoard";
import { useGoGame, LEVELS } from "@/lib/useGoEngine";

export default function GoPage() {
  const { state, play, pass, undo, reset, level, setLevel, thinking, status, score, moveCount } = useGoGame();

  return (
    <main className="relative min-h-screen">
      <Nav />
      <div className="mx-auto grid max-w-[1240px] gap-[clamp(28px,4vw,56px)] px-5 pb-24 pt-[104px] md:px-11 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <h1 className="font-display text-[clamp(26px,3vw,36px)] font-bold tracking-[-0.02em]">Cờ vây</h1>
            <Link href="/choi" className="text-[13px] font-medium text-ink-2 transition-colors hover:text-ink">← Đổi sân</Link>
          </div>
          <GoBoard state={state} onPoint={play} disabled={thinking || state.turn !== 1} />
        </div>

        <aside className="self-start lg:sticky lg:top-[96px]">
          <div className="border-b border-line pb-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">Trạng thái</div>
            <div className={`mt-1.5 font-display text-[20px] font-semibold ${state.done ? "text-vermilion" : ""}`} aria-live="polite">{status}</div>
            <p className="tabular mt-1 text-[12.5px] text-ink-3">Đen {score[0].toFixed(0)} · Trắng {score[1].toFixed(1)} (komi 6.5) · Bắt: {state.captures[0]}–{state.captures[1]}</p>
          </div>
          <div className="border-b border-line py-5">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">Độ khó</div>
            <div className="flex flex-wrap gap-1.5">
              {LEVELS.map((l, i) => (
                <button key={l} onClick={() => setLevel(i)} className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-all duration-150 active:scale-[0.97] ${i === level ? "border-vermilion bg-vermilion text-accent-ink" : "border-line-2 text-ink-2 hover:border-ink-2 hover:text-ink"}`}>{l}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 border-b border-line py-5">
            <button onClick={pass} disabled={state.done || thinking} className="flex-1 rounded-lg border border-line-2 py-2.5 text-[13.5px] font-semibold transition-all duration-150 enabled:hover:-translate-y-0.5 enabled:active:scale-[0.97] disabled:opacity-40">Pass</button>
            <button onClick={undo} disabled={moveCount === 0 || thinking} className="flex-1 rounded-lg border border-line-2 py-2.5 text-[13.5px] font-semibold transition-all duration-150 enabled:hover:-translate-y-0.5 enabled:active:scale-[0.97] disabled:opacity-40">Lùi nước</button>
            <button onClick={reset} className="flex-1 rounded-lg border border-line-2 py-2.5 text-[13.5px] font-semibold transition-all duration-150 enabled:hover:-translate-y-0.5 enabled:active:scale-[0.97]">Ván mới</button>
          </div>
          <p className="pt-5 text-[12.5px] leading-[1.65] text-ink-3">
            AI cờ vây trên máy chỉ ở mức nhập môn — muốn thử sức thật, <Link href="/online" className="text-vermilion underline-offset-4 hover:underline">đấu online</Link> hoặc học <Link href="/hoc" className="text-vermilion underline-offset-4 hover:underline">giáo trình cờ vây</Link>.
          </p>
        </aside>
      </div>
    </main>
  );
}
