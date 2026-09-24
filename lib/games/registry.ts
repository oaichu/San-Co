import { Chess } from "chess.js";
import { newCaro, applyMove, type CaroState } from "./caro/rules";
import { newXiangqi, applyXqMove, type XqState, type XqMove } from "./xiangqi/rules";
import { newGo, applyGoMove, scoreGo, type GoState } from "./go/rules";

export type GameId = "caro" | "chess" | "xiangqi" | "go";
export type Seat = "p1" | "p2";
export type GameResult = "p1" | "p2" | "draw" | null;

export interface GameAdapter<S = unknown, M = unknown> {
  id: GameId;
  init(): S;
  /** null = nước bất hợp lệ */
  apply(s: S, m: M): S | null;
  encode(s: S): unknown;
  decode(raw: unknown): S;
  result(s: S): GameResult;
  /** bên nào đang tới lượt */
  seatToMove(s: S): Seat;
}

export const caroAdapter: GameAdapter<CaroState, number> = {
  id: "caro",
  init: newCaro,
  apply: (s, m) => applyMove(s, m),
  encode: (s) => s,
  decode: (r) => r as CaroState,
  result: (s) => (s.winner === 1 ? "p1" : s.winner === 2 ? "p2" : s.winner === -1 ? "draw" : null),
  seatToMove: (s) => (s.turn === 1 ? "p1" : "p2"),
};

export const chessAdapter: GameAdapter<Chess, { from: string; to: string; promotion?: string }> = {
  id: "chess",
  init: () => new Chess(),
  apply: (s, m) => {
    const g = new Chess(s.fen());
    const r = g.move({ from: m.from, to: m.to, promotion: m.promotion ?? "q" });
    return r ? g : null;
  },
  encode: (s) => ({ fen: s.fen() }),
  decode: (r) => new Chess((r as { fen: string }).fen),
  result: (s) =>
    s.isCheckmate() ? (s.turn() === "w" ? "p2" : "p1") : s.isDraw() || s.isStalemate() || s.isThreefoldRepetition() || s.isInsufficientMaterial() ? "draw" : null,
  seatToMove: (s) => (s.turn() === "w" ? "p1" : "p2"),
};

export const xiangqiAdapter: GameAdapter<XqState, XqMove> = {
  id: "xiangqi",
  init: newXiangqi,
  apply: (s, m) => applyXqMove(s, m),
  encode: (s) => s,
  decode: (r) => r as XqState,
  result: (s) => (s.winner === "r" ? "p1" : s.winner === "b" ? "p2" : s.winner === -1 ? "draw" : null),
  seatToMove: (s) => (s.turn === "r" ? "p1" : "p2"),
};

export const goAdapter: GameAdapter<GoState, number> = {
  id: "go",
  init: newGo,
  apply: (s, m) => applyGoMove(s, m),
  encode: (s) => s,
  decode: (r) => r as GoState,
  result: (s) => {
    if (!s.done) return null;
    const [b, w] = scoreGo(s.board);
    return Math.abs(b - w) < 0.001 ? "draw" : b > w ? "p1" : "p2";
  },
  seatToMove: (s) => (s.turn === 1 ? "p1" : "p2"),
};

export const adapters: Record<GameId, GameAdapter<never, never>> = {
  caro: caroAdapter as never,
  chess: chessAdapter as never,
  xiangqi: xiangqiAdapter as never,
  go: goAdapter as never,
};
