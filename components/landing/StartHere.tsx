"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { dailyPuzzle } from "@/lib/content/daily";
import { build } from "@/components/learn/LessonBoard";
import { PuzzleThumb } from "@/components/puzzle/PuzzleThumb";
import { GAMES } from "@/components/board/skins";
import type { Puzzle } from "@/lib/content/types";

export function StartHere() {
  const [daily, setDaily] = useState<Puzzle | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setDaily(dailyPuzzle()), 0);
    return () => clearTimeout(t);
  }, []);

  const dailyGame = daily ? GAMES.find((g) => g.id === daily.game)?.name : "";

  return (
    <section className="mx-auto max-w-[1240px] px-5 pb-[clamp(64px,10vh,110px)] md:px-11 lg:px-[72px]">
      <h2 className="font-display text-[clamp(28px,3.6vw,44px)] font-bold tracking-[-0.02em]">Bắt đầu từ đâu?</h2>
      <div className="mt-8 border-t border-line">
        <Link href="/hoc" className="group flex items-center gap-5 border-b border-line py-7 transition-colors duration-150 hover:bg-surface/60">
          <div className="min-w-0 flex-1">
            <div className="font-display text-[clamp(20px,2.4vw,28px)] font-semibold tracking-[-0.015em]">Mới làm quen</div>
            <div className="mt-1 text-[14px] text-ink-2">Học luật trong vài phút, bàn cờ ngay trong bài</div>
          </div>
          <ArrowRight size={20} className="shrink-0 text-ink-3 transition-transform duration-150 group-hover:translate-x-1 group-hover:text-vermilion" />
        </Link>
        <Link href="/choi" className="group flex items-center gap-5 border-b border-line py-7 transition-colors duration-150 hover:bg-surface/60">
          <div className="min-w-0 flex-1">
            <div className="font-display text-[clamp(20px,2.4vw,28px)] font-semibold tracking-[-0.015em]">Đã biết đi quân</div>
            <div className="mt-1 text-[14px] text-ink-2">Đấu với máy, năm mức độ — hoặc hai người một máy</div>
          </div>
          <ArrowRight size={20} className="shrink-0 text-ink-3 transition-transform duration-150 group-hover:translate-x-1 group-hover:text-vermilion" />
        </Link>
        <Link href="/puzzle?daily=1" className="group flex items-center gap-5 border-b border-line py-7 transition-colors duration-150 hover:bg-surface/60">
          {daily && (
            <div className="hidden w-[76px] shrink-0 sm:block">
              <PuzzleThumb game={daily.game} state={build(daily.game, daily.setup)} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="font-display text-[clamp(20px,2.4vw,28px)] font-semibold tracking-[-0.015em]">Muốn thử sức</div>
            <div className="mt-1 text-[14px] text-ink-2">
              Thế cờ hôm nay{daily ? ` — ${dailyGame}: ${daily.title}` : ""}
            </div>
          </div>
          <ArrowRight size={20} className="shrink-0 text-ink-3 transition-transform duration-150 group-hover:translate-x-1 group-hover:text-vermilion" />
        </Link>
      </div>
    </section>
  );
}
