/**
 * Cờ caro — luật phổ thông Việt Nam, bàn 15×15:
 * - Đúng 5 quân liên tiếp mới thắng; 6 quân trở lên (quá 5) không tính.
 * - 5 quân bị chặn ở cả hai đầu (đối thủ hoặc mép bàn) không thắng.
 */
export const CARO_N = 15;

export type CaroPlayer = 1 | 2;

export interface CaroState {
  /** length N*N, 0 = trống */
  board: number[];
  turn: CaroPlayer;
  /** 0 = đang chơi, 1|2 = người thắng, -1 = hòa */
  winner: 0 | 1 | 2 | -1;
  winLine: number[];
  lastMove: number | null;
}

export function newCaro(): CaroState {
  return { board: new Array(CARO_N * CARO_N).fill(0), turn: 1, winner: 0, winLine: [], lastMove: null };
}

const DIRS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
] as const;

function inb(r: number, c: number) {
  return r >= 0 && r < CARO_N && c >= 0 && c < CARO_N;
}

/** Trả về hàng thắng nếu nước tại (r,c) tạo đúng-5 không bị chặn hai đầu */
export function winningLine(board: number[], r: number, c: number, p: CaroPlayer): number[] | null {
  for (const [dr, dc] of DIRS) {
    const cells: number[] = [];
    let rr = r,
      cc = c;
    while (inb(rr - dr, cc - dc) && board[(rr - dr) * CARO_N + (cc - dc)] === p) {
      rr -= dr;
      cc -= dc;
    }
    while (inb(rr, cc) && board[rr * CARO_N + cc] === p) {
      cells.push(rr * CARO_N + cc);
      rr += dr;
      cc += dc;
    }
    if (cells.length !== 5) continue;
    // cả hai đầu bị chặn thì không thắng
    const before = cells[0];
    const after = cells[cells.length - 1];
    const br = Math.floor(before / CARO_N) - dr;
    const bc = (before % CARO_N) - dc;
    const ar = Math.floor(after / CARO_N) + dr;
    const ac = (after % CARO_N) + dc;
    const beforeBlocked = !inb(br, bc) || board[br * CARO_N + bc] !== 0;
    const afterBlocked = !inb(ar, ac) || board[ar * CARO_N + ac] !== 0;
    if (!beforeBlocked || !afterBlocked) return cells;
  }
  return null;
}

export function applyMove(state: CaroState, idx: number): CaroState | null {
  if (state.winner !== 0) return null;
  if (idx < 0 || idx >= CARO_N * CARO_N || state.board[idx] !== 0) return null;
  const board = state.board.slice();
  board[idx] = state.turn;
  const r = Math.floor(idx / CARO_N);
  const c = idx % CARO_N;
  const line = winningLine(board, r, c, state.turn);
  const full = board.every((v) => v !== 0);
  return {
    board,
    turn: state.turn === 1 ? 2 : 1,
    winner: line ? state.turn : full ? -1 : 0,
    winLine: line ?? [],
    lastMove: idx,
  };
}

export function legalMoves(state: CaroState): number[] {
  if (state.winner !== 0) return [];
  const out: number[] = [];
  for (let i = 0; i < state.board.length; i++) if (state.board[i] === 0) out.push(i);
  return out;
}

/** Ô trống lân cận quân đã đánh (để AI không quét toàn bàn) */
export function candidates(board: number[], radius = 2): number[] {
  const set = new Set<number>();
  let hasStone = false;
  for (let i = 0; i < board.length; i++) {
    if (board[i] === 0) continue;
    hasStone = true;
    const r = Math.floor(i / CARO_N);
    const c = i % CARO_N;
    for (let dr = -radius; dr <= radius; dr++)
      for (let dc = -radius; dc <= radius; dc++) {
        const rr = r + dr,
          cc = c + dc;
        if (inb(rr, cc) && board[rr * CARO_N + cc] === 0) set.add(rr * CARO_N + cc);
      }
  }
  if (!hasStone) return [Math.floor(CARO_N / 2) * CARO_N + Math.floor(CARO_N / 2)];
  return [...set];
}
