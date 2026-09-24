import { Chess, type Move } from "chess.js";

const VAL: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
const CENTER = [3, 4];
const NODE_CAP = 60000;

function evaluate(c: Chess): number {
  if (c.isCheckmate()) return c.turn() === "w" ? -99999 : 99999;
  if (c.isDraw() || c.isStalemate() || c.isThreefoldRepetition()) return 0;
  let score = 0;
  for (const row of c.board())
    for (const sq of row) {
      if (!sq) continue;
      let v = VAL[sq.type];
      if (sq.type !== "k" && sq.type !== "r") {
        const file = sq.square.charCodeAt(0) - 97;
        const rank = 8 - Number(sq.square[1]);
        v += (3 - Math.abs(CENTER[0] - file)) + (3 - Math.abs(CENTER[1] - rank));
      }
      score += sq.color === "w" ? v : -v;
    }
  return score;
}

/** Nước đi sắp capture trước (MVV-LVA đơn giản) → alpha-beta cắt sớm */
function orderedMoves(c: Chess): Move[] {
  const ms = c.moves({ verbose: true });
  ms.sort((a, b) => (b.captured ? VAL[b.captured] : 0) - (a.captured ? VAL[a.captured] : 0));
  return ms;
}

let nodes = 0;

function alphabeta(c: Chess, depth: number, alpha: number, beta: number): number {
  if (depth === 0 || c.isGameOver() || nodes > NODE_CAP) return evaluate(c);
  nodes++;
  const moves = orderedMoves(c);
  if (c.turn() === "w") {
    let best = -Infinity;
    for (const m of moves) {
      c.move(m);
      best = Math.max(best, alphabeta(c, depth - 1, alpha, beta));
      c.undo();
      alpha = Math.max(alpha, best);
      if (beta <= alpha || nodes > NODE_CAP) break;
    }
    return best;
  }
  let best = Infinity;
  for (const m of moves) {
    c.move(m);
    best = Math.min(best, alphabeta(c, depth - 1, alpha, beta));
    c.undo();
    beta = Math.min(beta, best);
    if (beta <= alpha || nodes > NODE_CAP) break;
  }
  return best;
}

const CFG = [
  { depth: 1, noise: 600, top: 6 }, // Người mới
  { depth: 1, noise: 250, top: 3 }, // Dễ
  { depth: 2, noise: 90, top: 2 },  // Trung bình
  { depth: 2, noise: 30, top: 1 },  // Khó
  { depth: 3, noise: 8, top: 1 },   // Cao thủ
] as const;

/** Chọn nước SAN cho bên đang tới lượt */
export function pickChessMove(c: Chess, level: number): string | null {
  const cfg = CFG[Math.max(0, Math.min(4, level))];
  const moves = orderedMoves(c);
  if (moves.length === 0) return null;
  nodes = 0;
  const maximizing = c.turn() === "w";
  const scored = moves.map((m) => {
    c.move(m);
    const s = alphabeta(c, cfg.depth - 1, -Infinity, Infinity) + Math.random() * cfg.noise;
    c.undo();
    return { m, s };
  });
  scored.sort((a, b) => (maximizing ? b.s - a.s : a.s - b.s));
  return scored[Math.floor(Math.random() * Math.min(cfg.top, scored.length))].m.san;
}
