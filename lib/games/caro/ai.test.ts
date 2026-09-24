import { describe, it, expect } from "vitest";
import { CARO_N } from "./rules";
import { pickCaroMove } from "./ai";

function b(cells: [number, number, 1 | 2][]) {
  const board = new Array(CARO_N * CARO_N).fill(0);
  for (const [r, c, p] of cells) board[r * CARO_N + c] = p;
  return board;
}

describe("caro AI", () => {
  it("cao thủ lấy nước thắng ngay khi có 4 mở", () => {
    // AI (1) có 4 quân hàng 7 cột 3-6, ô (7,7) và (7,2) mở → phải đánh 1 trong 2
    const board = b([[7, 3, 1], [7, 4, 1], [7, 5, 1], [7, 6, 1], [0, 0, 2]]);
    const mv = pickCaroMove(board, 1, { level: 4 })!;
    expect([7 * CARO_N + 7, 7 * CARO_N + 2]).toContain(mv);
  });

  it("cao thủ chặn đối thủ sắp thắng khi mình không có nước thắng", () => {
    const board = b([[7, 3, 2], [7, 4, 2], [7, 5, 2], [7, 6, 2], [0, 0, 1]]);
    const mv = pickCaroMove(board, 1, { level: 4 })!;
    expect([7 * CARO_N + 7, 7 * CARO_N + 2]).toContain(mv);
  });

  it("bàn trống → đánh ô giữa", () => {
    expect(pickCaroMove(new Array(CARO_N * CARO_N).fill(0), 1, { level: 4 })).toBe(7 * CARO_N + 7);
  });
});
