import { colorOf, generalAt, idx, legalMoves, pseudoMoves, type XqColor, type XqMove, type XqState } from "./rules";

const VAL: Record<string, number> = { p: 60, a: 120, e: 120, h: 270, c: 300, r: 600, g: 100000 };
const MATE = 100000;
const opp = (c: XqColor): XqColor => (c === "r" ? "b" : "r");

/* ---------- đánh giá ---------- */

function evaluate(s: XqState): number {
  let v = 0;
  const b = s.board;
  for (let i = 0; i < b.length; i++) {
    const p = b[i];
    if (!p) continue;
    const t = p.toLowerCase();
    const r = Math.floor(i / 9), c = i % 9;
    let bonus = 0;
    if (t === "p") {
      const red = p === "P";
      const crossed = red ? r <= 4 : r >= 5;
      if (crossed) bonus += 40;
      // tốt càng sâu càng nguy hiểm
      bonus += red ? Math.max(0, 6 - r) * 6 : Math.max(0, r - 3) * 6;
      // tốt giữa sau sông đáng giá hơn
      if (crossed) bonus += (4 - Math.abs(c - 4)) * 4;
    } else if (t === "h" || t === "c") {
      // mã/pháo trung tâm hóa nhẹ
      bonus += (4 - Math.abs(c - 4)) * 6 + (5 - Math.abs(r - 4.5)) * 2;
    } else if (t === "r") {
      // xe trên cột mở / gần trung tâm
      bonus += (4 - Math.abs(c - 4)) * 4;
    }
    v += (colorOf(p) === "r" ? 1 : -1) * (VAL[t] + bonus);
  }
  // an toàn tướng: còn sĩ/tượng là còn tường
  for (const side of ["r", "b"] as const) {
    let guard = 0;
    for (const p of b) if (p && colorOf(p) === side && "ae".includes(p.toLowerCase())) guard++;
    v += (side === "r" ? 1 : -1) * guard * 15;
  }
  return v;
}

/* ---------- sinh nước đi nhanh ---------- */

/** ô sq có bị quân `by` tấn công không — tra ngược từ ô, O(1) thay vì quét toàn bàn */
function attacked(board: string[], sq: number, by: XqColor): boolean {
  const r = Math.floor(sq / 9), c = sq % 9;
  // tia thẳng: xe + tướng bay (cột) + pháo qua đúng 1 ngòi
  for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    let seen = 0;
    for (let k = 1; ; k++) {
      const rr = r + dr * k, cc = c + dc * k;
      if (rr < 0 || rr >= 10 || cc < 0 || cc >= 9) break;
      const p = board[idx(rr, cc)];
      if (!p) continue;
      seen++;
      const t = p.toLowerCase();
      if (colorOf(p) === by) {
        if (seen === 1 && (t === "r" || (t === "g" && dc === 0))) return true;
        if (seen === 2 && t === "c") return true;
      }
      if (seen >= 2) break;
    }
  }
  // mã: 8 vị trí quanh sq, chân mã phải trống
  for (const [dr, dc, lr, lc] of [
    [2, 1, 1, 0], [2, -1, 1, 0], [-2, 1, -1, 0], [-2, -1, -1, 0],
    [1, 2, 0, 1], [-1, 2, 0, 1], [1, -2, 0, -1], [-1, -2, 0, -1],
  ] as const) {
    const rr = r + dr, cc = c + dc;
    if (rr < 0 || rr >= 10 || cc < 0 || cc >= 9) continue;
    const p = board[idx(rr, cc)];
    if (p && p.toLowerCase() === "h" && colorOf(p) === by && !board[idx(r + lr, c + lc)]) return true;
  }
  // tốt: quân tốt `by` đánh được tới sq — từ phía trước và ngang (đã qua sông)
  const fwd = by === "r" ? 1 : -1; // tốt `by` đứng ở r+fwd để đánh sq
  const pr = r + fwd;
  if (pr >= 0 && pr < 10) {
    const p = board[idx(pr, c)];
    if (p && p.toLowerCase() === "p" && colorOf(p) === by) return true;
  }
  for (const dc of [-1, 1]) {
    const cc = c + dc;
    if (cc < 0 || cc >= 9) continue;
    const p = board[idx(r, cc)];
    if (!p || p.toLowerCase() !== "p" || colorOf(p) !== by) continue;
    const crossed = by === "r" ? r <= 4 : r >= 5;
    if (crossed) return true;
  }
  return false;
}

/** nước hợp lệ của bên đi: pseudo + lọc tự chiếu bằng attacked() rẻ */
function genMoves(board: string[], turn: XqColor): XqMove[] {
  const out: XqMove[] = [];
  for (let i = 0; i < board.length; i++) {
    const p = board[i];
    if (!p || colorOf(p) !== turn) continue;
    for (const to of pseudoMoves(board, i)) {
      // ăn tướng = thắng luôn, vẫn đưa vào để search thấy mate
      const nb = board.slice();
      nb[to] = nb[i];
      nb[i] = "";
      if (!attacked(nb, generalAt(nb, turn), opp(turn))) out.push({ from: i, to });
    }
  }
  return out;
}

function childOf(s: XqState, m: XqMove): XqState {
  const nb = s.board.slice();
  const cap = nb[m.to];
  nb[m.to] = nb[m.from];
  nb[m.from] = "";
  return { ...s, board: nb, turn: opp(s.turn), halfmove: cap ? 0 : s.halfmove + 1 };
}

function orderScore(b: string[], m: XqMove): number {
  const t = b[m.to];
  let s = 0;
  if (t) s += 10 * VAL[t.toLowerCase()] - VAL[b[m.from].toLowerCase()];
  // ưu tiên đưa quân về trung lộ
  s += 2 - Math.abs((m.to % 9) - 4) * 0.4;
  return s;
}

/* ---------- negamax + iterative deepening ---------- */

let nodes = 0;
let deadline = Infinity;
let aborted = false;

const outOfTime = () => {
  if (deadline === Infinity) return false;
  if ((nodes & 1023) === 0 && Date.now() > deadline) aborted = true;
  return aborted;
};

function quiesce(s: XqState, alpha: number, beta: number, ply: number): number {
  nodes++;
  const sign = s.turn === "r" ? 1 : -1;
  if (outOfTime() || ply > 8 || s.halfmove >= 120) return evaluate(s) * sign;
  const checked = attacked(s.board, generalAt(s.board, s.turn), opp(s.turn));
  let a = alpha;
  if (!checked) {
    const stand = evaluate(s) * sign;
    if (stand >= beta) return beta;
    if (stand > a) a = stand;
  }
  let ms = genMoves(s.board, s.turn);
  if (ms.length === 0) return -MATE + ply; // bí cũng thua
  if (!checked) ms = ms.filter((m) => s.board[m.to] !== "");
  ms.sort((x, y) => orderScore(s.board, y) - orderScore(s.board, x));
  for (const m of ms) {
    const v = -quiesce(childOf(s, m), -beta, -a, ply + 1);
    if (v >= beta) return beta;
    if (v > a) a = v;
  }
  return a;
}

function negamax(s: XqState, depth: number, alpha: number, beta: number, ply: number): number {
  nodes++;
  const sign = s.turn === "r" ? 1 : -1;
  if (outOfTime()) return evaluate(s) * sign;
  if (s.halfmove >= 120) return 0;
  if (depth <= 0) return quiesce(s, alpha, beta, ply);
  const ms = genMoves(s.board, s.turn);
  if (ms.length === 0) return -MATE + ply; // chiếu hết hoặc bí đều thua
  ms.sort((x, y) => orderScore(s.board, y) - orderScore(s.board, x));
  let best = -Infinity;
  for (const m of ms) {
    const v = -negamax(childOf(s, m), depth - 1, -beta, -alpha, ply + 1);
    if (v > best) best = v;
    if (best > alpha) alpha = best;
    if (alpha >= beta || aborted) break;
  }
  return best;
}

function searchRoot(s: XqState, root: XqMove[], maxDepth: number): XqMove {
  let best = root[0];
  for (let depth = 1; depth <= maxDepth; depth++) {
    if (aborted) break;
    let iterBest = best;
    let alpha = -Infinity;
    let completed = true;
    const ordered = [best, ...root.filter((m) => m !== best)];
    for (const m of ordered) {
      const v = -negamax(childOf(s, m), depth - 1, -Infinity, -alpha, 1);
      if (aborted) { completed = false; break; }
      if (v > alpha) { alpha = v; iterBest = m; }
    }
    if (completed) best = iterBest;
    if (alpha > MATE - 100) break;
  }
  return best;
}

const NOISE = [500, 200, 0, 0, 0] as const;
const TIME_MS = [0, 0, 0, 700, 1500] as const;

export interface XqAiOpts {
  timeMs?: number;
  depth?: number;
}

export function pickXqMove(s: XqState, level: number, opts?: XqAiOpts): XqMove | null {
  const root = legalMoves(s); // nước gốc kiểm tra đầy đủ bằng rules
  if (root.length === 0) return null;
  const lv = Math.max(0, Math.min(4, level));
  nodes = 0;
  aborted = false;
  const budget = opts?.depth ? Infinity : (opts?.timeMs ?? (TIME_MS[lv] || Infinity));
  deadline = budget === Infinity ? Infinity : Date.now() + budget;

  if (lv <= 1 && !opts?.depth) {
    const sign = s.turn === "r" ? 1 : -1;
    const scored = root.map((m) => ({ m, s: evaluate(childOf(s, m)) * sign + Math.random() * NOISE[lv] }));
    scored.sort((a, b) => b.s - a.s);
    return scored[Math.floor(Math.random() * Math.min(lv === 0 ? 6 : 3, scored.length))].m;
  }

  // sắp nước gốc bằng MVV-LVA trước khi search
  root.sort((x, y) => orderScore(s.board, y) - orderScore(s.board, x));
  const depthCap = opts?.depth ?? (lv === 2 ? 2 : lv === 3 ? 5 : 7);
  return searchRoot(s, root, depthCap);
}
