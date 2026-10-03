"use client";

import { useEffect, useMemo, useState } from "react";
import { Nav } from "@/components/Nav";
import { PUZZLES } from "@/lib/content/puzzles";
import { PuzzleBoard } from "@/components/learn/LessonBoard";
import type { GameId } from "@/lib/games/registry";

const GAME_LABEL: Record<GameId, string> = { caro: "Cờ caro", chess: "Cờ vua", xiangqi: "Cờ tướng", go: "Cờ vây" };
const STARS = ["", "★", "★★", "★★★"];
const LS_KEY = "san-co-puzzle-done";

const loadLocal = (): Set<string> => {
  if (typeof window === "undefined") return new Set();
  try { return new Set(JSON.parse(localStorage.getItem(LS_KEY) ?? "[]") as string[]); } catch { return new Set(); }
};

export default function PuzzlePage() {
  const [game, setGame] = useState<GameId>("chess");
  const [openId, setOpenId] = useState<string | null>(null);
  const [onlyUnsolved, setOnlyUnsolved] = useState(false);
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const [justSolvedId, setJustSolvedId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.resolve().then(() => {
      if (alive) setSolved(loadLocal());
      return fetch("/api/progress/puzzle").then((r) => r.ok ? r.json() : null).then((d) => {
        if (alive && d?.puzzles) setSolved((s) => new Set([...s, ...(d.puzzles as string[])]));
      });
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const list = useMemo(() => {
    const all = PUZZLES.filter((p) => p.game === game);
    return onlyUnsolved ? all.filter((p) => !solved.has(p.id)) : all;
  }, [game, onlyUnsolved, solved]);
  const open = list.find((p) => p.id === openId) ?? PUZZLES.find((p) => p.id === openId);
  const gameList = PUZZLES.filter((p) => p.game === game);
  const solvedCount = gameList.filter((p) => solved.has(p.id)).length;

  const markSolved = (id: string) => {
    setSolved((s) => new Set(s).add(id));
    try {
      const local = loadLocal();
      local.add(id);
      localStorage.setItem(LS_KEY, JSON.stringify([...local]));
    } catch { /* localStorage có thể bị tắt */ }
    fetch("/api/puzzle/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ puzzleId: id, solved: true }),
    }).catch(() => {});
  };

  /** thế chưa giải kế tiếp trong game hiện tại (tính từ thế đang mở, vòng lại từ đầu) */
  const nextUnsolved = () => {
    const start = open ? gameList.findIndex((p) => p.id === open.id) + 1 : 0;
    for (let i = 0; i < gameList.length; i++) {
      const p = gameList[(start + i) % gameList.length];
      if (!solved.has(p.id)) return p;
    }
    return null;
  };

  const goNext = () => {
    const n = nextUnsolved();
    setJustSolvedId(null);
    setOpenId(n ? n.id : null);
    if (!n && gameList.every((p) => solved.has(p.id))) setOpenId(gameList[0]?.id ?? null);
  };

  return (
    <main className="relative min-h-screen">
      <Nav />
      <div className="mx-auto max-w-[900px] px-5 pb-24 pt-[104px] md:px-11">
        <h1 className="font-display text-[clamp(30px,4vw,48px)] font-bold tracking-[-0.025em]">Thế cờ.</h1>
        <p className="mt-3 max-w-[52ch] text-[15px] leading-[1.65] text-ink-2">
          Mỗi thế là một chuỗi nước: đi đúng nước mấu chốt, đối thủ sẽ phản hồi — chơi tới khi kết liễu.
          Giải xong xem lời giải thích, thế khó hơn dần theo số sao.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-1.5 border-b border-line pb-px">
          {(Object.keys(GAME_LABEL) as GameId[]).map((g) => {
            const total = PUZZLES.filter((p) => p.game === g).length;
            const done = PUZZLES.filter((p) => p.game === g && solved.has(p.id)).length;
            return (
              <button key={g} onClick={() => { setGame(g); setOpenId(null); setJustSolvedId(null); }} className={`relative rounded-t-lg px-4 py-2.5 text-[13.5px] font-semibold transition-colors duration-150 ${g === game ? "bg-surface text-ink shadow-[inset_0_-2px_0_var(--vermilion)]" : "text-ink-2 hover:text-ink"}`}>
                {GAME_LABEL[g]}
                <span className="tabular ml-1.5 text-[11px] font-medium text-ink-3">{done}/{total}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center gap-3 text-[13px]">
          <span className="text-ink-2"><b className="tabular text-ink">{solvedCount}</b>/{gameList.length} đã giải</span>
          <span className="h-1.5 flex-1 max-w-[220px] overflow-hidden rounded-full bg-surface-2">
            <span className="block h-full rounded-full bg-vermilion transition-all duration-300" style={{ width: `${gameList.length ? (solvedCount / gameList.length) * 100 : 0}%` }} />
          </span>
          <button
            onClick={() => { setOnlyUnsolved((v) => !v); }}
            className={`ml-auto rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-all duration-150 active:scale-[0.97] ${onlyUnsolved ? "border-vermilion text-vermilion" : "border-line-2 text-ink-2 hover:border-ink-2 hover:text-ink"}`}
          >
            {onlyUnsolved ? "Đang ẩn thế đã giải" : "Ẩn thế đã giải"}
          </button>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1fr]">
          <ul className="divide-y divide-line border-y border-line self-start">
            {list.map((p) => (
              <li key={p.id}>
                <button onClick={() => { setOpenId(p.id); setJustSolvedId(null); }} className={`flex w-full items-center justify-between gap-3 py-4 text-left transition-colors duration-150 hover:bg-surface/60 ${openId === p.id ? "text-vermilion" : ""}`}>
                  <span>
                    <span className="block text-[15px] font-semibold">{p.title} {solved.has(p.id) && <span className="text-[11px] uppercase tracking-[0.06em] text-vermilion">✓</span>}</span>
                    <span className="text-[12px] text-ink-3">{p.theme ?? GAME_LABEL[p.game]}{p.explain ? " · có giải thích" : ""}</span>
                  </span>
                  <span className="text-[12px] tracking-[0.1em] text-vermilion" aria-label={`Độ khó ${p.difficulty}`}>{STARS[p.difficulty]}</span>
                </button>
              </li>
            ))}
            {list.length === 0 && (
              <li className="py-6 text-[13.5px] text-ink-3">Bạn đã giải hết các thế này — tắt bộ lọc để ôn lại.</li>
            )}
          </ul>
          <div>
            {open ? (
              <>
                <PuzzleBoard
                  key={open.id}
                  game={open.game}
                  setup={open.setup}
                  solution={open.solution}
                  hint={open.hint}
                  explain={open.explain}
                  prompt={open.title}
                  meta={[GAME_LABEL[open.game], open.theme, STARS[open.difficulty] && `Độ khó ${STARS[open.difficulty]}`].filter(Boolean).join(" · ")}
                  onSolved={() => { markSolved(open.id); setJustSolvedId(open.id); }}
                />
                {justSolvedId === open.id && open.explain && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={goNext}
                      className="rounded-lg bg-vermilion px-4 py-2 text-[13px] font-semibold text-accent-ink transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.97]"
                    >
                      {nextUnsolved() ? `Thế tiếp theo: ${nextUnsolved()!.title} →` : "Ôn lại thế đầu tiên →"}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="rounded-xl border border-dashed border-line-2 p-6 text-[13.5px] text-ink-3">Chọn một thế cờ bên trái để bắt đầu.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
