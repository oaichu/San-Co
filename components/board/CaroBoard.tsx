"use client";

import { CARO_N, type CaroState } from "@/lib/games/caro/rules";

const HOSHI = [3, 7, 11]; // chấm mốc như bàn gomoku
const PAD = "2.5%";

/** nét X vẽ tay — hai gạch chéo, đầu tròn */
export function MarkX({ faint }: { faint?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="absolute inset-[16%] h-[68%] w-[68%]" aria-hidden="true">
      <path d="M7 7.4 L17 16.6" pathLength="1" strokeDasharray="1" stroke="var(--stone-x)" strokeWidth="2.7" strokeLinecap="round" fill="none"
        style={faint ? undefined : { animation: "draw-in 220ms cubic-bezier(0.4,0,0.3,1) both" }} />
      <path d="M17 7.4 L7 16.6" pathLength="1" strokeDasharray="1" stroke="var(--stone-x)" strokeWidth="2.7" strokeLinecap="round" fill="none"
        style={faint ? undefined : { animation: "draw-in 220ms cubic-bezier(0.4,0,0.3,1) 90ms both" }} />
    </svg>
  );
}

/** nét O — vòng tròn nét tròn */
export function MarkO({ faint }: { faint?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="absolute inset-[16%] h-[68%] w-[68%]" aria-hidden="true">
      <circle cx="12" cy="12" r="5" pathLength="1" strokeDasharray="1" stroke="var(--stone-o)" strokeWidth="2.7" strokeLinecap="round" fill="none"
        style={faint ? undefined : { animation: "draw-in 260ms cubic-bezier(0.4,0,0.3,1) both" }} />
    </svg>
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
  const win = state.winLine;
  const winLine = win.length >= 2
    ? { x1: (win[0] % CARO_N) + 0.5, y1: Math.floor(win[0] / CARO_N) + 0.5, x2: (win[win.length - 1] % CARO_N) + 0.5, y2: Math.floor(win[win.length - 1] / CARO_N) + 0.5 }
    : null;

  return (
    <div
      role="grid"
      aria-label="Bàn cờ caro 15 nhân 15"
      className="relative mx-auto aspect-square w-full max-w-[620px] touch-manipulation select-none rounded-xl border border-edge bg-surface shadow-lift"
    >
      {/* ô ly + hoshi */}
      <svg className="pointer-events-none absolute" style={{ inset: PAD }} viewBox={`0 0 ${CARO_N} ${CARO_N}`} aria-hidden="true">
        <g stroke="var(--line)" strokeWidth="0.018">
          {Array.from({ length: CARO_N - 1 }, (_, i) => (
            <g key={i}>
              <line x1={i + 1} y1="0" x2={i + 1} y2={CARO_N} />
              <line x1="0" y1={i + 1} x2={CARO_N} y2={i + 1} />
            </g>
          ))}
        </g>
        {HOSHI.flatMap((r) => HOSHI.map((c) => (
          <circle key={`${r},${c}`} cx={c + 0.5} cy={r + 0.5} r="0.09" fill="var(--ink-3)" opacity="0.6" />
        )))}
      </svg>

      <div className="absolute grid" style={{ inset: PAD, gridTemplateColumns: `repeat(${CARO_N}, 1fr)` }}>
        {state.board.map((v, i) => (
          <button
            key={i}
            role="gridcell"
            aria-label={`Hàng ${Math.floor(i / CARO_N) + 1} cột ${(i % CARO_N) + 1}${v === 1 ? ", X" : v === 2 ? ", O" : ""}`}
            tabIndex={v === 0 && !disabled ? 0 : -1}
            disabled={disabled || v !== 0 || state.winner !== 0}
            onClick={() => onCell?.(i)}
            className="group relative"
          >
            {v === 0 && state.winner === 0 && (
              <span className="absolute inset-0 opacity-0 transition-opacity duration-100 group-enabled:group-hover:opacity-30">
                {state.turn === 1 ? <MarkX faint /> : <MarkO faint />}
              </span>
            )}
            {v === 1 && <MarkX />}
            {v === 2 && <MarkO />}
            {state.lastMove === i && state.winner === 0 && (
              <span className="pointer-events-none absolute bottom-[10%] right-[10%] h-[16%] w-[16%] rounded-full bg-vermilion opacity-80" aria-hidden="true" />
            )}
          </button>
        ))}
      </div>

      {/* gạch đường thắng */}
      {winLine && (
        <svg className="pointer-events-none absolute" style={{ inset: PAD }} viewBox={`0 0 ${CARO_N} ${CARO_N}`} aria-hidden="true">
          <line
            x1={winLine.x1} y1={winLine.y1} x2={winLine.x2} y2={winLine.y2}
            pathLength="1" strokeDasharray="1"
            stroke="var(--vermilion)" strokeWidth="0.16" strokeLinecap="round" opacity="0.9"
            style={{ animation: "draw-in 400ms cubic-bezier(0.23,1,0.32,1) 150ms both" }}
          />
        </svg>
      )}
    </div>
  );
}
