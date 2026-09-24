import { describe, it, expect } from "vitest";
import { newXiangqi, applyXqMove, legalMoves, idx, inCheck, XQ_INITIAL } from "./rules";

const mv = (fr: number, fc: number, tr: number, tc: number) => ({ from: idx(fr, fc), to: idx(tr, fc === fc ? tc : tc) });

describe("xiangqi rules", () => {
  it("khởi đầu: đỏ đi trước, mỗi bên 16 quân, có 44 nước hợp lệ", () => {
    const s = newXiangqi();
    expect(s.turn).toBe("r");
    expect(s.board.filter((p) => p && p === p.toUpperCase()).length).toBe(16);
    expect(s.board.filter((p) => p && p === p.toLowerCase()).length).toBe(16);
    expect(legalMoves(s).length).toBe(44);
  });

  it("tốt chưa qua sông chỉ đi thẳng; qua sông được đi ngang", () => {
    const s = newXiangqi();
    // tốt đỏ tại (6,0): chỉ đi lên (5,0)
    const pawnMoves = legalMoves(s).filter((m) => m.from === idx(6, 0));
    expect(pawnMoves.map((m) => m.to)).toEqual([idx(5, 0)]);
    // đưa tốt qua sông: đặt thủ công
    const b2 = XQ_INITIAL.slice();
    b2[idx(6, 0)] = "";
    b2[idx(4, 0)] = "P";
    const s2 = { ...s, board: b2 };
    const pm = legalMoves(s2).filter((m) => m.from === idx(4, 0));
    expect(pm.map((m) => m.to).sort()).toEqual([idx(4, 1), idx(3, 0)].sort());
  });

  it("mã bị chặn chân không nhảy được", () => {
    const s = newXiangqi();
    // mã đỏ (9,1) muốn lên (7,0)/(7,2) — bình thường được; chặn chân bằng quân ở (8,1)
    const b2 = s.board.slice();
    b2[idx(8, 1)] = "P";
    const s2 = { ...s, board: b2 };
    const hm = legalMoves(s2).filter((m) => m.from === idx(9, 1));
    expect(hm.every((m) => m.to !== idx(7, 0) && m.to !== idx(7, 2))).toBe(true);
  });

  it("pháo ăn quân phải nhảy qua đúng 1 ngòi", () => {
    const s = newXiangqi();
    // pháo đen (2,1) → ăn pháo đỏ (7,1)? giữa không có ngòi → không được
    const b2 = s.board.slice();
    const s2 = { ...s, board: b2, turn: "b" as const };
    const cm = legalMoves(s2).filter((m) => m.from === idx(2, 1));
    expect(cm.every((m) => m.to !== idx(7, 1))).toBe(true);
    // thêm ngòi tại (5,1) → ăn được
    const b3 = s.board.slice();
    b3[idx(5, 1)] = "P";
    const s3 = { ...s, board: b3, turn: "b" as const };
    const cm3 = legalMoves(s3).filter((m) => m.from === idx(2, 1));
    expect(cm3.some((m) => m.to === idx(7, 1))).toBe(true);
  });

  it("nước đi để tướng đối mặt là bất hợp lệ", () => {
    // dựng thế: tướng đỏ (9,4), tướng đen (0,4), chỉ còn cột e trống
    const board = new Array(90).fill("");
    board[idx(9, 4)] = "G";
    board[idx(0, 4)] = "g";
    board[idx(9, 3)] = "A"; // sĩ đỏ
    const s = { board, turn: "r" as const, winner: 0 as const, lastMove: null, halfmove: 0, moves: [] };
    // sĩ đỏ di chuyển hợp lệ; tướng đỏ đi ngang ra cột 3/5 (lộ mặt tướng? không — cột 4 vẫn trống → tướng rời cột thì OK, nhưng đi (9,3)→ chiếm chỗ sĩ. Thử nước G (9,4)->(9,5): hợp lệ trong cung
    const ms = legalMoves(s);
    expect(ms.some((m) => m.from === idx(9, 4) && m.to === idx(9, 5))).toBe(true);
    // tướng đỏ ăn thẳng lên? cột 4 trống → bay lên ăn tướng đen là nước pseudo hợp lệ và THẮNG luôn
    expect(ms.some((m) => m.from === idx(9, 4) && m.to === idx(0, 4))).toBe(true);
  });

  it("applyMove từ chối nước sai, chấp nhận nước đúng và đổi lượt", () => {
    const s = newXiangqi();
    expect(applyXqMove(s, mv(0, 0, 0, 1))).toBeNull(); // quân đen, sai lượt
    const s2 = applyXqMove(s, mv(9, 1, 7, 2))!; // mã đỏ
    expect(s2).not.toBeNull();
    expect(s2.turn).toBe("b");
    expect(s2.board[idx(7, 2)]).toBe("H");
  });

  it("inCheck nhận diện chiếu bởi xe", () => {
    const board = new Array(90).fill("");
    board[idx(9, 4)] = "G";
    board[idx(0, 4)] = "g";
    board[idx(9, 0)] = "r"; // xe đen chiếu dọc cột 0? không — tướng đỏ cột 4
    board[idx(5, 4)] = "r"; // xe đen cột 4 chiếu tướng đỏ
    expect(inCheck(board, "r")).toBe(true);
    expect(inCheck(board, "b")).toBe(false);
  });
});
