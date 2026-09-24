"use client";

import Link from "next/link";
import { Nav } from "@/components/Nav";
import { ChessBoard } from "@/components/board/ChessBoard";
import { useChessGame, LEVELS } from "@/lib/useChessEngine";

export default function ChessPage() {
  const { game, click, undo, reset, level, setLevel, thinking, selected, targets, sans, lastMove, status, moves } = useChessGame();

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
          <div className="border-b border-line pb-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">Trạng thái</div>
            <div className={`mt-1.5 font-display text-[20px] font-semibold ${game.isGameOver() ? "text-vermilion" : ""}`} aria-live="polite">{status}</div>
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
            <button onClick={undo} disabled={moves === 0 || thinking} className="flex-1 rounded-lg border border-line-2 py-2.5 text-[13.5px] font-semibold transition-all duration-150 enabled:hover:-translate-y-0.5 enabled:active:scale-[0.97] disabled:opacity-40">Lùi nước</button>
            <button onClick={reset} className="flex-1 rounded-lg border border-line-2 py-2.5 text-[13.5px] font-semibold transition-all duration-150 enabled:hover:-translate-y-0.5 enabled:active:scale-[0.97]">Ván mới</button>
          </div>
          <div className="pt-5">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">Nước đi</div>
            {sans.length === 0 ? (
              <p className="text-[13px] text-ink-3">Bạn cầm quân trắng, đi trước.</p>
            ) : (
              <ol className="tabular max-h-[220px] overflow-y-auto text-[13px] text-ink-2">
                {Array.from({ length: Math.ceil(sans.length / 2) }, (_, r) => (
                  <li key={r} className="flex gap-3 py-0.5">
                    <span className="w-6 text-ink-3">{r + 1}.</span>
                    <span className="w-12">{sans[r * 2]}</span>
                    <span className="w-12">{sans[r * 2 + 1] ?? ""}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
