"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Chess } from "chess.js";
import {
  ChevronLeft,
  CircleHelp,
  Flag,
  FlipVertical2,
  Lightbulb,
  Plus,
  RotateCcw,
  SkipForward,
  Undo2,
  Vibrate,
} from "lucide-react";
import { Nav } from "@/components/Nav";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PlayBoard } from "./PlayBoard";
import { SetupSheet } from "./SetupSheet";
import { RulesSheet } from "./RulesSheet";
import { GameOverDialog, readLossStreak, writeLossStreak } from "./GameOverDialog";
import { seatDot, seatName, chessDiff } from "./labels";
import { LEVELS } from "@/lib/play/levels";
import { readStats, useGame, type GameSetup } from "@/lib/play/useGame";
import { scoreGo, type GoState } from "@/lib/games/go/rules";
import { GAMES } from "@/components/board/skins";
import { useFitBoard } from "./useMedia";
import type { GameId, Seat } from "@/lib/games/registry";

type G = ReturnType<typeof useGame>;

const other = (s: Seat): Seat => (s === "p1" ? "p2" : "p1");

/* ---------- chấm "đang nghĩ" ---------- */
function ThinkingDots() {
  return (
    <span className="inline-flex items-end gap-[3px]" aria-label="Máy đang nghĩ">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-[5px] w-[5px] rounded-full bg-ink-3"
          style={{ animation: `thinking-dot 1s ease-in-out ${i * 0.18}s infinite` }}
        />
      ))}
    </span>
  );
}

/* ---------- thanh người chơi (trên/dưới bàn) ---------- */
function SeatBar({
  game,
  seat,
  name,
  isTurn,
  thinking,
  extra,
}: {
  game: GameId;
  seat: Seat;
  name: string;
  isTurn: boolean;
  thinking?: boolean;
  extra?: string | null;
}) {
  return (
    <div className="flex h-11 items-center gap-2.5 px-1">
      <span
        className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/15"
        style={{ background: seatDot(game, seat) }}
        aria-hidden="true"
      />
      <span className={`text-[14px] font-semibold ${isTurn ? "text-ink" : "text-ink-2"}`}>{name}</span>
      {isTurn && !thinking && <span className="h-1.5 w-1.5 rounded-full bg-vermilion" aria-hidden="true" />}
      {thinking && <ThinkingDots />}
      {extra && <span className="tabular ml-auto text-[12.5px] font-medium text-ink-3">{extra}</span>}
    </div>
  );
}

/* ---------- hàng nước đi (mobile strip / desktop list) ---------- */
function chips(game: GameId, notation: string[]): { no: number; note: string }[] {
  return notation.map((note, i) => ({ no: game === "chess" ? Math.floor(i / 2) + 1 : i + 1, note }));
}

function MoveStrip({ game, notation }: { game: GameId; notation: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [notation.length]);
  return (
    <div
      ref={ref}
      className="scrollbar-none flex gap-1.5 overflow-x-auto px-1 py-1.5"
      aria-label="Các nước đã đi"
    >
      {chips(game, notation).map((c, i) => (
        <span
          key={i}
          className={`tabular flex shrink-0 items-baseline gap-1 rounded-lg border px-2.5 py-1.5 text-[12.5px] ${
            i === notation.length - 1 ? "border-vermilion/50 bg-vermilion-soft text-ink" : "border-line text-ink-2"
          }`}
        >
          <span className="text-[10.5px] text-ink-3">{c.no}.</span>
          {c.note}
        </span>
      ))}
      {notation.length === 0 && <span className="py-1.5 text-[12.5px] text-ink-3">Chưa có nước nào</span>}
    </div>
  );
}

function MoveTable({ notation }: { notation: string[] }) {
  const rows: { no: number; a: string; b?: string }[] = [];
  for (let i = 0; i < notation.length; i += 2) {
    rows.push({ no: Math.floor(i / 2) + 1, a: notation[i], b: notation[i + 1] });
  }
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [notation.length]);
  return (
    <div ref={ref} className="max-h-56 overflow-y-auto rounded-xl border border-line">
      <table className="w-full text-[13px]">
        <tbody>
          {rows.map((r, ri) => (
            <tr key={r.no} className={ri === rows.length - 1 ? "bg-vermilion-soft/60" : ""}>
              <td className="tabular w-10 px-3 py-1.5 text-ink-3">{r.no}.</td>
              <td className="tabular px-2 py-1.5 font-medium text-ink">{r.a}</td>
              <td className="tabular px-2 py-1.5 font-medium text-ink">{r.b ?? ""}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td className="px-3 py-3 text-ink-3">Chưa có nước nào</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- shell chính ---------- */

export function GameShell({ game, g }: { game: GameId; g: G }) {
  const gameName = GAMES.find((x) => x.id === game)?.name ?? "";
  const su = g.setup;

  const [flipToggle, setFlipToggle] = useState(false);
  const [twoTap, setTwoTap] = useState(false);
  const [vibrate, setVibrate] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [overOpen, setOverOpen] = useState(false);

  // lật bàn: tự động khi người chơi cầm p2 vs máy (cờ vua/tướng), toggle đảo lại
  const autoFlip = su.mode === "ai" && su.humanSeat === "p2" && (game === "chess" || game === "xiangqi");
  const flipped = autoFlip !== flipToggle;

  // khởi tạo prefs từ localStorage/matchMedia
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const tt = localStorage.getItem("sc-pref-twotap");
        setTwoTap(tt != null ? tt === "1" : matchMedia("(pointer: coarse)").matches);
        const vb = localStorage.getItem("sc-pref-vibrate");
        if (vb != null) setVibrate(vb === "1");
      } catch {
        /* bỏ qua */
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const setPref = (key: string, v: boolean, apply: (b: boolean) => void) => {
    apply(v);
    try {
      localStorage.setItem(key, v ? "1" : "0");
    } catch {
      /* localStorage tắt */
    }
  };

  // mở "Cách chơi" lần đầu vào mỗi game
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const k = `sc-seen-rules-v1-${game}`;
        if (!localStorage.getItem(k)) {
          localStorage.setItem(k, "1");
          setRulesOpen(true);
        }
      } catch {
        /* localStorage tắt */
      }
    }, 700);
    return () => clearTimeout(t);
  }, [game]);

  // dialog kết thúc: mở sau 600ms để đường thắng/nước cuối kịp hiện; ghi chuỗi thua
  useEffect(() => {
    if (!g.result) {
      const t = setTimeout(() => setOverOpen(false), 0);
      return () => clearTimeout(t);
    }
    if (su.mode === "ai") {
      writeLossStreak(game, g.result === "draw" || g.result === su.humanSeat ? 0 : readLossStreak(game) + 1);
    }
    const t = setTimeout(() => setOverOpen(true), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.result]);

  /* ---- dữ liệu thanh người chơi ---- */
  const topSeat = flipped ? su.mode === "ai" ? su.humanSeat : "p1" : su.mode === "ai" ? other(su.humanSeat) : "p2";
  const bottomSeat = other(topSeat);
  const aiOpp = su.mode === "ai";
  const topName = aiOpp
    ? (topSeat === su.humanSeat ? "Bạn" : `Máy · ${LEVELS[su.level].name}`)
    : seatName(game, topSeat);
  const bottomName = aiOpp
    ? (bottomSeat === su.humanSeat ? `Bạn · ${seatName(game, su.humanSeat)}` : `Máy · ${LEVELS[su.level].name}`)
    : seatName(game, bottomSeat);

  // extra: chênh chất (cờ vua) / bắt quân + điểm (cờ vây)
  const extraFor = (seat: Seat): string | null => {
    if (game === "go") {
      const s = g.state as GoState;
      return `Bắt ${s.captures[seat === "p1" ? 0 : 1]}`;
    }
    if (game === "chess") {
      const d = chessDiff(g.state as Chess) * (seat === "p1" ? 1 : -1);
      return d > 0 ? `+${d}` : null;
    }
    return null;
  };

  /* ---- trạng thái ---- */
  let status: string;
  if (g.result) {
    const who =
      g.result === "draw"
        ? "Hòa"
        : aiOpp
          ? g.result === su.humanSeat
            ? "Bạn thắng"
            : "Máy thắng"
          : `${seatName(game, g.result)} thắng`;
    status = `${who} · ${g.resultReason ?? ""}`;
  } else if (g.thinking) status = "Máy đang nghĩ…";
  else if (aiOpp) status = g.isHumanTurn ? "Đến lượt bạn" : "Đến lượt máy";
  else status = `Đến lượt ${seatName(game, g.turn)}`;
  if (game === "go" && !g.result) {
    const [b, w] = scoreGo((g.state as GoState).board);
    status += ` · Đen ${b} — Trắng ${w.toFixed(1)}`;
  }

  const setupSummary = aiOpp
    ? `Đấu với máy · ${LEVELS[su.level].name} · Cầm ${seatName(game, su.humanSeat).toLowerCase()}${game === "go" ? ` · ${su.goSize}×${su.goSize}` : ""}`
    : `Hai người một máy${game === "go" ? ` · ${su.goSize}×${su.goSize}` : ""}`;

  const canAct = !g.result;
  const aspect = game === "xiangqi" ? 0.9 : 1;
  const { ref: stageRef, size: boardSize } = useFitBoard(aspect, 88); // trừ 2 thanh ghế h-11

  const record = (() => {
    const s = readStats()[game]?.[aiOpp ? `ai-${su.level}` : "local"];
    return s && s.w + s.l + s.d > 0 ? s : null;
  })();

  const menuItems = (
    <div className="flex flex-col">
      <button
        onClick={() => {
          setMoreOpen(false);
          g.resign();
        }}
        disabled={!canAct}
        className="flex min-h-[48px] items-center gap-3 rounded-lg px-3 text-[14px] font-medium text-ink transition-colors duration-150 hover:bg-surface-2 disabled:opacity-40"
      >
        <Flag size={17} className="text-ink-3" /> Xin thua
      </button>
      <button
        onClick={() => {
          setFlipToggle((f) => !f);
          setMoreOpen(false);
        }}
        className="flex min-h-[48px] items-center gap-3 rounded-lg px-3 text-[14px] font-medium text-ink transition-colors duration-150 hover:bg-surface-2"
      >
        <FlipVertical2 size={17} className="text-ink-3" /> Lật bàn
      </button>
      <button
        onClick={() => {
          setMoreOpen(false);
          setRulesOpen(true);
        }}
        className="flex min-h-[48px] items-center gap-3 rounded-lg px-3 text-[14px] font-medium text-ink transition-colors duration-150 hover:bg-surface-2"
      >
        <CircleHelp size={17} className="text-ink-3" /> Cách chơi
      </button>
      {(game === "caro" || game === "go") && (
        <div className="flex min-h-[48px] items-center justify-between gap-3 px-3">
          <span className="text-[14px] font-medium text-ink">Chạm hai lần để đặt quân</span>
          <Switch checked={twoTap} onCheckedChange={(v) => setPref("sc-pref-twotap", !!v, setTwoTap)} aria-label="Chạm hai lần để đặt quân" />
        </div>
      )}
      <div className="flex min-h-[48px] items-center justify-between gap-3 px-3">
        <span className="flex items-center gap-3 text-[14px] font-medium text-ink">
          <Vibrate size={17} className="text-ink-3" /> Rung khi đặt quân
        </span>
        <Switch checked={vibrate} onCheckedChange={(v) => setPref("sc-pref-vibrate", !!v, setVibrate)} aria-label="Rung khi đặt quân" />
      </div>
    </div>
  );

  const actionBtn =
    "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10.5px] font-semibold text-ink-2 transition-colors duration-150 enabled:hover:text-ink disabled:opacity-35";

  return (
    <main className="relative flex h-dvh flex-col overflow-hidden lg:block lg:h-auto lg:min-h-dvh lg:overflow-visible">
      <div className="hidden lg:block">
        <Nav />
      </div>

      {/* header gọn cho màn nhỏ */}
      <header
        className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4 lg:hidden"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <Link href="/choi" className="flex min-h-[44px] items-center gap-1 text-[14px] font-semibold text-ink-2 transition-colors hover:text-ink">
          <ChevronLeft size={18} /> {gameName}
        </Link>
        <button
          onClick={() => setRulesOpen(true)}
          aria-label="Cách chơi"
          className="grid h-11 w-11 place-items-center rounded-lg text-ink-2 transition-colors hover:text-ink"
        >
          <CircleHelp size={19} />
        </button>
      </header>

      {/* ---------- một cây duy nhất: cột bàn + aside ---------- */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:mx-auto lg:w-full lg:max-w-[1180px] lg:flex-row lg:items-start lg:justify-center lg:gap-8 lg:px-8 lg:pb-16 lg:pt-[calc(68px+40px)]">
        {/* cột bàn: stage đo bằng ResizeObserver; nhóm [ghế trên, bàn, ghế dưới] căn giữa */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:h-[calc(100dvh-172px)]">
          <div ref={stageRef} className="grid min-h-0 min-w-0 flex-1 place-items-center px-2">
            {boardSize > 0 && (
              <div className="flex w-full flex-col" style={{ maxWidth: boardSize }}>
                <SeatBar game={game} seat={topSeat} name={topName} isTurn={g.turn === topSeat && !g.result} thinking={g.thinking} extra={extraFor(topSeat)} />
                <div className="[&_[role=grid]]:max-w-none">
                  <PlayBoard
                    game={game}
                    state={g.state}
                    isHumanTurn={g.isHumanTurn}
                    thinking={g.thinking}
                    result={g.result}
                    hint={g.hint}
                    lastMove={g.lastMove}
                    flipped={flipped}
                    twoTap={twoTap}
                    vibrate={vibrate}
                    onPlay={g.play}
                  />
                </div>
                <SeatBar game={game} seat={bottomSeat} name={bottomName} isTurn={g.turn === bottomSeat && !g.result} extra={extraFor(bottomSeat)} />
              </div>
            )}
          </div>
          {/* trạng thái + dải nước đi — chỉ màn nhỏ, căn trái thẳng với thanh ghế */}
          <div className="px-4 pb-2 lg:hidden">
            <p className="tabular px-1 text-[12.5px] text-ink-2" aria-live="polite">
              {status}
            </p>
            <MoveStrip game={game} notation={g.notation} />
          </div>
        </div>

        <aside className="hidden w-[340px] shrink-0 flex-col gap-5 lg:flex">
          <div className="flex items-start justify-between gap-3">
            <button
              onClick={() => setSetupOpen(true)}
              className="rounded-xl border border-line px-4 py-2.5 text-left text-[13px] font-medium text-ink-2 transition-colors duration-150 hover:border-line-2 hover:text-ink"
            >
              {setupSummary}
            </button>
            <button
              onClick={() => setRulesOpen(true)}
              aria-label="Cách chơi"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line text-ink-2 transition-colors hover:text-ink"
            >
              <CircleHelp size={17} />
            </button>
          </div>

          <p className="text-[14px] font-medium text-ink" aria-live="polite">
            {status}
          </p>

          <div className="flex gap-2">
            <button
              onClick={g.requestHint}
              disabled={!g.isHumanTurn || g.thinking || !canAct}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-vermilion text-[13.5px] font-semibold text-accent-ink transition-transform duration-150 enabled:hover:-translate-y-0.5 disabled:opacity-40"
            >
              <Lightbulb size={16} /> Gợi ý
            </button>
            <button
              onClick={g.undo}
              disabled={!g.canUndo}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line text-[13.5px] font-semibold text-ink transition-colors duration-150 enabled:hover:bg-surface-2 disabled:opacity-40"
            >
              <Undo2 size={16} /> Lùi nước
            </button>
            <button
              onClick={() => setSetupOpen(true)}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line text-[13.5px] font-semibold text-ink transition-colors duration-150 hover:bg-surface-2"
            >
              <RotateCcw size={16} /> Ván mới
            </button>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] font-medium text-ink-2">
            <button onClick={g.resign} disabled={!canAct} className="py-1.5 transition-colors enabled:hover:text-ink disabled:opacity-40">
              Xin thua
            </button>
            <button onClick={() => setFlipToggle((f) => !f)} className="py-1.5 transition-colors hover:text-ink">
              Lật bàn
            </button>
            {game === "go" && (
              <button onClick={() => g.play(-1)} disabled={!canAct || (aiOpp && !g.isHumanTurn)} className="py-1.5 transition-colors enabled:hover:text-ink disabled:opacity-40">
                Bỏ lượt
              </button>
            )}
            {g.result && !overOpen && (
              <button onClick={() => setOverOpen(true)} className="py-1.5 font-semibold text-vermilion">
                Kết quả
              </button>
            )}
          </div>

          {(game === "caro" || game === "go") && (
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-ink-2">Chạm hai lần để đặt quân</span>
              <Switch checked={twoTap} onCheckedChange={(v) => setPref("sc-pref-twotap", !!v, setTwoTap)} aria-label="Chạm hai lần để đặt quân" />
            </div>
          )}

          <MoveTable notation={g.notation} />

          {record && (
            <p className="tabular text-[12.5px] text-ink-3">
              Thành tích {aiOpp ? `mức ${LEVELS[su.level].name}` : "hai người"}: {record.w} thắng · {record.l} thua · {record.d} hòa
            </p>
          )}
        </aside>
      </div>

      {/* ---------- thanh hành động dưới (mobile, trong flow — không fixed) ---------- */}
      <div
        className="shrink-0 border-t border-line bg-surface lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex h-[62px] items-stretch">
          <button onClick={g.requestHint} disabled={!g.isHumanTurn || g.thinking || !canAct} className={actionBtn} aria-label="Gợi ý">
            <Lightbulb size={20} /> Gợi ý
          </button>
          <button onClick={g.undo} disabled={!g.canUndo} className={actionBtn} aria-label="Lùi nước">
            <Undo2 size={20} /> Lùi nước
          </button>
          <button onClick={() => setSetupOpen(true)} className={actionBtn} aria-label="Ván mới">
            <RotateCcw size={20} /> Ván mới
          </button>
          {game === "go" && (
            <button onClick={() => g.play(-1)} disabled={!canAct || (aiOpp && !g.isHumanTurn)} className={actionBtn} aria-label="Bỏ lượt">
              <SkipForward size={20} /> Bỏ lượt
            </button>
          )}
          <button onClick={() => setMoreOpen(true)} className={actionBtn} aria-label="Thêm">
            <Plus size={20} /> Thêm
          </button>
        </div>
      </div>

      {/* chip Kết quả khi đã đóng dialog */}
      {g.result && !overOpen && (
        <button
          onClick={() => setOverOpen(true)}
          className="fixed bottom-[calc(62px+env(safe-area-inset-bottom)+10px)] right-3 z-40 rounded-full border border-line bg-surface px-4 py-2 text-[12.5px] font-semibold text-vermilion shadow-lift lg:hidden"
        >
          Kết quả
        </button>
      )}

      {/* ---------- sheets / dialogs ---------- */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl border-line bg-surface text-ink"
          style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}
        >
          <SheetHeader className="px-5 pt-5">
            <SheetTitle className="font-display text-[17px] font-semibold text-ink">Thêm</SheetTitle>
          </SheetHeader>
          <div className="px-2">{menuItems}</div>
        </SheetContent>
      </Sheet>

      <SetupSheet
        game={game}
        setup={su}
        open={setupOpen}
        onOpenChange={setSetupOpen}
        onStart={(next: GameSetup) => {
          setSetupOpen(false);
          g.newGame(next);
        }}
      />

      <RulesSheet game={game} open={rulesOpen} onOpenChange={setRulesOpen} />

      <GameOverDialog
        game={game}
        result={g.result}
        resultReason={g.resultReason}
        setup={su}
        moveCount={g.moveCount}
        hintsUsed={g.hintsUsed}
        startedAt={g.startedAt}
        open={overOpen}
        onClose={() => setOverOpen(false)}
        onNewGame={() => {
          setOverOpen(false);
          g.newGame();
        }}
        onNewLevel={(lv) => {
          setOverOpen(false);
          g.newGame({ level: lv as 0 | 1 | 2 | 3 | 4 });
        }}
      />
    </main>
  );
}
