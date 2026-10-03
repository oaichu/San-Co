"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { LESSONS, lessonsByGame } from "@/lib/content/lessons";
import { BoardSkin } from "@/components/board/skins";
import type { GameId } from "@/lib/games/registry";

const TABS: { id: GameId; name: string }[] = [
  { id: "caro", name: "Cờ caro" },
  { id: "chess", name: "Cờ vua" },
  { id: "xiangqi", name: "Cờ tướng" },
  { id: "go", name: "Cờ vây" },
];
const LS_KEY = "san-co-lessons-done";

const loadLocal = (): Set<string> => {
  if (typeof window === "undefined") return new Set();
  try { return new Set(JSON.parse(localStorage.getItem(LS_KEY) ?? "[]") as string[]); } catch { return new Set(); }
};

export default function HocPage() {
  const [game, setGame] = useState<GameId>("caro");
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    Promise.resolve().then(() => {
      if (alive) setDone(loadLocal());
      return fetch("/api/progress").then((r) => r.ok ? r.json() : null).then((d) => {
        if (alive && d?.lessons) setDone((s) => new Set([...s, ...(d.lessons as string[])]));
      });
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const list = lessonsByGame(game);
  const nextLesson = useMemo(
    () => list.find((l) => !done.has(l.id)) ?? null,
    [list, done],
  );
  const totalDone = LESSONS.filter((l) => done.has(l.id)).length;

  return (
    <main className="relative min-h-screen">
      <Nav />
      <div className="mx-auto max-w-[1240px] px-5 pb-24 pt-[104px] md:px-11">
        <h1 className="font-display text-[clamp(30px,4vw,48px)] font-bold tracking-[-0.025em]">Học cờ.</h1>
        <p className="mt-3 max-w-[52ch] text-[15px] leading-[1.65] text-ink-2">
          Giáo trình ngắn, có bàn cờ tương tác trong từng bài. Tiến độ lưu trên máy; đăng nhập để đồng bộ mọi thiết bị.
        </p>
        <p className="tabular mt-3 text-[13px] font-medium text-ink-3">
          Đã học {totalDone}/{LESSONS.length} bài
        </p>

        <div className="mt-8 flex gap-1.5 border-b border-line pb-px">
          {TABS.map((t) => {
            const g = lessonsByGame(t.id);
            const d = g.filter((l) => done.has(l.id)).length;
            return (
              <button key={t.id} onClick={() => setGame(t.id)} className={`rounded-t-lg px-4 py-2.5 text-[13.5px] font-semibold transition-colors duration-150 ${t.id === game ? "bg-surface text-ink shadow-[inset_0_-2px_0_var(--vermilion)]" : "text-ink-2 hover:text-ink"}`}>
                {t.name}
                <span className="tabular ml-1.5 text-[11px] font-medium text-ink-3">{d}/{g.length}</span>
              </button>
            );
          })}
        </div>

        {nextLesson && (
          <Link href={`/hoc/${nextLesson.id}`} className="group mt-6 flex items-center justify-between gap-4 rounded-2xl border border-vermilion/40 bg-vermilion-soft px-6 py-4 transition-all duration-150 hover:-translate-y-0.5">
            <span>
              <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-vermilion">Học tiếp</span>
              <span className="mt-0.5 block text-[15.5px] font-semibold text-ink group-hover:text-vermilion transition-colors duration-150">{nextLesson.title}</span>
              <span className="mt-0.5 block text-[13px] text-ink-2">{nextLesson.sub}</span>
            </span>
            <span className="shrink-0 text-[18px] text-vermilion transition-transform duration-150 group-hover:translate-x-1" aria-hidden="true">→</span>
          </Link>
        )}

        <div className="grid gap-px overflow-hidden border-b border-line sm:grid-cols-2">
          {list.map((l, i) => (
            <Link key={l.id} href={`/hoc/${l.id}`} className="group flex gap-5 border-t border-line py-6 pr-2 transition-colors duration-150 hover:bg-surface/60">
              <span className="tabular font-display text-[15px] font-semibold text-ink-3">0{i + 1}</span>
              <div className="min-w-0">
                <h2 className="font-display text-[18px] font-semibold tracking-[-0.01em] transition-colors group-hover:text-vermilion">
                  {l.title}
                  {done.has(l.id) && <span className="ml-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-vermilion">xong</span>}
                </h2>
                <p className="mt-1 text-[13.5px] leading-[1.6] text-ink-2">{l.sub}</p>
              </div>
              <span className="ml-auto mt-1 shrink-0 text-ink-3 transition-transform duration-150 group-hover:translate-x-1 group-hover:text-vermilion" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex items-center gap-5 rounded-2xl border border-line bg-surface p-6">
          <div className="hidden w-[140px] shrink-0 overflow-hidden rounded-lg border border-edge sm:block"><BoardSkin game={game} /></div>
          <div>
            <h3 className="font-display text-[18px] font-semibold">Học xong thì vào sân</h3>
            <p className="mt-1 text-[13.5px] text-ink-2">Áp dụng ngay: đấu AI hoặc giải thế cờ để ghi nhớ.</p>
            <div className="mt-3 flex gap-2">
              <Link href={`/choi/${game}`} className="rounded-lg bg-vermilion px-4 py-2 text-[13px] font-semibold text-accent-ink transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.97]">Chơi {TABS.find((t) => t.id === game)?.name}</Link>
              <Link href="/puzzle" className="rounded-lg border border-line-2 px-4 py-2 text-[13px] font-semibold transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.97]">Giải thế cờ</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
