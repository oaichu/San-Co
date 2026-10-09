"use client";

import { useState } from "react";
import type { Chess, Square } from "chess.js";
import { CaroBoard } from "@/components/board/CaroBoard";
import { ChessBoard } from "@/components/board/ChessBoard";
import { GoBoard } from "@/components/board/GoBoard";
import { XiangqiBoard } from "@/components/board/XiangqiBoard";
import { Piece, type PieceType } from "@/components/board/ChessPieces";
import { legalMoves as xqLegal, colorOf, type XqState } from "@/lib/games/xiangqi/rules";
import type { CaroState } from "@/lib/games/caro/rules";
import type { GoState } from "@/lib/games/go/rules";
import type { GameId, GameResult } from "@/lib/games/registry";

const PROMO_PIECES: { t: PieceType; name: string }[] = [
  { t: "q", name: "Hậu" },
  { t: "r", name: "Xe" },
  { t: "b", name: "Tượng" },
  { t: "n", name: "Mã" },
];

export interface PlayBoardProps {
  game: GameId;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any;
  isHumanTurn: boolean;
  thinking: boolean;
  result: GameResult;
  hint: unknown | null;
  lastMove?: { from: string; to: string } | null;
  flipped: boolean;
  /** chạm hai lần để đặt quân (caro/go, màn cảm ứng) */
  twoTap: boolean;
  /** rung nhẹ khi đặt quân thành công */
  vibrate: boolean;
  onPlay: (m: unknown) => boolean;
}

/** bàn chơi: chọn quân cho chess/xiangqi, phong cấp, chạm-hai-lần cho caro/go, gợi ý */
export function PlayBoard({ game, state, isHumanTurn, thinking, result, hint, lastMove, flipped, twoTap, vibrate, onPlay }: PlayBoardProps) {
  const disabled = !!result || thinking || !isHumanTurn;

  /* ---- chọn ô cho chess / xiangqi ---- */
  const [sel, setSel] = useState<string | number | null>(null);
  const [promo, setPromo] = useState<{ from: string; to: string } | null>(null);
  /* ---- ghost chạm-hai-lần cho caro / go ---- */
  const [ghost, setGhost] = useState<number | null>(null);

  // đổi thế (đi nước / lùi / ván mới) → bỏ chọn + ghost + phong cấp dở
  const [prevState, setPrevState] = useState(state);
  if (prevState !== state) {
    setPrevState(state);
    setSel(null);
    setPromo(null);
    setGhost(null);
  }

  const doPlay = (m: unknown) => {
    if (onPlay(m) && vibrate && typeof navigator !== "undefined") navigator.vibrate?.(8);
  };

  /* ---- cờ vua ---- */
  if (game === "chess") {
    const c = state as Chess;
    const myColor = c.turn();
    const targets = new Set<string>(
      sel != null ? c.moves({ square: sel as Square, verbose: true }).map((m) => m.to) : []
    );
    const onSquare = (sq: Square) => {
      if (disabled) return;
      if (promo) {
        setPromo(null);
        return;
      }
      if (sel != null && targets.has(sq)) {
        const p = c.get(sel as Square);
        const rank = sq[1];
        if (p?.type === "p" && (rank === "8" || rank === "1")) {
          setPromo({ from: sel as string, to: sq });
          return;
        }
        doPlay({ from: sel, to: sq });
        return;
      }
      const p = c.get(sq);
      setSel(p && p.color === myColor ? sq : null);
    };
    // vị trí panel phong cấp: nằm giữa ô đến, kẹp trong bàn
    const promoPos = promo
      ? (() => {
          const f = promo.to.charCodeAt(0) - 97;
          const r = 8 - Number(promo.to[1]);
          const vc = flipped ? 7 - f : f;
          const vr = flipped ? 7 - r : r;
          return { left: (vc + 0.5) * 12.5, top: (vr + 0.5) * 12.5 };
        })()
      : null;
    return (
      <div className="relative w-full">
        <ChessBoard
          game={c}
          selected={sel as Square | null}
          targets={targets}
          onSquare={onSquare}
          disabled={disabled}
          lastMove={lastMove ?? null}
          flipped={flipped}
          hint={hint as { from: string; to: string } | null}
        />
        {promo && promoPos && (
          <div
            className="absolute z-30 flex gap-1 rounded-xl border border-line bg-surface p-1.5 shadow-lift"
            style={{
              left: `clamp(96px, ${promoPos.left}%, calc(100% - 96px))`,
              top: `clamp(30px, ${promoPos.top}%, calc(100% - 30px))`,
              transform: "translate(-50%, -50%)",
            }}
            role="dialog"
            aria-label="Chọn quân phong cấp"
          >
            {PROMO_PIECES.map(({ t, name }) => (
              <button
                key={t}
                aria-label={`Phong ${name}`}
                className="grid h-11 w-11 place-items-center rounded-lg transition-colors duration-100 hover:bg-surface-2 active:bg-surface-2"
                onClick={() => {
                  doPlay({ from: promo.from, to: promo.to, promotion: t });
                  setPromo(null);
                }}
              >
                <span className="block h-9 w-9">
                  <Piece t={t} c={myColor} />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ---- cờ tướng ---- */
  if (game === "xiangqi") {
    const s = state as XqState;
    const targets = new Set<number>(
      sel != null ? xqLegal(s).filter((m) => m.from === sel).map((m) => m.to) : []
    );
    const onPoint = (i: number) => {
      if (disabled) return;
      if (sel != null && targets.has(i)) {
        doPlay({ from: sel, to: i });
        return;
      }
      const p = s.board[i];
      setSel(p && colorOf(p) === s.turn ? i : null);
    };
    return (
      <XiangqiBoard
        state={s}
        selected={sel as number | null}
        targets={targets}
        onPoint={onPoint}
        disabled={disabled}
        flipped={flipped}
        hint={hint as { from: number; to: number } | null}
      />
    );
  }

  /* ---- caro / cờ vây: chạm 1 lần hoặc chạm-hai-lần ---- */
  const tap = (i: number) => {
    if (disabled) return;
    if (twoTap) {
      if (ghost === i) {
        setGhost(null);
        doPlay(i);
      } else setGhost(i);
    } else doPlay(i);
  };
  const hintIdx = typeof hint === "number" && hint >= 0 ? hint : null;

  if (game === "caro") {
    return (
      <CaroBoard
        state={state as CaroState}
        onCell={tap}
        disabled={disabled}
        hint={hintIdx}
        ghost={twoTap ? ghost : null}
        coords
      />
    );
  }
  return (
    <GoBoard
      state={state as GoState}
      onPoint={tap}
      disabled={disabled}
      hint={hintIdx}
      ghost={twoTap ? ghost : null}
      coords
    />
  );
}
