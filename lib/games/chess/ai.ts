import { Chess, type Move } from "chess.js";

const VAL: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
const MATE = 100000;

/**
 * Bảng điểm vị trí (rút gọn từ Michniewski), nhìn từ phía trắng,
 * ô [rank 0=trắng..7=đen][file a..h]. Đen dùng bản lật dọc.
 */
const PST: Record<string, number[]> = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5, 5, 10, 25, 25, 10, 5, 5,
    0, 0, 0, 20, 20, 0, 0, 0,
    5, -5, -10, 0, 0, -10, -5, 5,
    5, 10, 10, -20, -20, 10, 10, 5,
    0, 0, 0, 0, 0, 0, 0, 0,
  ],
  n: [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20, 0, 0, 0, 0, -20, -40,
    -30, 0, 10, 15, 15, 10, 0, -30,
    -30, 5, 15, 20, 20, 15, 5, -30,
    -30, 0, 15, 20, 20, 15, 0, -30,
    -30, 5, 10, 15, 15, 10, 5, -30,
    -40, -20, 0, 5, 5, 0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50,
  ],
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 10, 10, 5, 0, -10,
    -10, 5, 5, 10, 10, 5, 5, -10,
    -10, 0, 10, 10, 10, 10, 0, -10,
    -10, 10, 10, 10, 10, 10, 10, -10,
    -10, 5, 0, 0, 0, 0, 5, -10,
    -20, -10, -10, -10, -10, -10, -10, -20,
  ],
  r: [
    0, 0, 0, 0, 0, 0, 0, 0,
    5, 10, 10, 10, 10, 10, 10, 5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    0, 0, 0, 5, 5, 0, 0, 0,
  ],
  q: [
    -20, -10, -10, -5, -5, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 5, 5, 5, 0, -10,
    -5, 0, 5, 5, 5, 5, 0, -5,
    0, 0, 5, 5, 5, 5, 0, -5,
    -10, 5, 5, 5, 5, 5, 0, -10,
    -10, 0, 5, 0, 0, 0, 0, -10,
    -20, -10, -10, -5, -5, -10, -10, -20,
  ],
  k: [
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10,
    20, 20, 0, 0, 0, 0, 20, 20,
    20, 30, 10, 0, 0, 10, 30, 20,
  ],
};

function evaluate(c: Chess): number {
  let score = 0;
  for (const row of c.board()) {
    for (const sq of row) {
      if (!sq) continue;
      const file = sq.square.charCodeAt(0) - 97;
      const rank = Number(sq.square[1]) - 1; // 1..8 → 0..7
      // trắng đọc bảng từ dưới lên: hàng rank1 = chỉ số (8-rank)... PST viết cho trắng với rank0 ở đầu
      const idx = sq.color === "w" ? (8 - (rank + 1)) * 8 + file : rank * 8 + file;
      const v = VAL[sq.type] + PST[sq.type][idx];
      score += sq.color === "w" ? v : -v;
    }
  }
  return score;
}

/** điểm sắp nước: capture MVV-LVA, phong cấp, chiếu sớm */
function moveScore(m: Move): number {
  let s = 0;
  if (m.captured) s += 10 * VAL[m.captured] - VAL[m.piece];
  if (m.promotion) s += VAL[m.promotion] ?? 0;
  if (m.san.includes("+") || m.san.includes("#")) s += 50;
  return s;
}

function orderedMoves(c: Chess, capturesOnly = false): Move[] {
  let ms = c.moves({ verbose: true });
  if (capturesOnly) ms = ms.filter((m) => m.captured || m.promotion);
  ms.sort((a, b) => moveScore(b) - moveScore(a));
  return ms;
}

let nodes = 0;
let deadline = Infinity;
let aborted = false;

const outOfTime = () => {
  if (deadline === Infinity) return false;
  if ((nodes & 255) === 0 && Date.now() > deadline) aborted = true;
  return aborted;
};

/** quiescence: capture + phong cấp; khi bị chiếu duyệt mọi nước để không bỏ sót chiếu hết */
function quiesce(c: Chess, alpha: number, beta: number, ply: number): number {
  nodes++;
  const sign = c.turn() === "w" ? 1 : -1;
  if (outOfTime() || ply > 10) return evaluate(c) * sign;
  const checked = c.inCheck();
  let a = alpha;
  if (!checked) {
    const stand = evaluate(c) * sign;
    if (stand >= beta) return beta;
    if (stand > a) a = stand;
  }
  const ms = orderedMoves(c, !checked);
  if (ms.length === 0) return checked ? -MATE + ply : a;
  for (const m of ms) {
    c.move(m);
    const v = -quiesce(c, -beta, -a, ply + 1);
    c.undo();
    if (v >= beta) return beta;
    if (v > a) a = v;
  }
  return a;
}

function negamax(c: Chess, depth: number, alpha: number, beta: number, ply: number): number {
  nodes++;
  if (outOfTime()) return evaluate(c) * (c.turn() === "w" ? 1 : -1);
  if (c.isDraw() || c.isThreefoldRepetition() || c.isInsufficientMaterial() || c.isDrawByFiftyMoves()) return 0;
  if (depth <= 0) return quiesce(c, alpha, beta, ply);
  const moves = orderedMoves(c);
  if (moves.length === 0) return c.inCheck() ? -MATE + ply : 0;
  let best = -Infinity;
  for (const m of moves) {
    c.move(m);
    const v = -negamax(c, depth - 1, -beta, -alpha, ply + 1);
    c.undo();
    if (v > best) best = v;
    if (best > alpha) alpha = best;
    if (alpha >= beta || aborted) break;
  }
  return best;
}

/** iterative deepening: trả nước tốt nhất của lần lặp sâu nhất hoàn thành */
function searchRoot(c: Chess, maxDepth: number): Move | null {
  const rootMoves = orderedMoves(c);
  if (rootMoves.length === 0) return null;
  let best = rootMoves[0];
  for (let depth = 1; depth <= maxDepth; depth++) {
    if (aborted) break;
    let iterBest = best;
    let alpha = -Infinity;
    let completed = true;
    // nước tốt của vòng trước đi trước
    const ordered = [best, ...rootMoves.filter((m) => m !== best)];
    for (const m of ordered) {
      c.move(m);
      const v = -negamax(c, depth - 1, -Infinity, -alpha, 1);
      c.undo();
      if (aborted) { completed = false; break; }
      if (v > alpha) { alpha = v; iterBest = m; }
    }
    if (completed) best = iterBest;
    if (alpha > MATE - 100) break; // đã thấy chiếu hết gần nhất
  }
  return best;
}

const NOISE = [600, 250, 90, 0, 0] as const;
const TIME_MS = [0, 0, 0, 700, 1500] as const;

export interface AiOpts {
  timeMs?: number;
  depth?: number;
}

/** Chọn nước SAN cho bên đang tới lượt */
export function pickChessMove(c: Chess, level: number, opts?: AiOpts): string | null {
  const lv = Math.max(0, Math.min(4, level));
  const moves = orderedMoves(c);
  if (moves.length === 0) return null;
  nodes = 0;
  aborted = false;
  const budget = opts?.depth ? Infinity : (opts?.timeMs ?? (TIME_MS[lv] || Infinity));
  deadline = budget === Infinity ? Infinity : Date.now() + budget;

  if (lv <= 1 && !opts?.depth) {
    // cấp thấp: đánh giá nông + nhiễu, bắt chước lỗi người mới
    const noise = NOISE[lv];
    const sign = c.turn() === "w" ? 1 : -1;
    const scored = moves.map((m) => {
      c.move(m);
      const s = evaluate(c) * sign + Math.random() * noise;
      c.undo();
      return { m, s };
    });
    scored.sort((a, b) => b.s - a.s);
    return scored[Math.floor(Math.random() * Math.min(lv === 0 ? 6 : 3, scored.length))].m.san;
  }

  const depthCap = opts?.depth ?? (lv === 2 ? 2 : lv === 3 ? 6 : 8);
  const best = searchRoot(c, depthCap);
  return best?.san ?? null;
}
