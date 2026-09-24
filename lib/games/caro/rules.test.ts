import { describe, it, expect } from "vitest";
import { CARO_N, newCaro, applyMove, winningLine, candidates } from "./rules";

function b(cells: [number, number, 1 | 2][]) {
  const board = new Array(CARO_N * CARO_N).fill(0);
  for (const [r, c, p] of cells) board[r * CARO_N + c] = p;
  return board;
}

describe("caro rules — luật VN đúng-5", () => {
  it("đúng 5 quân không bị chặn hai đầu → thắng", () => {
    const board = b([[7, 3, 1], [7, 4, 1], [7, 5, 1], [7, 6, 1], [7, 7, 1]]);
    expect(winningLine(board, 7, 5, 1)).toHaveLength(5);
  });

  it("6 quân (quá 5) → không thắng", () => {
    const board = b([[7, 2, 1], [7, 3, 1], [7, 4, 1], [7, 5, 1], [7, 6, 1], [7, 7, 1]]);
    expect(winningLine(board, 7, 4, 1)).toBeNull();
  });

  it("5 quân bị chặn hai đầu bởi đối thủ → không thắng", () => {
    const board = b([
      [7, 2, 2],
      [7, 3, 1], [7, 4, 1], [7, 5, 1], [7, 6, 1], [7, 7, 1],
      [7, 8, 2],
    ]);
    expect(winningLine(board, 7, 5, 1)).toBeNull();
  });

  it("5 quân một đầu là mép bàn, đầu kia mở → thắng", () => {
    const board = b([[0, 0, 1], [0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]]);
    expect(winningLine(board, 0, 2, 1)).toHaveLength(5);
  });

  it("chéo cũng tính", () => {
    const board = b([[2, 2, 1], [3, 3, 1], [4, 4, 1], [5, 5, 1], [6, 6, 1]]);
    expect(winningLine(board, 4, 4, 1)).toHaveLength(5);
  });
});

describe("applyMove", () => {
  it("đặt quân, đổi lượt, ghi lastMove", () => {
    const s = newCaro();
    const s2 = applyMove(s, 7 * CARO_N + 7)!;
    expect(s2.board[7 * CARO_N + 7]).toBe(1);
    expect(s2.turn).toBe(2);
    expect(s2.lastMove).toBe(7 * CARO_N + 7);
    expect(s.board[7 * CARO_N + 7]).toBe(0); // immutable
  });

  it("từ chối ô đã có quân / ngoài bàn / sau khi kết thúc", () => {
    const s = applyMove(newCaro(), 0)!;
    expect(applyMove(s, 0)).toBeNull();
    expect(applyMove(s, -1)).toBeNull();
    expect(applyMove(s, CARO_N * CARO_N)).toBeNull();
    let w = newCaro();
    // X đánh 5 quân hàng 7, O đánh dương
    const seq: [number, number][] = [[7, 3], [0, 0], [7, 4], [0, 1], [7, 5], [0, 2], [7, 6], [0, 3], [7, 7]];
    for (const [r, c] of seq) w = applyMove(w, r * CARO_N + c)!;
    expect(w.winner).toBe(1);
    expect(applyMove(w, 1 * CARO_N)).toBeNull();
  });
});

describe("candidates", () => {
  it("bàn trống → trả về ô giữa", () => {
    expect(candidates(new Array(CARO_N * CARO_N).fill(0))).toEqual([7 * CARO_N + 7]);
  });
  it("chỉ gồm ô trống quanh quân đã đánh", () => {
    const cs = candidates(b([[7, 7, 1]]));
    expect(cs.length).toBeGreaterThan(0);
    expect(cs.every((i) => Math.abs(Math.floor(i / CARO_N) - 7) <= 2 && Math.abs((i % CARO_N) - 7) <= 2)).toBe(true);
  });
});
