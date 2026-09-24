"use client";

import { XQ_W, XQ_H, colorOf, type XqState } from "@/lib/games/xiangqi/rules";

const CHAR_R: Record<string, string> = { r: "車", h: "馬", e: "相", a: "仕", g: "帥", c: "炮", p: "兵" };
const CHAR_B: Record<string, string> = { r: "車", h: "馬", e: "象", a: "士", g: "將", c: "砲", p: "卒" };

const PAD = "6.5%";
const XQ_CREAM = "radial-gradient(circle at 36% 28%, #faf0d6 0%, #ecd9ac 62%, #d8bd8a 100%)";

// điểm có dấu mốc: pháo + tốt
const MARKS: [number, number][] = [
  [1, 2], [7, 2], [1, 7], [7, 7],
  [0, 3], [2, 3], [4, 3], [6, 3], [8, 3],
  [0, 6], [2, 6], [4, 6], [6, 6], [8, 6],
];

/** hai nét móc "[" mở về phía điểm, ở cạnh s (trái/phải) — tọa độ tâm điểm (px,py) trong viewBox 9×10 */
function markerPaths(px: number, py: number, s: -1 | 1) {
  const x0 = px + s * 0.3;
  const h = -s * 0.14;
  return `M ${x0} ${py - 0.18} v 0.1 M ${x0} ${py - 0.18} h ${h} M ${x0} ${py + 0.18} v -0.1 M ${x0} ${py + 0.18} h ${h}`;
}

function GridSvg({ flipped }: { flipped?: boolean }) {
  // viewBox 9×10, tâm điểm (c+0.5, r+0.5); flipped xoay qua transform scale(-1)
  const t = flipped ? "scale(-1,-1) translate(-9,-10)" : undefined;
  return (
    <svg className="pointer-events-none absolute" style={{ inset: PAD }} viewBox="0 0 9 10" preserveAspectRatio="none" aria-hidden="true">
      <g transform={t} stroke="var(--wood-line)" strokeWidth="0.035" fill="none">
        {/* ngang */}
        {Array.from({ length: XQ_H }, (_, r) => (
          <line key={`h${r}`} x1="0.5" y1={r + 0.5} x2="8.5" y2={r + 0.5} />
        ))}
        {/* dọc: biên ngoài chạy suốt, trong đứt qua sông */}
        <line x1="0.5" y1="0.5" x2="0.5" y2="9.5" />
        <line x1="8.5" y1="0.5" x2="8.5" y2="9.5" />
        {Array.from({ length: 7 }, (_, c) => (
          <g key={`v${c}`}>
            <line x1={c + 1.5} y1="0.5" x2={c + 1.5} y2="4.5" />
            <line x1={c + 1.5} y1="5.5" x2={c + 1.5} y2="9.5" />
          </g>
        ))}
        {/* khung ngoài đậm hơn */}
        <rect x="0.5" y="0.5" width="8" height="9" strokeWidth="0.07" />
        {/* cung tướng */}
        <line x1="3.5" y1="0.5" x2="5.5" y2="2.5" /><line x1="5.5" y1="0.5" x2="3.5" y2="2.5" />
        <line x1="3.5" y1="7.5" x2="5.5" y2="9.5" /><line x1="5.5" y1="7.5" x2="3.5" y2="9.5" />
        {/* dấu mốc pháo/tốt */}
        {MARKS.map(([c, r]) => (
          <path
            key={`${c},${r}`}
            strokeWidth="0.03"
            d={[
              c < XQ_W - 1 ? markerPaths(c + 0.5, r + 0.5, -1) : "", // mốc bên phải điểm
              c > 0 ? markerPaths(c + 0.5, r + 0.5, 1) : "",          // mốc bên trái điểm
            ].join(" ")}
          />
        ))}
      </g>
    </svg>
  );
}

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
      className="relative mx-auto aspect-[9/10] w-full max-w-[560px] touch-manipulation select-none overflow-hidden rounded-xl border border-edge shadow-lift"
      style={{ background: "linear-gradient(160deg, var(--wood-1), var(--wood-2))" }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-xl" style={{ boxShadow: "inset 0 2px 10px rgba(60,36,10,.32), inset 0 -1px 0 rgba(255,240,210,.22)" }} aria-hidden="true" />

      <GridSvg flipped={flipped} />

      {/* chữ sông */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-1/2 flex -translate-y-1/2 items-center justify-between font-display font-semibold text-[--wood-line]"
        style={{ paddingInline: "12%", fontSize: "clamp(15px, 4vw, 26px)", letterSpacing: "0.22em", color: "var(--wood-line)" }}
        aria-hidden="true"
      >
        <span style={flipped ? { transform: "scale(-1,-1)" } : undefined}>楚 河</span>
        <span style={flipped ? { transform: "scale(-1,-1)" } : undefined}>漢 界</span>
      </div>

      <div className="absolute grid" style={{ inset: PAD, gridTemplateColumns: `repeat(${XQ_W}, 1fr)`, gridTemplateRows: `repeat(${XQ_H}, 1fr)` }}>
        {Array.from({ length: XQ_W * XQ_H }, (_, disp) => {
          const i = flipped ? XQ_W * XQ_H - 1 - disp : disp;
          const r = Math.floor(i / XQ_W);
          const c = i % XQ_W;
          const p = state.board[i];
          const col = p ? colorOf(p) : null;
          const isSel = selected === i;
          const isTarget = targets.has(i);
          const isLast = state.lastMove && (state.lastMove.from === i || state.lastMove.to === i);
          const pc = col === "r" ? "var(--xq-red)" : "var(--xq-ink)";
          return (
            <button
              key={i}
              role="gridcell"
              aria-label={`Điểm ${r + 1},${c + 1}${p ? ` ${col === "r" ? "đỏ" : "đen"} ${p.toLowerCase()}` : ""}`}
              disabled={disabled || state.winner !== 0}
              onClick={() => onPoint?.(i)}
              className="group relative"
            >
              {isTarget && !p && (
                <span
                  className="absolute left-1/2 top-1/2 h-[26%] w-[26%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{ background: "color-mix(in srgb, var(--vermilion) 60%, transparent)" }}
                />
              )}
              {isTarget && p && (
                <span
                  className="absolute inset-[1%] rounded-full border-2"
                  style={{ borderColor: "color-mix(in srgb, var(--vermilion) 70%, transparent)" }}
                />
              )}
              {p && (
                <span
                  className={`absolute inset-[4%] flex items-center justify-center rounded-full text-[clamp(15px,3.6vw,27px)] font-semibold leading-none animate-[stone-in_200ms_ease-out] transition-transform duration-150 ease-out ${
                    col === "r" && !disabled ? "group-enabled:group-hover:-translate-y-[3%]" : ""
                  }`}
                  style={{
                    background: XQ_CREAM,
                    border: `2px solid ${pc}`,
                    color: pc,
                    boxShadow: isSel
                      ? "0 0 0 2.5px var(--vermilion), 0 5px 12px -3px rgba(30,18,4,.55)"
                      : "0 4px 9px -3px rgba(30,18,4,.5), inset 0 1px 0 rgba(255,252,240,.6)",
                    textShadow: "0 1px 0 rgba(255,250,235,.5)",
                  }}
                >
                  {/* vòng trong mảnh — nét khắc trên quân thật */}
                  <span className="pointer-events-none absolute inset-[9%] rounded-full" style={{ border: `1px solid color-mix(in srgb, ${pc} 55%, transparent)` }} aria-hidden="true" />
                  {col === "r" ? CHAR_R[p.toLowerCase()] : CHAR_B[p.toLowerCase()]}
                </span>
              )}
              {/* nước cuối: chấm son nhỏ ở góc điểm đi/đến */}
              {isLast && (
                <span className="pointer-events-none absolute bottom-[4%] right-[4%] h-[13%] w-[13%] rounded-full bg-vermilion" style={{ boxShadow: "0 0 0 1.5px var(--wood-1)" }} aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
