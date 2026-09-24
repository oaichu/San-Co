"use client";

import { GO_N, type GoState } from "@/lib/games/go/rules";

const STAR = [3, 9, 15];

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
    <div role="grid" aria-label="Bàn cờ vây 19 nhân 19" className="mx-auto aspect-square w-full max-w-[620px] touch-manipulation select-none rounded-xl border border-edge bg-surface p-[3%] shadow-lift">
      <div className="grid h-full w-full" style={{ gridTemplateColumns: `repeat(${GO_N}, 1fr)` }}>
        {Array.from({ length: GO_N * GO_N }, (_, i) => {
          const r = Math.floor(i / GO_N);
          const c = i % GO_N;
          const v = state.board[i];
          const isStar = STAR.includes(r) && STAR.includes(c);
          return (
            <button
              key={i}
              role="gridcell"
              aria-label={`Điểm ${r + 1},${c + 1}${v === 1 ? ", quân đen" : v === 2 ? ", quân trắng" : ""}`}
              disabled={disabled || v !== 0 || state.done}
              onClick={() => onPoint?.(i)}
              className="group relative"
            >
              <span className="pointer-events-none absolute inset-0" aria-hidden="true">
                {c < GO_N - 1 && <span className="absolute left-1/2 right-[-50%] top-1/2 h-px bg-line-2" />}
                {r < GO_N - 1 && <span className="absolute bottom-[-50%] left-1/2 top-1/2 w-px bg-line-2" />}
                {isStar && v === 0 && <span className="absolute left-1/2 top-1/2 h-[14%] w-[14%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-line-2" />}
              </span>
              {v === 0 && !state.done && (
                <span className="absolute inset-[12%] rounded-full opacity-0 transition-opacity duration-100 group-enabled:group-hover:opacity-100" style={{ background: "color-mix(in srgb, var(--vermilion) 25%, transparent)" }} />
              )}
              {v !== 0 && (
                <span
                  className={`absolute inset-[8%] rounded-full animate-[stone-in_200ms_ease-out] ${state.lastMove === i ? "ring-2 ring-vermilion" : ""}`}
                  style={{
                    background: v === 1 ? "var(--go-b)" : "var(--go-w)",
                    boxShadow: "0 3px 8px -2px rgba(0,0,0,.45)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
