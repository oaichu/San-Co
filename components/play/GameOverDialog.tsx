"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LEVELS } from "@/lib/play/levels";
import { readStats, type GameSetup } from "@/lib/play/useGame";
import type { GameId, GameResult, Seat } from "@/lib/games/registry";
import { seatName } from "./labels";

const fmtTime = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** đếm chuỗi thua liên tiếp vs máy — localStorage sc-losses-v1-<game> */
export function readLossStreak(game: GameId): number {
  try {
    return Number(localStorage.getItem(`sc-losses-v1-${game}`) ?? "0") || 0;
  } catch {
    return 0;
  }
}
export function writeLossStreak(game: GameId, n: number) {
  try {
    localStorage.setItem(`sc-losses-v1-${game}`, String(n));
  } catch {
    /* localStorage tắt */
  }
}

export function GameOverDialog({
  game,
  result,
  resultReason,
  setup,
  moveCount,
  hintsUsed,
  startedAt,
  open,
  onClose,
  onNewGame,
  onNewLevel,
}: {
  game: GameId;
  result: GameResult;
  resultReason: string | null;
  setup: GameSetup;
  moveCount: number;
  hintsUsed: number;
  startedAt: number;
  open: boolean;
  onClose: () => void;
  onNewGame: () => void;
  onNewLevel: (level: number) => void;
}) {
  const [secs, setSecs] = useState("0:00");
  const [record, setRecord] = useState<{ w: number; l: number; d: number } | null>(null);
  const [losses, setLosses] = useState(0);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      setSecs(fmtTime(Date.now() - startedAt));
      const s = readStats()[game]?.[setup.mode === "ai" ? `ai-${setup.level}` : "local"];
      setRecord(s ?? null);
      setLosses(readLossStreak(game));
    }, 0);
    return () => clearTimeout(t);
  }, [open, startedAt, game, setup]);

  if (!result) return null;

  const humanWon = setup.mode === "ai" && result === setup.humanSeat;
  const humanLost = setup.mode === "ai" && result !== "draw" && result !== setup.humanSeat;
  const headline =
    result === "draw"
      ? "Hòa"
      : setup.mode === "ai"
        ? humanWon
          ? "Bạn thắng"
          : "Máy thắng"
        : `${seatName(game, result as Seat)} thắng`;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-line bg-surface text-ink sm:max-w-sm" showCloseButton={false}>
        <div className="px-1 pb-1 pt-2 text-center">
          <h2 className="font-display text-[30px] font-bold tracking-[-0.02em]">
            {humanWon ? (
              <span className="relative inline-block">
                {headline}
                <svg
                  className="absolute -bottom-1 left-0 h-[7px] w-full"
                  viewBox="0 0 100 6"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 4 Q 50 1 98 3.5"
                    pathLength="1"
                    strokeDasharray="1"
                    stroke="var(--vermilion)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                    style={{ animation: "draw-in 300ms cubic-bezier(0.23,1,0.32,1) 120ms both" }}
                  />
                </svg>
              </span>
            ) : (
              headline
            )}
          </h2>
          {resultReason && <p className="mt-1.5 text-[13.5px] text-ink-2">{resultReason}</p>}

          <div className="tabular mt-5 flex justify-center gap-6 text-[13px]">
            <div>
              <div className="font-semibold text-ink">{moveCount}</div>
              <div className="mt-0.5 text-[11.5px] text-ink-3">nước đi</div>
            </div>
            <div>
              <div className="font-semibold text-ink">{secs}</div>
              <div className="mt-0.5 text-[11.5px] text-ink-3">thời gian</div>
            </div>
            <div>
              <div className="font-semibold text-ink">{hintsUsed}</div>
              <div className="mt-0.5 text-[11.5px] text-ink-3">gợi ý</div>
            </div>
          </div>

          {record && setup.mode === "ai" && (
            <p className="tabular mt-3 text-[12px] text-ink-3">
              Mức {LEVELS[setup.level].name}: {record.w} thắng · {record.l} thua · {record.d} hòa
            </p>
          )}

          <div className="mt-6 flex flex-col gap-2">
            {humanWon && setup.level < 4 && (
              <button
                onClick={() => onNewLevel(setup.level + 1)}
                className="min-h-[46px] w-full rounded-xl bg-vermilion text-[14.5px] font-semibold text-accent-ink transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                Thử mức {LEVELS[setup.level + 1].name}
              </button>
            )}
            {humanLost && losses >= 2 && setup.level > 0 && (
              <button
                onClick={() => onNewLevel(setup.level - 1)}
                className="min-h-[46px] w-full rounded-xl bg-vermilion text-[14.5px] font-semibold text-accent-ink transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                Hạ xuống mức {LEVELS[setup.level - 1].name}
              </button>
            )}
            <button
              onClick={onNewGame}
              className={`min-h-[46px] w-full rounded-xl text-[14.5px] font-semibold transition-[transform,background-color,border-color,color] duration-150 active:scale-[0.98] ${
                (humanWon && setup.level < 4) || (humanLost && losses >= 2 && setup.level > 0)
                  ? "border border-line text-ink hover:bg-surface-2"
                  : "bg-vermilion text-accent-ink hover:-translate-y-0.5"
              }`}
            >
              Ván mới
            </button>
            <button
              onClick={onClose}
              className="min-h-[44px] w-full rounded-xl text-[13.5px] font-medium text-ink-2 transition-colors duration-150 hover:text-ink"
            >
              Xem lại bàn cờ
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
