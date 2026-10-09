import { PUZZLES } from "./puzzles";
import type { Puzzle } from "./types";
import type { GameId } from "@/lib/games/registry";

/** PRNG mulberry32 — deterministic, seed cố định */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(arr: readonly T[], rand: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

/** YYYY-MM-DD theo giờ Việt Nam */
export function dayKey(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

const EPOCH = Date.UTC(2026, 0, 1); // mốc 2026-01-01

/** Thế cờ của ngày: quay vòng qua các thế difficulty ≥ 2, xáo theo seed cố định */
export function dailyPuzzle(d = new Date()): Puzzle {
  const [y, m, dd] = dayKey(d).split("-").map(Number);
  const days = Math.floor((Date.UTC(y, m - 1, dd) - EPOCH) / 86_400_000);
  const pool = shuffled(
    PUZZLES.filter((p) => p.difficulty >= 2),
    mulberry32(0x5eed)
  );
  return pool[((days % pool.length) + pool.length) % pool.length];
}

/** Chuỗi ôn luyện: tầng 1 xáo, rồi tầng 2, rồi tầng 3 — cùng seed cùng thứ tự */
export function buildStreak(game: GameId | "all", seed: number): Puzzle[] {
  const pool = game === "all" ? PUZZLES : PUZZLES.filter((p) => p.game === game);
  const rand = mulberry32(seed);
  const out: Puzzle[] = [];
  for (const tier of [1, 2, 3] as const) {
    out.push(...shuffled(pool.filter((p) => p.difficulty === tier), rand));
  }
  return out;
}
