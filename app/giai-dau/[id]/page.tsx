"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Nav } from "@/components/Nav";
import { FORMAT_LABEL, type TourFormat } from "@/lib/tournament";
import type { GameId } from "@/lib/games/registry";

const GAME_LABEL: Record<GameId, string> = { caro: "Cờ caro", chess: "Cờ vua", xiangqi: "Cờ tướng", go: "Cờ vây" };
const STATUS_LABEL = { open: "Đang mở đăng ký", running: "Đang đấu", done: "Đã kết thúc" } as const;

interface Detail {
  tour: {
    id: number; name: string; game: GameId; format: TourFormat; tc_key: string;
    max_players: number; total_rounds: number; current_round: number;
    status: "open" | "running" | "done"; created_by: number; winner: number | null;
  };
  players: { user_id: number; username: string; score: number; buchholz: number; alive: number }[];
  games: {
    id: number; round: number; p1: number; p2: number | null;
    p1_name: string; p2_name: string | null;
    result: "p1" | "p2" | "draw" | null; room_id: string | null;
  }[];
  joined: boolean;
  myGame: { id: number; room_id: string | null } | null;
}

export default function TourPage() {
  const params = useParams();
  const id = String(params.id);
  const [d, setD] = useState<Detail | null>(null);
  const [me, setMe] = useState<{ id: number; username: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/tour/${id}`).then((r) => (r.ok ? r.json() : null)).then(setD).catch(() => {});
  }, [id]);
  useEffect(() => {
    load();
    fetch("/api/me").then((r) => r.json()).then((x) => setMe(x.user)).catch(() => {});
    const t = setInterval(load, 4000); // cập nhật kết quả gần realtime
    return () => clearInterval(t);
  }, [load]);

  const act = async (action: "join" | "start") => {
    setBusy(true); setError(null);
    const r = await fetch(`/api/tour/${id}/${action}`, { method: "POST" }).catch(() => null);
    if (!r) setError("Mất kết nối.");
    else if (!r.ok) setError((await r.json()).error ?? "Lỗi.");
    setBusy(false);
    load();
  };

  if (!d) {
    return <main className="relative min-h-screen"><Nav /><div className="mx-auto max-w-[980px] px-5 pt-[104px] text-[13.5px] text-ink-3">Đang tải…</div></main>;
  }
  const t = d.tour;
  const isCreator = me?.id === t.created_by;
  const winnerName = t.winner != null ? d.players.find((p) => p.user_id === t.winner)?.username : null;
  const rounds = [...new Set(d.games.map((g) => g.round))].sort((a, b) => b - a);

  return (
    <main className="relative min-h-screen">
      <Nav />
      <div className="mx-auto max-w-[980px] px-5 pb-24 pt-[104px] md:px-11">
        <Link href="/giai-dau" className="text-[13px] font-medium text-ink-3 transition-colors hover:text-ink">← Tất cả giải</Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[clamp(28px,3.6vw,44px)] font-bold tracking-[-0.025em]">{t.name}</h1>
            <p className="mt-2 text-[13.5px] text-ink-2">
              {GAME_LABEL[t.game]} · {FORMAT_LABEL[t.format]} · {t.tc_key === "0" ? "không giờ" : `nhịp ${t.tc_key}`} · {STATUS_LABEL[t.status]}
              {t.status !== "open" && ` · Vòng ${t.current_round}${t.total_rounds ? `/${t.total_rounds}` : ""}`}
            </p>
          </div>
          <div className="flex gap-2">
            {d.myGame?.room_id && (
              <Link href={`/online?room=${d.myGame.room_id}`} className="rounded-xl bg-vermilion px-5 py-2.5 text-[13.5px] font-semibold text-accent-ink transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.97]">
                Vào trận của bạn
              </Link>
            )}
            {t.status === "open" && me && !d.joined && (
              <button onClick={() => act("join")} disabled={busy} className="rounded-xl bg-vermilion px-5 py-2.5 text-[13.5px] font-semibold text-accent-ink transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-40">Tham gia</button>
            )}
            {t.status === "open" && isCreator && (
              <button onClick={() => act("start")} disabled={busy || d.players.length < 2} className="rounded-xl border border-vermilion px-5 py-2.5 text-[13.5px] font-semibold text-vermilion transition-all duration-150 hover:bg-vermilion hover:text-accent-ink active:scale-[0.97] disabled:opacity-40">
                Bắt đầu ({d.players.length}/{t.max_players})
              </button>
            )}
          </div>
        </div>
        {error && <p className="mt-3 text-[13.5px] font-medium text-vermilion">{error}</p>}
        {t.format === "ko" && t.status !== "open" && (
          <p className="mt-3 text-[12.5px] text-ink-3">Loại trực tiếp: hòa — bên rating cao hơn đi tiếp.</p>
        )}
        {winnerName && (
          <p className="mt-4 border-y border-line py-3 text-[15px] font-semibold">
            Vô địch: <span className="text-vermilion">{winnerName}</span>
          </p>
        )}

        <div className="mt-10 grid gap-[clamp(28px,4vw,48px)] lg:grid-cols-[1fr_1.2fr]">
          {/* bảng xếp hạng */}
          <section>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">Kỳ thủ · {d.players.length}</h2>
            <table className="mt-3 w-full border-y border-line text-[13.5px]">
              <tbody>
                {d.players.map((p, i) => (
                  <tr key={p.user_id} className="border-b border-line last:border-0">
                    <td className="tabular w-8 py-2.5 text-ink-3">{i + 1}</td>
                    <td className="py-2.5 font-medium">
                      {p.username}
                      {t.winner === p.user_id && <span className="ml-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-vermilion">vô địch</span>}
                      {t.format === "ko" && !p.alive && t.status === "running" && <span className="ml-2 text-[11px] text-ink-3">loại</span>}
                    </td>
                    <td className="tabular py-2.5 text-right font-semibold">{p.score}</td>
                    {t.format !== "ko" && <td className="tabular py-2.5 text-right text-[12px] text-ink-3">BH {p.buchholz}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* các vòng đấu */}
          <section>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">Diễn biến</h2>
            {rounds.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-line-2 p-5 text-[13px] text-ink-3">
                {t.status === "open" ? "Chưa bốc cặp — chờ người tạo bắt đầu giải." : "Đang bốc cặp…"}
              </p>
            ) : (
              <div className="mt-3 space-y-6">
                {rounds.map((r) => (
                  <div key={r}>
                    <div className="mb-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                      {t.format === "ko" ? (r === rounds[0] && t.status === "done" ? "Chung kết & các vòng" : `Vòng ${r}`) : `Vòng ${r}`}
                    </div>
                    <ul className="divide-y divide-line border-y border-line">
                      {d.games.filter((g) => g.round === r).map((g) => (
                        <li key={g.id} className="flex items-center justify-between gap-3 py-2.5 text-[13.5px]">
                          <span className="min-w-0 truncate">
                            <span className={g.result === "p1" ? "font-semibold" : ""}>{g.p1_name}</span>
                            <span className="tabular mx-2 text-ink-3">
                              {g.p2 === null ? "bye" : g.result === null ? "—" : g.result === "draw" ? "½–½" : g.result === "p1" ? "1–0" : "0–1"}
                            </span>
                            <span className={g.result === "p2" ? "font-semibold" : ""}>{g.p2_name ?? ""}</span>
                          </span>
                          {g.result === null && g.room_id && (
                            <Link href={`/online?room=${g.room_id}`} className="shrink-0 rounded-lg border border-line-2 px-3 py-1 text-[11.5px] font-semibold text-ink-2 transition-colors hover:border-vermilion hover:text-vermilion">
                              {me && (me.id === g.p1 || me.id === g.p2) ? "Vào trận" : "Xem"}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
