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

  it("tìm chiếu hết trong 1 ở level 2+ (nước sau xe)", () => {
    for (const l of [2, 3, 4]) {
      const c = new Chess("6k1/5ppp/8/8/8/8/5PPP/1R4K1 w - - 0 1");
      expect(pickChessMove(c, l, { depth: 2 })).toBe("Rb8#");
    }
  });

  it("tìm chiếu hết trong 2 ở level 4 (hy sinh xe ép đổi)", () => {
    // Rd8+! buộc Rxd8, Rxd8# — back rank kinh điển
    const c = new Chess("2r3k1/5ppp/8/3R4/8/8/5PPP/3R2K1 w - - 0 1");
    const san = pickChessMove(c, 4, { depth: 4 })!;
    c.move(san);
    // sau nước đầu, đen bị chiếu và mọi phản ứng đều dẫn tới hết cờ ở nước kế
    expect(c.inCheck()).toBe(true);
    for (const rep of c.moves()) {
      const c2 = new Chess(c.fen());
      c2.move(rep);
      const c3 = new Chess(c2.fen());
      const finish = pickChessMove(c3, 2, { depth: 1 })!;
      c3.move(finish);
      expect(c3.isCheckmate(), `phản ứng ${rep} phải bị chiếu hết ngay`).toBe(true);
    }
  });

  it("level 3 không bỏ hậu khi hậu bị mã tấn công", () => {
    const c = new Chess("4k3/8/8/8/8/2n5/8/3QK3 w - - 0 1");
    const san = pickChessMove(c, 3, { depth: 3 })!;
    expect(san.startsWith("Q"), `hậu phải thoát, AI chọn ${san}`).toBe(true);
  });
});
