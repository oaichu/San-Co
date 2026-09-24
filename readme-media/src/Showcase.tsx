import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Blobs, C, fontFamily, MarkO, MarkX } from "./theme";

const Act: React.FC<{ label: string; f: number; dur: number; children: React.ReactNode }> = ({
  label,
  f,
  dur,
  children,
}) => {
  const inA = interpolate(f, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const outA = interpolate(f, [dur - 10, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tagY = interpolate(f, [4, 16], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: Math.min(inA, outA), justifyContent: "center", alignItems: "center" }}>
      {children}
      <div
        style={{
          position: "absolute",
          left: 44,
          bottom: 36,
          display: "flex",
          alignItems: "center",
          gap: 14,
          opacity: inA,
          transform: `translateY(${tagY}px)`,
        }}
      >
        <div style={{ width: 34, height: 3, background: C.accent, borderRadius: 2 }} />
        <span style={{ fontFamily, fontSize: 30, fontWeight: 800, color: C.ink, letterSpacing: "-0.02em" }}>{label}</span>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- Act 1: Caro ---------- */
const CaroAct: React.FC<{ f: number }> = ({ f }) => {
  const N = 11, CELL = 40, size = N * CELL;
  const plies = [
    { i: 5, j: 5, x: true }, { i: 6, j: 5, x: false }, { i: 4, j: 6, x: true },
    { i: 6, j: 6, x: false }, { i: 6, j: 4, x: true }, { i: 4, j: 4, x: false },
    { i: 3, j: 7, x: true }, { i: 7, j: 7, x: false }, { i: 7, j: 3, x: true },
  ];
  const winP = interpolate(f, [58, 72], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lines = [];
  for (let i = 0; i <= N; i++)
    lines.push(
      <line key={`h${i}`} x1="0" y1={i * CELL} x2={size} y2={i * CELL} stroke={C.hairline} />,
      <line key={`v${i}`} x1={i * CELL} y1="0" x2={i * CELL} y2={size} stroke={C.hairline} />,
    );
  return (
    <svg width={size} height={size} style={{ background: "#1B1510", borderRadius: 14, boxShadow: "0 24px 60px rgba(0,0,0,.5)" }}>
      {lines}
      {plies.map((p, k) => {
        const local = Math.min(1, Math.max(0, (f - (10 + k * 5)) / 7));
        if (local <= 0) return null;
        return (
          <g key={k} transform={`translate(${p.j * CELL + CELL / 2 - 14},${p.i * CELL + CELL / 2 - 14})`}>
            {p.x ? <MarkX size={28} progress={local} /> : <MarkO size={28} progress={local} color={C.ink} />}
          </g>
        );
      })}
      {/* đường chéo phụ (3,7)-(7,3) */}
      <line
        x1={3 * CELL + CELL / 2} y1={7 * CELL + CELL / 2}
        x2={3 * CELL + CELL / 2 + 4 * CELL * winP} y2={7 * CELL + CELL / 2 - 4 * CELL * winP}
        stroke={C.accent} strokeWidth="5" strokeLinecap="round" opacity={winP > 0 ? 1 : 0}
      />
    </svg>
  );
};

/* ---------- Act 2: Cờ tướng ---------- */
const Disc: React.FC<{ ch: string; red: boolean; x: number; y: number; scale?: number; opacity?: number }> = ({
  ch, red, x, y, scale = 1, opacity = 1,
}) => (
  <g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity}>
    <circle r="20" fill="#E8DCC0" stroke={red ? C.accent : "#3A3126"} strokeWidth="2" />
    <circle r="15" fill="none" stroke={red ? C.accent : "#3A3126"} strokeWidth="1.2" opacity="0.7" />
    <text textAnchor="middle" dominantBaseline="central" fontSize="19" fontWeight="700"
      fontFamily="serif" fill={red ? "#B23A1A" : "#2A241B"}>{ch}</text>
  </g>
);

const XiangqiAct: React.FC<{ f: number }> = ({ f }) => {
  const W = 8, H = 9, CELL = 40, OX = 20, OY = 40;
  const px = (c: number) => OX + c * CELL;
  const py = (r: number) => OY + r * CELL;
  const lines = [];
  for (let r = 0; r <= H; r++) {
    lines.push(<line key={`h${r}`} x1={px(0)} y1={py(r)} x2={px(W)} y2={py(r)} stroke="#6B5636" strokeWidth="1.4" />);
    if (r < H) {
      if (r === 4) {
        lines.push(<line key={`v${r}a`} x1={px(0)} y1={py(r)} x2={px(0)} y2={py(r + 1)} stroke="#6B5636" strokeWidth="1.4" />);
        lines.push(<line key={`v${r}b`} x1={px(W)} y1={py(r)} x2={px(W)} y2={py(r + 1)} stroke="#6B5636" strokeWidth="1.4" />);
      } else for (let c = 0; c <= W; c++)
        lines.push(<line key={`v${r}-${c}`} x1={px(c)} y1={py(r)} x2={px(c)} y2={py(r + 1)} stroke="#6B5636" strokeWidth="1.4" />);
    }
  }
  // Pháo đỏ (1,7) bắt tướng đen (4,1) qua ngòi tốt (4,7)? — đơn giản: pháo bắt mã (4,4)
  const slide = spring({ frame: f, fps: 30, delay: 22, config: { damping: 18, stiffness: 120 } });
  const cannonY = py(7) + (py(4) - py(7)) * slide;
  const capA = interpolate(f, [30, 38], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ring = interpolate(f, [30, 46], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W * CELL + 40} height={H * CELL + 80}
      style={{ background: "linear-gradient(160deg,#C99B58,#B5864A)", borderRadius: 14, boxShadow: "0 24px 60px rgba(0,0,0,.5)" }}>
      {lines}
      <text x={px(2)} y={py(4.5)} textAnchor="middle" fontSize="20" fontFamily="serif" fill="#6B5636" opacity=".8">楚 河</text>
      <text x={px(6)} y={py(4.5)} textAnchor="middle" fontSize="20" fontFamily="serif" fill="#6B5636" opacity=".8">漢 界</text>
      <Disc ch="帥" red={false} x={px(4)} y={py(0)} />
      <Disc ch="馬" red={false} x={px(4)} y={py(4)} opacity={capA} />
      <Disc ch="砲" red x={px(4)} y={cannonY} />
      <Disc ch="俥" red x={px(0)} y={py(9)} />
      <circle cx={px(4)} cy={py(4)} r={20 + ring * 26} fill="none" stroke={C.accent}
        strokeWidth={3 * (1 - ring)} opacity={ring > 0 && ring < 1 ? 1 : 0} />
    </svg>
  );
};

/* ---------- Act 3: Cờ vây ---------- */
const GoAct: React.FC<{ f: number }> = ({ f }) => {
  const N = 9, CELL = 42, size = N * CELL;
  const gridIn = interpolate(f, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  // Đen vây bắt 2 quân trắng
  const blacks = [[4, 2], [3, 3], [5, 3], [4, 5], [7, 6], [6, 7]];
  const whites = [[4, 3], [4, 4]];
  const capP = interpolate(f, [52, 64], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const stone = (i: number, j: number, white: boolean, k: number, extra?: number) => {
    const p = spring({ frame: f, fps: 30, delay: 6 + k * 5, config: { damping: 15, stiffness: 200 } });
    if (p <= 0) return null;
    const cx = j * CELL + CELL / 2, cy = i * CELL + CELL / 2;
    const op = extra !== undefined ? 1 - extra : 1;
    return (
      <g key={`${i}-${j}`} opacity={op}>
        <circle cx={cx + 2} cy={cy + 3} r={17 * p} fill="rgba(0,0,0,.3)" />
        <circle cx={cx} cy={cy} r={17 * p}
          fill={white ? "url(#gw)" : "url(#gb)"} transform={`translate(0,${(1 - p) * -10})`} />
      </g>
    );
  };
  const lines = [];
  for (let i = 0; i < N; i++)
    lines.push(
      <line key={`h${i}`} x1={CELL / 2} y1={i * CELL + CELL / 2} x2={size - CELL / 2} y2={i * CELL + CELL / 2} stroke="#3A2A15" strokeWidth="1.2" />,
      <line key={`v${i}`} x1={i * CELL + CELL / 2} y1={CELL / 2} x2={i * CELL + CELL / 2} y2={size - CELL / 2} stroke="#3A2A15" strokeWidth="1.2" />,
    );
  return (
    <svg width={size} height={size}
      style={{ background: `linear-gradient(155deg,${C.wood},#C49A58)`, borderRadius: 14, boxShadow: "0 24px 60px rgba(0,0,0,.5)", opacity: gridIn }}>
      <defs>
        <radialGradient id="gb" cx="35%" cy="30%"><stop offset="0%" stopColor="#5A5148" /><stop offset="100%" stopColor={C.stoneB} /></radialGradient>
        <radialGradient id="gw" cx="35%" cy="30%"><stop offset="0%" stopColor="#FFFDF6" /><stop offset="100%" stopColor={C.stoneW} /></radialGradient>
      </defs>
      {lines}
      {[[2, 2], [2, 6], [6, 2], [6, 6], [4, 4]].filter(([i, j]) => !(i === 4 && j === 4)).map(([i, j]) => (
        <circle key={`h${i}${j}`} cx={j * CELL + CELL / 2} cy={i * CELL + CELL / 2} r="3.4" fill="#3A2A15" />
      ))}
      {blacks.map(([i, j], k) => stone(i, j, false, k))}
      {whites.map(([i, j], k) => stone(i, j, true, blacks.length + k, capP))}
      {capP > 0 && capP < 1 && (
        <text x={size / 2} y={size + 30} textAnchor="middle" fontFamily={fontFamily} fontSize="22"
          fontWeight="600" fill={C.accent} opacity={capP}>Đen bắt 2 quân</text>
      )}
    </svg>
  );
};

export const Showcase: React.FC = () => {
  const frame = useCurrentFrame();
  const ACT = 80;
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily }}>
      <Blobs frame={frame} period={240} opacity={0.4} />
      {frame < ACT && (
        <Act label="Cờ caro" f={frame} dur={ACT}><CaroAct f={frame} /></Act>
      )}
      {frame >= ACT - 5 && frame < ACT * 2 && (
        <Act label="Cờ tướng" f={frame - ACT} dur={ACT}><XiangqiAct f={frame - ACT} /></Act>
      )}
      {frame >= ACT * 2 - 5 && (
        <Act label="Cờ vây" f={frame - ACT * 2} dur={ACT}><GoAct f={frame - ACT * 2} /></Act>
      )}
      <div style={{ position: "absolute", top: 30, right: 44, fontFamily, fontSize: 15, fontWeight: 600, color: C.inkDim, letterSpacing: "0.18em" }}>
        SÂN CỜ
      </div>
    </AbsoluteFill>
  );
};
