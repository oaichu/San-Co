import { describe, it, expect } from "vitest";
import { koPairs, rrSchedule, rrRoundCount, swissPairs, swissRounds, tcOf, TIME_CONTROLS, type SwissPlayer } from "./tournament";

describe("koPairs", () => {
  it("seed đầu gặp seed cuối", () => {
    expect(koPairs([1, 2, 3, 4])).toEqual([[1, 4], [2, 3]]);
    expect(koPairs([1, 2])).toEqual([[1, 2]]);
  });
  it("lẻ người → hạt giống giữa được bye", () => {
    expect(koPairs([1, 2, 3])).toEqual([[1, 3], [2, null]]);
    expect(koPairs([1, 2, 3, 4, 5])).toEqual([[1, 5], [2, 4], [3, null]]);
  });
});

describe("rrSchedule", () => {
  it("mọi cặp đấu đúng một lần, đủ số vòng", () => {
    const rounds = rrSchedule([1, 2, 3, 4]);
    expect(rounds).toHaveLength(3);
    const met = new Set<string>();
    for (const round of rounds) for (const [a, b] of round) met.add([a, b].sort().join("-"));
    expect(met.size).toBe(6); // C(4,2)
    for (const round of rounds) {
      const played = round.flatMap(([a, b]) => [a, b]).filter((x) => x !== null);
      expect(new Set(played).size).toBe(4); // mỗi người đấu đúng 1 trận/vòng
    }
  });
  it("lẻ người → mỗi vòng 1 bye, mọi người bye đúng 1 lần", () => {
    const rounds = rrSchedule([1, 2, 3]);
    expect(rounds).toHaveLength(3);
    const byes = rounds.flat().filter(([, b]) => b === null).map(([a]) => a);
    expect(byes.sort()).toEqual([1, 2, 3]);
    const met = new Set<string>();
    for (const round of rounds) for (const [a, b] of round) if (b !== null) met.add([a, b].sort().join("-"));
    expect(met.size).toBe(3); // C(3,2)
  });
  it("rrRoundCount khớp schedule", () => {
    for (const n of [2, 3, 4, 5, 8]) expect(rrSchedule(Array.from({ length: n }, (_, i) => i + 1))).toHaveLength(rrRoundCount(n));
  });
});

describe("swiss", () => {
  const p = (id: number, score: number, opps: number[] = [], hadBye = false): SwissPlayer => ({
    id, score, buchholz: 0, opponents: new Set(opps), hadBye,
  });

  it("vòng 1 xếp theo điểm, ghép đôi gần nhau", () => {
    const pairs = swissPairs([p(1, 1), p(2, 1), p(3, 0), p(4, 0)]);
    expect(pairs).toEqual([[1, 2], [3, 4]]);
  });
  it("không tái đấu nếu còn lựa chọn", () => {
    const pairs = swissPairs([p(1, 1, [2]), p(2, 1, [1]), p(3, 0), p(4, 0)]);
    expect(pairs).toEqual([[1, 3], [2, 4]]);
  });
  it("lẻ người → người cuối chưa bye được bye", () => {
    const pairs = swissPairs([p(1, 2), p(2, 1), p(3, 0)]);
    expect(pairs).toEqual([[1, 2], [3, null]]);
  });
  it("người đã bye không bye lần nữa khi còn lựa chọn khác", () => {
    // 5 người, p5 đã bye — vòng này bye phải rơi vào người khác
    const players = [p(1, 3), p(2, 2), p(3, 1), p(4, 1), p(5, 0, [], true)];
    const pairs = swissPairs(players);
    const bye = pairs.find(([, b]) => b === null);
    expect(bye).toBeTruthy();
    expect(bye![0]).not.toBe(5);
    expect(pairs.length).toBe(3);
  });
  it("swissRounds = ceil(log2 n)", () => {
    expect(swissRounds(4)).toBe(2);
    expect(swissRounds(5)).toBe(3);
    expect(swissRounds(8)).toBe(3);
    expect(swissRounds(9)).toBe(4);
  });
});

describe("time controls", () => {
  it("tcOf trả null cho không giờ/không hợp lệ", () => {
    expect(tcOf("0")).toBeNull();
    expect(tcOf("99+99")).toBeNull();
    expect(tcOf(null)).toBeNull();
  });
  it("mọi TC hợp lệ có initial > 0", () => {
    for (const t of TIME_CONTROLS.slice(1)) expect(t.initial).toBeGreaterThan(0);
    expect(tcOf("3+2")).toEqual({ key: "3+2", label: "Chớp 3+2", initial: 180, inc: 2 });
  });
});
