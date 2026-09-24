"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { applyXqMove, colorOf, legalMoves, newXiangqi, type XqState } from "./games/xiangqi/rules";
import { pickXqMove } from "./games/xiangqi/ai";

export const LEVELS = ["Người mới", "Dễ", "Trung bình", "Khó", "Cao thủ"] as const;

export function useXiangqiGame() {
  const [state, setState] = useState<XqState>(newXiangqi);
  const [history, setHistory] = useState<XqState[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [level, setLevel] = useState(2);
  const [thinking, setThinking] = useState(false);
  const busy = useRef(false);

  const targets = useMemo(
    () => new Set(selected == null ? [] : legalMoves(state).filter((m) => m.from === selected).map((m) => m.to)),
    [state, selected]
  );

  const click = useCallback(
    (i: number) => {
      if (busy.current || state.winner !== 0 || state.turn !== "r") return;
      if (selected != null && targets.has(i)) {
        const next = applyXqMove(state, { from: selected, to: i });
        if (next) {
          setHistory((h) => [...h, state]);
          setState(next);
          setSelected(null);
          if (next.winner === 0) {
            busy.current = true;
            setThinking(true);
            setTimeout(() => {
              setState((cur) => {
                const mv = pickXqMove(cur, level);
                const after = mv ? applyXqMove(cur, mv) ?? cur : cur;
                busy.current = false;
                setThinking(false);
                if (after !== cur) setHistory((h) => [...h, cur]);
                return after;
              });
            }, 300 + Math.random() * 500);
          }
        }
        return;
      }
      const p = state.board[i];
      setSelected(p && colorOf(p) === "r" ? i : null);
    },
    [state, selected, targets, level]
  );

  const undo = useCallback(() => {
    if (busy.current) return;
    setHistory((h) => {
      const target = h.length >= 2 ? h[h.length - 2] : h.length === 1 ? h[0] : null;
      if (!target) return h;
      setState(target);
      setSelected(null);
      return h.slice(0, h.length >= 2 ? -2 : -1);
    });
  }, []);

  const reset = useCallback(() => {
    if (busy.current) return;
    setState(newXiangqi());
    setHistory([]);
    setSelected(null);
  }, []);

  const status =
    state.winner === "r" ? "Bạn thắng." : state.winner === "b" ? "AI thắng." : state.winner === -1 ? "Hòa." : thinking ? "AI đang nghĩ…" : "Lượt của bạn (quân đỏ)";

  return { state, click, undo, reset, level, setLevel, thinking, selected, targets, status, moveCount: state.moves.length, moves: state.moves };
}
