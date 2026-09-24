"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { applyMove, newCaro, type CaroState } from "./games/caro/rules";
import { pickCaroMove } from "./games/caro/ai";

export const LEVELS = ["Người mới", "Dễ", "Trung bình", "Khó", "Cao thủ"] as const;

export function useCaroGame() {
  const [state, setState] = useState<CaroState>(newCaro);
  const [history, setHistory] = useState<CaroState[]>([]);
  const [level, setLevel] = useState(2);
  const [thinking, setThinking] = useState(false);
  const busy = useRef(false);

  /** Log nước đi theo thứ tự: lastMove của từng state trong history + state hiện tại */
  const moveLog = useMemo(
    () => [...history.map((s) => s.lastMove), state.lastMove].filter((m): m is number => m != null),
    [history, state]
  );

  const play = useCallback(
    (idx: number) => {
      if (busy.current) return;
      setState((s) => {
        const next = applyMove(s, idx);
        if (!next) return s;
        setHistory((h) => [...h, s]);
        if (next.winner === 0) {
          busy.current = true;
          setThinking(true);
          const delay = 300 + Math.random() * 500;
          setTimeout(() => {
            setState((cur) => {
              const mv = pickCaroMove(cur.board, cur.turn, { level });
              const after = mv == null ? cur : applyMove(cur, mv) ?? cur;
              busy.current = false;
              setThinking(false);
              if (after !== cur) setHistory((h) => [...h, cur]);
              return after;
            });
          }, delay);
        }
        return next;
      });
    },
    [level]
  );

  const undo = useCallback(() => {
    if (busy.current) return;
    setHistory((h) => {
      const target = h.length >= 2 ? h[h.length - 2] : h.length === 1 ? h[0] : null;
      if (!target) return h;
      setState(target);
      return h.slice(0, h.length >= 2 ? -2 : -1);
    });
  }, []);

  const reset = useCallback(() => {
    if (busy.current) return;
    setState(newCaro());
    setHistory([]);
  }, []);

  return { state, play, undo, reset, level, setLevel, thinking, moveLog };
}
