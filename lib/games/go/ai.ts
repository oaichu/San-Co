import { applyGoMove, GO_N, type GoState } from "./rules";

const STAR = [3, 9, 15];

function scoreCandidate(s: GoState, i: number): number {
  const next = applyGoMove(s, i);
  if (!next) return -Infinity;
  const gained = next.captures[s.turn - 1] - s.captures[s.turn - 1];
  let v = gained * 120;
  // đếm khí nhóm mới — tránh tự đặt vào thế 1 khí
  const r = Math.floor(i / GO_N), c = i % GO_N;
  let libs = 0;
  for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const rr = r + dr, cc = c + dc;
    if (rr < 0 || rr >= GO_N || cc < 0 || cc >= GO_N) continue;
    if (next.board[rr * GO_N + cc] === 0) libs++;
  }
  v += libs * 8;
  if (libs === 1 && gained === 0) v -= 60; // tự vào atari
  // điểm sao đầu ván
  if (s.moves.length < 20 && STAR.includes(r) && STAR.includes(c)) v += 15;
  // sát quân địch (áp lực) / gần quân mình
  for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const rr = r + dr, cc = c + dc;
    if (rr < 0 || rr >= GO_N || cc < 0 || cc >= GO_N) continue;
    const q = s.board[rr * GO_N + cc];
    if (q !== 0 && q !== s.turn) v += 6;
    if (q === s.turn) v += 4;
  }
  // trung tâm
  v += 10 - (Math.abs(r - 9) + Math.abs(c - 9)) * 0.5;
  return v;
}

const CFG = [
  { noise: 300, top: 10, passAt: 0.0 },
  { noise: 150, top: 6, passAt: 0.0 },
  { noise: 60, top: 3, passAt: 0.02 },
  { noise: 20, top: 2, passAt: 0.05 },
  { noise: 6, top: 1, passAt: 0.08 },
] as const;

/** AI cố ý yếu: heuristic + noise. move = index ô hoặc -1 (pass) */
export function pickGoMove(s: GoState, level: number): number | null {
  if (s.done) return null;
  const cfg = CFG[Math.max(0, Math.min(4, level))];
  // cuối ván: bàn đã dày → pass theo xác suất
  const stones = s.board.filter(Boolean).length;
  if (stones > 200 && Math.random() < cfg.passAt + (stones - 200) / 161) return -1;

  const scored: { i: number; v: number }[] = [];
  for (let i = 0; i < s.board.length; i++) {
    if (s.board[i] !== 0 || i === s.ko) continue;
    const base = scoreCandidate(s, i);
    if (base === -Infinity) continue;
    scored.push({ i, v: base + Math.random() * cfg.noise });
  }
  if (scored.length === 0) return -1;
  scored.sort((a, b) => b.v - a.v);
  return scored[Math.floor(Math.random() * Math.min(cfg.top, scored.length))].i;
}
