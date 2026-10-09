/**
 * Điểm vào chung cho AI cả 4 game — thuần logic, không DOM,
 * chạy được trong worker lẫn node test.
 * Trả về nước đi theo định dạng move của adapter:
 * caro/go = index ô (go pass = -1), xiangqi = {from,to}, chess = {from,to,promotion?}.
 */
import type { Chess } from "chess.js";
import type { GameId } from "@/lib/games/registry";
import type { CaroState } from "@/lib/games/caro/rules";
import type { GoState } from "@/lib/games/go/rules";
import type { XqState } from "@/lib/games/xiangqi/rules";
import { pickCaroMove } from "@/lib/games/caro/ai";
import { pickChessMove } from "@/lib/games/chess/ai";
import { pickXqMove } from "@/lib/games/xiangqi/ai";
import { pickGoMove } from "@/lib/games/go/ai";
import type { Level } from "./levels";

export function pickMove(game: GameId, state: unknown, level: Level, opts?: { timeMs?: number }): unknown | null {
  switch (game) {
    case "caro": {
      const s = state as CaroState;
      return pickCaroMove(s.board, s.turn, { level, timeMs: opts?.timeMs });
    }
    case "chess": {
      const c = state as Chess;
      const san = pickChessMove(c, level, { timeMs: opts?.timeMs });
      if (!san) return null;
      // đổi SAN → {from,to,promotion?} theo định dạng adapter
      const mv = c.moves({ verbose: true }).find((m) => m.san === san);
      return mv ? { from: mv.from, to: mv.to, promotion: mv.promotion } : null;
    }
    case "xiangqi":
      return pickXqMove(state as XqState, level, { timeMs: opts?.timeMs });
    case "go":
      return pickGoMove(state as GoState, level, { timeMs: opts?.timeMs });
  }
}
