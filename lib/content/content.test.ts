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

/* ===== kiểm tra theo theme: thế nào thì phải kết thúc ra sao ===== */

const CHESS_VAL: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function chessMat(c: any, color: "w" | "b"): number {
  let s = 0;
  for (const row of c.board()) for (const p of row) if (p && p.color === color) s += CHESS_VAL[p.type];
  return s;
}
const xqCount = (board: string[], red: boolean) => board.filter((q) => q && (q === q.toUpperCase()) === red).length;

describe("puzzle content hợp lệ", () => {
  it("id không trùng", () => {
    const ids = PUZZLES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("mỗi game ≥ 25 thế, ≥ 7 thế 3 sao, ≥ 8 thế 1 sao", () => {
    for (const game of ["caro", "chess", "xiangqi", "go"] as const) {
      const ps = PUZZLES.filter((p) => p.game === game);
      expect(ps.length, game).toBeGreaterThanOrEqual(25);
      expect(ps.filter((p) => p.difficulty === 3).length, `${game} d3`).toBeGreaterThanOrEqual(7);
      expect(ps.filter((p) => p.difficulty === 1).length, `${game} d1`).toBeGreaterThanOrEqual(8);
    }
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

    const need = `${p.id} (${p.theme ?? "?"})`;
    const solver = () => adapters[p.game].seatToMove(buildState(p.game, p.setup));
    const playAll = () => {
      let s = buildState(p.game, p.setup);
      for (const m of p.solution) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        s = adapters[p.game].apply(s as never, m as any) as any;
      }
      return s;
    };

    if ((p.game === "chess" || p.game === "xiangqi") && p.theme === "Chiếu hết") {
      it(`${p.id}: chiếu hết — người giải thắng`, () => {
        expect(adapters[p.game].result(playAll()), need).toBe(solver());
      });
    }
    if (p.game === "chess" && (p.theme === "Bắt quân" || p.theme === "Chiến thuật")) {
      it(`${p.id}: chênh lệch quân cải thiện`, () => {
        const s0 = buildState(p.game, p.setup);
        const s = playAll();
        const color = solver() === "p1" ? "w" : "b";
        const d = (c: unknown) => chessMat(c, color) - chessMat(c, color === "w" ? "b" : "w");
        expect(d(s), need).toBeGreaterThan(d(s0));
      });
    }
    if (p.game === "xiangqi" && p.theme === "Bắt quân") {
      it(`${p.id}: bắt được quân đen, đỏ nguyên vẹn`, () => {
        const s0 = buildState(p.game, p.setup);
        const s = playAll();
        const red = solver() === "p1";
        expect(xqCount(s.board, !red), need).toBeLessThan(xqCount(s0.board, !red));
        expect(xqCount(s.board, red), need).toBe(xqCount(s0.board, red));
      });
    }
    if (p.game === "caro" && (p.theme === "Tấn công" || p.solution.length >= 3)) {
      it(`${p.id}: tấn công — người giải thắng`, () => {
        expect(adapters[p.game].result(playAll()), need).toBe(solver());
      });
    }
    if (p.game === "caro" && p.theme === "Phòng thủ") {
      it(`${p.id}: phòng thủ — đối thủ không còn nước thắng ngay`, () => {
        const a = adapters[p.game];
        const s = playAll();
        const oppTurn = s.turn;
        for (let i = 0; i < s.board.length; i++) {
          if (s.board[i] !== 0) continue;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const t = a.apply(s as never, i as any) as any;
          expect(t?.winner ?? 0, `${p.id}: đối thủ thắng ngay ở ô ${i}`).not.toBe(oppTurn);
        }
      });
    }
    if (p.game === "go" && (p.theme === "Bắt quân" || p.theme === "Thang" || p.theme === "Ko")) {
      it(`${p.id}: bắt được quân trắng`, () => {
        const s0 = buildState(p.game, p.setup);
        const s = playAll();
        const si = solver() === "p1" ? 0 : 1;
        expect(s.captures[si], need).toBeGreaterThan(s0.captures[si]);
      });
    }
  }
});

export { eqMove, buildState };
