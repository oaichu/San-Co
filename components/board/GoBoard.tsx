"use client";

import { goSize, type GoState } from "@/lib/games/go/rules";

const PAD = "4.5%"; // lề gỗ quanh lưới

// quân cầu: highlight lệch trên-trái như quân thật
const STONE_B = "radial-gradient(circle at 33% 27%, #5a5044 0%, #2e2619 42%, #120d07 78%)";
const STONE_W = "radial-gradient(circle at 33% 27%, #fffdf4 0%, #f0e7d0 55%, #cbbc9c 100%)";

/** điểm sao (hoshi) theo kích thước bàn */
function starPoints(n: number): [number, number][] {
  if (n === 9) return [[2, 2], [2, 6], [6, 2], [6, 6], [4, 4]];
  if (n === 13) return [3, 6, 9].flatMap((r) => [3, 6, 9].map((c): [number, number] => [r, c]));
  return [3, 9, 15].flatMap((r) => [3, 9, 15].map((c): [number, number] => [r, c]));
}

/** chữ cột cờ vây: A–T bỏ I */
const goCol = (c: number) => String.fromCharCode(65 + c + (c >= 8 ? 1 : 0));

export function GoBoard({
  state,
  onPoint,
  disabled,
  hint,
  ghost,
  coords = false,
}: {
  state: GoState;
  onPoint?: (i: number) => void;
  disabled?: boolean;
  /** điểm gợi ý: quân mờ + vòng son nhấp */
  hint?: number | null;
  /** điểm preview chạm-hai-lần */
  ghost?: number | null;
  /** tọa độ mép bàn */
  coords?: boolean;
}) {
  const n = goSize(state.board);
  const stars = starPoints(n);
  return (
    <div
      role="grid"
      aria-label={`Bàn cờ vây ${n} nhân ${n}`}
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
      <svg className="absolute" style={{ inset: PAD }} viewBox={`0 0 ${n} ${n}`} aria-hidden="true">
        <g stroke="var(--wood-line)" strokeWidth="1">
          {Array.from({ length: n }, (_, i) => (
            <g key={i}>
              <line x1="0.5" y1={i + 0.5} x2={n - 0.5} y2={i + 0.5} vectorEffect="non-scaling-stroke" />
              <line x1={i + 0.5} y1="0.5" x2={i + 0.5} y2={n - 0.5} vectorEffect="non-scaling-stroke" />
            </g>
          ))}
        </g>
        <rect x="0.5" y="0.5" width={n - 1} height={n - 1} fill="none" stroke="var(--wood-line)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {stars.map(([r, c]) => (
          <circle key={`${r},${c}`} cx={c + 0.5} cy={r + 0.5} r={0.09} fill="var(--wood-line)" />
        ))}
      </svg>

      <div className="absolute grid" style={{ inset: PAD, gridTemplateColumns: `repeat(${n}, 1fr)` }}>
        {Array.from({ length: n * n }, (_, i) => {
          const r = Math.floor(i / n);
          const c = i % n;
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
              {v === 0 && (ghost === i || hint === i) && (
                <>
                  <span
                    className="absolute inset-[7%] rounded-full opacity-60"
                    style={{ background: state.turn === 1 ? STONE_B : STONE_W, boxShadow: "0 3px 8px -2px rgba(0,0,0,.45)" }}
                  />
                  <span
                    className={`pointer-events-none absolute inset-[2%] rounded-full border-2 border-vermilion ${hint === i ? "hint-ring" : ""}`}
                    aria-hidden="true"
                  />
                </>
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

      {/* tọa độ mép: số n→1 bên trái, chữ A–T (bỏ I) dưới */}
      {coords &&
        Array.from({ length: n }, (_, r) => (
          <span
            key={`r${r}`}
            className="tabular pointer-events-none absolute left-[1.1%] -translate-y-1/2 font-medium text-ink-3"
            style={{ top: `${4.5 + ((r + 0.5) * 91) / n}%`, fontSize: "clamp(6px, 1.1vw, 9px)" }}
            aria-hidden="true"
          >
            {n - r}
          </span>
        ))}
      {coords &&
        Array.from({ length: n }, (_, c) => (
          <span
            key={`c${c}`}
            className="pointer-events-none absolute bottom-[1.1%] -translate-x-1/2 font-medium text-ink-3"
            style={{ left: `${4.5 + ((c + 0.5) * 91) / n}%`, fontSize: "clamp(6px, 1.1vw, 9px)" }}
            aria-hidden="true"
          >
            {goCol(c)}
          </span>
        ))}
    </div>
  );
}
