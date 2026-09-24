/**
 * Cờ tướng 9×10. board[90], chữ thường = đen (trên), HOA = đỏ (dưới).
 * r/h/e/a/g/c/p = xe mã tượng sĩ tướng pháo tốt.
 * Hàng 0 = biên đen, hàng 9 = biên đỏ. Sông giữa hàng 4–5.
 */
export const XQ_W = 9;
export const XQ_H = 10;

export type XqColor = "r" | "b"; // red | black
export interface XqMove { from: number; to: number }
export interface XqState {
  board: string[]; // "" = trống
  turn: XqColor;
  winner: XqColor | 0 | -1; // -1 = hòa (50 nước không ăn quân — đơn giản hoá)
  lastMove: XqMove | null;
  halfmove: number;
  moves: XqMove[];
}

export const XQ_INITIAL = [
  "r", "h", "e", "a", "g", "a", "e", "h", "r",
  "", "", "", "", "", "", "", "", "",
  "", "c", "", "", "", "", "", "c", "",
  "p", "", "p", "", "p", "", "p", "", "p",
  "", "", "", "", "", "", "", "", "",
  "", "", "", "", "", "", "", "", "",
  "P", "", "P", "", "P", "", "P", "", "P",
  "", "C", "", "", "", "", "", "C", "",
  "", "", "", "", "", "", "", "", "",
  "R", "H", "E", "A", "G", "A", "E", "H", "R",
];

export function newXiangqi(): XqState {
  return { board: XQ_INITIAL.slice(), turn: "r", winner: 0, lastMove: null, halfmove: 0, moves: [] };
}

/**
 * FEN nội bộ: 10 hàng "/" ngăn cách, số = ô trống, HOA = đỏ, thường = đen,
 * ký tự cuối = lượt ("r" đỏ / "b" đen). VD khai cục:
 * "rheagaehr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RHEAGAEHR r"
 */
export function xqFromFen(fen: string): XqState | null {
  const [placement, turn] = fen.trim().split(/\s+/);
  const rows = placement.split("/");
  if (rows.length !== XQ_H) return null;
  const board: string[] = [];
  for (const row of rows) {
    let n = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) {
        const k = Number(ch);
        for (let i = 0; i < k; i++) board.push("");
        n += k;
      } else if ("rheagcp".includes(ch.toLowerCase())) {
        board.push(ch);
        n++;
      } else return null;
    }
    if (n !== XQ_W) return null;
  }
  if (board.length !== XQ_W * XQ_H) return null;
  // mỗi bên phải còn tướng
  if (!board.some((p) => p === "g") || !board.some((p) => p === "G")) return null;
  const t = turn === "b" ? "b" : "r";
  const s: XqState = { board, turn: t, winner: 0, lastMove: null, halfmove: 0, moves: [] };
  return s;
}

export function xqToFen(s: XqState): string {
  const rows = [];
  for (let r = 0; r < XQ_H; r++) {
    let row = "", empty = 0;
    for (let c = 0; c < XQ_W; c++) {
      const p = s.board[idx(r, c)];
      if (!p) empty++;
      else { if (empty) row += empty; empty = 0; row += p; }
    }
    if (empty) row += empty;
    rows.push(row);
  }
  return `${rows.join("/")} ${s.turn}`;
}

export const rc = (i: number) => [Math.floor(i / XQ_W), i % XQ_W] as const;
export const idx = (r: number, c: number) => r * XQ_W + c;
const inb = (r: number, c: number) => r >= 0 && r < XQ_H && c >= 0 && c < XQ_W;
export const colorOf = (p: string): XqColor | null => (p ? (p === p.toUpperCase() ? "r" : "b") : null);
const opp = (c: XqColor): XqColor => (c === "r" ? "b" : "r");

function inPalace(r: number, c: number, col: XqColor) {
  if (c < 3 || c > 5) return false;
  return col === "r" ? r >= 7 && r <= 9 : r >= 0 && r <= 2;
}
const crossedRiver = (r: number, col: XqColor) => (col === "r" ? r <= 4 : r >= 5);

/** Nước đi pseudo-legal của quân tại i (chưa kiểm tra tự chiếu) */
function pseudo(board: string[], i: number): number[] {
  const p = board[i];
  if (!p) return [];
  const col = colorOf(p)!;
  const t = p.toLowerCase();
  const [r, c] = rc(i);
  const out: number[] = [];
  const push = (rr: number, cc: number) => {
    if (!inb(rr, cc)) return false;
    const q = board[idx(rr, cc)];
    if (q && colorOf(q) === col) return false;
    out.push(idx(rr, cc));
    return !q; // true = có thể đi tiếp (ô trống)
  };

  if (t === "g") {
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const rr = r + dr, cc = c + dc;
      if (inPalace(rr, cc, col)) push(rr, cc);
    }
    // tướng đối mặt: ăn thẳng tướng địch nếu không còn quân cản
    for (let rr = r + (col === "r" ? -1 : 1); inb(rr, c); rr += col === "r" ? -1 : 1) {
      const q = board[idx(rr, c)];
      if (!q) continue;
      if (q.toLowerCase() === "g") out.push(idx(rr, c));
      break;
    }
  } else if (t === "a") {
    for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const rr = r + dr, cc = c + dc;
      if (inPalace(rr, cc, col)) push(rr, cc);
    }
  } else if (t === "e") {
    for (const [dr, dc] of [[2, 2], [2, -2], [-2, 2], [-2, -2]]) {
      const rr = r + dr, cc = c + dc;
      if (!inb(rr, cc) || crossedRiver(rr, col)) continue;
      if (board[idx(r + dr / 2, c + dc / 2)]) continue; // tượng bị chặn mắt
      push(rr, cc);
    }
  } else if (t === "h") {
    for (const [dr, dc, lr, lc] of [
      [2, 1, 1, 0], [2, -1, 1, 0], [-2, 1, -1, 0], [-2, -1, -1, 0],
      [1, 2, 0, 1], [-1, 2, 0, 1], [1, -2, 0, -1], [-1, -2, 0, -1],
    ] as const) {
      if (board[idx(r + lr, c + lc)]) continue; // chân mã bị chặn
      const rr = r + dr, cc = c + dc;
      if (inb(rr, cc)) push(rr, cc);
    }
  } else if (t === "r" || t === "c") {
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      let rr = r + dr, cc = c + dc, jumped = false;
      while (inb(rr, cc)) {
        const q = board[idx(rr, cc)];
        if (t === "r") {
          if (!q) out.push(idx(rr, cc));
          else { if (colorOf(q) !== col) out.push(idx(rr, cc)); break; }
        } else {
          if (!jumped) {
            if (!q) out.push(idx(rr, cc));
            else jumped = true;
          } else if (q) {
            if (colorOf(q) !== col) out.push(idx(rr, cc));
            break;
          }
        }
        rr += dr; cc += dc;
      }
    }
  } else if (t === "p") {
    const f = col === "r" ? -1 : 1;
    push(r + f, c);
    if (crossedRiver(r, col)) { push(r, c - 1); push(r, c + 1); }
  }
  return out;
}

export function generalAt(board: string[], col: XqColor): number {
  return board.findIndex((p) => p.toLowerCase() === "g" && colorOf(p) === col);
}

/** Bên `col` đang bị chiếu? */
export function inCheck(board: string[], col: XqColor): boolean {
  const g = generalAt(board, col);
  if (g < 0) return true;
  const enemy = opp(col);
  for (let i = 0; i < board.length; i++) {
    if (!board[i] || colorOf(board[i]) !== enemy) continue;
    if (pseudo(board, i).includes(g)) return true;
  }
  return false;
}

function doMove(s: XqState, m: XqMove): XqState {
  const board = s.board.slice();
  const captured = board[m.to];
  board[m.to] = board[m.from];
  board[m.from] = "";
  const next: XqState = {
    board,
    turn: opp(s.turn),
    winner: 0,
    lastMove: m,
    halfmove: captured ? 0 : s.halfmove + 1,
    moves: [...s.moves, m],
  };
  const nt = next.turn;
  // hết nước: bên tới lượt không có nước hợp lệ → thua (chiếu hết hoặc bí)
  if (legalMoves(next).length === 0) next.winner = s.turn;
  else if (next.halfmove >= 120) next.winner = -1;
  void nt;
  return next;
}

export function legalMoves(s: XqState): XqMove[] {
  if (s.winner !== 0) return [];
  const out: XqMove[] = [];
  for (let i = 0; i < s.board.length; i++) {
    const p = s.board[i];
    if (!p || colorOf(p) !== s.turn) continue;
    for (const to of pseudo(s.board, i)) {
      const nb = s.board.slice();
      nb[to] = nb[i];
      nb[i] = "";
      if (!inCheck(nb, s.turn)) out.push({ from: i, to });
    }
  }
  return out;
}

export function applyXqMove(s: XqState, m: XqMove): XqState | null {
  const ok = legalMoves(s).some((l) => l.from === m.from && l.to === m.to);
  return ok ? doMove(s, m) : null;
}
