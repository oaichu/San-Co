import { describe, it, expect } from "vitest";
import { LESSONS } from "./lessons";
import { PUZZLES } from "./puzzles";
import { adapters, type GameId } from "@/lib/games/registry";
import type { Setup } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildState(game: GameId, setup: Setup): any {
  const a = adapters[game];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let s: any = a.init() as any;
  if ("fen" in setup) {
    s = a.decode({ fen: setup.fen }) as never;
  } else {
    for (const m of setup.moves ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const next = a.apply(s as never, m as any) as any;
      if (!next) throw new Error(`setup move bất hợp lệ: ${JSON.stringify(m)}`);
      s = next;
    }
  }
  return s;
}

function eqMove(a: unknown, b: unknown): boolean {
  if (typeof a === "number" && typeof b === "number") return a === b;
  return JSON.stringify(a) === JSON.stringify(b);
}

describe("lesson content hợp lệ", () => {
  for (const l of LESSONS) {
    describe(l.id, () => {
      it("có ít nhất 1 block nội dung", () => {
        expect(l.blocks.length).toBeGreaterThan(0);
      });
      l.blocks.forEach((b, i) => {
        if (b.t === "text") return;
        it(`block ${i} (${b.t}): setup hợp lệ`, () => {
          const s = buildState(l.game, b.setup);
          expect(s).toBeTruthy();
        });
        if (b.t === "demo" && b.moves?.length) {
          it(`block ${i}: demo moves đều hợp lệ`, () => {
            let s = buildState(l.game, b.setup);
            for (const m of b.moves!) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const next = adapters[l.game].apply(s as never, m as any) as any;
              expect(next, `move ${JSON.stringify(m)} phải hợp lệ`).toBeTruthy();
              s = next;
            }
          });
        }
        if (b.t === "try") {
          it(`block ${i}: solution là nước hợp lệ`, () => {
            const s = buildState(l.game, b.setup);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const next = adapters[l.game].apply(s as never, b.solution as any) as any;
            expect(next, `solution ${JSON.stringify(b.solution)} phải hợp lệ`).toBeTruthy();
          });
        }
      });
    });
  }
});

/** các thế chiếu hết: sau chuỗi giải, ván phải kết thúc với người giải thắng */
const MATE_PUZZLES = new Set(["xq-11", "xq-12", "xq-14", "chess-12", "chess-13"]);
/** các thế bắt quân: sau chuỗi giải, đối thủ mất quân, mình nguyên vẹn */
const CAPTURE_XQ_PUZZLES = new Set(["xq-13", "xq-15"]);

describe("puzzle content hợp lệ", () => {
  it("id không trùng", () => {
    const ids = PUZZLES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const p of PUZZLES) {
    it(`${p.id}: solution là chuỗi lẻ nước (kết thúc bằng nước người giải)`, () => {
      expect(p.solution.length).toBeGreaterThan(0);
      expect(p.solution.length % 2).toBe(1);
    });

    it(`${p.id}: toàn bộ solution hợp lệ, luân phiên đúng lượt`, () => {
      const a = adapters[p.game];
      const solver = a.seatToMove(buildState(p.game, p.setup));
      let s = buildState(p.game, p.setup);
      for (let i = 0; i < p.solution.length; i++) {
        expect(a.seatToMove(s), `${p.id} nước ${i}: phải tới lượt ${i % 2 === 0 ? solver : "đối thủ"}`).toBe(
          i % 2 === 0 ? solver : solver === "p1" ? "p2" : "p1",
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const next = a.apply(s as never, p.solution[i] as any) as any;
        expect(next, `${p.id}: move ${JSON.stringify(p.solution[i])} phải hợp lệ`).toBeTruthy();
        if (i < p.solution.length - 1) expect(next.winner ?? 0, `${p.id}: ván không được kết thúc trước nước cuối`).toBe(0);
        s = next;
      }
    });

    if (MATE_PUZZLES.has(p.id)) {
      it(`${p.id}: nước cuối là chiếu hết`, () => {
        let s = buildState(p.game, p.setup);
        for (const m of p.solution) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          s = adapters[p.game].apply(s as never, m as any) as any;
        }
        expect(adapters[p.game].result(s), `${p.id}: sau chuỗi giải ván phải kết thúc`).toBeTruthy();
        expect(adapters[p.game].result(s)).toBe(adapters[p.game].seatToMove(buildState(p.game, p.setup)) === "p1" ? "p1" : "p2");
      });
    }

    if (CAPTURE_XQ_PUZZLES.has(p.id)) {
      it(`${p.id}: bắt được quân đen, đỏ nguyên vẹn`, () => {
        const s0 = buildState(p.game, p.setup);
        let s = s0;
        for (const m of p.solution) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          s = adapters[p.game].apply(s as never, m as any) as any;
        }
        const count = (b: string[], red: boolean) => b.filter((q) => q && (q === q.toUpperCase()) === red).length;
        expect(count(s.board, false)).toBeLessThan(count(s0.board, false));
        expect(count(s.board, true)).toBe(count(s0.board, true));
      });
    }
  }
});

export { eqMove, buildState };
