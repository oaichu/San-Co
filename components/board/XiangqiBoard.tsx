"use client";

import { XQ_W, XQ_H, colorOf, type XqState } from "@/lib/games/xiangqi/rules";

const CHAR_R: Record<string, string> = { r: "車", h: "馬", e: "相", a: "仕", g: "帥", c: "炮", p: "兵" };
const CHAR_B: Record<string, string> = { r: "車", h: "馬", e: "象", a: "士", g: "將", c: "砲", p: "卒" };

export function XiangqiBoard({
  state,
  selected,
  targets,
  onPoint,
  disabled,
  flipped,
}: {
  state: XqState;
  selected: number | null;
  targets: Set<number>;
  onPoint?: (i: number) => void;
  disabled?: boolean;
  /** xoay bàn 180° cho bên đen khi chơi online */
  flipped?: boolean;
}) {
  return (
    <div
      role="grid"
      aria-label="Bàn cờ tướng"
      className="relative mx-auto aspect-[9/10] w-full max-w-[560px] touch-manipulation select-none rounded-xl border border-edge bg-surface p-[5.5%] shadow-lift"
    >
      {/* cung tướng: đường chéo 2 cung (điểm (c,r) → x=c, y=r trong viewBox 8×9) */}
      <svg className="pointer-events-none absolute inset-[5.5%]" aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 8 9" style={{ width: "89%", height: "89%" }}>
        <g stroke="var(--line-2)" strokeWidth="1" vectorEffect="non-scaling-stroke">
          <line x1="3" y1="0" x2="5" y2="2" /><line x1="5" y1="0" x2="3" y2="2" />
          <line x1="3" y1="7" x2="5" y2="9" /><line x1="5" y1="7" x2="3" y2="9" />
        </g>
      </svg>
      <div className="grid h-full w-full" style={{ gridTemplateColumns: `repeat(${XQ_W}, 1fr)`, gridTemplateRows: `repeat(${XQ_H}, 1fr)` }}>
        {Array.from({ length: XQ_W * XQ_H }, (_, disp) => {
          const i = flipped ? XQ_W * XQ_H - 1 - disp : disp;
          const r = Math.floor(i / XQ_W);
          const c = i % XQ_W;
          // khi lật bàn: hàng ngang nối về cột trái, hàng dọc nối lên trên, sông nằm ở r5
          const hasRight = flipped ? c > 0 : c < XQ_W - 1;
          const hasDown = flipped ? r > 0 : r < XQ_H - 1;
          const riverEdge = flipped ? r === 5 : r === 4;
          const p = state.board[i];
          const col = p ? colorOf(p) : null;
          const isSel = selected === i;
          const isTarget = targets.has(i);
          const isLast = state.lastMove && (state.lastMove.from === i || state.lastMove.to === i);
          return (
            <button
              key={i}
              role="gridcell"
              aria-label={`Điểm ${r + 1},${c + 1}${p ? ` ${col === "r" ? "đỏ" : "đen"} ${p.toLowerCase()}` : ""}`}
              disabled={disabled || state.winner !== 0}
              onClick={() => onPoint?.(i)}
              className="relative"
            >
              {/* vạch kẻ */}
              <span className="pointer-events-none absolute inset-0" aria-hidden="true">
                {hasRight && <span className={`absolute top-1/2 h-px bg-line-2 ${flipped ? "right-1/2 left-[-50%]" : "left-1/2 right-[-50%]"}`} />}
                {hasDown && !(riverEdge && c > 0 && c < XQ_W - 1) && (
                  <span className={`absolute left-1/2 w-px bg-line-2 ${flipped ? "top-[-50%] bottom-1/2" : "bottom-[-50%] top-1/2"}`} />
                )}
              </span>
              {isTarget && !p && <span className="absolute left-1/2 top-1/2 h-[28%] w-[28%] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "color-mix(in srgb, var(--vermilion) 55%, transparent)" }} />}
              {p && (
                <span
                  className={`absolute inset-[4%] flex items-center justify-center rounded-full border text-[clamp(14px,3.4vw,26px)] font-semibold leading-none animate-[stone-in_200ms_ease-out] ${isSel || isLast ? "ring-2 ring-vermilion ring-offset-1 ring-offset-surface" : ""}`}
                  style={{
                    background: "var(--surface-2)",
                    borderColor: col === "r" ? "var(--vermilion)" : "var(--ink-3)",
                    color: col === "r" ? "var(--vermilion)" : "var(--ink)",
                    boxShadow: "0 3px 8px -2px rgba(0,0,0,.4)",
                  }}
                >
                  {col === "r" ? CHAR_R[p.toLowerCase()] : CHAR_B[p.toLowerCase()]}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {/* chữ sông */}
      <div className="pointer-events-none absolute left-[8%] right-[8%] top-1/2 flex -translate-y-1/2 items-center justify-between font-display text-[clamp(13px,2.4vw,20px)] font-semibold tracking-[0.3em] text-ink-3" aria-hidden="true">
        <span>楚 河</span>
        <span>漢 界</span>
      </div>
    </div>
  );
}
