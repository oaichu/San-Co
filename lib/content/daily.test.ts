import { describe, it, expect } from "vitest";
import { dayKey, dailyPuzzle, buildStreak } from "./daily";
import { PUZZLES } from "./puzzles";

describe("dayKey", () => {
  it("format YYYY-MM-DD", () => {
    expect(dayKey(new Date(Date.UTC(2026, 2, 15)))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it("đúng múi giờ Asia/Ho_Chi_Minh: 17h UTC vẫn cùng ngày, 18h UTC sang ngày sau", () => {
    // VN = UTC+7: 2026-03-10 16:59 UTC = 23:59 VN ngày 10; 17:01 UTC = 00:01 VN ngày 11
    expect(dayKey(new Date(Date.UTC(2026, 2, 10, 16, 59)))).toBe("2026-03-10");
    expect(dayKey(new Date(Date.UTC(2026, 2, 10, 17, 1)))).toBe("2026-03-11");
  });
});

describe("dailyPuzzle", () => {
  it("cùng ngày → cùng thế", () => {
    const d = new Date(Date.UTC(2026, 4, 20, 3, 0));
    expect(dailyPuzzle(d).id).toBe(dailyPuzzle(d).id);
  });
  it("chỉ chọn thế difficulty ≥ 2", () => {
    for (let i = 0; i < 30; i++) {
      const p = dailyPuzzle(new Date(Date.UTC(2026, 0, 1 + i)));
      expect(p.difficulty, `${p.id} ngày +${i}`).toBeGreaterThanOrEqual(2);
    }
  });
  it("ngày khác nhau (thường) cho thế khác nhau", () => {
    const ids = new Set(
      Array.from({ length: 10 }, (_, i) => dailyPuzzle(new Date(Date.UTC(2026, 0, 1 + i))).id),
    );
    expect(ids.size).toBeGreaterThan(5);
  });
});

describe("buildStreak", () => {
  it("cùng seed → cùng thứ tự", () => {
    const a = buildStreak("all", 42).map((p) => p.id);
    const b = buildStreak("all", 42).map((p) => p.id);
    expect(a).toEqual(b);
  });
  it("seed khác → thứ tự khác", () => {
    const a = buildStreak("all", 1).map((p) => p.id);
    const b = buildStreak("all", 2).map((p) => p.id);
    expect(a).not.toEqual(b);
  });
  it("xếp theo tầng: hết 1 sao rồi 2 sao rồi 3 sao", () => {
    for (const game of ["all", "caro", "chess", "xiangqi", "go"] as const) {
      const diffs = buildStreak(game, 7).map((p) => p.difficulty);
      const sorted = [...diffs].sort((x, y) => x - y);
      expect(diffs, game).toEqual(sorted);
    }
  });
  it("lọc đúng game và trả đủ số thế", () => {
    expect(buildStreak("caro", 5).every((p) => p.game === "caro")).toBe(true);
    expect(buildStreak("all", 5).length).toBe(PUZZLES.length);
  });
});
