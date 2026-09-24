"use client";

import { GO_N, type GoState } from "@/lib/games/go/rules";

const STAR = [3, 9, 15];
const PAD = "4.5%"; // lề gỗ quanh lưới

// quân cầu: highlight lệch trên-trái như quân thật
const STONE_B = "radial-gradient(circle at 33% 27%, #5a5044 0%, #2e2619 42%, #120d07 78%)";
const STONE_W = "radial-gradient(circle at 33% 27%, #fffdf4 0%, #f0e7d0 55%, #cbbc9c 100%)";

export function GoBoard({
  state,
  onPoint,
  disabled,
}: {
  state: GoState;
  onPoint?: (i: number) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="grid"
      aria-label="Bàn cờ vây 19 nhân 19"
      className="relative mx-auto aspect-square w-full max-w-[620px] touch-manipulation select-none overflow-hidden rounded-xl border border-edge shadow-lift"
      style={{ background: "linear-gradient(155deg, var(--wood-1), var(--wood-2))" }}
    >
      {/* vân gỗ rất nhẹ + viền lõm */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{ background: "repeating-linear-gradient(93deg, transparent 0 26px, rgba(80,50,16,.35) 26px 27px)" }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 rounded-xl" style={{ boxShadow: "inset 0 2px 10px rgba(60,36,10,.35), inset 0 -1px 0 rgba(255,240,210,.25)" }} aria-hidden="true" />

      {/* lưới kẻ + hoshi — SVG để nét đều nhau */}
      <svg className="absolute" style={{ inset: PAD }} viewBox="0 0 19 19" aria-hidden="true">
        <g stroke="var(--wood-line)" strokeWidth="0.028">
          {Array.from({ length: GO_N }, (_, i) => (
            <g key={i}>
              <line x1="0.5" y1={i + 0.5} x2="18.5" y2={i + 0.5} />
              <line x1={i + 0.5} y1="0.5" x2={i + 0.5} y2="18.5" />
            </g>
          ))}
        </g>
        <rect x="0.5" y="0.5" width="18" height="18" fill="none" stroke="var(--wood-line)" strokeWidth="0.06" />
        {STAR.flatMap((r) => STAR.map((c) => (
          <circle key={`${r},${c}`} cx={c + 0.5} cy={r + 0.5} r="0.1" fill="var(--wood-line)" />
        )))}
      </svg>

      <div className="absolute grid" style={{ inset: PAD, gridTemplateColumns: `repeat(${GO_N}, 1fr)` }}>
        {Array.from({ length: GO_N * GO_N }, (_, i) => {
          const r = Math.floor(i / GO_N);
          const c = i % GO_N;
          const v = state.board[i];
          return (
            <button
              key={i}
              role="gridcell"
              aria-label={`Điểm ${r + 1},${c + 1}${v === 1 ? ", quân đen" : v === 2 ? ", quân trắng" : ""}`}
              disabled={disabled || v !== 0 || state.done}
              onClick={() => onPoint?.(i)}
              className="group relative"
            >
              {v === 0 && !state.done && (
                <span
                  className="absolute inset-[7%] rounded-full opacity-0 transition-opacity duration-100 group-enabled:group-hover:opacity-40"
                  style={{ background: state.turn === 1 ? STONE_B : STONE_W, boxShadow: "0 3px 8px -2px rgba(0,0,0,.45)" }}
                />
              )}
              {v !== 0 && (
                <span
                  className="absolute inset-[6%] rounded-full animate-[stone-in_180ms_ease-out]"
                  style={{
                    background: v === 1 ? STONE_B : STONE_W,
                    boxShadow: "0 4px 7px -2px rgba(20,10,0,.55), inset 0 -1px 2px rgba(0,0,0,.18)",
                  }}
                >
                  {state.lastMove === i && (
                    <span
                      className="absolute left-1/2 top-1/2 h-[30%] w-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                      style={{ background: v === 1 ? "rgba(236,227,208,.85)" : "rgba(30,22,12,.7)" }}
                    />
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
