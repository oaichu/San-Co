"use client";

import { useCallback, useRef, useState } from "react";
import { applyGoMove, newGo, scoreGo, type GoState } from "./games/go/rules";
import { pickGoMove } from "./games/go/ai";

export const LEVELS = ["Người mới", "Dễ", "Trung bình", "Khó", "Cao thủ"] as const;

export function useGoGame() {
  const [state, setState] = useState<GoState>(newGo);
  const [, setHistory] = useState<GoState[]>([]);
  const [level, setLevel] = useState(2);
  const [thinking, setThinking] = useState(false);
  const busy = useRef(false);

  const apply = useCallback(
    (move: number) => {
      if (busy.current) return;
      const next = applyGoMove(state, move);
      if (!next) return;
      setHistory((h) => [...h, state]);
      setState(next);
      if (!next.done) {
        busy.current = true;
        setThinking(true);
        setTimeout(() => {
          setState((cur) => {
            const mv = pickGoMove(cur, level);
            const after = mv == null ? cur : applyGoMove(cur, mv) ?? cur;
            busy.current = false;
            setThinking(false);
            if (after !== cur) setHistory((h) => [...h, cur]);
            return after;
          });
        }, 300 + Math.random() * 500);
      }
    },
    [state, level]
  );

  const pass = useCallback(() => apply(-1), [apply]);

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
    setState(newGo());
    setHistory([]);
  }, []);

  const [b, w] = scoreGo(state.board);
  const status = state.done
    ? b > w ? `Đen thắng ${(b - w).toFixed(1)} điểm.` : `Trắng thắng ${(w - b).toFixed(1)} điểm.`
    : thinking ? "AI đang nghĩ…" : "Lượt của bạn (quân đen)";

  return { state, play: apply, pass, undo, reset, level, setLevel, thinking, status, score: [b, w] as const, moveCount: state.moves.length };
}
