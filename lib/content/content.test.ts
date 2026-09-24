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

describe("puzzle content hợp lệ", () => {
  for (const p of PUZZLES) {
    it(`${p.id}: toàn bộ solution hợp lệ`, () => {
      let s = buildState(p.game, p.setup);
      for (const m of p.solution) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const next = adapters[p.game].apply(s as never, m as any) as any;
        expect(next, `${p.id}: move ${JSON.stringify(m)} phải hợp lệ`).toBeTruthy();
        s = next;
      }
    });
  }
});

export { eqMove, buildState };
