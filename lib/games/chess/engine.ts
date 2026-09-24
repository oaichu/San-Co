import { Chess, type Move, type Square } from "chess.js";

export type ChessEngine = Chess;
export type { Move, Square };

export function newChess(fen?: string): Chess {
  return new Chess(fen);
}
