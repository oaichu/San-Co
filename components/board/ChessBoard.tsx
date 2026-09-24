"use client";

import type { CSSProperties } from "react";
import type { Chess, Square } from "chess.js";
import { Piece, type PieceType } from "./ChessPieces";

export function ChessBoard({
  game,
  selected,
  targets,
  onSquare,
  disabled,
  lastMove,
  flipped,
}: {
  game: Chess;
  selected: Square | null;
  targets: Set<string>;
  onSquare?: (sq: Square) => void;
  disabled?: boolean;
  lastMove?: { from: string; to: string } | null;
  /** xoay bàn 180° cho người cầm quân đen */
  flipped?: boolean;
}) {
  const board = game.board();
  const checkSq = game.inCheck()
    ? board.flat().find((s) => s?.type === "k" && s.color === game.turn())?.square
    : undefined;

  return (
    <div
      role="grid"
      aria-label="Bàn cờ vua"
      className="mx-auto grid aspect-square w-full max-w-[620px] touch-manipulation select-none overflow-hidden rounded-xl border border-edge shadow-lift"
      style={{ gridTemplateColumns: "repeat(8, 1fr)" }}
    >
      {board.flat().map((_, disp) => {
        const sqIdx = flipped ? 63 - disp : disp;
        const sq = board.flat()[sqIdx];
        const file = sqIdx % 8;
        const rank = Math.floor(sqIdx / 8);
        const dispFile = disp % 8;
        const dispRank = Math.floor(disp / 8);
        const light = (file + rank) % 2 === 0;
        const name = sq?.square ?? (`${String.fromCharCode(97 + file)}${8 - rank}` as Square);
        const isSel = selected === name;
        const isTarget = targets.has(name);
        const isLast = lastMove && (lastMove.from === name || lastMove.to === name);
        const isCheck = checkSq === name;
        const own = sq?.color === "w";
        // quân vừa đi: trượt từ ô nguồn
        const slid =
          sq && lastMove && lastMove.to === name
            ? (() => {
                const ff = lastMove.from.charCodeAt(0) - 97;
                const fr = 8 - Number(lastMove.from[1]);
                const sgn = flipped ? -1 : 1;
                return { "--dx": `${(ff - file) * sgn * 100}%`, "--dy": `${(fr - rank) * sgn * 100}%`, animation: "piece-slide 220ms cubic-bezier(0.23,1,0.32,1)" } as CSSProperties;
              })()
            : undefined;
        return (
          <button
            key={name}
            role="gridcell"
            aria-label={`Ô ${name}${sq ? `, ${sq.color === "w" ? "trắng" : "đen"} ${sq.type}` : ""}`}
            disabled={disabled}
            onClick={() => onSquare?.(name)}
            className="group relative flex items-center justify-center transition-[background-color] duration-100"
            style={{
              cursor: !disabled && (own || isTarget) ? "pointer" : "default",
              background: isCheck
                ? "color-mix(in srgb, var(--vermilion) 82%, var(--chess-d))"
                : isSel
                  ? "color-mix(in srgb, var(--chess-l) 45%, var(--vermilion))"
                  : isLast
                    ? "color-mix(in srgb, var(--chess-l) 68%, var(--vermilion))"
                    : light
                      ? "var(--chess-l)"
                      : "var(--chess-d)",
            }}
          >
            {/* chấm nước đi hợp lệ — kiểu quốc tế: chấm nhỏ giữa ô / vòng ăn quân */}
            {isTarget && !sq && (
              <span
                className="h-[30%] w-[30%] rounded-full"
                style={{ background: light ? "rgba(60,42,20,.34)" : "rgba(20,14,8,.34)" }}
              />
            )}
            {isTarget && sq && (
              <span
                className="absolute inset-[4%] rounded-full"
                style={{ border: "4px solid rgba(60,42,20,.42)" }}
              />
            )}
            {sq && (
              <span
                className={`relative h-[86%] w-[86%] transition-transform duration-150 ease-out ${
                  slid ? "" : "animate-[stone-in_180ms_ease-out]"
                } ${own && !disabled ? "group-enabled:group-hover:-translate-y-[4%]" : ""}`}
                style={{ filter: "drop-shadow(0 3px 3px rgba(20,12,4,.38))", ...slid }}
              >
                <Piece t={sq.type as PieceType} c={sq.color} />
              </span>
            )}
            {/* tọa độ: số hàng cột ngoài cùng trái, chữ cột hàng dưới cùng */}
            {dispFile === 0 && (
              <span
                className="absolute left-[4%] top-[3%] font-semibold leading-none"
                style={{ fontSize: "clamp(8px, 1.4vw, 11px)", color: light ? "var(--chess-d)" : "var(--chess-l)" }}
              >
                {8 - rank}
              </span>
            )}
            {dispRank === 7 && (
              <span
                className="absolute bottom-[3%] right-[5%] font-semibold leading-none"
                style={{ fontSize: "clamp(8px, 1.4vw, 11px)", color: light ? "var(--chess-d)" : "var(--chess-l)" }}
              >
                {String.fromCharCode(97 + file)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
