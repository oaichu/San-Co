"use client";

import { useState } from "react";
import { Nav } from "@/components/Nav";
import { PUZZLES } from "@/lib/content/puzzles";
import { TryBoard } from "@/components/learn/LessonBoard";
import type { GameId } from "@/lib/games/registry";

const GAME_LABEL: Record<GameId, string> = { caro: "Cờ caro", chess: "Cờ vua", xiangqi: "Cờ tướng", go: "Cờ vây" };
const STARS = ["", "★", "★★", "★★★"];

export default function PuzzlePage() {
  const [game, setGame] = useState<GameId>("chess");
  const [openId, setOpenId] = useState<string | null>(null);
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const list = PUZZLES.filter((p) => p.game === game);
  const open = list.find((p) => p.id === openId);

  const markSolved = (id: string) => {
    setSolved((s) => new Set(s).add(id));
    fetch("/api/puzzle/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ puzzleId: id, solved: true }),
    }).catch(() => {});
  };

  return (
    <main className="relative min-h-screen">
      <Nav />
      <div className="mx-auto max-w-[900px] px-5 pb-24 pt-[104px] md:px-11">
        <h1 className="font-display text-[clamp(30px,4vw,48px)] font-bold tracking-[-0.025em]">Thế cờ.</h1>
        <p className="mt-3 max-w-[52ch] text-[15px] leading-[1.65] text-ink-2">Mỗi thế có một nước mấu chốt. Tìm ra nó trên bàn cờ.</p>

        <div className="mt-8 flex gap-1.5 border-b border-line pb-px">
          {(Object.keys(GAME_LABEL) as GameId[]).map((g) => (
            <button key={g} onClick={() => { setGame(g); setOpenId(null); }} className={`rounded-t-lg px-4 py-2.5 text-[13.5px] font-semibold transition-colors duration-150 ${g === game ? "bg-surface text-ink shadow-[inset_0_-2px_0_var(--vermilion)]" : "text-ink-2 hover:text-ink"}`}>
              {GAME_LABEL[g]}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
          <ul className="divide-y divide-line border-y border-line self-start">
            {list.map((p) => (
              <li key={p.id}>
                <button onClick={() => setOpenId(p.id)} className={`flex w-full items-center justify-between gap-3 py-4 text-left transition-colors duration-150 hover:bg-surface/60 ${openId === p.id ? "text-vermilion" : ""}`}>
                  <span>
                    <span className="block text-[15px] font-semibold">{p.title} {solved.has(p.id) && <span className="text-[11px] uppercase tracking-[0.06em] text-vermilion">✓</span>}</span>
                    <span className="text-[12px] text-ink-3">{GAME_LABEL[p.game]}</span>
                  </span>
                  <span className="text-[12px] tracking-[0.1em] text-vermilion" aria-label={`Độ khó ${p.difficulty}`}>{STARS[p.difficulty]}</span>
                </button>
              </li>
            ))}
          </ul>
          <div>
            {open ? (
              <TryBoard
                key={open.id}
                game={open.game}
                setup={open.setup}
                solution={open.solution[0]}
                hint={open.hint}
                prompt={open.title}
                onSolved={() => markSolved(open.id)}
              />
            ) : (
              <p className="rounded-xl border border-dashed border-line-2 p-6 text-[13.5px] text-ink-3">Chọn một thế cờ bên trái để bắt đầu.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
