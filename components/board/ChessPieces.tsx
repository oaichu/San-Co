import type { JSX } from "react";

export type PieceType = "k" | "q" | "r" | "b" | "n" | "p";

// Bộ quân vẽ tay theo silhouette Staunton quốc tế, viewBox 45×45.
// Trắng: fill ngà + viền nâu sẫm. Đen: fill gỗ đen + viền tối + chi tiết sáng.
const W_FILL = "#f6efdd";
const W_LINE = "#33291c";
const B_FILL = "#221a11";
const B_LINE = "#0e0a05";
const B_DETAIL = "#f6efdd";

function shared(c: "w" | "b") {
  return {
    fill: c === "w" ? W_FILL : B_FILL,
    stroke: c === "w" ? W_LINE : B_LINE,
    detail: c === "w" ? W_LINE : B_DETAIL,
  };
}

const BODY: Record<PieceType, (c: "w" | "b") => JSX.Element> = {
  // Tốt: đầu tròn + thân chuông + đế 2 tầng
  p: (c) => {
    const s = shared(c);
    return (
      <g fill={s.fill} stroke={s.stroke} strokeWidth="1.5" strokeLinejoin="round">
        <circle cx="22.5" cy="11.5" r="4.8" />
        <path d="M22.5 15.5c-5.2 3.6-7.8 8.6-7.8 15h15.6c0-6.4-2.6-11.4-7.8-15z" />
        <path d="M13.5 30.5h18l2.1 4.6H11.4z" />
        <rect x="10.5" y="35" width="24" height="3.4" rx="1.6" />
      </g>
    );
  },
  // Xe: 3 merlon + thân thót + đế
  r: (c) => {
    const s = shared(c);
    return (
      <g fill={s.fill} stroke={s.stroke} strokeWidth="1.5" strokeLinejoin="round">
        <path d="M13 8h4.5v2.8h3.4V8h3.2v2.8h3.4V8H32v5.5H13z" />
        <path d="M15 13.5h15l-1.9 16.6h-11.2z" />
        <path d="M13 30h19l1.6 4.2H11.4z" />
        <rect x="10.5" y="34.2" width="24" height="3.6" rx="1.6" />
        {c === "b" && <path d="M15 14.8h15" stroke={s.detail} strokeWidth="0.9" fill="none" opacity="0.45" />}
      </g>
    );
  },
  // Mã: đầu ngựa quay trái + tai + cổ + đế
  n: (c) => {
    const s = shared(c);
    return (
      <g fill={s.fill} stroke={s.stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M13.5 36.5C13.5 29.5 16.5 24.6 21 20.8L14.6 19C12.3 18.2 11.6 15.6 13.2 14L19.6 8.6l-1-2.9 3.2 0.5 0.8-2.9 2.9 1.7C28.2 7.4 30.8 12.4 31 18.5l0 18z" />
        <circle cx="17.6" cy="12.6" r="1.15" fill={s.detail} stroke="none" />
        <circle cx="14.4" cy="16.6" r="0.85" fill={s.detail} stroke="none" opacity="0.8" />
        <path d="M24.5 8.6C28.6 10 30.6 14 30.8 18.5" fill="none" stroke={s.detail} strokeWidth="1" opacity={c === "b" ? 0.4 : 0.55} />
        <rect x="10.5" y="36.5" width="24" height="3.4" rx="1.6" />
      </g>
    );
  },
  // Tượng: quả bóng + mũ mitre có khe + đế
  b: (c) => {
    const s = shared(c);
    return (
      <g fill={s.fill} stroke={s.stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
        <circle cx="22.5" cy="7.6" r="2.5" />
        <path d="M22.5 10.4C16.2 14.2 13.8 19 13.8 23.6c0 4.2 3.5 6.8 8.7 6.8s8.7-2.6 8.7-6.8c0-4.6-2.4-9.4-8.7-13.2z" />
        <path d="M24.6 15.2 L20.4 20.6" stroke={s.detail} strokeWidth="1.4" fill="none" opacity={c === "b" ? 0.7 : 0.8} />
        <path d="M15 30.4h15l1.7 3.8H13.3z" />
        <rect x="11.5" y="34.2" width="22" height="3.8" rx="1.7" />
      </g>
    );
  },
  // Hậu: vương miện 5 đỉnh có bi + thân + đế
  q: (c) => {
    const s = shared(c);
    return (
      <g fill={s.fill} stroke={s.stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M11 26L11.6 10.4 16.8 16.6 17.4 9.4 21.6 15.6 22.5 8.6 23.4 15.6 27.6 9.4 28.2 16.6 33.4 10.4 34 26z" />
        <circle cx="11.6" cy="9" r="1.6" />
        <circle cx="17.4" cy="8" r="1.6" />
        <circle cx="22.5" cy="7.2" r="1.6" />
        <circle cx="27.6" cy="8" r="1.6" />
        <circle cx="33.4" cy="9" r="1.6" />
        <rect x="14.5" y="26" width="16" height="2.6" rx="1" />
        <path d="M15.5 28.6h14l1.9 5.6H13.6z" />
        <rect x="11.5" y="34.2" width="22" height="3.8" rx="1.7" />
      </g>
    );
  },
  // Vua: thánh giá + thân oval có 2 cánh + đế
  k: (c) => {
    const s = shared(c);
    return (
      <g fill={s.fill} stroke={s.stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M21.3 4.8h2.4v2.2h2.2v2.2h-2.2v2.4h-2.4V9.2h-2.2V7h2.2z" />
        <path d="M22.5 12.4C16.4 14 14 18.8 14.4 24.4c0.3 3.8 2.4 6.4 8.1 6.4s7.8-2.6 8.1-6.4c0.4-5.6-2-10.4-8.1-12z" />
        <path d="M17.4 18.6c-1.3 2-1.4 5-0.4 7.6M27.6 18.6c1.3 2 1.4 5 0.4 7.6" fill="none" stroke={s.detail} strokeWidth="1.2" opacity={c === "b" ? 0.5 : 0.6} />
        <path d="M15 31h15l1.7 3.4H13.3z" />
        <rect x="11.5" y="34.4" width="22" height="3.8" rx="1.7" />
      </g>
    );
  },
};

export function Piece({ t, c, className }: { t: PieceType; c: "w" | "b"; className?: string }) {
  return (
    <svg viewBox="0 0 45 45" className={className} aria-hidden="true" style={{ display: "block", width: "100%", height: "100%" }}>
      {BODY[t](c)}
    </svg>
  );
}
