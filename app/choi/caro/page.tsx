"use client";

import Link from "next/link";
import { Nav } from "@/components/Nav";
import { CaroBoard } from "@/components/board/CaroBoard";
import { StatusLine, LevelTrack, PanelActions, MoveList } from "@/components/GamePanel";
import { useCaroGame, LEVELS } from "@/lib/useCaroEngine";
import { CARO_N } from "@/lib/games/caro/rules";

function moveLabel(idx: number) {
  return `${String.fromCharCode(65 + (idx % CARO_N))}${Math.floor(idx / CARO_N) + 1}`;
}

export default function CaroPage() {
  const { state, play, undo, reset, level, setLevel, thinking, moveLog } = useCaroGame();
  const status =
    state.winner === 1 ? "Bạn thắng." : state.winner === 2 ? "AI thắng." : state.winner === -1 ? "Hòa." : thinking ? "AI đang nghĩ…" : "Lượt của bạn";

  const rows: [string, string?][] = [];
  for (let r = 0; r < Math.ceil(moveLog.length / 2); r++)
    rows.push([moveLabel(moveLog[r * 2]), moveLog[r * 2 + 1] != null ? moveLabel(moveLog[r * 2 + 1]) : undefined]);

  return (
    <main className="relative min-h-screen">
      <Nav />
      <div className="mx-auto grid max-w-[1240px] gap-[clamp(28px,4vw,56px)] px-5 pb-24 pt-[104px] md:px-11 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <h1 className="font-display text-[clamp(26px,3vw,36px)] font-bold tracking-[-0.02em]">Cờ caro</h1>
            <Link href="/choi" className="text-[13px] font-medium text-ink-2 transition-colors hover:text-ink">← Đổi sân</Link>
          </div>
          <CaroBoard state={state} onCell={play} disabled={thinking || state.turn !== 1} />
        </div>

        <aside className="self-start lg:sticky lg:top-[96px]">
          <StatusLine
            text={status}
            over={state.winner !== 0}
            stone={state.turn === 1 ? "var(--stone-x)" : "var(--stone-o)"}
          />
          <LevelTrack levels={LEVELS} level={level} onLevel={setLevel} />
          <PanelActions actions={[
            { label: "Lùi nước", onClick: undo, disabled: moveLog.length === 0 || thinking },
            { label: "Ván mới", onClick: reset },
          ]} />
          <MoveList rows={rows} empty="Chưa có nước nào — bạn đi trước." lastIdx={moveLog.length - 1} />
        </aside>
      </div>
    </main>
  );
}
