"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { adapters, type GameId, type GameResult, type Seat } from "@/lib/games/registry";
import { CARO_N } from "@/lib/games/caro/rules";
import { goSize as boardSizeOf, newGo, scoreGo } from "@/lib/games/go/rules";
import { XQ_W, type XqMove } from "@/lib/games/xiangqi/rules";
import { useAi } from "./useAi";
import type { Level } from "./levels";

export type Mode = "ai" | "local";
export interface GameSetup {
  mode: Mode;
  level: Level;
  humanSeat: Seat;
  goSize?: 9 | 13 | 19;
}

/* ---------- notation ---------- */

const xqLbl = (i: number) => `${String.fromCharCode(97 + (i % XQ_W))}${10 - Math.floor(i / XQ_W)}`;

function notation(game: GameId, move: unknown, sizeBefore: number): string {
  switch (game) {
    case "caro": {
      const i = move as number;
      return `${String.fromCharCode(65 + (i % CARO_N))}${CARO_N - Math.floor(i / CARO_N)}`;
    }
    case "xiangqi": {
      const m = move as XqMove;
      return `${xqLbl(m.from)}→${xqLbl(m.to)}`;
    }
    case "go": {
      const i = move as number;
      if (i === -1) return "Bỏ lượt";
      const col = i % sizeBefore;
      const row = Math.floor(i / sizeBefore);
      // bỏ chữ I như ký hiệu cờ vây chuẩn
      return `${String.fromCharCode(65 + col + (col >= 8 ? 1 : 0))}${sizeBefore - row}`;
    }
    default:
      return "";
  }
}

/* ---------- kết quả / lý do ---------- */

/** khóa thế cờ cho luật lặp 3 lần (bỏ đồng hồ nước trong FEN) */
const posKey = (c: Chess) => c.fen().split(" ").slice(0, 4).join(" ");

function chessResult(top: Chess, stack: unknown[]): GameResult {
  if (top.isCheckmate()) return top.turn() === "w" ? "p2" : "p1";
  if (top.isStalemate() || top.isDrawByFiftyMoves() || top.isInsufficientMaterial()) return "draw";
  // stack lưu Chess theo FEN nên isThreefoldRepetition() không có history — đếm tay
  const k = posKey(top);
  let seen = 0;
  for (const s of stack) if (posKey(s as Chess) === k && ++seen >= 3) return "draw";
  return null;
}

function chessReason(top: Chess, stack: unknown[]): string {
  if (top.isCheckmate()) return "Chiếu hết";
  if (top.isStalemate()) return "Hết nước đi — hòa pat";
  if (top.isInsufficientMaterial()) return "Không đủ quân chiếu hết";
  if (top.isDrawByFiftyMoves()) return "Luật 50 nước";
  const k = posKey(top);
  let seen = 0;
  for (const s of stack) if (posKey(s as Chess) === k && ++seen >= 3) return "Lặp lại ba lần";
  return "Hòa";
}

/* ---------- stats ---------- */

const STATS_KEY = "sc-stats-v1";
type StatLine = { w: number; l: number; d: number };
export type StatsTable = Record<string, Record<string, StatLine>>;

export function readStats(): StatsTable {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY) ?? "{}") as StatsTable;
  } catch {
    return {};
  }
}

function recordStat(game: GameId, setup: GameSetup, res: Exclude<GameResult, null>) {
  try {
    const all = readStats();
    const key = setup.mode === "ai" ? `ai-${setup.level}` : "local";
    const g = (all[game] ??= {});
    const s = (g[key] ??= { w: 0, l: 0, d: 0 });
    if (res === "draw") s.d++;
    else if (setup.mode === "ai") {
      if (res === setup.humanSeat) s.w++;
      else s.l++;
    } else if (res === "p1") s.w++;
    else s.l++;
    localStorage.setItem(STATS_KEY, JSON.stringify(all));
  } catch {
    /* localStorage tắt */
  }
}

/* ---------- session ---------- */

interface Session {
  stack: unknown[]; // stack[0] = thế mở
  moves: unknown[];
  notes: string[];
  startedAt: number;
  hintsUsed: number;
  resigned: Seat | null;
}

const other = (s: Seat): Seat => (s === "p1" ? "p2" : "p1");
const AI_DELAY = 350;

export function useGame(game: GameId, initialSetup?: Partial<GameSetup>) {
  const a = adapters[game];
  const ai = useAi();

  const [setup, setSetup] = useState<GameSetup>(() => ({ mode: "ai", level: 2, humanSeat: "p1", ...initialSetup }));

  const initialFor = useCallback(
    (su: GameSetup): unknown => (game === "go" ? newGo(su.goSize ?? 9) : a.init()),
    [a, game]
  );

  const fresh = useCallback(
    (su: GameSetup): Session => ({ stack: [initialFor(su)], moves: [], notes: [], startedAt: Date.now(), hintsUsed: 0, resigned: null }),
    [initialFor]
  );

  const [session, setSession] = useState<Session>(() => fresh({ mode: "ai", level: 2, humanSeat: "p1", ...initialSetup }));
  const sessionRef = useRef(session);
  const setupRef = useRef(setup);
  const [thinking, setThinking] = useState(false);
  const [hint, setHint] = useState<unknown | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statsDone = useRef(false);

  const applySession = useCallback((s: Session) => {
    sessionRef.current = s;
    setSession(s);
  }, []);

  const persist = useCallback(
    (s: Session, su: GameSetup) => {
      try {
        const key = `sc-game-v1-${game}`;
        if (s.moves.length === 0) localStorage.removeItem(key);
        else localStorage.setItem(key, JSON.stringify({ setup: su, moves: s.moves, startedAt: s.startedAt, hintsUsed: s.hintsUsed }));
      } catch {
        /* localStorage tắt */
      }
    },
    [game]
  );

  const top = session.stack[session.stack.length - 1];

  const result: GameResult = session.resigned
    ? other(session.resigned)
    : game === "chess"
      ? chessResult(top as Chess, session.stack)
      : (a.result(top as never) as GameResult);

  const resultReason: string | null = !result
    ? null
    : session.resigned
      ? "Xin thua"
      : game === "caro"
        ? (top as { winner: number }).winner === -1
          ? "Kín bàn"
          : "Đủ năm quân"
        : game === "chess"
          ? chessReason(top as Chess, session.stack)
          : game === "xiangqi"
            ? (top as { winner: number | string }).winner === -1
              ? "120 nước không ăn quân"
              : "Chiếu hết"
            : (() => {
                const [b, w] = scoreGo((top as { board: number[] }).board);
                const diff = b - w;
                return `Hai bên cùng bỏ lượt · ${diff > 0 ? `Đen +${diff.toFixed(1)}` : `Trắng +${(-diff).toFixed(1)}`}`;
              })();

  /* ---------- đẩy nước đi vào stack (dùng chung cho người chơi + AI) ---------- */
  const pushMove = useCallback(
    (m: unknown): boolean => {
      const ses = sessionRef.current;
      const su = setupRef.current;
      const topS = ses.stack[ses.stack.length - 1];
      let note: string;
      let next: unknown;
      if (game === "chess") {
        const mv = m as { from: string; to: string; promotion?: string };
        // clone để lấy SAN — stack lưu Chess theo FEN, không có history
        let r;
        try {
          r = new Chess((topS as Chess).fen()).move({ from: mv.from, to: mv.to, promotion: mv.promotion ?? "q" });
        } catch {
          return false;
        }
        if (!r) return false;
        next = a.apply(topS as never, m as never);
        if (!next) return false;
        note = r.san;
      } else {
        next = a.apply(topS as never, m as never);
        if (!next) return false;
        const size = game === "go" ? boardSizeOf((topS as { board: number[] }).board) : 0;
        note = notation(game, m, size);
      }
      const ns: Session = { ...ses, stack: [...ses.stack, next], moves: [...ses.moves, m], notes: [...ses.notes, note] };
      applySession(ns);
      persist(ns, su);
      setHint(null);
      return true;
    },
    [a, applySession, game, persist]
  );

  const play = useCallback(
    (m: unknown): boolean => {
      const ses = sessionRef.current;
      const su = setupRef.current;
      const topS = ses.stack[ses.stack.length - 1];
      if (result || thinking) return false;
      if (su.mode === "ai" && a.seatToMove(topS as never) !== su.humanSeat) return false;
      return pushMove(m);
    },
    [a, pushMove, result, thinking]
  );

  const undo = useCallback(() => {
    ai.cancel();
    setThinking(false);
    const ses = sessionRef.current;
    const su = setupRef.current;
    if (ses.stack.length <= 1) return;
    let cut = ses.stack.length - 1;
    if (su.mode === "ai") {
      cut -= 1;
      while (cut > 0 && a.seatToMove(ses.stack[cut] as never) !== su.humanSeat) cut -= 1;
    } else {
      cut -= 1;
    }
    const moves2 = ses.moves.slice(0, cut);
    applySession({ ...ses, stack: ses.stack.slice(0, cut + 1), moves: moves2, notes: ses.notes.slice(0, cut), resigned: null });
    persist({ ...ses, moves: moves2 }, su);
    setHint(null);
  }, [a, ai, applySession, persist]);

  const movesMade = session.moves.length;
  const canUndo = !result
    ? setup.mode === "ai"
      ? movesMade >= (setup.humanSeat === "p2" ? 2 : 1)
      : movesMade > 0
    : movesMade > 0;

  const resign = useCallback(() => {
    const ses = sessionRef.current;
    const su = setupRef.current;
    if (result) return;
    ai.cancel();
    setThinking(false);
    const topS = ses.stack[ses.stack.length - 1];
    const loser = su.mode === "ai" ? su.humanSeat : a.seatToMove(topS as never);
    applySession({ ...ses, resigned: loser });
  }, [a, ai, applySession, result]);

  const newGame = useCallback(
    (next?: Partial<GameSetup>) => {
      ai.cancel();
      setThinking(false);
      setHint(null);
      const su: GameSetup = { ...setupRef.current, ...next };
      setupRef.current = su;
      setSetup(su);
      try {
        localStorage.setItem(`sc-setup-v1-${game}`, JSON.stringify(su));
        localStorage.removeItem(`sc-game-v1-${game}`);
      } catch {
        /* localStorage tắt */
      }
      statsDone.current = false;
      applySession(fresh(su));
    },
    [ai, applySession, fresh, game]
  );

  /* ---------- AI đi khi tới lượt ---------- */
  useEffect(() => {
    const su = setup;
    if (su.mode !== "ai" || result) return;
    const topS = session.stack[session.stack.length - 1];
    if (a.seatToMove(topS as never) === su.humanSeat) return;
    const moveCountAtReq = session.moves.length;
    const t0 = Date.now();
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    queueMicrotask(() => {
      if (!cancelled) setThinking(true);
    });
    ai.request(game, topS, su.level, {}).then((mv) => {
      if (cancelled) return;
      const wait = Math.max(0, AI_DELAY - (Date.now() - t0));
      timer = setTimeout(() => {
        if (cancelled) return;
        const cur = sessionRef.current;
        setThinking(false);
        if (cur.moves.length !== moveCountAtReq) return; // undo/newGame đã xen vào
        if (mv != null) pushMove(mv);
      }, wait);
    });
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, session, setup, result]);

  /* ---------- khôi phục ván đang chơi + setup đã lưu ---------- */
  useEffect(() => {
    // hoãn ra khỏi render đầu — SSR mount xong mới đọc localStorage và set state
    const t = setTimeout(() => {
      try {
        const raw = localStorage.getItem(`sc-game-v1-${game}`);
        if (raw) {
          const data = JSON.parse(raw) as { setup?: Partial<GameSetup>; moves?: unknown[]; startedAt?: number; hintsUsed?: number };
          const su: GameSetup = { mode: "ai", level: 2, humanSeat: "p1", ...data.setup };
          const stack: unknown[] = [initialFor(su)];
          const moves: unknown[] = [];
          const notes: string[] = [];
          let ok = true;
          for (const m of data.moves ?? []) {
            const prev = stack[stack.length - 1];
            let note = "";
            if (game === "chess") {
              const mv = m as { from: string; to: string; promotion?: string };
              try {
                const r = new Chess((prev as Chess).fen()).move({ from: mv.from, to: mv.to, promotion: mv.promotion ?? "q" });
                if (!r) {
                  ok = false;
                  break;
                }
                note = r.san;
              } catch {
                ok = false;
                break;
              }
            }
            const nxt = a.apply(prev as never, m as never);
            if (!nxt) {
              ok = false;
              break;
            }
            if (game !== "chess") {
              const size = game === "go" ? boardSizeOf((prev as { board: number[] }).board) : 0;
              note = notation(game, m, size);
            }
            stack.push(nxt);
            moves.push(m);
            notes.push(note);
          }
          if (ok && moves.length > 0) {
            setupRef.current = su;
            setSetup(su);
            statsDone.current = false;
            applySession({ stack, moves, notes, startedAt: data.startedAt ?? Date.now(), hintsUsed: data.hintsUsed ?? 0, resigned: null });
            return;
          }
        }
        const setupRaw = localStorage.getItem(`sc-setup-v1-${game}`);
        if (setupRaw) {
          const su: GameSetup = { mode: "ai", level: 2, humanSeat: "p1", ...JSON.parse(setupRaw) };
          setupRef.current = su;
          setSetup(su);
          applySession(fresh(su));
        }
      } catch {
        /* dữ liệu hỏng → bỏ qua, chơi ván mới */
      }
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  /* ---------- ghi stats + dọn ván đã kết thúc ---------- */
  useEffect(() => {
    if (!result || statsDone.current) return;
    statsDone.current = true;
    recordStat(game, setupRef.current, result);
    try {
      localStorage.removeItem(`sc-game-v1-${game}`);
    } catch {
      /* localStorage tắt */
    }
  }, [game, result]);

  /* ---------- gợi ý ---------- */
  const requestHint = useCallback(() => {
    if (result || thinking) return;
    const ses = sessionRef.current;
    const su = setupRef.current;
    const topS = ses.stack[ses.stack.length - 1];
    if (su.mode === "ai" && a.seatToMove(topS as never) !== su.humanSeat) return;
    const moveCountAtReq = ses.moves.length;
    applySession({ ...ses, hintsUsed: ses.hintsUsed + 1 });
    ai.request(game, topS, 4, {}).then((mv) => {
      if (mv == null) return;
      if (sessionRef.current.moves.length !== moveCountAtReq) return; // đã có nước mới — gợi ý cũ vô dụng
      setHint(mv);
      if (hintTimer.current) clearTimeout(hintTimer.current);
      hintTimer.current = setTimeout(() => setHint(null), 4000);
    });
  }, [a, ai, applySession, game, result, thinking]);

  useEffect(
    () => () => {
      if (hintTimer.current) clearTimeout(hintTimer.current);
    },
    []
  );

  const turn: Seat = a.seatToMove(top as never);
  const lastMove =
    game === "chess"
      ? (() => {
          const m = session.moves[session.moves.length - 1] as { from: string; to: string } | undefined;
          return m ? { from: m.from, to: m.to } : null;
        })()
      : ((top as { lastMove?: unknown }).lastMove ?? null);

  return {
    setup,
    newGame,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state: top as any,
    moves: session.moves,
    notation: session.notes,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lastMove: lastMove as any,
    turn,
    isHumanTurn: setup.mode === "local" ? true : turn === setup.humanSeat,
    thinking,
    result,
    resultReason,
    winnerSeat: result === "draw" ? null : result,
    play,
    undo,
    canUndo,
    resign,
    hint,
    requestHint,
    hintsUsed: session.hintsUsed,
    startedAt: session.startedAt,
    moveCount: session.moves.length,
  };
}
