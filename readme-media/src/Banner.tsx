import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Blobs, C, fontFamily, MarkO, MarkX } from "./theme";

const N = 9; // mini caro board
const CELL = 30;

// Ván caro ngắn lặp lại: X thắng đường chéo
const PLIES: { i: number; j: number; x: boolean }[] = [
  { i: 4, j: 4, x: true },
  { i: 5, j: 4, x: false },
  { i: 5, j: 5, x: true },
  { i: 4, j: 5, x: false },
  { i: 6, j: 6, x: true },
  { i: 3, j: 5, x: false },
  { i: 7, j: 7, x: true },
];

const CaroLoop: React.FC<{ frame: number }> = ({ frame }) => {
  const cycle = 110; // một ván trong 110f, 40f nghỉ
  const f = frame % 150;
  const inRound = f < cycle;
  const placed = inRound ? PLIES.filter((_, k) => f >= 14 + k * 10) : [];
  const winP = interpolate(f, [90, 108], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(f, [cycle + 8, cycle + 20], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeIn = interpolate(f, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  const size = N * CELL;
  const lines = [];
  for (let i = 0; i <= N; i++) {
    lines.push(
      <line key={`h${i}`} x1="0" y1={i * CELL} x2={size} y2={i * CELL} stroke={C.hairline} strokeWidth="1" />,
      <line key={`v${i}`} x1={i * CELL} y1="0" x2={i * CELL} y2={size} stroke={C.hairline} strokeWidth="1" />,
    );
  }
  // đường chéo thắng (4,4)-(7,7)
  const winLen = Math.hypot(3 * CELL, 3 * CELL);

  return (
    <div style={{ opacity: fadeOut * fadeIn, transform: "rotateX(48deg) rotateZ(-32deg)", transformStyle: "preserve-3d" }}>
      <svg width={size} height={size} style={{ display: "block", background: "#1A140D", borderRadius: 10, boxShadow: "0 30px 60px rgba(0,0,0,0.55)" }}>
        <rect x="0" y="0" width={size} height={size} fill="#1B1510" rx="10" />
        <g transform={`translate(0,0)`}>{lines}</g>
        {placed.map((p, k) => {
          const local = Math.min(1, Math.max(0, (f - (14 + k * 10)) / 8));
          const cx = p.j * CELL + CELL / 2;
          const cy = p.i * CELL + CELL / 2;
          return (
            <g key={k} transform={`translate(${cx - 15},${cy - 15})`}>
              {p.x ? <MarkX size={30} progress={local} /> : <MarkO size={30} progress={local} color={C.ink} />}
            </g>
          );
        })}
        <line
          x1={4 * CELL + CELL / 2}
          y1={4 * CELL + CELL / 2}
          x2={4 * CELL + CELL / 2 + 3 * CELL * winP}
          y2={4 * CELL + CELL / 2 + 3 * CELL * winP}
          stroke={C.accent}
          strokeWidth="4"
          strokeLinecap="round"
          opacity={winP > 0 ? 1 : 0}
          strokeDasharray={winLen}
          strokeDashoffset={winLen * (1 - winP)}
        />
      </svg>
    </div>
  );
};

export const Banner: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = "SÂN CỜ";
  const lineW = interpolate(frame, [26, 46], [0, 340], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tagP = interpolate(frame, [38, 54], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const metaP = interpolate(frame, [50, 64], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const boardIn = spring({ frame, fps, delay: 8, config: { damping: 26, stiffness: 90 } });

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily, overflow: "hidden" }}>
      <Blobs frame={frame} period={150} />
      {/* hairline trên/dưới */}
      <div style={{ position: "absolute", top: 24, left: 56, right: 56, height: 1, background: C.hairline }} />
      <div style={{ position: "absolute", bottom: 24, left: 56, right: 56, height: 1, background: C.hairline }} />

      <div style={{ position: "absolute", left: 72, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ display: "flex", gap: 2 }}>
          {title.split("").map((ch, i) => {
            const p = spring({ frame, fps, delay: 4 + i * 4, config: { damping: 14, stiffness: 160 } });
            return (
              <span
                key={i}
                style={{
                  fontSize: 108,
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: C.ink,
                  display: "inline-block",
                  opacity: p,
                  transform: `translateY(${(1 - p) * 34}px) rotate(${(1 - p) * -6}deg)`,
                }}
              >
                {ch === " " ? "\u00A0" : ch}
              </span>
            );
          })}
        </div>
        <div style={{ height: 5, width: lineW, background: C.accent, borderRadius: 3, marginTop: 10 }} />
        <div
          style={{
            marginTop: 18,
            fontSize: 25,
            fontWeight: 600,
            color: C.inkDim,
            opacity: tagP,
            transform: `translateY(${(1 - tagP) * 14}px)`,
          }}
        >
          Caro · Cờ vua · Cờ tướng · Cờ vây — sân chơi cho cộng đồng
        </div>
        <div
          style={{
            marginTop: 14,
            fontSize: 16,
            fontWeight: 400,
            color: C.inkDim,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            opacity: metaP,
          }}
        >
          Self-hosted · WebSocket realtime · SQLite · Docker
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 90,
          top: "50%",
          transform: `translateY(-50%) scale(${0.9 + boardIn * 0.1})`,
          opacity: boardIn,
          perspective: 900,
        }}
      >
        <CaroLoop frame={frame} />
      </div>
    </AbsoluteFill>
  );
};
