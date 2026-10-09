import type { Chess } from "chess.js";
import { CARO_N, type CaroState } from "@/lib/games/caro/rules";
import { goSize, type GoState } from "@/lib/games/go/rules";
import { XQ_H, XQ_W, colorOf, type XqState } from "@/lib/games/xiangqi/rules";
import { CHAR_B, CHAR_R } from "@/components/board/XiangqiBoard";
import { Piece, type PieceType } from "@/components/board/ChessPieces";
import type { GameId } from "@/lib/games/registry";

const WOOD = "linear-gradient(155deg, var(--wood-1), var(--wood-2))";
const STONE_B = "#221a11";
const STONE_W = "#f2ead8";

/** khung cắt quanh các quân: bbox + lề 2 ô, cửa sổ tối thiểu 7×7 */
function stoneWindow(board: number[], n: number): [number, number, number, number] {
  let r0 = n, r1 = -1, c0 = n, c1 = -1;
  board.forEach((v, i) => {
    if (!v) return;
    const r = Math.floor(i / n), c = i % n;
    if (r < r0) r0 = r;
    if (r > r1) r1 = r;
    if (c < c0) c0 = c;
    if (c > c1) c1 = c;
  });
  if (r1 < 0) return [0, n - 1, 0, n - 1];
  const grow = (lo: number, hi: number): [number, number] => {
    let a = lo - 2, b = hi + 2;
    while (b - a + 1 < 7) {
      if (a > 0) a--;
      else b++;
    }
    if (a < 0) { b -= a; a = 0; }
    if (b > n - 1) { a -= b - (n - 1); b = n - 1; }
    return [Math.max(0, a), Math.min(n - 1, b)];
  };
  const [ra, rb] = grow(r0, r1);
  const [ca, cb] = grow(c0, c1);
  return [ra, rb, ca, cb];
}

function CaroThumb({ state }: { state: CaroState }) {
  const [r0, r1, c0, c1] = stoneWindow(state.board, CARO_N);
  const cw = c1 - c0 + 1, ch = r1 - r0 + 1;
  return (
    <div className="aspect-square w-full overflow-hidden rounded-lg border border-edge bg-surface">
      <svg viewBox={`${c0} ${r0} ${cw} ${ch}`} className="block h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <g stroke="var(--line)" strokeWidth="0.03">
          {Array.from({ length: cw + 1 }, (_, i) => (
            <line key={`v${i}`} x1={c0 + i} y1={r0} x2={c0 + i} y2={r1 + 1} />
          ))}
          {Array.from({ length: ch + 1 }, (_, i) => (
            <line key={`h${i}`} x1={c0} y1={r0 + i} x2={c1 + 1} y2={r0 + i} />
          ))}
        </g>
        {state.board.map((v, i) => {
          if (!v) return null;
          const r = Math.floor(i / CARO_N), c = i % CARO_N;
          return v === 1 ? (
            <path
              key={i}
              d={`M ${c + 0.28} ${r + 0.28} L ${c + 0.72} ${r + 0.72} M ${c + 0.72} ${r + 0.28} L ${c + 0.28} ${r + 0.72}`}
              stroke="var(--stone-x)" strokeWidth="0.09" strokeLinecap="round" fill="none"
            />
          ) : (
            <circle key={i} cx={c + 0.5} cy={r + 0.5} r="0.32" stroke="var(--stone-o)" strokeWidth="0.09" fill="none" />
          );
        })}
      </svg>
    </div>
  );
}

function GoThumb({ state }: { state: GoState }) {
  const n = goSize(state.board);
  const [r0, r1, c0, c1] = stoneWindow(state.board, n);
  const cw = c1 - c0 + 1, ch = r1 - r0 + 1;
  return (
    <div className="aspect-square w-full overflow-hidden rounded-lg border border-edge" style={{ background: WOOD }}>
      <svg viewBox={`${c0} ${r0} ${cw} ${ch}`} className="block h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <g stroke="var(--wood-line)" strokeWidth="0.03">
          {Array.from({ length: cw }, (_, i) => (
            <line key={`v${i}`} x1={c0 + i + 0.5} y1={r0 + 0.5} x2={c0 + i + 0.5} y2={r1 + 0.5} />
          ))}
          {Array.from({ length: ch }, (_, i) => (
            <line key={`h${i}`} x1={c0 + 0.5} y1={r0 + i + 0.5} x2={c1 + 0.5} y2={r0 + i + 0.5} />
          ))}
        </g>
        {state.board.map((v, i) => {
          if (!v) return null;
          const r = Math.floor(i / n), c = i % n;
          return (
            <circle
              key={i}
              cx={c + 0.5} cy={r + 0.5} r="0.44"
              fill={v === 1 ? STONE_B : STONE_W}
              stroke="rgba(20,10,0,.3)" strokeWidth="0.03"
            />
          );
        })}
      </svg>
    </div>
  );
}

function ChessThumb({ state }: { state: Chess }) {
  return (
    <div className="grid aspect-square w-full grid-cols-8 grid-rows-8 overflow-hidden rounded-lg border border-edge">
      {state.board().flat().map((sq, i) => {
        const r = Math.floor(i / 8), c = i % 8;
        return (
          <div key={i} className="relative" style={{ background: (r + c) % 2 === 0 ? "var(--chess-l)" : "var(--chess-d)" }}>
            {sq && (
              <span data-piece={sq.color} className="chess-piece absolute inset-[4%] block">
                <Piece t={sq.type as PieceType} c={sq.color} />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function XiangqiThumb({ state }: { state: XqState }) {
  return (
    <div className="grid aspect-square w-full place-items-center overflow-hidden rounded-lg border border-edge" style={{ background: WOOD }}>
      <svg viewBox="0 0 9 10" className="block h-[90%] w-[90%]" aria-hidden="true">
        <g stroke="var(--wood-line)" strokeWidth="0.035" fill="none">
          {Array.from({ length: XQ_H }, (_, r) => (
            <line key={`h${r}`} x1="0.5" y1={r + 0.5} x2="8.5" y2={r + 0.5} />
          ))}
          <line x1="0.5" y1="0.5" x2="0.5" y2="9.5" />
          <line x1="8.5" y1="0.5" x2="8.5" y2="9.5" />
          {Array.from({ length: 7 }, (_, c) => (
            <g key={`v${c}`}>
              <line x1={c + 1.5} y1="0.5" x2={c + 1.5} y2="4.5" />
              <line x1={c + 1.5} y1="5.5" x2={c + 1.5} y2="9.5" />
            </g>
          ))}
          <rect x="0.5" y="0.5" width="8" height="9" strokeWidth="0.06" />
          <line x1="3.5" y1="0.5" x2="5.5" y2="2.5" /><line x1="5.5" y1="0.5" x2="3.5" y2="2.5" />
          <line x1="3.5" y1="7.5" x2="5.5" y2="9.5" /><line x1="5.5" y1="7.5" x2="3.5" y2="9.5" />
        </g>
        {state.board.map((p, i) => {
          if (!p) return null;
          const r = Math.floor(i / XQ_W), c = i % XQ_W;
          const red = colorOf(p) === "r";
          const pc = red ? "var(--xq-red)" : "var(--xq-ink)";
          return (
            <g key={i}>
              <circle
                cx={c + 0.5} cy={r + 0.5} r="0.42"
                fill="#ecd9ac" stroke={pc} strokeWidth="0.06"
              />
              <text
                x={c + 0.5} y={r + 0.5}
                textAnchor="middle" dominantBaseline="central"
                fontSize="0.5" fontWeight="600" fill={pc}
              >
                {red ? CHAR_R[p.toLowerCase()] : CHAR_B[p.toLowerCase()]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Thumbnail thế cờ nhẹ, nét ở mọi cỡ: caro/go cắt quanh cụm quân, chess/tướng vẽ cả bàn */
export function PuzzleThumb({ game, state }: { game: GameId; state: unknown }) {
  if (game === "caro") return <CaroThumb state={state as CaroState} />;
  if (game === "go") return <GoThumb state={state as GoState} />;
  if (game === "chess") return <ChessThumb state={state as Chess} />;
  return <XiangqiThumb state={state as XqState} />;
}
