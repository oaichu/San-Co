"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { pickChessMove } from "./games/chess/ai";

export const LEVELS = ["Người mới", "Dễ", "Trung bình", "Khó", "Cao thủ"] as const;

export function useChessGame() {
  const [fen, setFen] = useState(() => new Chess().fen());
  const [history, setHistory] = useState<string[]>([]);
  const [sans, setSans] = useState<string[]>([]);
  const [selected, setSelected] = useState<Square | null>(null);
  const [level, setLevel] = useState(2);
  const [thinking, setThinking] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const busy = useRef(false);

  const game = useMemo(() => new Chess(fen), [fen]);
  const targets = useMemo(
    () => new Set(selected ? game.moves({ square: selected, verbose: true }).map((m) => m.to) : []),
    [game, selected]
  );

  const maybeAi = useCallback(
    (g: Chess) => {
      if (g.isGameOver() || g.turn() !== "b") return;
      busy.current = true;
      setThinking(true);
      setTimeout(() => {
        const beforeAi = g.fen();
        const mv = pickChessMove(g, level);
        if (mv) {
          const r = g.move(mv);
          setSans((s) => [...s, r.san]);
          setLastMove({ from: r.from, to: r.to });
          setHistory((h) => [...h, beforeAi]);
          setFen(g.fen());
        }
        busy.current = false;
        setThinking(false);
      }, 300 + Math.random() * 500);
    },
    [level]
  );

  const click = useCallback(
    (sq: Square) => {
      if (busy.current || game.isGameOver() || game.turn() !== "w") return;
      if (selected && targets.has(sq)) {
        const g = new Chess(fen);
        const r = g.move({ from: selected, to: sq, promotion: "q" });
        if (r) {
          setSans((s) => [...s, r.san]);
          setLastMove({ from: r.from, to: r.to });
          setHistory((h) => [...h, fen]);
          setFen(g.fen());
          setSelected(null);
          maybeAi(g);
        }
        return;
      }
      const piece = game.get(sq);
      setSelected(piece?.color === "w" ? sq : null);
    },
    [game, fen, selected, targets, maybeAi]
  );

  const undo = useCallback(() => {
    if (busy.current) return;
    setHistory((h) => {
      const target = h.length >= 2 ? h[h.length - 2] : h.length === 1 ? h[0] : null;
      if (!target) return h;
      setFen(target);
      setSans((s) => s.slice(0, h.length >= 2 ? -2 : -1));
      setSelected(null);
      setLastMove(null);
      return h.slice(0, h.length >= 2 ? -2 : -1);
    });
  }, []);

  const reset = useCallback(() => {
    if (busy.current) return;
    setFen(new Chess().fen());
    setHistory([]);
    setSans([]);
    setSelected(null);
    setLastMove(null);
  }, []);

  const status = game.isCheckmate()
    ? game.turn() === "w" ? "AI thắng — chiếu hết." : "Bạn thắng — chiếu hết."
    : game.isDraw() || game.isStalemate() ? "Hòa."
    : thinking ? "AI đang nghĩ…"
    : game.inCheck() ? "Bạn đang bị chiếu." : "Lượt của bạn";

  return { game, click, undo, reset, level, setLevel, thinking, selected, targets, sans, lastMove, status, moves: history.length };
}
