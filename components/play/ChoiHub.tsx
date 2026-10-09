"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { Nav } from "@/components/Nav";
import { BoardSkin, GAMES } from "@/components/board/skins";
import { dailyPuzzle } from "@/lib/content/daily";
import { build } from "@/components/learn/LessonBoard";
import { PuzzleThumb } from "@/components/puzzle/PuzzleThumb";
import { readStats } from "@/lib/play/useGame";
import type { GameId } from "@/lib/games/registry";
import type { Puzzle } from "@/lib/content/types";

interface GameMeta {
  resume: number | null; // số nước ván đang dở
  record: string | null; // "n thắng · m thua"
}

function loadMeta(): Record<GameId, GameMeta> {
  const out = {} as Record<GameId, GameMeta>;
  for (const g of GAMES) {
    let resume: number | null = null;
    try {
      const raw = localStorage.getItem(`sc-game-v1-${g.id}`);
      if (raw) {
        const n = (JSON.parse(raw) as { moves?: unknown[] }).moves?.length ?? 0;
        if (n > 0) resume = n;
      }
    } catch {
      /* bỏ qua */
    }
    const all = readStats()[g.id];
    let w = 0, l = 0, d = 0;
    for (const k of Object.keys(all ?? {})) {
      if (!k.startsWith("ai-")) continue;
      w += all[k].w;
      l += all[k].l;
      d += all[k].d;
    }
    const record = w + l + d > 0 ? `${w} thắng · ${l} thua · ${d} hòa` : null;
    out[g.id] = { resume, record };
  }
  return out;
}

function streakBest(): number {
  try {
    const raw = localStorage.getItem("sc-streak-best-v1");
    if (!raw) return 0;
    return Math.max(0, ...Object.values(JSON.parse(raw) as Record<string, number>));
  } catch {
    return 0;
  }
}

export function ChoiHub() {
  const [meta, setMeta] = useState<Record<GameId, GameMeta> | null>(null);
  const [daily, setDaily] = useState<Puzzle | null>(null);
  const [best, setBest] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setMeta(loadMeta());
      setDaily(dailyPuzzle());
      setBest(streakBest());
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const dailyGame = daily ? GAMES.find((g) => g.id === daily.game)?.name : "";

  return (
    <main className="relative min-h-dvh">
      <Nav />
      <div className="mx-auto max-w-[1240px] px-5 pb-24 pt-[calc(68px+40px)] md:px-11">
        <h1 className="font-display text-[clamp(34px,4.5vw,56px)] font-bold tracking-[-0.025em]">Vào sân.</h1>
        <p className="mt-3 max-w-[52ch] text-[15.5px] leading-[1.65] text-ink-2">
          Chọn cờ, đấu với máy năm mức độ hoặc chơi hai người trên một máy.
        </p>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
          {GAMES.map((g) => {
            const m = meta?.[g.id];
            return (
              <div key={g.id} className="flex flex-col gap-5 bg-canvas p-6 sm:flex-row sm:items-center sm:gap-6 md:p-8">
                <Link href={`/choi/${g.id}`} className="w-[clamp(110px,15vw,170px)] shrink-0 overflow-hidden rounded-lg border border-edge shadow-lift">
                  <BoardSkin game={g.id} />
                </Link>
                <div className="min-w-0">
                  <h2 className="font-display text-[22px] font-semibold tracking-[-0.015em]">{g.name}</h2>
                  <p className="mt-1 text-[13.5px] leading-[1.6] text-ink-2">{g.desc}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <Link
                      href={`/choi/${g.id}`}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-vermilion px-4 text-[13px] font-semibold text-accent-ink transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.97]"
                    >
                      Đấu với máy
                    </Link>
                    <Link
                      href={`/choi/${g.id}?mode=local`}
                      className="inline-flex min-h-[44px] items-center rounded-lg border border-line px-4 text-[13px] font-semibold text-ink transition-colors duration-150 hover:bg-surface"
                    >
                      Hai người
                    </Link>
                    {m?.resume != null && (
                      <Link href={`/choi/${g.id}`} className="tabular text-[12.5px] font-medium text-vermilion underline-offset-4 hover:underline">
                        Tiếp tục ván · {m.resume} nước
                      </Link>
                    )}
                  </div>
                  {m?.record && <p className="tabular mt-2.5 text-[12px] text-ink-3">Đấu máy: {m.record}</p>}
                </div>
              </div>
            );
          })}
        </div>

        <h2 className="mt-16 font-display text-[22px] font-semibold tracking-[-0.015em]">Chế độ khác</h2>
        <div className="mt-4 border-t border-line">
          <Link href="/puzzle?daily=1" className="group flex items-center gap-4 border-b border-line py-5 transition-colors duration-150 hover:bg-surface/60">
            {daily && (
              <div className="hidden w-[56px] shrink-0 sm:block">
                <PuzzleThumb game={daily.game} state={build(daily.game, daily.setup)} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold text-ink">Thế cờ hôm nay</div>
              {daily && (
                <div className="mt-0.5 flex items-center gap-2 text-[13px] text-ink-2">
                  <span className="truncate">
                    {dailyGame} · {daily.title}
                  </span>
                  <span className="flex shrink-0 items-center gap-0.5 text-vermilion" aria-label={`Độ khó ${daily.difficulty} trên 3`}>
                    {Array.from({ length: daily.difficulty }, (_, i) => (
                      <Star key={i} size={11} fill="currentColor" strokeWidth={0} />
                    ))}
                  </span>
                </div>
              )}
            </div>
            <ArrowRight size={17} className="shrink-0 text-ink-3 transition-transform duration-150 group-hover:translate-x-1 group-hover:text-vermilion" />
          </Link>
          <Link href="/puzzle?mode=streak" className="group flex items-center gap-4 border-b border-line py-5 transition-colors duration-150 hover:bg-surface/60">
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold text-ink">Luyện liên hoàn</div>
              <div className="tabular mt-0.5 text-[13px] text-ink-2">
                Giải liên tiếp, ba mạng{best > 0 ? ` · kỷ lục ${best}` : ""}
              </div>
            </div>
            <ArrowRight size={17} className="shrink-0 text-ink-3 transition-transform duration-150 group-hover:translate-x-1 group-hover:text-vermilion" />
          </Link>
          <Link href="/online" className="group flex items-center gap-4 border-b border-line py-5 transition-colors duration-150 hover:bg-surface/60">
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold text-ink">Đấu online</div>
              <div className="mt-0.5 text-[13px] text-ink-2">Tạo phòng, gửi link cho bạn bè</div>
            </div>
            <ArrowRight size={17} className="shrink-0 text-ink-3 transition-transform duration-150 group-hover:translate-x-1 group-hover:text-vermilion" />
          </Link>
          <Link href="/giai-dau" className="group flex items-center gap-4 border-b border-line py-5 transition-colors duration-150 hover:bg-surface/60">
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold text-ink">Giải đấu</div>
              <div className="mt-0.5 text-[13px] text-ink-2">Bảng xếp hạng và các giải đang mở</div>
            </div>
            <ArrowRight size={17} className="shrink-0 text-ink-3 transition-transform duration-150 group-hover:translate-x-1 group-hover:text-vermilion" />
          </Link>
        </div>
      </div>
    </main>
  );
}
