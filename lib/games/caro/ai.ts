import { CARO_N, candidates, winningLine, type CaroPlayer } from "./rules";

/** Độ khó 0..4: Người mới → Cao thủ */
export interface CaroAiOpts {
  level: number;
  timeMs?: number;
  /** RNG thay thế cho test có seed */
  rand?: () => number;
}

const DIRS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
] as const;

const other = (p: CaroPlayer): CaroPlayer => (p === 1 ? 2 : 1);

function inb(r: number, c: number) {
  return r >= 0 && r < CARO_N && c >= 0 && c < CARO_N;
}

/**
 * Điểm tấn công khi đặt p tại idx: tổng độ dài chuỗi 4 hướng,
 * bonus nếu mở 2 đầu, bonus lớn nếu tạo đúng-5.
 */
function attackScore(board: number[], idx: number, p: CaroPlayer): number {
  const r = Math.floor(idx / CARO_N);
  const c = idx % CARO_N;
  let score = 0;
  for (const [dr, dc] of DIRS) {
    let len = 1;
    let open = 0;
    for (const s of [-1, 1]) {
      let rr = r + dr * s,
        cc = c + dc * s;
      while (inb(rr, cc) && board[rr * CARO_N + cc] === p) {
        len++;
        rr += dr * s;
        cc += dc * s;
      }
      if (inb(rr, cc) && board[rr * CARO_N + cc] === 0) open++;
    }
    if (len >= 5) score += 100000;
    else if (len === 4) score += open === 2 ? 12000 : open === 1 ? 2500 : 0;
    else if (len === 3) score += open === 2 ? 900 : open === 1 ? 120 : 0;
    else if (len === 2) score += open === 2 ? 60 : open === 1 ? 15 : 0;
    else score += open * 3;
  }
  // ưu tiên vị trí trung tâm
  const ctr = (CARO_N - 1) / 2;
  score += 14 - (Math.abs(r - ctr) + Math.abs(c - ctr));
  return score;
}

/** đặt p vào idx có tạo thế thắng ngay (đúng-5, không bịt hai đầu) không */
function isWinningMove(board: number[], idx: number, p: CaroPlayer): boolean {
  board[idx] = p;
  const win = winningLine(board, Math.floor(idx / CARO_N), idx % CARO_N, p) !== null;
  board[idx] = 0;
  return win;
}

function winningCells(board: number[], p: CaroPlayer): number[] {
  const out: number[] = [];
  for (const i of candidates(board)) if (isWinningMove(board, i, p)) out.push(i);
  return out;
}

/**
 * Nước tạo "tứ" (4 quân còn ≥1 đầu mở → nước sau ra đúng-5 thắng được).
 * Trả về số hướng tạo được tứ; ≥2 hướng = tứ kép không thủ được.
 */
function fourThreatDirs(board: number[], idx: number, p: CaroPlayer): number {
  board[idx] = p;
  const r = Math.floor(idx / CARO_N);
  const c = idx % CARO_N;
  let dirs = 0;
  for (const [dr, dc] of DIRS) {
    let len = 1;
    let open = 0;
    for (const s of [-1, 1]) {
      let rr = r + dr * s,
        cc = c + dc * s;
      while (inb(rr, cc) && board[rr * CARO_N + cc] === p) {
        len++;
        rr += dr * s;
        cc += dc * s;
      }
      if (inb(rr, cc) && board[rr * CARO_N + cc] === 0) open++;
    }
    if (len === 4 && open >= 1) dirs++;
  }
  board[idx] = 0;
  return dirs;
}

/** điểm một bên theo các chuỗi liên tiếp trên toàn bàn */
function sideScore(board: number[], p: CaroPlayer): number {
  let total = 0;
  for (let i = 0; i < board.length; i++) {
    if (board[i] !== p) continue;
    const r = Math.floor(i / CARO_N), c = i % CARO_N;
    for (const [dr, dc] of DIRS) {
      const pr = r - dr, pc = c - dc;
      if (inb(pr, pc) && board[pr * CARO_N + pc] === p) continue; // chỉ đếm đầu chuỗi
      let len = 0;
      let rr = r, cc = c;
      while (inb(rr, cc) && board[rr * CARO_N + cc] === p) {
        len++;
        rr += dr;
        cc += dc;
      }
      let open = 0;
      if (inb(pr, pc) && board[pr * CARO_N + pc] === 0) open++;
      if (inb(rr, cc) && board[rr * CARO_N + cc] === 0) open++;
      if (len >= 5) total += 200000;
      else if (len === 4) total += open === 2 ? 50000 : open === 1 ? 8000 : 0;
      else if (len === 3) total += open === 2 ? 2500 : open === 1 ? 250 : 0;
      else if (len === 2) total += open === 2 ? 120 : open === 1 ? 25 : 0;
      else total += open === 2 ? 8 : 0;
    }
  }
  return total;
}

const WIN = 1_000_000;
let nodes = 0;
let deadline = Infinity;
let aborted = false;

const outOfTime = () => {
  if (deadline === Infinity) return false;
  if ((nodes & 255) === 0 && Date.now() > deadline) aborted = true;
  return aborted;
};

/** top-k ứng viên theo heuristic 2 phía */
function topCandidates(board: number[], side: CaroPlayer, k: number): number[] {
  const scored = candidates(board).map((i) => ({
    i,
    s: attackScore(board, i, side) + attackScore(board, i, other(side)) * 0.9,
  }));
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, k).map((x) => x.i);
}

function negamax(board: number[], turn: CaroPlayer, depth: number, alpha: number, beta: number, ply: number, k: number): number {
  nodes++;
  if (outOfTime()) return sideScore(board, turn) - sideScore(board, other(turn));
  if (depth <= 0) return sideScore(board, turn) - sideScore(board, other(turn));
  const cands = topCandidates(board, turn, k);
  if (cands.length === 0) return 0;
  let best = -Infinity;
  for (const m of cands) {
    board[m] = turn;
    const win = winningLine(board, Math.floor(m / CARO_N), m % CARO_N, turn);
    const v = win ? WIN - ply : -negamax(board, other(turn), depth - 1, -beta, -alpha, ply + 1, k);
    board[m] = 0;
    if (v > best) best = v;
    if (best > alpha) alpha = best;
    if (alpha >= beta || aborted) break;
  }
  return best;
}

/**
 * VCF — chuỗi tứ ép buộc: tấn công chỉ đánh nước tạo tứ (hoặc thắng),
 * phòng thủ bắt buộc chặn ô thắng duy nhất. `depth` = số nước tấn công còn lại.
 * Trả chuỗi nước CHỨNG MINH được thắng, hoặc null.
 */
function vcf(board: number[], me: CaroPlayer, depth: number): number[] | null {
  if (outOfTime()) return null;
  nodes++;
  const opp = other(me);
  for (const m of candidates(board)) {
    const threatDirs = fourThreatDirs(board, m, me);
    board[m] = me;
    const winsNow = winningLine(board, Math.floor(m / CARO_N), m % CARO_N, me);
    if (winsNow) {
      board[m] = 0;
      return [m];
    }
    if (threatDirs === 0) {
      board[m] = 0;
      continue;
    }
    const wins = winningCells(board, me);
    if (wins.length > 1) {
      board[m] = 0;
      return [m]; // hai đầu thắng — chặn không xuể
    }
    // đối thủ có nước thắng ngay của riêng họ thì họ thắng trước
    if (wins.length === 0 || winningCells(board, opp).length > 0 || depth <= 1) {
      board[m] = 0;
      continue;
    }
    const forced = wins[0];
    board[forced] = opp;
    const rest = vcf(board, me, depth - 1);
    board[forced] = 0;
    board[m] = 0;
    if (rest) return [m, forced, ...rest];
  }
  return null;
}

const CFG = [
  { def: 0.5, noise: 1.6, top: 8 }, // Người mới — đánh bừa gần quân
  { def: 0.7, noise: 1.0, top: 5 }, // Dễ
  { def: 0.85, noise: 0.5, top: 3 }, // Trung bình
] as const;

/** Chọn nước đi cho `me`. Trả về index ô hoặc null nếu bàn đầy */
export function pickCaroMove(board: number[], me: CaroPlayer, opts: CaroAiOpts): number | null {
  const lv = Math.max(0, Math.min(4, opts.level));
  const rand = opts.rand ?? Math.random;
  const opp = other(me);
  const cands = candidates(board);
  if (cands.length === 0) return null;

  // luôn ăn nước thắng ngay, luôn chặn nước thắng của đối thủ
  const wins = winningCells(board, me);
  if (wins.length > 0) return wins[0];
  const oppWins = winningCells(board, opp);
  if (oppWins.length > 0) return oppWins[0];

  nodes = 0;
  aborted = false;
  deadline = opts?.timeMs ? Date.now() + opts.timeMs : Infinity;

  if (lv === 4) {
    // VCF tìm chiến thắng ép buộc trước khi minimax (~8 ply = 4 nước tấn công)
    const seq = vcf(board, me, 4);
    if (seq && seq.length > 0) return seq[0];
  }

  if (lv >= 3) {
    const depth = lv === 4 ? 4 : 2;
    const k = lv === 4 ? 8 : 10;
    const top = topCandidates(board, me, k);
    let best = top[0];
    let bestV = -Infinity;
    for (const m of top) {
      board[m] = me;
      const win = winningLine(board, Math.floor(m / CARO_N), m % CARO_N, me);
      const v = win ? WIN : -negamax(board, opp, depth - 1, -Infinity, Infinity, 1, k);
      board[m] = 0;
      if (v > bestV) {
        bestV = v;
        best = m;
      }
      if (aborted) break;
    }
    return best;
  }

  const cfg = CFG[lv];
  const scored = cands.map((idx) => ({
    idx,
    s: attackScore(board, idx, me) + attackScore(board, idx, opp) * cfg.def + rand() * cfg.noise * 100,
  }));
  scored.sort((a, b) => b.s - a.s);
  const pick = scored[Math.floor(rand() * Math.min(cfg.top, scored.length))];
  return pick.idx;
}
