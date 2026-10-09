import type { GameId, Seat } from "@/lib/games/registry";
import { Chess } from "chess.js";

/** tên bên chơi theo seat của từng game */
export function seatName(game: GameId, seat: Seat): string {
  switch (game) {
    case "caro":
      return seat === "p1" ? "X" : "O";
    case "chess":
      return seat === "p1" ? "Trắng" : "Đen";
    case "xiangqi":
      return seat === "p1" ? "Đỏ" : "Đen";
    case "go":
      return seat === "p1" ? "Đen" : "Trắng";
  }
}

/** chấm màu đại diện bên chơi — css background cho dot 12px */
export function seatDot(game: GameId, seat: Seat): string {
  const light = "radial-gradient(circle at 36% 30%, #fffdf4 0%, #e9dcba 70%, #cdb98d 100%)";
  const dark = "radial-gradient(circle at 36% 30%, #5a5044 0%, #2e2619 55%, #120d07 100%)";
  const red = "radial-gradient(circle at 36% 30%, #e2624a 0%, var(--xq-red) 60%, #7e1f10 100%)";
  switch (game) {
    case "caro":
      return seat === "p1" ? "var(--stone-x)" : "var(--stone-o)";
    case "chess":
      return seat === "p1" ? light : dark;
    case "xiangqi":
      return seat === "p1" ? red : dark;
    case "go":
      return seat === "p1" ? dark : light;
  }
}

const VAL: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/** chênh lệch chất cờ vua, dương = trắng hơn */
export function chessDiff(c: Chess): number {
  let d = 0;
  for (const row of c.board()) for (const sq of row) if (sq) d += sq.color === "w" ? VAL[sq.type] : -VAL[sq.type];
  return d;
}
