"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LEVELS, type Level } from "@/lib/play/levels";
import { readStats, type GameSetup } from "@/lib/play/useGame";
import type { GameId, Seat } from "@/lib/games/registry";
import { useMedia } from "./useMedia";

const SEAT_OPTS: Record<GameId, { v: "p1" | "p2" | "random"; label: string }[]> = {
  chess: [
    { v: "p1", label: "Trắng" },
    { v: "p2", label: "Đen" },
    { v: "random", label: "Ngẫu nhiên" },
  ],
  xiangqi: [
    { v: "p1", label: "Đỏ" },
    { v: "p2", label: "Đen" },
    { v: "random", label: "Ngẫu nhiên" },
  ],
  caro: [
    { v: "p1", label: "X đi trước" },
    { v: "p2", label: "O đi sau" },
    { v: "random", label: "Ngẫu nhiên" },
  ],
  go: [
    { v: "p1", label: "Đen" },
    { v: "p2", label: "Trắng" },
    { v: "random", label: "Ngẫu nhiên" },
  ],
};

interface Draft {
  mode: "ai" | "local";
  seat: "p1" | "p2" | "random";
  level: Level;
  goSize: 9 | 13 | 19;
}

function SetupForm({
  game,
  setup,
  onStart,
}: {
  game: GameId;
  setup: GameSetup;
  onStart: (su: GameSetup) => void;
}) {
  const [d, setD] = useState<Draft>({
    mode: setup.mode,
    seat: setup.humanSeat,
    level: setup.level,
    goSize: setup.goSize ?? 9,
  });
  const [record, setRecord] = useState<{ w: number; l: number; d: number } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const s = readStats()[game]?.[`ai-${d.level}`];
      setRecord(s ?? null);
    }, 0);
    return () => clearTimeout(t);
  }, [game, d.level]);

  const start = () => {
    const humanSeat: Seat = d.seat === "random" ? (Math.random() < 0.5 ? "p1" : "p2") : d.seat;
    onStart({ mode: d.mode, level: d.level, humanSeat, goSize: d.goSize });
  };

  const tgItem =
    "min-h-[44px] flex-1 rounded-lg border border-line px-3 text-[13.5px] font-medium text-ink-2 transition-colors duration-150 data-[pressed]:border-vermilion data-[pressed]:bg-vermilion-soft data-[pressed]:text-ink hover:text-ink";

  return (
    <div className="flex flex-col gap-6 px-1 pb-2">
      <div>
        <div className="mb-2 text-[13px] font-semibold text-ink">Chế độ</div>
        <ToggleGroup
          value={[d.mode]}
          onValueChange={(v) => v[0] && setD({ ...d, mode: v[0] as Draft["mode"] })}
          className="w-full gap-2"
        >
          <ToggleGroupItem value="ai" className={tgItem}>
            Đấu với máy
          </ToggleGroupItem>
          <ToggleGroupItem value="local" className={tgItem}>
            Hai người một máy
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {d.mode === "ai" && (
        <div>
          <div className="mb-2 text-[13px] font-semibold text-ink">Cầm quân</div>
          <ToggleGroup
            value={[d.seat]}
            onValueChange={(v) => v[0] && setD({ ...d, seat: v[0] as Draft["seat"] })}
            className="w-full gap-2"
          >
            {SEAT_OPTS[game].map((o) => (
              <ToggleGroupItem key={o.v} value={o.v} className={tgItem}>
                {o.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      )}

      {d.mode === "ai" && (
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-[13px] font-semibold text-ink">Độ khó</span>
            <span className="text-[12px] text-ink-3">
              {LEVELS[d.level].name} · {LEVELS[d.level].hint}
            </span>
          </div>
          <div className="flex gap-1.5" role="radiogroup" aria-label="Độ khó">
            {LEVELS.map((lv, i) => (
              <button
                key={i}
                role="radio"
                aria-checked={d.level === i}
                onClick={() => setD({ ...d, level: i as Level })}
                className={`flex h-11 flex-1 items-center justify-center rounded-lg border text-[14px] font-semibold transition-colors duration-150 ${
                  d.level === i
                    ? "border-vermilion bg-vermilion-soft text-ink"
                    : "border-line text-ink-3 hover:text-ink"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          {record && (record.w + record.l + record.d) > 0 && (
            <p className="tabular mt-2 text-[12px] text-ink-3">
              Thành tích mức này: {record.w} thắng · {record.l} thua · {record.d} hòa
            </p>
          )}
        </div>
      )}

      {game === "go" && (
        <div>
          <div className="mb-2 text-[13px] font-semibold text-ink">Kích thước bàn</div>
          <ToggleGroup
            value={[String(d.goSize)]}
            onValueChange={(v) => v[0] && setD({ ...d, goSize: Number(v[0]) as Draft["goSize"] })}
            className="w-full gap-2"
          >
            {["9", "13", "19"].map((s) => (
              <ToggleGroupItem key={s} value={s} className={tgItem}>
                {s}×{s}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <p className="mt-2 text-[12px] text-ink-3">9×9 hợp cho người mới</p>
        </div>
      )}

      <button
        onClick={start}
        className="min-h-[48px] w-full rounded-xl bg-vermilion text-[15px] font-semibold text-accent-ink transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98]"
      >
        Bắt đầu ván
      </button>
    </div>
  );
}

/** Sheet (mobile) / Dialog (desktop) chọn chế độ ván mới */
export function SetupSheet({
  game,
  setup,
  open,
  onOpenChange,
  onStart,
}: {
  game: GameId;
  setup: GameSetup;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onStart: (su: GameSetup) => void;
}) {
  const desktop = useMedia("(min-width: 768px)");
  const form = <SetupForm game={game} setup={setup} onStart={onStart} />;

  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="border-line bg-surface text-ink sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-[19px] font-semibold">Ván mới</DialogTitle>
          </DialogHeader>
          {form}
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl border-line bg-surface text-ink"
        style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}
      >
        <SheetHeader className="px-5 pt-5">
          <SheetTitle className="font-display text-[19px] font-semibold text-ink">Ván mới</SheetTitle>
        </SheetHeader>
        <div className="px-5">{form}</div>
      </SheetContent>
    </Sheet>
  );
}
