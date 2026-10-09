import { describe, it, expect } from "vitest";
import { CARO_N, candidates, winningLine } from "./rules";
import { pickCaroMove } from "./ai";

function b(cells: [number, number, 1 | 2][]) {
  const board = new Array(CARO_N * CARO_N).fill(0);
  for (const [r, c, p] of cells) board[r * CARO_N + c] = p;
  return board;
}

const cell = (r: number, c: number) => r * CARO_N + c;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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

  it("level 3/4 chặn ba mở khi không có đòn tốt hơn", () => {
    // đối thủ có ba mở hàng 7 (cột 4-6); mình không có đòn nào đáng kể
    const board = b([[7, 4, 2], [7, 5, 2], [7, 6, 2], [4, 4, 1]]);
    for (const l of [3, 4]) {
      const mv = pickCaroMove(board.slice(), 1, { level: l })!;
      expect([cell(7, 3), cell(7, 7)], `level ${l} phải chặn một đầu`).toContain(mv);
    }
  }, 30000);

  it("level 4 tìm VCF hai bước (tứ → chặn → tứ kép)", () => {
    // (7,3) tạo tứ một đầu (7,7 bị đối thủ chặn) → ép (7,2) → (4,3) tạo tứ kép dọc
    const board = b([
      [7, 4, 1], [7, 5, 1], [7, 6, 1], // ba ngang
      [5, 3, 1], [6, 3, 1],            // đôi dọc chờ (7,3) + (4,3)
      [7, 7, 2], [0, 0, 2], [0, 1, 2],
    ]);
    const mv = pickCaroMove(board.slice(), 1, { level: 4 })!;
    expect(mv).toBe(cell(7, 3));
  }, 30000);

  it("level 4 thắng level 0 ít nhất 4/5 ván (seed cố định)", () => {
    let wins = 0;
    for (let seed = 1; seed <= 5; seed++) {
      const rand = mulberry32(seed * 7919);
      const board = new Array(CARO_N * CARO_N).fill(0);
      let turn: 1 | 2 = 1;
      let winner = 0;
      for (let ply = 0; ply < 120; ply++) {
        const mv = pickCaroMove(board, turn, { level: turn === 1 ? 4 : 0, rand });
        if (mv === null) break;
        board[mv] = turn;
        if (winningLine(board, Math.floor(mv / CARO_N), mv % CARO_N, turn)) { winner = turn; break; }
        turn = turn === 1 ? 2 : 1;
        if (candidates(board).length === 0) break;
      }
      if (winner === 1) wins++;
    }
    expect(wins).toBeGreaterThanOrEqual(4);
  }, 60000);
});
