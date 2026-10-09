import { describe, it, expect } from "vitest";
import { newGo, applyGoMove, goSize, type GoState } from "./rules";
import { pickGoMove } from "./ai";

const g = (n: number, r: number, c: number) => r * n + c;

function play(n: number, cells: number[]): GoState {
  let s = newGo(n as 19);
  for (const i of cells) {
    const next = applyGoMove(s, i);
    if (!next) throw new Error(`setup move ${i} bất hợp lệ`);
    s = next;
  }
  return s;
}

describe("go AI", () => {
  it("bắt quân đang bị atari", () => {
    // trắng (10,10) chỉ còn 1 khí (10,11)
    const s = play(19, [g(19, 9, 10), g(19, 10, 10), g(19, 10, 9), g(19, 0, 0), g(19, 11, 10), g(19, 0, 1)]);
    expect(s.turn).toBe(1);
    expect(pickGoMove(s, 4)).toBe(g(19, 10, 11));
  });

  it("cứu quân mình đang bị atari (kéo dài khí)", () => {
    // đen (10,10) chỉ còn 1 khí (11,10)
    const s = play(19, [g(19, 10, 10), g(19, 9, 10), g(19, 0, 0), g(19, 10, 9), g(19, 0, 1), g(19, 10, 11)]);
    expect(s.turn).toBe(1);
    expect(pickGoMove(s, 4)).toBe(g(19, 11, 10));
  });

  it("không lấp mắt thật của chính mình", () => {
    // đen bao quanh (10,10): 4 cạnh + 4 chéo đều là đen → mắt thật
    const s = play(19, [
      g(19, 9, 10), g(19, 0, 0), g(19, 11, 10), g(19, 0, 1),
      g(19, 10, 9), g(19, 0, 2), g(19, 10, 11), g(19, 0, 3),
      g(19, 9, 9), g(19, 1, 0), g(19, 9, 11), g(19, 1, 1),
      g(19, 11, 9), g(19, 2, 0), g(19, 11, 11), g(19, 2, 2),
    ]);
    expect(s.turn).toBe(1);
    const mv = pickGoMove(s, 4)!;
    expect(mv).not.toBe(g(19, 10, 10));
  });

  it("chạy được trên bàn 9×9 và 13×13", () => {
    for (const n of [9, 13] as const) {
      const s = newGo(n);
      expect(goSize(s.board)).toBe(n);
      const mv = pickGoMove(s, 4)!;
      expect(mv === -1 || (mv >= 0 && mv < n * n)).toBe(true);
    }
  });
});
