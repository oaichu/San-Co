import { describe, it, expect } from "vitest";
import { newGo, applyGoMove, scoreGo, legalGoMoves, goSize, GO_N } from "./rules";

const at = (r: number, c: number) => r * GO_N + c;
const at9 = (r: number, c: number) => r * 9 + c;

describe("go rules", () => {
  it("bắt quân hết khí", () => {
    let s = newGo();
    // đen bao vây quân trắng đơn tại (1,1): đen (0,1),(1,0),(1,2) rồi (2,1)
    s = applyGoMove(s, at(0, 1))!; // đen
    s = applyGoMove(s, at(1, 1))!; // trắng
    s = applyGoMove(s, at(1, 0))!; // đen
    s = applyGoMove(s, at(9, 9))!; // trắng
    s = applyGoMove(s, at(1, 2))!; // đen
    s = applyGoMove(s, at(9, 10))!; // trắng
    s = applyGoMove(s, at(2, 1))!; // đen bắt
    expect(s.board[at(1, 1)]).toBe(0);
    expect(s.captures[0]).toBe(1);
  });

  it("cấm tự sát", () => {
    const s = newGo();
    // dựng: đen vây kín ô (1,1) trừ chính nó; trắng đặt vào = tự sát
    const b = new Array(GO_N * GO_N).fill(0);
    b[at(0, 1)] = b[at(1, 0)] = b[at(1, 2)] = b[at(2, 1)] = 1;
    const s2 = { ...s, board: b, turn: 2 as const };
    expect(applyGoMove(s2, at(1, 1))).toBeNull();
  });

  it("tự sát kèm bắt quân thì hợp lệ", () => {
    // trắng (1,1) tự sát về hình dáng NHƯNG ăn được nhóm đen → hợp lệ
    const b = new Array(GO_N * GO_N).fill(0);
    b[at(0, 1)] = 1; b[at(1, 0)] = 1; b[at(2, 1)] = 1; // đen vây 3 phía
    b[at(1, 2)] = 2; b[at(0, 2)] = 2; b[at(2, 2)] = 2; b[at(1, 3)] = 2; b[at(0, 0)] = 2; b[at(2, 0)] = 2; b[at(3, 1)] = 2;
    // nhóm đen gồm (0,1),(1,0),(2,1): khí duy nhất là (1,1)? (0,1) hàng xóm: (0,0)=W,(0,2)=W,(1,1)=trống → đúng.
    // trắng đánh (1,1): bắt 3 quân đen → ô được giải phóng → hợp lệ
    const s = { ...newGo(), board: b, turn: 2 as const };
    const next = applyGoMove(s, at(1, 1))!;
    expect(next).not.toBeNull();
    expect(next.board[at(0, 1)]).toBe(0);
    expect(next.captures[1]).toBe(3);
  });

  it("2 lượt pass liên tiếp → kết thúc", () => {
    let s = newGo();
    s = applyGoMove(s, -1)!;
    s = applyGoMove(s, -1)!;
    expect(s.done).toBe(true);
    expect(applyGoMove(s, at(0, 0))).toBeNull();
  });

  it("score: vùng trống bao bởi đen tính cho đen", () => {
    const b = new Array(GO_N * GO_N).fill(0);
    // đen bao một góc 2×2 tại (0,0)
    b[at(0, 2)] = b[at(1, 2)] = b[at(2, 0)] = b[at(2, 1)] = b[at(2, 2)] = 1;
    b[at(10, 10)] = 2; // vùng ngoài tiếp giáp cả 2 màu → trung lập
    const [black, white] = scoreGo(b, 0);
    expect(black).toBe(5 + 4); // 5 quân + 4 đất
    expect(white).toBe(1);
  });
});

describe("go 9×9", () => {
  it("newGo(9) tạo bàn 81 ô, goSize nhận đúng kích thước", () => {
    const s = newGo(9);
    expect(s.board).toHaveLength(81);
    expect(goSize(s.board)).toBe(9);
    expect(goSize(newGo(13).board)).toBe(13);
    expect(goSize(newGo().board)).toBe(19);
  });

  it("bắt quân ở biên bàn 9×9", () => {
    // trắng (0,4) trên biên: đen vây (0,3),(0,5),(1,4) → bắt
    let s = newGo(9);
    s = applyGoMove(s, at9(0, 3))!; // đen
    s = applyGoMove(s, at9(0, 4))!; // trắng
    s = applyGoMove(s, at9(0, 5))!; // đen
    s = applyGoMove(s, at9(7, 7))!; // trắng đánh xa
    s = applyGoMove(s, at9(1, 4))!; // đen bắt
    expect(s.board[at9(0, 4)]).toBe(0);
    expect(s.captures[0]).toBe(1);
  });

  it("tự sát bị từ chối trên 9×9", () => {
    const b = new Array(81).fill(0);
    b[at9(0, 1)] = b[at9(1, 0)] = b[at9(1, 2)] = b[at9(2, 1)] = 1;
    const s = { ...newGo(9), board: b, turn: 2 as const };
    expect(applyGoMove(s, at9(1, 1))).toBeNull();
    expect(legalGoMoves(s)).not.toContain(at9(1, 1));
  });

  it("chấm điểm trên 9×9", () => {
    const b = new Array(81).fill(0);
    // đen bao góc 2×2 tại (0,0)
    b[at9(0, 2)] = b[at9(1, 2)] = b[at9(2, 0)] = b[at9(2, 1)] = b[at9(2, 2)] = 1;
    b[at9(7, 7)] = 2;
    const [black, white] = scoreGo(b, 0);
    expect(black).toBe(9); // 5 quân + 4 đất
    expect(white).toBe(1);
  });

  it("2 pass kết thúc ván 9×9", () => {
    let s = newGo(9);
    s = applyGoMove(s, -1)!;
    s = applyGoMove(s, -1)!;
    expect(s.done).toBe(true);
  });
});
