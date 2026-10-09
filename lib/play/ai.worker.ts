/**
 * Worker AI: nhận {id, game, state(encode), level, timeMs?},
 * decode theo adapter rồi trả {id, move}.
 */
import { adapters, type GameId } from "@/lib/games/registry";
import { pickMove } from "./ai";
import type { Level } from "./levels";

interface Req {
  id: number;
  game: GameId;
  state: unknown;
  level: Level;
  timeMs?: number;
}

self.onmessage = (ev: MessageEvent<Req>) => {
  const { id, game, state, level, timeMs } = ev.data;
  let move: unknown = null;
  try {
    const s = adapters[game].decode(state);
    move = pickMove(game, s, level, { timeMs });
  } catch {
    move = null;
  }
  (self as unknown as Worker).postMessage({ id, move });
};
