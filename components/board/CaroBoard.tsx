"use client";

import { CARO_N, type CaroState } from "@/lib/games/caro/rules";

export function Stone({ p, last, win }: { p: 1 | 2; last?: boolean; win?: boolean }) {
  return (
    <span
      className={`absolute inset-[14%] rounded-full ${win ? "animate-[win-pop_600ms_cubic-bezier(0.34,1.4,0.64,1)]" : "animate-[stone-in_300ms_cubic-bezier(0.34,1.4,0.64,1)]"}`}
      style={{
        background: p === 1 ? "var(--stone-x)" : "var(--stone-o)",
        boxShadow: "0 6px 14px -4px rgba(0,0,0,.5)",
        outline: last ? "2px solid var(--vermilion)" : undefined,
        outlineOffset: last ? 2 : undefined,
      }}
    />
  );
}

export function CaroBoard({
  state,
  onCell,
  disabled,
}: {
  state: CaroState;
  onCell?: (idx: number) => void;
  disabled?: boolean;
}) {
  const winSet = new Set(state.winLine);
  return (
    <div
      role="grid"
      aria-label="Bàn cờ caro 15 nhân 15"
      className="mx-auto grid aspect-square w-full max-w-[620px] touch-manipulation select-none rounded-xl border border-edge bg-surface p-[1.5%] shadow-lift"
      style={{ gridTemplateColumns: `repeat(${CARO_N}, 1fr)` }}
    >
      {state.board.map((v, i) => {
        const r = Math.floor(i / CARO_N);
        const c = i % CARO_N;
        return (
          <button
            key={i}
            role="gridcell"
            aria-label={`Hàng ${r + 1} cột ${c + 1}${v === 1 ? ", quân đỏ" : v === 2 ? ", quân đen" : ""}`}
            tabIndex={v === 0 && !disabled ? 0 : -1}
            disabled={disabled || v !== 0 || state.winner !== 0}
            onClick={() => onCell?.(i)}
            className={`relative transition-colors duration-100 enabled:hover:bg-vermilion/10 ${c < CARO_N - 1 ? "border-r border-line" : ""} ${r < CARO_N - 1 ? "border-b border-line" : ""}`}
          >
            {v !== 0 && <Stone p={v as 1 | 2} last={state.lastMove === i} win={winSet.has(i)} />}
          </button>
        );
      })}
    </div>
  );
}
