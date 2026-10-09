"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  Heart,
  Lightbulb,
  RotateCcw,
  Star,
} from "lucide-react";
import { Nav } from "@/components/Nav";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PUZZLES } from "@/lib/content/puzzles";
import { buildStreak, dailyPuzzle, dayKey } from "@/lib/content/daily";
import { build, PuzzleBoard, type PuzzleBoardHandle, type PuzzleBoardMeta } from "@/components/learn/LessonBoard";
import { PuzzleThumb } from "./PuzzleThumb";
import { GAMES } from "@/components/board/skins";
import type { GameId } from "@/lib/games/registry";
import type { Puzzle } from "@/lib/content/types";
import { useMedia } from "@/components/play/useMedia";

const LS_KEY = "san-co-puzzle-done";
const DAILY_KEY = "sc-daily-v1";
const STREAK_KEY = "sc-streak-best-v1";

const gameLabel = (id: GameId) => GAMES.find((g) => g.id === id)?.name ?? id;

const loadLocal = (): Set<string> => {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(LS_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
};

function Stars({ n, size = 11 }: { n: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5 text-vermilion" aria-label={`Độ khó ${n} trên 3`}>
      {Array.from({ length: n }, (_, i) => (
        <Star key={i} size={size} fill="currentColor" strokeWidth={0} />
      ))}
    </span>
  );
}

/* ---- chuỗi ngày daily ---- */
const readDailyMap = (): Record<string, boolean> => {
  try {
    return JSON.parse(localStorage.getItem(DAILY_KEY) ?? "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
};
const shiftKey = (key: string, days: number) => {
  const [y, m, d] = key.split("-").map(Number);
  return dayKey(new Date(Date.UTC(y, m - 1, d) + days * 86_400_000));
};
function dailyStreak(): number {
  const map = readDailyMap();
  let key = dayKey();
  if (!map[key]) key = shiftKey(key, -1); // hôm nay chưa giải thì chuỗi tính tới hôm qua
  let n = 0;
  while (map[key]) {
    n++;
    key = shiftKey(key, -1);
  }
  return n;
}
const markDailyDone = () => {
  try {
    const m = readDailyMap();
    m[dayKey()] = true;
    localStorage.setItem(DAILY_KEY, JSON.stringify(m));
  } catch {
    /* localStorage tắt */
  }
};

/* ================= solver ================= */

function Solver({
  puzzle,
  bare,
  boardRef,
  onMeta,
  onSolved,
}: {
  puzzle: Puzzle;
  bare?: boolean;
  boardRef?: RefObject<PuzzleBoardHandle | null>;
  onMeta?: (m: PuzzleBoardMeta) => void;
  onSolved: () => void;
}) {
  return (
    <PuzzleBoard
      ref={boardRef}
      key={puzzle.id}
      bare={bare}
      game={puzzle.game}
      setup={puzzle.setup}
      solution={puzzle.solution}
      hint={puzzle.hint}
      explain={puzzle.explain}
      prompt={puzzle.title}
      meta={[gameLabel(puzzle.game), puzzle.theme, `Độ khó ${puzzle.difficulty}/3`].filter(Boolean).join(" · ")}
      onMeta={onMeta}
      onSolved={onSolved}
    />
  );
}

/* ================= streak ================= */

function StreakPanel({ markSolved }: { markSolved: (id: string) => void }) {
  const [pick, setPick] = useState<GameId | "all">("all");
  const [run, setRun] = useState<{ seq: Puzzle[]; idx: number; lives: number; score: number; over: boolean } | null>(null);
  const [best, setBest] = useState<Record<string, number>>({});

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        setBest(JSON.parse(localStorage.getItem(STREAK_KEY) ?? "{}") as Record<string, number>);
      } catch {
        /* bỏ qua */
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // lưu kỷ lục khi ván streak kết thúc
  useEffect(() => {
    if (!run?.over) return;
    const nb = { ...best, [pick]: Math.max(best[pick] ?? 0, run.score) };
    try {
      localStorage.setItem(STREAK_KEY, JSON.stringify(nb));
    } catch {
      /* localStorage tắt */
    }
    queueMicrotask(() => setBest(nb));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.over]);

  const start = () => setRun({ seq: buildStreak(pick, Date.now()), idx: 0, lives: 3, score: 0, over: false });
  const advance = () =>
    setRun((r) =>
      r ? { ...r, idx: r.idx + 1, over: r.lives <= 0 || r.idx + 1 >= r.seq.length } : r
    );

  if (!run) {
    const tgItem =
      "min-h-[44px] flex-1 rounded-lg border border-line px-3 text-[13px] font-medium text-ink-2 transition-colors duration-150 data-[pressed]:border-vermilion data-[pressed]:bg-vermilion-soft data-[pressed]:text-ink hover:text-ink";
    return (
      <div className="mt-8 max-w-[560px]">
        <p className="text-[14.5px] leading-[1.65] text-ink-2">
          Giải thế liên tiếp từ dễ tới khó. Sai một nước mất một mạng — hết ba mạng thì dừng.
        </p>
        <div className="mt-6">
          <div className="mb-2 text-[13px] font-semibold text-ink">Chọn cờ</div>
          <ToggleGroup value={[pick]} onValueChange={(v) => v[0] && setPick(v[0] as GameId | "all")} className="w-full flex-wrap gap-2">
            <ToggleGroupItem value="all" className={tgItem}>Tất cả</ToggleGroupItem>
            {GAMES.map((g) => (
              <ToggleGroupItem key={g.id} value={g.id} className={tgItem}>{g.name}</ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <button
          onClick={start}
          className="mt-6 min-h-[48px] w-full rounded-xl bg-vermilion text-[15px] font-semibold text-accent-ink transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98]"
        >
          Bắt đầu
        </button>
        {(best[pick] ?? 0) > 0 && <p className="tabular mt-3 text-center text-[12.5px] text-ink-3">Kỷ lục: {best[pick]} thế</p>}
      </div>
    );
  }

  if (run.over) {
    return (
      <div className="mt-12 max-w-[400px] text-center">
        <div className="tabular font-display text-[64px] font-bold leading-none text-ink">{run.score}</div>
        <p className="mt-2 text-[14px] text-ink-2">thế đã giải</p>
        <p className="tabular mt-1 text-[12.5px] text-ink-3">Kỷ lục: {Math.max(best[pick] ?? 0, run.score)}</p>
        <div className="mt-6 flex gap-2">
          <button
            onClick={start}
            className="min-h-[46px] flex-1 rounded-xl bg-vermilion text-[14px] font-semibold text-accent-ink transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            Chơi lại
          </button>
          <button
            onClick={() => setRun(null)}
            className="min-h-[46px] flex-1 rounded-xl border border-line text-[14px] font-semibold text-ink transition-colors duration-150 hover:bg-surface"
          >
            Đổi cờ
          </button>
        </div>
      </div>
    );
  }

  const p = run.seq[run.idx];
  return (
    <div className="mt-6 max-w-[560px]">
      <div className="mb-4 flex items-center gap-4">
        <span className="flex items-center gap-1" aria-label={`Còn ${run.lives} mạng`}>
          {[0, 1, 2].map((i) => (
            <Heart
              key={i}
              size={17}
              className={i < run.lives ? "text-vermilion" : "text-line-2"}
              fill={i < run.lives ? "currentColor" : "none"}
            />
          ))}
        </span>
        <span className="tabular text-[13.5px] font-semibold text-ink">{run.score} điểm</span>
        <span className="tabular ml-auto text-[12.5px] text-ink-3">
          Thế {run.idx + 1}/{run.seq.length}
        </span>
      </div>
      <StreakSolver
        key={run.idx}
        puzzle={p}
        onSolved={() => {
          markSolved(p.id);
          setRun((r) => (r ? { ...r, score: r.score + 1 } : r));
          setTimeout(advance, 900);
        }}
        onWrong={() => setRun((r) => (r ? { ...r, lives: Math.max(0, r.lives - 1) } : r))}
        onReplayDone={advance}
      />
    </div>
  );
}

// streak cần autoRevealAfter=1 + onWrong/onReplayDone — bọc riêng để truyền đủ props
function StreakSolver({
  puzzle,
  onSolved,
  onWrong,
  onReplayDone,
}: {
  puzzle: Puzzle;
  onSolved: () => void;
  onWrong: (n: number) => void;
  onReplayDone: () => void;
}) {
  return (
    <PuzzleBoard
      key={puzzle.id}
      game={puzzle.game}
      setup={puzzle.setup}
      solution={puzzle.solution}
      hint={puzzle.hint}
      explain={puzzle.explain}
      prompt={puzzle.title}
      meta={[gameLabel(puzzle.game), puzzle.theme, `Độ khó ${puzzle.difficulty}/3`].filter(Boolean).join(" · ")}
      autoRevealAfter={1}
      onSolved={onSolved}
      onWrong={onWrong}
      onReplayDone={onReplayDone}
    />
  );
}

/* ================= app ================= */

function PuzzleAppInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const desktop = useMedia("(min-width: 1024px)");

  const openId = sp.get("id");
  const isDaily = sp.get("daily") === "1";
  const streakMode = sp.get("mode") === "streak";

  const [solved, setSolved] = useState<Set<string>>(new Set());
  const [fGame, setFGame] = useState<GameId>("chess");
  const [fDiff, setFDiff] = useState<0 | 1 | 2 | 3>(0);
  const [fTheme, setFTheme] = useState<string | null>(null);
  const [hideSolved, setHideSolved] = useState(false);
  const [daily, setDaily] = useState<Puzzle | null>(null);
  const [streak, setStreak] = useState(0);
  const [meta, setMeta] = useState<PuzzleBoardMeta>({ wrong: 0, finished: false, status: "idle" });
  const boardRef = useRef<PuzzleBoardHandle | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.resolve()
      .then(() => {
        if (alive) {
          setSolved(loadLocal());
          setDaily(dailyPuzzle());
          setStreak(dailyStreak());
        }
        return fetch("/api/progress/puzzle")
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (alive && d?.puzzles) setSolved((s) => new Set([...s, ...(d.puzzles as string[])]));
          });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const markSolved = (id: string) => {
    setSolved((s) => new Set(s).add(id));
    try {
      const local = loadLocal();
      local.add(id);
      localStorage.setItem(LS_KEY, JSON.stringify([...local]));
    } catch {
      /* localStorage tắt */
    }
    if (daily && id === daily.id) {
      markDailyDone();
      setStreak(dailyStreak());
    }
    fetch("/api/puzzle/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ puzzleId: id, solved: true }),
    }).catch(() => {});
  };

  const themes = useMemo(
    () => [...new Set(PUZZLES.filter((p) => p.game === fGame && p.theme).map((p) => p.theme as string))],
    [fGame]
  );

  const list = useMemo(
    () =>
      PUZZLES.filter(
        (p) =>
          p.game === fGame &&
          (fDiff === 0 || p.difficulty === fDiff) &&
          (!fTheme || p.theme === fTheme) &&
          (!hideSolved || !solved.has(p.id))
      ),
    [fGame, fDiff, fTheme, hideSolved, solved]
  );

  const openP = useMemo(() => {
    if (isDaily && daily) return daily;
    if (openId) return PUZZLES.find((p) => p.id === openId) ?? null;
    return null;
  }, [isDaily, daily, openId]);

  /** thế tiếp theo chưa giải trong game đang lọc */
  const nextUnsolved = (from: Puzzle) => {
    const gl = PUZZLES.filter((p) => p.game === from.game);
    const start = gl.findIndex((p) => p.id === from.id) + 1;
    for (let i = 0; i < gl.length; i++) {
      const p = gl[(start + i) % gl.length];
      if (!solved.has(p.id)) return p;
    }
    return gl[0] ?? null;
  };

  const openPuzzle = (id: string) => router.push(`/puzzle?id=${id}`);
  const closeSolver = () => router.push("/puzzle");
  const goNext = (from: Puzzle) => {
    const n = nextUnsolved(from);
    if (n) openPuzzle(n.id);
  };

  const gameList = PUZZLES.filter((p) => p.game === fGame);
  const solvedCount = gameList.filter((p) => solved.has(p.id)).length;

  const mBarBtn =
    "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10.5px] font-semibold text-ink-2 transition-colors duration-150 enabled:hover:text-ink disabled:opacity-35";

  return (
    <main className="relative min-h-dvh">
      <Nav />
      <div className="mx-auto max-w-[1100px] px-5 pb-24 pt-[calc(68px+40px)] md:px-11">
        <h1 className="font-display text-[clamp(34px,4.5vw,54px)] font-bold tracking-[-0.025em]">Thế cờ.</h1>
        <p className="mt-3 max-w-[52ch] text-[15px] leading-[1.65] text-ink-2">
          Đi đúng nước mấu chốt, đối thủ phản hồi theo kịch bản — chơi tới khi kết liễu.
        </p>

        {/* hôm nay */}
        <div className="mt-10 flex items-center gap-5 rounded-2xl border border-line bg-surface p-5 md:p-6">
          {daily && (
            <div className="w-[104px] shrink-0 sm:w-[136px]">
              <PuzzleThumb game={daily.game} state={build(daily.game, daily.setup)} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            {daily && (
              <>
                <h2 className="truncate font-display text-[19px] font-semibold text-ink">{daily.title}</h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px] text-ink-2">
                  <span className="rounded-md bg-vermilion-soft px-1.5 py-0.5 text-[11px] font-semibold text-vermilion">Hôm nay</span>
                  {gameLabel(daily.game)}
                  <Stars n={daily.difficulty} />
                  {streak > 0 && <span className="tabular font-medium">Chuỗi {streak} ngày</span>}
                  {solved.has(daily.id) && (
                    <span className="flex items-center gap-1 font-semibold text-vermilion">
                      <Check size={12} /> Đã giải
                    </span>
                  )}
                </div>
              </>
            )}
            <div className="mt-3">
              <button
                onClick={() => router.push("/puzzle?daily=1")}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-vermilion px-4 text-[13px] font-semibold text-accent-ink transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.97]"
              >
                Giải thế hôm nay <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* tabs */}
        <div className="mt-10 flex gap-1.5 border-b border-line pb-px">
          <button
            onClick={() => router.push("/puzzle")}
            className={`rounded-t-lg px-4 py-2.5 text-[13.5px] font-semibold transition-colors duration-150 ${
              !streakMode ? "bg-surface text-ink shadow-[inset_0_-2px_0_var(--vermilion)]" : "text-ink-2 hover:text-ink"
            }`}
          >
            Thư viện
          </button>
          <button
            onClick={() => router.push("/puzzle?mode=streak")}
            className={`rounded-t-lg px-4 py-2.5 text-[13.5px] font-semibold transition-colors duration-150 ${
              streakMode ? "bg-surface text-ink shadow-[inset_0_-2px_0_var(--vermilion)]" : "text-ink-2 hover:text-ink"
            }`}
          >
            Liên hoàn
          </button>
        </div>

        {streakMode ? (
          <StreakPanel markSolved={markSolved} />
        ) : (
          <>
            {/* bộ lọc */}
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
              <ToggleGroup
                value={[fGame]}
                onValueChange={(v) => {
                  if (!v[0]) return;
                  setFGame(v[0] as GameId);
                  setFTheme(null);
                }}
                className="flex-wrap gap-1.5"
              >
                {GAMES.map((g) => {
                  const total = PUZZLES.filter((p) => p.game === g.id).length;
                  const done = PUZZLES.filter((p) => p.game === g.id && solved.has(p.id)).length;
                  return (
                    <ToggleGroupItem
                      key={g.id}
                      value={g.id}
                      className="min-h-[40px] rounded-lg border border-line px-3 text-[12.5px] font-medium text-ink-2 transition-colors duration-150 data-[pressed]:border-vermilion data-[pressed]:bg-vermilion-soft data-[pressed]:text-ink hover:text-ink"
                    >
                      {g.name} <span className="tabular ml-1 text-[10.5px] text-ink-3">{done}/{total}</span>
                    </ToggleGroupItem>
                  );
                })}
              </ToggleGroup>

              <div className="flex gap-1" role="radiogroup" aria-label="Độ khó">
                {([0, 1, 2, 3] as const).map((d) => (
                  <button
                    key={d}
                    role="radio"
                    aria-checked={fDiff === d}
                    onClick={() => setFDiff(d)}
                    className={`flex min-h-[40px] items-center gap-1 rounded-lg border px-3 text-[12.5px] font-medium transition-colors duration-150 ${
                      fDiff === d ? "border-vermilion bg-vermilion-soft text-ink" : "border-line text-ink-2 hover:text-ink"
                    }`}
                  >
                    {d === 0 ? "Tất cả" : <Stars n={d} size={10} />}
                  </button>
                ))}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger className="flex min-h-[40px] items-center gap-1.5 rounded-lg border border-line px-3 text-[12.5px] font-medium text-ink-2 transition-colors hover:text-ink">
                  {fTheme ?? "Chủ đề"} <ChevronDown size={13} className="text-ink-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="border-line bg-surface text-ink">
                  <DropdownMenuRadioGroup value={fTheme ?? ""} onValueChange={(v) => setFTheme(v === "" ? null : v)}>
                    <DropdownMenuRadioItem value="">Tất cả chủ đề</DropdownMenuRadioItem>
                    {themes.map((t) => (
                      <DropdownMenuRadioItem key={t} value={t}>
                        {t}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <label className="flex min-h-[40px] cursor-pointer items-center gap-2 text-[12.5px] font-medium text-ink-2">
                <Switch checked={hideSolved} onCheckedChange={(v) => setHideSolved(!!v)} aria-label="Ẩn thế đã giải" />
                Ẩn thế đã giải
              </label>

              <span className="tabular ml-auto text-[12.5px] text-ink-3">
                {solvedCount}/{gameList.length} đã giải
              </span>
            </div>

            <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_minmax(380px,460px)]">
              <ul className="divide-y divide-line self-start border-y border-line">
                {list.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => openPuzzle(p.id)}
                      className={`flex min-h-[52px] w-full items-center justify-between gap-3 py-3.5 text-left transition-colors duration-150 hover:bg-surface/60 ${
                        openP?.id === p.id ? "text-vermilion" : ""
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 text-[15px] font-semibold">
                          <span className="truncate">{p.title}</span>
                          {solved.has(p.id) && <Check size={14} className="shrink-0 text-vermilion" aria-label="Đã giải" />}
                        </span>
                        <span className="text-[12px] text-ink-3">{p.theme ?? gameLabel(p.game)}</span>
                      </span>
                      <Stars n={p.difficulty} />
                    </button>
                  </li>
                ))}
                {list.length === 0 && (
                  <li className="py-6 text-[13.5px] text-ink-3">Không còn thế nào khớp bộ lọc.</li>
                )}
              </ul>

              {/* solver trên desktop: cột sticky */}
              <div className="hidden lg:block">
                {openP ? (
                  <div className="sticky top-24">
                    <Solver puzzle={openP} onSolved={() => markSolved(openP.id)} />
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-line-2 p-6 text-[13.5px] text-ink-3">
                    Chọn một thế cờ bên trái để bắt đầu.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* solver toàn màn trên mobile */}
      {openP && !desktop && !streakMode && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-canvas lg:hidden">
          <header
            className="flex h-14 shrink-0 items-center justify-between border-b border-line px-3"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
          >
            <button
              onClick={closeSolver}
              className="flex min-h-[44px] items-center gap-1 text-[14px] font-semibold text-ink-2 transition-colors hover:text-ink"
            >
              <ChevronLeft size={18} /> Thư viện
            </button>
            <div className="flex items-center gap-2 text-[12px] text-ink-3">
              {gameLabel(openP.game)} <Stars n={openP.difficulty} />
            </div>
          </header>
          <div className="flex-1 overflow-y-auto px-4 pb-4 pt-5" style={{ paddingBottom: "calc(76px + env(safe-area-inset-bottom))" }}>
            <Solver
              puzzle={openP}
              bare
              boardRef={boardRef}
              onMeta={setMeta}
              onSolved={() => markSolved(openP.id)}
            />
          </div>
          <div
            className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="flex h-[62px] items-stretch">
              <button onClick={() => boardRef.current?.toggleHint()} disabled={!openP.hint || meta.finished} className={mBarBtn}>
                <Lightbulb size={19} /> Gợi ý
              </button>
              <button onClick={() => boardRef.current?.replay()} disabled={meta.wrong < 2 || meta.finished} className={mBarBtn}>
                <Star size={19} /> Lời giải
              </button>
              <button onClick={() => boardRef.current?.reset()} disabled={meta.status === "idle" && meta.wrong === 0} className={mBarBtn}>
                <RotateCcw size={19} /> Làm lại
              </button>
              <button onClick={() => goNext(openP)} className={`${mBarBtn} ${meta.finished ? "text-vermilion" : ""}`}>
                <ArrowRight size={19} /> Thế tiếp
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export function PuzzleApp() {
  return (
    <Suspense>
      <PuzzleAppInner />
    </Suspense>
  );
}
