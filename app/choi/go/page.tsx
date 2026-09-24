"use client";

import Link from "next/link";
import { Nav } from "@/components/Nav";
import { GoBoard } from "@/components/board/GoBoard";
import { StatusLine, LevelTrack, PanelActions } from "@/components/GamePanel";
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
          <StatusLine
            text={status}
            over={state.done}
            stone={state.turn === 1 ? "var(--go-b)" : "var(--go-w)"}
            sub={<p className="tabular mt-1.5 text-[12.5px] text-ink-3">Đen {score[0].toFixed(0)} · Trắng {score[1].toFixed(1)} (komi 6.5) · Bắt: {state.captures[0]}–{state.captures[1]}</p>}
          />
          <LevelTrack levels={LEVELS} level={level} onLevel={setLevel} />
          <PanelActions actions={[
            { label: "Pass", onClick: pass, disabled: state.done || thinking },
            { label: "Lùi nước", onClick: undo, disabled: moveCount === 0 || thinking },
            { label: "Ván mới", onClick: reset },
          ]} />
          <p className="pt-5 text-[12.5px] leading-[1.65] text-ink-3">
            AI cờ vây trên máy chỉ ở mức nhập môn — muốn thử sức thật, <Link href="/online" className="text-vermilion underline-offset-4 hover:underline">đấu online</Link> hoặc học <Link href="/hoc" className="text-vermilion underline-offset-4 hover:underline">giáo trình cờ vây</Link>.
          </p>
        </aside>
      </div>
    </main>
  );
}
