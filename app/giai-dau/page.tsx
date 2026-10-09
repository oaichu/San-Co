"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import { TIME_CONTROLS, FORMAT_LABEL, type TourFormat } from "@/lib/tournament";
import type { GameId } from "@/lib/games/registry";

const GAME_LABEL: Record<GameId, string> = { caro: "Cờ caro", chess: "Cờ vua", xiangqi: "Cờ tướng", go: "Cờ vây" };
const STATUS_LABEL = { open: "Đang mở", running: "Đang đấu", done: "Đã xong" } as const;

interface TourRow {
  id: number; name: string; game: GameId; format: TourFormat; tc_key: string;
  max_players: number; status: keyof typeof STATUS_LABEL; creator: string; players: number;
}

export default function TournamentsPage() {
  const [tours, setTours] = useState<TourRow[] | null>(null);
  const [me, setMe] = useState<{ username: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const load = useCallback(() => {
    fetch("/api/tour").then((r) => r.json()).then((d) => setTours(d.tours)).catch(() => setTours([]));
    fetch("/api/me").then((r) => r.json()).then((d) => setMe(d.user)).catch(() => {});
  }, []);
  useEffect(load, [load]);

  return (
    <main className="relative min-h-screen">
      <Nav />
      <div className="mx-auto max-w-[980px] px-5 pb-24 pt-[104px] md:px-11">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="font-display text-[clamp(30px,4vw,48px)] font-bold tracking-[-0.025em]">Giải đấu.</h1>
            <p className="mt-3 max-w-[52ch] text-[15px] leading-[1.65] text-ink-2">
              Thi đấu theo thể thức giải thật — loại trực tiếp, vòng tròn, Thụy Sĩ. Có đồng hồ, có ELO.
            </p>
          </div>
          {me && (
            <button onClick={() => setCreating((c) => !c)} className="shrink-0 rounded-xl bg-vermilion px-5 py-2.5 text-[13.5px] font-semibold text-accent-ink transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.97]">
              {creating ? "Đóng" : "Tạo giải"}
            </button>
          )}
        </div>

        {creating && <CreateForm onDone={(id) => router.push(`/giai-dau/${id}`)} onError={setError} />}
        {error && <p className="mt-4 text-[13.5px] font-medium text-vermilion">{error}</p>}

        <div className="mt-10">
          {tours === null ? (
            <p className="text-[13.5px] text-ink-3">Đang tải…</p>
          ) : tours.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line-2 p-6 text-[13.5px] text-ink-3">
              Chưa có giải nào. {me ? "Tạo giải đầu tiên cho cộng đồng." : "Đăng nhập để tạo và tham gia giải."}
            </p>
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {tours.map((t) => (
                <li key={t.id}>
                  <Link href={`/giai-dau/${t.id}`} className="flex items-center justify-between gap-4 py-4 transition-colors duration-150 hover:bg-surface/60">
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-semibold">{t.name}</div>
                      <div className="mt-0.5 text-[12.5px] text-ink-3">
                        {GAME_LABEL[t.game]} · {FORMAT_LABEL[t.format]} · {t.tc_key === "0" ? "không giờ" : t.tc_key} · {t.players}/{t.max_players} người · bởi {t.creator}
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full border px-3 py-1 text-[11.5px] font-semibold ${
                      t.status === "open" ? "border-vermilion text-vermilion" : t.status === "running" ? "border-line-2 text-ink" : "border-line text-ink-3"
                    }`}>
                      {STATUS_LABEL[t.status]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}

function CreateForm({ onDone, onError }: { onDone: (id: number) => void; onError: (e: string | null) => void }) {
  const [name, setName] = useState("");
  const [game, setGame] = useState<GameId>("chess");
  const [format, setFormat] = useState<TourFormat>("swiss");
  const [tc, setTc] = useState("3+2");
  const [max, setMax] = useState(8);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    onError(null);
    const r = await fetch("/api/tour", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, game, format, tc, maxPlayers: max }),
    }).catch(() => null);
    setBusy(false);
    if (!r) return onError("Mất kết nối.");
    const d = await r.json();
    if (!r.ok) return onError(d.error ?? "Không tạo được giải.");
    onDone(d.id);
  };

  const sel = "rounded-lg border border-line-2 bg-transparent px-3 py-2 text-[16px] text-ink outline-none md:text-[13.5px] transition-colors focus:border-vermilion";
  return (
    <div className="mt-6 border-y border-line py-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="sm:col-span-2 lg:col-span-2">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">Tên giải</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Giải mở rộng tháng này" className={`${sel} w-full`} />
        </label>
        <label>
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">Loại cờ</span>
          <select value={game} onChange={(e) => setGame(e.target.value as GameId)} className={`${sel} w-full`}>
            {(Object.keys(GAME_LABEL) as GameId[]).map((g) => <option key={g} value={g}>{GAME_LABEL[g]}</option>)}
          </select>
        </label>
        <label>
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">Thể thức</span>
          <select value={format} onChange={(e) => setFormat(e.target.value as TourFormat)} className={`${sel} w-full`}>
            {(Object.keys(FORMAT_LABEL) as TourFormat[]).map((f) => <option key={f} value={f}>{FORMAT_LABEL[f]}</option>)}
          </select>
        </label>
        <label>
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">Số người</span>
          <select value={max} onChange={(e) => setMax(Number(e.target.value))} className={`${sel} w-full`}>
            {[4, 8, 16, 32].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-4">
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">Nhịp giờ</span>
        <div className="flex flex-wrap gap-1.5">
          {TIME_CONTROLS.map((t) => (
            <button key={t.key} onClick={() => setTc(t.key)} className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-all duration-150 active:scale-[0.97] ${t.key === tc ? "border-vermilion bg-vermilion text-accent-ink" : "border-line-2 text-ink-2 hover:border-ink-2 hover:text-ink"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <button onClick={submit} disabled={busy || name.trim().length < 3} className="mt-5 rounded-xl bg-vermilion px-6 py-2.5 text-[13.5px] font-semibold text-accent-ink transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-40">
        {busy ? "Đang tạo…" : "Mở đăng ký"}
      </button>
    </div>
  );
}
