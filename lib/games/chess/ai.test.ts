import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
import { pickChessMove } from "./ai";

describe("chess AI", () => {
  it("ăn hậu khi có cơ hội (level 4)", () => {
    // Hậu đen h4 không được bảo vệ, mã f3 bắt được
    const c = new Chess("rnb1kbnr/pppp1ppp/8/4p3/7q/5N2/PPPPPPPP/RNBQKB1R w KQkq - 0 1");
    expect(pickChessMove(c, 4)).toBe("Nxh4");
  }, 30000);

  it("trả về null khi hết nước (checkmate)", () => {
    const c = new Chess("rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3");
    expect(c.isCheckmate()).toBe(true);
    expect(pickChessMove(c, 4)).toBeNull();
  });

  it("mọi level đều trả nước hợp lệ", () => {
    for (let l = 0; l <= 4; l++) {
      const c = new Chess();
      const mv = pickChessMove(c, l)!;
      expect(c.moves()).toContain(mv);
    }
  }, 30000);
});
