import { describe, it, expect } from "vitest";
import { eloDelta } from "./elo";

describe("elo", () => {
  it("ngang rating, thắng → +16", () => {
    expect(eloDelta(1200, 1200, 1)).toBe(16);
    expect(eloDelta(1200, 1200, 0)).toBe(-16);
    expect(eloDelta(1200, 1200, 0.5)).toBe(0);
  });
  it("đánh thắng đối thủ mạnh hơn → cộng nhiều hơn", () => {
    expect(eloDelta(1200, 1600, 1)).toBeGreaterThan(16);
  });
});
