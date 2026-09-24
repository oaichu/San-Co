"use client";

import Link from "next/link";
import { Nav } from "@/components/Nav";
import { XiangqiBoard } from "@/components/board/XiangqiBoard";
import { StatusLine, LevelTrack, PanelActions, MoveList } from "@/components/GamePanel";
import { useXiangqiGame, LEVELS } from "@/lib/useXiangqiEngine";
import { XQ_W } from "@/lib/games/xiangqi/rules";

const lbl = (i: number) => `${String.fromCharCode(97 + (i % XQ_W))}${10 - Math.floor(i / XQ_W)}`;

export default function XiangqiPage() {
  const { state, click, undo, reset, level, setLevel, thinking, selected, targets, status, moves } = useXiangqiGame();

  const rows: [string, string?][] = [];
  for (let r = 0; r < Math.ceil(moves.length / 2); r++)
    rows.push([`${lbl(moves[r * 2].from)}→${lbl(moves[r * 2].to)}`, moves[r * 2 + 1] ? `${lbl(moves[r * 2 + 1].from)}→${lbl(moves[r * 2 + 1].to)}` : undefined]);

  return (
    <main className="relative min-h-screen">
      <Nav />
      <div className="mx-auto grid max-w-[1240px] gap-[clamp(28px,4vw,56px)] px-5 pb-24 pt-[104px] md:px-11 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <h1 className="font-display text-[clamp(26px,3vw,36px)] font-bold tracking-[-0.02em]">Cờ tướng</h1>
            <Link href="/choi" className="text-[13px] font-medium text-ink-2 transition-colors hover:text-ink">← Đổi sân</Link>
          </div>
          <div className="mx-auto max-w-[560px]">
            <XiangqiBoard state={state} selected={selected} targets={targets} onPoint={click} disabled={thinking || state.turn !== "r"} />
          </div>
        </div>

        <aside className="self-start lg:sticky lg:top-[96px]">
          <StatusLine
            text={status}
            over={state.winner !== 0}
            stone={state.turn === "r" ? "var(--vermilion)" : "var(--ink)"}
          />
          <LevelTrack levels={LEVELS} level={level} onLevel={setLevel} />
          <PanelActions actions={[
            { label: "Lùi nước", onClick: undo, disabled: moves.length === 0 || thinking },
            { label: "Ván mới", onClick: reset },
          ]} />
          <MoveList rows={rows} empty="Bạn cầm quân đỏ, đi trước." lastIdx={moves.length - 1} />
        </aside>
      </div>
    </main>
  );
}
