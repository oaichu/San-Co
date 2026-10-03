"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { adapters, type GameId } from "@/lib/games/registry";
import type { Setup } from "@/lib/content/types";
import { CaroBoard } from "@/components/board/CaroBoard";
import { ChessBoard } from "@/components/board/ChessBoard";
import { XiangqiBoard } from "@/components/board/XiangqiBoard";
import { GoBoard } from "@/components/board/GoBoard";
import type { CaroState } from "@/lib/games/caro/rules";
import { colorOf, legalMoves, type XqState } from "@/lib/games/xiangqi/rules";
import type { GoState } from "@/lib/games/go/rules";
import type { Chess, Square } from "chess.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function build(game: GameId, setup: Setup): any {
  const a = adapters[game];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let s: any;
  if ("fen" in setup) s = a.decode({ fen: setup.fen } as never);
  else {
    s = a.init();
    for (const m of setup.moves ?? []) s = a.apply(s as never, m as never) ?? s;
  }
  return s;
}

const eq = (a: unknown, b: unknown) => (typeof a === "number" && typeof b === "number" ? a === b : JSON.stringify(a) === JSON.stringify(b));

/** Bàn demo: dựng thế rồi tự diễn moves (lặp lại) */
export function DemoBoard({ game, setup, moves, note }: { game: GameId; setup: Setup; moves?: unknown[]; note?: string }) {
  const base = useMemo(() => build(game, setup), [game, setup]);
  const [step, setStep] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const state = useMemo<any>(() => {
    let s = base;
    for (let i = 0; i < Math.min(step, moves?.length ?? 0); i++) s = adapters[game].apply(s, moves![i] as never) ?? s;
    return s;
  }, [base, step, moves, game]);

  useEffect(() => {
    if (!moves?.length) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const t = setTimeout(() => setStep(moves.length), 0);
      return () => clearTimeout(t);
    }
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setStep((st) => {
        if (st >= moves.length) {
          timer = setTimeout(() => { setStep(0); tick(); }, 2800);
          return st;
        }
        timer = setTimeout(tick, 900);
        return st + 1;
      });
    };
    timer = setTimeout(tick, 700);
    return () => clearTimeout(timer);
  }, [base, moves, game]);

  return (
    <figure className="my-6">
      <div className="mx-auto max-w-[420px]">
        <ReadOnlyBoard game={game} state={state} />
      </div>
      {note && <figcaption className="mt-3 text-center text-[13px] text-ink-3">{note}</figcaption>}
    </figure>
  );
}

/** Bàn thử: người học phải tìm đúng nước */
export function TryBoard({ game, setup, solution, hint, prompt, onSolved }: {
  game: GameId; setup: Setup; solution: unknown; hint?: string; prompt: string; onSolved?: () => void;
}) {  const base = useMemo(() => build(game, setup), [game, setup]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [state, setState] = useState<any>(base);
  const [sel, setSel] = useState<string | number | null>(null);
  const [status, setStatus] = useState<"idle" | "wrong" | "solved">("idle");
  const [showHint, setShowHint] = useState(false);
  const wrongTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const tryMove = useCallback(
    (m: unknown) => {
      if (status === "solved") return;
      if (eq(m, solution)) {
        const next = adapters[game].apply(state, m as never);
        if (next) setState(next);
        setStatus("solved");
        onSolved?.();
      } else {
        setStatus("wrong");
        clearTimeout(wrongTimer.current);
        wrongTimer.current = setTimeout(() => setStatus("idle"), 1400);
      }
    },
    [game, state, solution, status, onSolved]
  );

  const reset = () => { setState(base); setSel(null); setStatus("idle"); };

  return (
    <figure className="my-6 rounded-2xl border border-line bg-surface p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="text-[14.5px] font-medium leading-[1.6]">{prompt}</p>
        <span className="shrink-0 rounded-full border border-vermilion px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-vermilion">Thử ngay</span>
      </div>
      <div className="mx-auto max-w-[420px]">
        <InteractiveBoard game={game} state={state} sel={sel} setSel={setSel} onMove={tryMove} />
      </div>
      <div className="mt-4 flex items-center gap-3 text-[13px]">
        {status === "solved" && <span className="font-semibold text-vermilion">Chính xác.</span>}
        {status === "wrong" && <span className="font-medium text-ink-2">Chưa đúng — thử lại.</span>}
        {status === "idle" && <span className="text-ink-3">Chọn nước đi trên bàn.</span>}
        <span className="ml-auto flex gap-2">
          {hint && status !== "solved" && (
            <button onClick={() => setShowHint((v) => !v)} className="rounded-lg border border-line-2 px-3 py-1.5 text-[12px] font-semibold text-ink-2 transition-all duration-150 hover:border-ink-2 hover:text-ink active:scale-[0.97]">Gợi ý</button>
          )}
          {status !== "idle" && (
            <button onClick={reset} className="rounded-lg border border-line-2 px-3 py-1.5 text-[12px] font-semibold text-ink-2 transition-all duration-150 hover:border-ink-2 hover:text-ink active:scale-[0.97]">Làm lại</button>
          )}
        </span>
      </div>
      {showHint && hint && <p className="mt-3 border-t border-line pt-3 text-[13px] text-ink-2">{hint}</p>}
    </figure>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ReadOnlyBoard({ game, state }: { game: GameId; state: any }) {
  if (game === "caro") return <CaroBoard state={state as CaroState} disabled />;
  if (game === "chess") return <ChessBoard game={state as Chess} selected={null} targets={new Set()} disabled />;
  if (game === "xiangqi") return <XiangqiBoard state={state as XqState} selected={null} targets={new Set()} disabled />;
  return <GoBoard state={state as GoState} disabled />;
}

function InteractiveBoard({ game, state, sel, setSel, onMove, disabled }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  game: GameId; state: any; sel: string | number | null; setSel: (v: string | number | null) => void; onMove: (m: unknown) => void; disabled?: boolean;
}) {
  if (game === "caro") return <CaroBoard state={state as CaroState} disabled={disabled} onCell={(i) => onMove(i)} />;
  if (game === "chess") {
    const g = state as Chess;
    const targets = new Set(sel != null && !disabled ? g.moves({ square: sel as Square, verbose: true }).map((m) => m.to) : []);
    return (
      <ChessBoard game={g} selected={disabled ? null : sel as Square | null} targets={targets} disabled={disabled}
        onSquare={(sq) => {
          if (disabled) return;
          if (sel && targets.has(sq)) { onMove({ from: sel, to: sq }); setSel(null); return; }
          const p = g.get(sq);
          setSel(p && p.color === g.turn() ? sq : null);
        }} />
    );
  }
  if (game === "xiangqi") {
    const s = state as XqState;
    const targets = new Set<number>();
    if (sel != null && !disabled) for (const m of legalMoves(s)) if (m.from === sel) targets.add(m.to);
    return (
      <XiangqiBoard state={s} selected={disabled ? null : sel as number | null} targets={targets} disabled={disabled}
        onPoint={(i) => {
          if (disabled) return;
          if (sel != null && targets.has(i)) { onMove({ from: sel, to: i }); setSel(null); return; }
          const p = s.board[i];
          setSel(p && colorOf(p) === s.turn ? i : null);
        }} />
    );
  }
  return <GoBoard state={state as GoState} disabled={disabled} onPoint={(i) => onMove(i)} />;
}

const eqMove = (a: unknown, b: unknown) =>
  typeof a === "number" && typeof b === "number" ? a === b : JSON.stringify(a) === JSON.stringify(b);

/**
 * Bàn thế cờ: người giải đi nước mình, đúng thì đối thủ tự phản hồi theo chuỗi giải,
 * cho tới nước kết liễu. Sai 2 lần mở "xem lời giải" (diễn lại toàn bộ).
 */
export function PuzzleBoard({ game, setup, solution, hint, explain, prompt, meta, onSolved }: {
  game: GameId; setup: Setup; solution: unknown[]; hint?: string; explain?: string;
  prompt: string; meta?: string; onSolved?: () => void;
}) {
  const base = useMemo(() => build(game, setup), [game, setup]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [state, setState] = useState<any>(base);
  const [pIdx, setPIdx] = useState(0); // luôn trỏ tới nước người giải (chẵn)
  const [sel, setSel] = useState<string | number | null>(null);
  const [status, setStatus] = useState<"idle" | "wrong" | "busy" | "solved" | "shown">("idle");
  const [wrong, setWrong] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => clearTimers, []);

  const playerMoves = Math.ceil(solution.length / 2);
  const doneMoves = pIdx / 2;

  const reset = () => {
    clearTimers();
    setState(base); setPIdx(0); setSel(null); setShowHint(false);
    setStatus("idle");
  };

  /** diễn lại toàn bộ lời giải, không tính là đã giải */
  const replay = () => {
    clearTimers();
    setState(base); setPIdx(0); setSel(null); setShowHint(false);
    setStatus("busy");
    solution.forEach((m, i) => {
      timers.current.push(setTimeout(() => {
        setState((s: unknown) => adapters[game].apply(s as never, m as never) ?? s);
      }, 350 + i * 850));
    });
    timers.current.push(setTimeout(() => setStatus("shown"), 350 + solution.length * 850 + 500));
  };

  const tryMove = (m: unknown) => {
    if (status === "solved" || status === "shown" || status === "busy") return;
    if (eqMove(m, solution[pIdx])) {
      const next = adapters[game].apply(state, m as never);
      if (!next) return;
      setState(next); setSel(null);
      const ni = pIdx + 1;
      if (ni === solution.length) {
        setStatus("solved");
        onSolved?.();
        return;
      }
      setStatus("busy");
      timers.current.push(setTimeout(() => {
        setState((s: unknown) => adapters[game].apply(s as never, solution[ni] as never) ?? s);
        setPIdx(ni + 1);
        setStatus("idle");
      }, 650));
    } else {
      setStatus("wrong");
      setWrong((w) => w + 1);
      timers.current.push(setTimeout(() => setStatus("idle"), 1300));
    }
  };

  const finished = status === "solved" || status === "shown";

  return (
    <figure className="my-6 rounded-2xl border border-line bg-surface p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[14.5px] font-medium leading-[1.6]">{prompt}</p>
          {meta && <p className="mt-1 text-[12px] uppercase tracking-[0.08em] text-ink-3">{meta}</p>}
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] ${finished ? "border-vermilion text-vermilion" : "border-line-2 text-ink-3"}`}>
          {status === "solved" ? "Đã giải" : finished ? "Lời giải" : `Nước ${doneMoves + 1}/${playerMoves}`}
        </span>
      </div>
      <div className="mx-auto max-w-[420px]">
        <InteractiveBoard game={game} state={state} sel={sel} setSel={setSel} onMove={tryMove} disabled={finished} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px]">
        {status === "solved" && <span className="font-semibold text-vermilion">Chính xác.</span>}
        {status === "shown" && <span className="font-medium text-ink-2">Đó là chuỗi giải — nhấn làm lại để tự đi.</span>}
        {status === "wrong" && <span className="font-medium text-ink-2">Chưa đúng — thử nước khác.</span>}
        {status === "busy" && <span className="text-ink-3">Đối thủ phản hồi…</span>}
        {status === "idle" && <span className="text-ink-3">Chọn quân rồi chọn đích trên bàn.</span>}
        <span className="ml-auto flex gap-2">
          {hint && !finished && (
            <button onClick={() => setShowHint((v) => !v)} className="rounded-lg border border-line-2 px-3 py-1.5 text-[12px] font-semibold text-ink-2 transition-all duration-150 hover:border-ink-2 hover:text-ink active:scale-[0.97]">Gợi ý</button>
          )}
          {wrong >= 2 && !finished && (
            <button onClick={replay} className="rounded-lg border border-line-2 px-3 py-1.5 text-[12px] font-semibold text-ink-2 transition-all duration-150 hover:border-ink-2 hover:text-ink active:scale-[0.97]">Xem lời giải</button>
          )}
          {status !== "idle" && (
            <button onClick={reset} className="rounded-lg border border-line-2 px-3 py-1.5 text-[12px] font-semibold text-ink-2 transition-all duration-150 hover:border-ink-2 hover:text-ink active:scale-[0.97]">Làm lại</button>
          )}
        </span>
      </div>
      {showHint && hint && !finished && <p className="mt-3 border-t border-line pt-3 text-[13px] text-ink-2">💡 {hint}</p>}
      {finished && explain && (
        <p className="mt-3 border-t border-line pt-3 text-[13.5px] leading-[1.7] text-ink-2">{explain}</p>
      )}
    </figure>
  );
}
