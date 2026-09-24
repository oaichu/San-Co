/**
 * Cờ vây 19×19. board[361], 0 trống / 1 đen / 2 trắng.
 * Đen đi trước. Luật: bắt quân hết khí, cấm tự sát, ko đơn giản (cấm lặp ngay thế trước),
 * 2 lượt pass liên tiếp = kết thúc, chấm đất + quân (area scoring rút gọn, komi 6.5).
 */
export const GO_N = 19;

export type GoPlayer = 1 | 2;

export interface GoState {
  board: number[];
  turn: GoPlayer;
  captures: [number, number]; // [đen bắt được, trắng bắt được]
  passes: number;
  ko: number; // ô cấm đánh (ko), -1 = không
  done: boolean;
  lastMove: number | null; // -1 = pass
  moves: number[];
}

export function newGo(): GoState {
  return { board: new Array(GO_N * GO_N).fill(0), turn: 1, captures: [0, 0], passes: 0, ko: -1, done: false, lastMove: null, moves: [] };
}

const neighbors = (i: number): number[] => {
  const r = Math.floor(i / GO_N), c = i % GO_N;
  const out: number[] = [];
  if (r > 0) out.push(i - GO_N);
  if (r < GO_N - 1) out.push(i + GO_N);
  if (c > 0) out.push(i - 1);
  if (c < GO_N - 1) out.push(i + 1);
  return out;
};

/** Nhóm quân + khí của nhóm chứa i */
function group(board: number[], i: number): { stones: number[]; libs: Set<number> } {
  const color = board[i];
  const stones: number[] = [];
  const libs = new Set<number>();
  const seen = new Set<number>([i]);
  const stack = [i];
  while (stack.length) {
    const cur = stack.pop()!;
    stones.push(cur);
    for (const n of neighbors(cur)) {
      if (board[n] === 0) libs.add(n);
      else if (board[n] === color && !seen.has(n)) {
        seen.add(n);
        stack.push(n);
      }
    }
  }
  return { stones, libs };
}

export function applyGoMove(s: GoState, move: number): GoState | null {
  if (s.done) return null;
  // pass
  if (move === -1) {
    return { ...s, turn: s.turn === 1 ? 2 : 1, passes: s.passes + 1, done: s.passes >= 1, lastMove: -1, moves: [...s.moves, -1], ko: -1 };
  }
  if (move < 0 || move >= GO_N * GO_N || s.board[move] !== 0 || move === s.ko) return null;

  const board = s.board.slice();
  board[move] = s.turn;
  const enemy = s.turn === 1 ? 2 : 1;
  const captures: [number, number] = [s.captures[0], s.captures[1]];
  let capturedStones: number[] = [];

  // bắt các nhóm địch hết khí
  for (const n of neighbors(move)) {
    if (board[n] !== enemy) continue;
    const g = group(board, n);
    if (g.libs.size === 0) {
      for (const st of g.stones) board[st] = 0;
      capturedStones = capturedStones.concat(g.stones);
    }
  }
  captures[s.turn - 1] += capturedStones.length;

  // tự sát: nhóm mình vẫn hết khí → cấm
  const own = group(board, move);
  if (own.libs.size === 0) return null;

  // ko: nếu chỉ bắt đúng 1 quân và quân mới chỉ có 1 khí → ô vừa bị bắt là ko
  let ko = -1;
  if (capturedStones.length === 1 && own.stones.length === 1 && own.libs.size === 1) ko = capturedStones[0];

  return {
    board,
    turn: enemy,
    captures,
    passes: 0,
    ko,
    done: false,
    lastMove: move,
    moves: [...s.moves, move],
  };
}

/** Chấm điểm area: quân trên bàn + đất bao quanh hoàn toàn bởi một màu. Trả về [đen, trắng(+komi)] */
export function scoreGo(board: number[], komi = 6.5): [number, number] {
  let black = 0, white = 0;
  const seen = new Set<number>();
  for (let i = 0; i < board.length; i++) {
    if (board[i] === 1) black++;
    else if (board[i] === 2) white++;
    else if (!seen.has(i)) {
      // vùng trống: BFS, xem tiếp giáp màu nào
      const region: number[] = [];
      const borders = new Set<number>();
      const stack = [i];
      seen.add(i);
      while (stack.length) {
        const cur = stack.pop()!;
        region.push(cur);
        for (const n of neighbors(cur)) {
          if (board[n] === 0 && !seen.has(n)) { seen.add(n); stack.push(n); }
          else if (board[n] !== 0) borders.add(board[n]);
        }
      }
      if (borders.size === 1) {
        if (borders.has(1)) black += region.length;
        else white += region.length;
      }
    }
  }
  return [black, white + komi];
}

export function legalGoMoves(s: GoState): number[] {
  if (s.done) return [];
  const out: number[] = [];
  for (let i = 0; i < s.board.length; i++) {
    if (s.board[i] !== 0 || i === s.ko) continue;
    if (applyGoMove(s, i)) out.push(i);
  }
  return out;
}
