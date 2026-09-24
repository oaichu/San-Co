import { colorOf, legalMoves, type XqMove, type XqState } from "./rules";

const VAL: Record<string, number> = { p: 60, a: 120, e: 120, h: 270, c: 300, r: 600, g: 100000 };

function evaluate(s: XqState): number {
  let v = 0;
  for (let i = 0; i < s.board.length; i++) {
    const p = s.board[i];
    if (!p) continue;
    const base = VAL[p.toLowerCase()];
    const r = Math.floor(i / 9);
    // tốt qua sông mạnh hơn
    const bonus = p.toLowerCase() === "p" && ((p === "P" && r <= 4) || (p === "p" && r >= 5)) ? 40 : 0;
    v += colorOf(p) === "r" ? base + bonus : -(base + bonus);
  }
  return v;
}

function doRaw(s: XqState, m: XqMove): XqState {
  const nb = s.board.slice();
  nb[m.to] = nb[m.from];
  nb[m.from] = "";
  return { ...s, board: nb, turn: s.turn === "r" ? "b" : "r" };
}

function alphabeta(s: XqState, depth: number, alpha: number, beta: number): number {
  if (s.winner !== 0) return s.winner === "r" ? 999999 : -999999;
  if (depth === 0) return evaluate(s);
  const ms = legalMoves(s);
  if (s.turn === "r") {
    let best = -Infinity;
    for (const m of ms) {
      best = Math.max(best, alphabeta(doRaw(s, m), depth - 1, alpha, beta));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best === -Infinity ? evaluate(s) : best;
  }
  let best = Infinity;
  for (const m of ms) {
    best = Math.min(best, alphabeta(doRaw(s, m), depth - 1, alpha, beta));
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best === Infinity ? evaluate(s) : best;
}

const CFG = [
  { depth: 1, noise: 500, top: 6 },
  { depth: 1, noise: 200, top: 3 },
  { depth: 2, noise: 80, top: 2 },
  { depth: 3, noise: 25, top: 1 },
  { depth: 4, noise: 5, top: 1 },
] as const;

export function pickXqMove(s: XqState, level: number): XqMove | null {
  const ms = legalMoves(s);
  if (ms.length === 0) return null;
  const cfg = CFG[Math.max(0, Math.min(4, level))];
  const maxing = s.turn === "r";
  const scored = ms.map((m) => {
    const child = doRaw(s, m);
    child.winner = child.winner; // recompute below if needed
    return { m, s: alphabeta(child, cfg.depth - 1, -Infinity, Infinity) + Math.random() * cfg.noise };
  });
  scored.sort((a, b) => (maxing ? b.s - a.s : a.s - b.s));
  return scored[Math.floor(Math.random() * Math.min(cfg.top, scored.length))].m;
}
