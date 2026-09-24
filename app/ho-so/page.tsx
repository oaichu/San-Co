"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import type { GameId } from "@/lib/games/registry";

const GAME_LABEL: Record<GameId, string> = { caro: "Cờ caro", chess: "Cờ vua", xiangqi: "Cờ tướng", go: "Cờ vây" };
interface Rating { game: GameId; rating: number; wins: number; losses: number; draws: number }
interface GameRow { id: number; game: GameId; result: string | null; created_at: number; p1: number; p2: number; p1_name: string; p2_name: string }
interface LbRow { game: GameId; rating: number; wins: number; losses: number; draws: number; username: string }

export default function HoSoPage() {
  const [me, setMe] = useState<{ id: number; username: string; ratings: Rating[] } | null | undefined>(undefined);
  const [games, setGames] = useState<GameRow[]>([]);
  const [lb, setLb] = useState<LbRow[]>([]);
  const [lbGame, setLbGame] = useState<GameId>("caro");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => {
      setMe(d.user);
      if (d.user) fetch("/api/history").then((r) => r.json()).then((h) => setGames(h.games ?? []));
    });
  }, []);

  useEffect(() => {
    fetch(`/api/leaderboard?game=${lbGame}`).then((r) => r.json()).then((d) => setLb(d.rows ?? []));
  }, [lbGame]);

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <main className="relative min-h-screen">
      <Nav />
      <div className="mx-auto max-w-[1100px] px-5 pb-24 pt-[104px] md:px-11">
        {me === undefined ? null : me === null ? (
          <div className="py-24 text-center">
            <h1 className="font-display text-[32px] font-bold">Chưa đăng nhập</h1>
            <Link href="/dang-nhap" className="mt-6 inline-block rounded-xl bg-vermilion px-7 py-3.5 text-[15px] font-semibold text-accent-ink transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.97]">Đăng nhập</Link>
          </div>
        ) : (
          <div className="grid gap-[clamp(28px,4vw,56px)] lg:grid-cols-[1fr_380px]">
            <div>
              <div className="flex items-baseline justify-between gap-4">
                <h1 className="font-display text-[clamp(30px,4vw,44px)] font-bold tracking-[-0.025em]">{me.username}</h1>
                <button onClick={logout} className="text-[13px] font-medium text-ink-2 transition-colors hover:text-vermilion">Đăng xuất</button>
              </div>

              <div className="mt-8">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">Rating</div>
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
                  {(["caro", "chess", "xiangqi", "go"] as GameId[]).map((g) => {
                    const r = me.ratings.find((x) => x.game === g);
                    return (
                      <div key={g} className="bg-surface p-4">
                        <div className="text-[11.5px] font-semibold text-ink-3">{GAME_LABEL[g]}</div>
                        <div className="tabular mt-1 font-display text-[26px] font-bold">{r?.rating ?? 1200}</div>
                        <div className="tabular mt-0.5 text-[11.5px] text-ink-3">{r ? `${r.wins}T ${r.losses}B ${r.draws}H` : "chưa đấu"}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-10">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">Ván gần đây</div>
                {games.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-line-2 p-5 text-[13.5px] text-ink-3">Chưa có ván online nào. <Link href="/online" className="text-vermilion underline-offset-4 hover:underline">Vào sảnh</Link> để đấu ván đầu tiên.</p>
                ) : (
                  <ul className="divide-y divide-line border-y border-line">
                    {games.map((g) => {
                      const won = g.result === (g.p1 === me.id ? "p1" : "p2");
                      return (
                        <li key={g.id} className="flex items-center justify-between gap-3 py-3 text-[13.5px]">
                          <span className="font-medium">{GAME_LABEL[g.game]}</span>
                          <span className="truncate text-ink-3">{g.p1_name} – {g.p2_name}</span>
                          <span className={`shrink-0 font-semibold ${!g.result ? "text-ink-3" : g.result === "draw" ? "text-ink-2" : won ? "text-vermilion" : "text-ink-3"}`}>
                            {!g.result ? "đang chơi" : g.result === "draw" ? "Hòa" : won ? "Thắng" : "Thua"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            <aside className="self-start">
              <div className="mb-3 flex items-baseline justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">Bảng xếp hạng</div>
              </div>
              <div className="mb-4 flex gap-1">
                {(Object.keys(GAME_LABEL) as GameId[]).map((g) => (
                  <button key={g} onClick={() => setLbGame(g)} className={`rounded-full border px-3 py-1 text-[11.5px] font-semibold transition-all duration-150 active:scale-[0.97] ${g === lbGame ? "border-vermilion bg-vermilion text-accent-ink" : "border-line-2 text-ink-2 hover:text-ink"}`}>
                    {GAME_LABEL[g].replace("Cờ ", "")}
                  </button>
                ))}
              </div>
              {lb.length === 0 ? (
                <p className="text-[13px] text-ink-3">Chưa có ai xếp hạng sân này.</p>
              ) : (
                <ol className="divide-y divide-line border-y border-line">
                  {lb.map((r, i) => (
                    <li key={r.username} className="flex items-center gap-3 py-2.5 text-[13.5px]">
                      <span className={`tabular w-5 font-display font-bold ${i === 0 ? "text-vermilion" : "text-ink-3"}`}>{i + 1}</span>
                      <span className="font-medium">{r.username}</span>
                      <span className="tabular ml-auto font-semibold">{r.rating}</span>
                    </li>
                  ))}
                </ol>
              )}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
