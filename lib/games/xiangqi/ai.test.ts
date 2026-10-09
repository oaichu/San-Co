import { describe, it, expect } from "vitest";
import { xqFromFen, idx } from "./rules";
import { pickXqMove } from "./ai";

describe("xiangqi AI", () => {
  it("level 2+ ăn xe đen không được bảo vệ (pháo qua ngòi)", () => {
    // xe đen (0,0) chỉ có ngòi tốt (2,0) — pháo đỏ (5,0) bắt được
    const s = xqFromFen("r2aga3/9/p8/9/9/C8/9/9/9/3G5 r")!;
    for (const l of [2, 3, 4]) {
      const mv = pickXqMove(s, l, { depth: 2 })!;
      expect(mv, `level ${l}`).toEqual({ from: idx(5, 0), to: idx(0, 0) });
    }
  });

  it("level 3+ tìm chiếu hết trong 1 (mã khóa cửa cung)", () => {
    // H (4,2) -> (2,3): chiếu hết, hai sĩ khóa hai bên tướng
    const s = xqFromFen("3aga3/9/9/9/2H6/4R4/9/9/9/4G4 r")!;
    for (const l of [3, 4]) {
      const mv = pickXqMove(s, l, { depth: 3 })!;
      expect(mv, `level ${l}`).toEqual({ from: idx(4, 2), to: idx(2, 3) });
    }
  });
});
