import { loadFont } from "@remotion/google-fonts/BeVietnamPro";

export const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "800"],
  subsets: ["vietnamese"],
});

export const C = {
  bg: "#14100B",
  paper: "#F4EFE3",
  ink: "#F1E7D0",
  inkDim: "#9A8D79",
  accent: "#E0552F",
  hairline: "#2E261B",
  wood: "#D9B36C",
  woodDark: "#8A6A3B",
  stoneB: "#221D16",
  stoneW: "#EDE5D3",
};

// Liquid blobs — dịch chuyển bằng sin/cos theo chu kỳ để loop liền mạch
export const Blobs: React.FC<{ frame: number; period: number; opacity?: number }> = ({
  frame,
  period,
  opacity = 0.5,
}) => {
  const t = (2 * Math.PI * frame) / period;
  const blob = (
    x: number,
    y: number,
    size: number,
    color: string,
    dx: number,
    dy: number,
    blur = 90,
  ) => (
    <div
      style={{
        position: "absolute",
        left: x + Math.sin(t + x) * dx,
        top: y + Math.cos(t + y) * dy,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
        opacity,
      }}
    />
  );
  return (
    <>
      {blob(700, -140, 560, "#7A3416", 60, 40)}
      {blob(-180, 140, 480, "#5C3A17", 50, 46)}
      {blob(320, 240, 380, "#1E3A34", 44, 30)}
    </>
  );
};

// Nét X/O vẽ tay giống bàn caro trong app
export const MarkX: React.FC<{ size: number; progress: number; color?: string }> = ({
  size,
  progress,
  color = C.accent,
}) => {
  const len = size * 0.62;
  const off = len * (1 - Math.min(1, progress * 2));
  const off2 = len * (1 - Math.max(0, Math.min(1, progress * 2 - 1)));
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <line x1="11" y1="11" x2="29" y2="29" stroke={color} strokeWidth="3.2" strokeLinecap="round"
        strokeDasharray={len} strokeDashoffset={off} />
      <line x1="29" y1="11" x2="11" y2="29" stroke={color} strokeWidth="3.2" strokeLinecap="round"
        strokeDasharray={len} strokeDashoffset={off2} />
    </svg>
  );
};

export const MarkO: React.FC<{ size: number; progress: number; color?: string }> = ({
  size,
  progress,
  color = "#3A3126",
}) => {
  const len = 88;
  const off = len * (1 - Math.min(1, progress));
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="11" fill="none" stroke={color} strokeWidth="3.2"
        strokeLinecap="round" strokeDasharray={len} strokeDashoffset={off}
        transform="rotate(-90 20 20)" />
    </svg>
  );
};
