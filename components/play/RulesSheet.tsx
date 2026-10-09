"use client";

import { useState } from "react";
import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RULES, type RuleIcon } from "@/lib/content/rules";
import { lessonsByGame } from "@/lib/content/lessons";
import { GAMES } from "@/components/board/skins";
import { Piece } from "@/components/board/ChessPieces";
import { MarkX, MarkO } from "@/components/board/CaroBoard";
import type { GameId } from "@/lib/games/registry";
import { useMedia } from "./useMedia";

const STONE_B = "radial-gradient(circle at 33% 27%, #5a5044 0%, #2e2619 42%, #120d07 78%)";
const STONE_W = "radial-gradient(circle at 33% 27%, #fffdf4 0%, #f0e7d0 55%, #cbbc9c 100%)";

function Icon({ icon }: { icon: RuleIcon }) {
  if (icon.kind === "chess") {
    return (
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-line bg-surface-2">
        <span className="block h-8 w-8">
          <Piece t={icon.t} c={icon.c} />
        </span>
      </span>
    );
  }
  if (icon.kind === "xq") {
    const c = icon.red ? "var(--xq-red)" : "var(--xq-ink)";
    return (
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[19px] font-semibold"
        style={{
          background: "radial-gradient(circle at 36% 28%, #faf0d6 0%, #ecd9ac 62%, #d8bd8a 100%)",
          border: `1.5px solid ${c}`,
          color: c,
        }}
      >
        {icon.ch}
      </span>
    );
  }
  if (icon.kind === "caro") {
    return (
      <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-line bg-surface-2">
        {icon.mark === "x" ? <MarkX faint /> : <MarkO faint />}
      </span>
    );
  }
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-line bg-surface-2">
      <span className="block h-7 w-7 rounded-full" style={{ background: icon.color === "b" ? STONE_B : STONE_W }} />
    </span>
  );
}

function RulesBody({ game, onClose }: { game: GameId; onClose: () => void }) {
  const steps = RULES[game];
  const [i, setI] = useState(0);
  const step = steps[i];
  const last = i === steps.length - 1;
  const firstLesson = lessonsByGame(game)[0];

  return (
    <div className="flex flex-col gap-5 px-1 pb-2">
      <div className="min-h-[180px]">
        <h3 className="font-display text-[17px] font-semibold text-ink">{step.title}</h3>
        {step.text && <p className="mt-2 text-[14px] leading-[1.65] text-ink-2">{step.text}</p>}
        {step.pieces && (
          <ul className="mt-3 flex flex-col gap-2">
            {step.pieces.map((p) => (
              <li key={p.name} className="flex items-center gap-3">
                <Icon icon={p.icon} />
                <div className="min-w-0">
                  <div className="text-[13.5px] font-semibold text-ink">{p.name}</div>
                  <div className="text-[12.5px] leading-[1.5] text-ink-2">{p.move}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {step.bullets && (
          <ul className="mt-3 flex flex-col gap-2">
            {step.bullets.map((b) => (
              <li key={b} className="flex gap-2.5 text-[13.5px] leading-[1.6] text-ink-2">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-vermilion" aria-hidden="true" />
                {b}
              </li>
            ))}
          </ul>
        )}
      </div>

      {last && (
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="min-h-[44px] flex-1 rounded-xl bg-vermilion text-[14px] font-semibold text-accent-ink transition-transform duration-150 active:scale-[0.98]"
          >
            Chơi luôn
          </button>
          {firstLesson && (
            <Link
              href={`/hoc/${firstLesson.id}`}
              className="grid min-h-[44px] flex-1 place-items-center rounded-xl border border-line text-[14px] font-semibold text-ink transition-colors duration-150 hover:bg-surface-2"
            >
              Học bài 1
            </Link>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={() => setI(i - 1)}
          disabled={i === 0}
          className="min-h-[44px] rounded-lg px-3 text-[13.5px] font-medium text-ink-2 transition-colors duration-150 hover:text-ink disabled:opacity-40"
        >
          Quay lại
        </button>
        <div className="flex gap-1.5" aria-hidden="true">
          {steps.map((_, k) => (
            <span key={k} className={`h-1.5 w-4 rounded-full transition-[transform,background-color] duration-200 ${k === i ? "bg-vermilion" : "scale-x-[0.375] bg-line-2"}`} />
          ))}
        </div>
        <button
          onClick={() => setI(i + 1)}
          disabled={last}
          className="min-h-[44px] rounded-lg px-3 text-[13.5px] font-semibold text-vermilion transition-colors duration-150 disabled:opacity-40"
        >
          Tiếp
        </button>
      </div>
    </div>
  );
}

export function RulesSheet({
  game,
  open,
  onOpenChange,
}: {
  game: GameId;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const desktop = useMedia("(min-width: 768px)");
  const name = GAMES.find((g) => g.id === game)?.name ?? "";
  const title = `Cách chơi ${name}`;

  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="border-line bg-surface text-ink sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-[19px] font-semibold">{title}</DialogTitle>
          </DialogHeader>
          <RulesBody game={game} onClose={() => onOpenChange(false)} />
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] overflow-y-auto rounded-t-2xl border-line bg-surface text-ink"
        style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}
      >
        <SheetHeader className="px-5 pt-5">
          <SheetTitle className="font-display text-[19px] font-semibold text-ink">{title}</SheetTitle>
        </SheetHeader>
        <div className="px-5">
          <RulesBody game={game} onClose={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
