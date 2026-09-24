"use client";

import type { Chess, Square } from "chess.js";

const GLYPH: Record<string, string> = {
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
};

export function ChessBoard({
  game,
  selected,
  targets,
  onSquare,
  disabled,
  lastMove,
}: {
  game: Chess;
  selected: Square | null;
  targets: Set<string>;
  onSquare?: (sq: Square) => void;
  disabled?: boolean;
  lastMove?: { from: string; to: string } | null;
}) {
  const board = game.board();
  const checkSq = game.inCheck()
    ? board.flat().find((s) => s?.type === "k" && s.color === game.turn())?.square
    : undefined;

  return (
    <div role="grid" aria-label="Bàn cờ vua" className="grid aspect-square w-full select-none overflow-hidden rounded-xl border border-edge shadow-lift" style={{ gridTemplateColumns: "repeat(8, 1fr)" }}>
      {board.flat().map((sq, i) => {
        const file = i % 8;
        const rank = Math.floor(i / 8);
        const light = (file + rank) % 2 === 0;
        const name = sq?.square ?? (`${String.fromCharCode(97 + file)}${8 - rank}` as Square);
        const isSel = selected === name;
        const isTarget = targets.has(name);
        const isLast = lastMove && (lastMove.from === name || lastMove.to === name);
        const isCheck = checkSq === name;
        return (
          <button
            key={name}
            role="gridcell"
            aria-label={`Ô ${name}${sq ? `, ${sq.color === "w" ? "trắng" : "đen"} ${sq.type}` : ""}`}
            disabled={disabled}
            onClick={() => onSquare?.(name)}
            className="relative flex items-center justify-center transition-[background-color] duration-100"
            style={{
              background: isCheck
                ? "var(--vermilion)"
                : isSel || isLast
                  ? "color-mix(in srgb, var(--chess-l) 60%, var(--vermilion))"
                  : light
                    ? "var(--chess-l)"
                    : "var(--chess-d)",
            }}
          >
            {isTarget && !sq && <span className="h-[26%] w-[26%] rounded-full" style={{ background: "color-mix(in srgb, var(--vermilion) 55%, transparent)" }} />}
            {isTarget && sq && <span className="absolute inset-[6%] rounded-full border-[3px]" style={{ borderColor: "color-mix(in srgb, var(--vermilion) 65%, transparent)" }} />}
            {sq && (
              <span
                className="animate-[stone-in_200ms_ease-out] leading-none"
                style={{
                  fontSize: "clamp(20px, 5vw, 44px)",
                  color: sq.color === "w" ? "var(--stone-o)" : "var(--stone-x)",
                  textShadow: sq.color === "w" ? "0 1px 0 rgba(0,0,0,.35)" : "0 1px 0 rgba(255,255,255,.25)",
                }}
              >
                {GLYPH[sq.type]}
              </span>
            )}
            {file === 0 && <span className="absolute left-0.5 top-0.5 text-[9px] font-semibold opacity-60" style={{ color: light ? "var(--chess-d)" : "var(--chess-l)" }}>{8 - rank}</span>}
            {rank === 7 && <span className="absolute bottom-0.5 right-1 text-[9px] font-semibold opacity-60" style={{ color: light ? "var(--chess-d)" : "var(--chess-l)" }}>{String.fromCharCode(97 + file)}</span>}
          </button>
        );
      })}
    </div>
  );
}
