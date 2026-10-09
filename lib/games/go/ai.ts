import { applyGoMove, goSize, type GoState } from "./rules";

const STAR: Record<number, number[]> = { 9: [2, 4, 6], 13: [3, 6, 9], 19: [3, 9, 15] };

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;
const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]] as const;

/** nhóm quân + khí (bản rút gọn, chỉ cần cho chấm điểm nước đi) */
function groupAt(board: number[], i: number, n: number): { stones: number; libs: Set<number> } {
  const color = board[i];
  const libs = new Set<number>();
  const seen = new Set<number>([i]);
  const stack = [i];
  let stones = 0;
  while (stack.length) {
    const cur = stack.pop()!;
    stones++;
    const r = Math.floor(cur / n), c = cur % n;
    for (const [dr, dc] of DIRS) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || rr >= n || cc < 0 || cc >= n) continue;
      const j = rr * n + cc;
      if (board[j] === 0) libs.add(j);
      else if (board[j] === color && !seen.has(j)) { seen.add(j); stack.push(j); }
    }
  }
  return { stones, libs };
}

/** mắt thật của `me`: mọi khí cạnh đều là quân mình, chéo hầu như là mình/mép */
function isTrueEye(board: number[], i: number, me: number, n: number): boolean {
  const r = Math.floor(i / n), c = i % n;
  let diagOpp = 0, diagTotal = 0;
  for (const [dr, dc] of DIRS) {
    const rr = r + dr, cc = c + dc;
    if (rr < 0 || rr >= n || cc < 0 || cc >= n) continue;
    if (board[rr * n + cc] !== me) return false;
  }
  for (const [dr, dc] of DIAG) {
    const rr = r + dr, cc = c + dc;
    if (rr < 0 || rr >= n || cc < 0 || cc >= n) continue;
    diagTotal++;
    if (board[rr * n + cc] !== 0 && board[rr * n + cc] !== me) diagOpp++;
  }
  // ở giữa bàn cho phép tối đa 1 điểm chéo là địch; sát biên yêu cầu sạch
  return diagTotal === 4 ? diagOpp <= 1 : diagOpp === 0;
}

function scoreCandidate(s: GoState, i: number, n: number, conservative: boolean): number {
  const me = s.turn;
  const opp = me === 1 ? 2 : 1;
  if (isTrueEye(s.board, i, me, n)) return -Infinity; // tuyệt đối không lấp mắt mình

  const next = applyGoMove(s, i);
  if (!next) return -Infinity;
  const gained = next.captures[me - 1] - s.captures[me - 1];
  let v = gained * (conservative ? 260 : 220);

  const r = Math.floor(i / n), c = i % n;
  const own = groupAt(next.board, i, n);
  v += own.libs.size * 8;
  if (own.libs.size === 1 && gained === 0) v -= conservative ? 120 : 70; // tự vào atari

  // cứu nhóm mình đang bị atari (chỉ còn 1 khí = chính ô i)
  for (const [dr, dc] of DIRS) {
    const rr = r + dr, cc = c + dc;
    if (rr < 0 || rr >= n || cc < 0 || cc >= n) continue;
    const j = rr * n + cc;
    if (s.board[j] === me) {
      const g = groupAt(s.board, j, n);
      if (g.libs.size === 1 && g.libs.has(i) && own.libs.size >= 2) v += 150 + g.stones * 30;
    }
    // đánh vào khí cuối của địch mà không bắt được (applyGoMove đã loại tự sát) — vẫn là áp lực tốt
    if (s.board[j] === opp) {
      const g = groupAt(s.board, j, n);
      if (g.libs.size === 2 && g.libs.has(i)) v += 40; // đưa địch vào atari
    }
  }

  // điểm sao đầu ván
  const star = STAR[n] ?? STAR[19];
  if (s.moves.length < Math.min(20, n + 2) && star.includes(r) && star.includes(c)) v += 15;

  // sát quân địch (áp lực) / gần quân mình — chơi chắc hơn trên bàn nhỏ
  for (const [dr, dc] of DIRS) {
    const rr = r + dr, cc = c + dc;
    if (rr < 0 || rr >= n || cc < 0 || cc >= n) continue;
    const q = s.board[rr * n + cc];
    if (q === opp) v += conservative ? 3 : 6;
    if (q === me) v += conservative ? 6 : 4;
  }
  // trung tâm
  const ctr = (n - 1) / 2;
  v += 10 - (Math.abs(r - ctr) + Math.abs(c - ctr)) * (20 / n) * 0.5;
  return v;
}

const CFG = [
  { noise: 300, top: 10, passAt: 0.0, passMin: -Infinity },
  { noise: 150, top: 6, passAt: 0.0, passMin: -Infinity },
  { noise: 60, top: 3, passAt: 0.02, passMin: -40 },
  { noise: 20, top: 2, passAt: 0.05, passMin: 0 },
  { noise: 6, top: 1, passAt: 0.08, passMin: 10 },
] as const;

/** AI cờ vây: heuristic theo nhóm/khí. move = index ô hoặc -1 (pass) */
export function pickGoMove(s: GoState, level: number, opts?: { timeMs?: number }): number | null {
  void opts; // chấm heuristic gần như tức thì — giữ tham số cho tương lai
  if (s.done) return null;
  const n = goSize(s.board);
  const conservative = n <= 9; // bàn nhỏ: chơi chắc, ít liều
  const cfg = CFG[Math.max(0, Math.min(4, level))];
  const stones = s.board.filter(Boolean).length;
  const capacity = n * n;

  // cuối ván: bàn đã dày → pass theo xác suất
  const dense = stones / capacity;
  const denseLimit = conservative ? 0.5 : 200 / 361;
  if (dense > denseLimit && Math.random() < cfg.passAt + (dense - denseLimit) * 1.5) return -1;

  const scored: { i: number; v: number }[] = [];
  for (let i = 0; i < s.board.length; i++) {
    if (s.board[i] !== 0 || i === s.ko) continue;
    const base = scoreCandidate(s, i, n, conservative);
    if (base === -Infinity) continue;
    scored.push({ i, v: base + Math.random() * cfg.noise });
  }
  if (scored.length === 0) return -1;
  scored.sort((a, b) => b.v - a.v);
  // bàn dày mà nước tốt nhất vẫn âm/kém → pass để ván kết thúc
  if (dense > denseLimit && scored[0].v < cfg.passMin + cfg.noise * 0.5) return -1;
  return scored[Math.floor(Math.random() * Math.min(cfg.top, scored.length))].i;
}
