"use client";

import Link from "next/link";
import { Nav } from "@/components/Nav";
import { ChessBoard } from "@/components/board/ChessBoard";
import { StatusLine, LevelTrack, PanelActions, MoveList } from "@/components/GamePanel";
import { useChessGame, LEVELS } from "@/lib/useChessEngine";

export default function ChessPage() {
  const { game, click, undo, reset, level, setLevel, thinking, selected, targets, sans, lastMove, status, moves } = useChessGame();

  const rows: [string, string?][] = [];
  for (let r = 0; r < Math.ceil(sans.length / 2); r++) rows.push([sans[r * 2], sans[r * 2 + 1]]);

  return (
    <main className="relative min-h-screen">
      <Nav />
      <div className="mx-auto grid max-w-[1240px] gap-[clamp(28px,4vw,56px)] px-5 pb-24 pt-[104px] md:px-11 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <h1 className="font-display text-[clamp(26px,3vw,36px)] font-bold tracking-[-0.02em]">Cờ vua</h1>
            <Link href="/choi" className="text-[13px] font-medium text-ink-2 transition-colors hover:text-ink">← Đổi sân</Link>
          </div>
          <ChessBoard game={game} selected={selected} targets={targets} onSquare={click} disabled={thinking || game.turn() !== "w"} lastMove={lastMove} />
        </div>

        <aside className="self-start lg:sticky lg:top-[96px]">
          <StatusLine
            text={status}
            over={game.isGameOver()}
            stone={game.turn() === "w" ? "#f6efdd" : "#221a11"}
          />
          <LevelTrack levels={LEVELS} level={level} onLevel={setLevel} />
          <PanelActions actions={[
            { label: "Lùi nước", onClick: undo, disabled: moves === 0 || thinking },
            { label: "Ván mới", onClick: reset },
          ]} />
          <MoveList rows={rows} empty="Bạn cầm quân trắng, đi trước." lastIdx={sans.length - 1} />
        </aside>
      </div>
    </main>
  );
}
