"use client";

import { useState } from "react";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { useOnline } from "@/lib/useOnline";
import { adapters, type GameId, type Seat } from "@/lib/games/registry";
import { CaroBoard } from "@/components/board/CaroBoard";
import { ChessBoard } from "@/components/board/ChessBoard";
import { XiangqiBoard } from "@/components/board/XiangqiBoard";
import { GoBoard } from "@/components/board/GoBoard";
import type { CaroState } from "@/lib/games/caro/rules";
import { colorOf, legalMoves, type XqState } from "@/lib/games/xiangqi/rules";
import type { GoState } from "@/lib/games/go/rules";
import type { Chess, Square } from "chess.js";

const GAME_LABEL: Record<GameId, string> = { caro: "Cờ caro", chess: "Cờ vua", xiangqi: "Cờ tướng", go: "Cờ vây" };
const SEAT_LABEL: Record<Seat, string> = { p1: "quân đi trước", p2: "quân đi sau" };

export default function OnlinePage() {
  const ol = useOnline();
  return (
    <main className="relative min-h-screen">
      <Nav />
      <div className="mx-auto max-w-[1240px] px-5 pb-24 pt-[104px] md:px-11">
        {ol.room ? <GameRoom ol={ol} /> : <Lobby ol={ol} />}
        {ol.error && (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-vermilion bg-surface px-5 py-3 text-[13.5px] font-medium text-vermilion shadow-lift" role="alert">
            {ol.error}
            <button onClick={ol.clearError} className="ml-3 underline underline-offset-2">Đóng</button>
          </div>
        )}
      </div>
    </main>
  );
}

function Lobby({ ol }: { ol: ReturnType<typeof useOnline> }) {
  const [game, setGame] = useState<GameId>("caro");
  return (
    <div className="grid gap-[clamp(28px,4vw,56px)] lg:grid-cols-[1fr_360px]">
      <div>
        <h1 className="font-display text-[clamp(30px,4vw,48px)] font-bold tracking-[-0.025em]">Sảnh online.</h1>
        <p className="mt-3 max-w-[52ch] text-[15px] leading-[1.65] text-ink-2">
          {ol.me ? `Chào ${ol.me.username}. Tạo phòng hoặc tìm trận nhanh — ván đấu được xếp hạng ELO.` : "Đăng nhập để tạo phòng và giữ rating ELO của bạn."}
        </p>

        <div className="mt-8">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">Loại cờ</div>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(GAME_LABEL) as GameId[]).map((g) => (
              <button key={g} onClick={() => setGame(g)} className={`rounded-full border px-4 py-2 text-[13px] font-medium transition-all duration-150 active:scale-[0.97] ${g === game ? "border-vermilion bg-vermilion text-accent-ink" : "border-line-2 text-ink-2 hover:border-ink-2 hover:text-ink"}`}>
                {GAME_LABEL[g]}
              </button>
            ))}
          </div>
          <div className="mt-5 flex gap-2">
            {ol.me ? (
              <>
                <button onClick={() => ol.quick(game)} className="rounded-xl bg-vermilion px-6 py-3 text-[14px] font-semibold text-accent-ink transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.97]">Tìm trận nhanh</button>
                <button onClick={() => ol.create(game)} className="rounded-xl border border-line-2 px-6 py-3 text-[14px] font-semibold transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.97]">Tạo phòng</button>
              </>
            ) : (
              <Link href="/dang-nhap" className="rounded-xl bg-vermilion px-6 py-3 text-[14px] font-semibold text-accent-ink transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.97]">Đăng nhập để chơi</Link>
            )}
          </div>
        </div>
      </div>

      <aside className="self-start">
        <div className="mb-3 flex items-baseline justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">Phòng đang mở</div>
          <span className={`text-[11.5px] font-medium ${ol.connected ? "text-ink-3" : "text-vermilion"}`}>{ol.connected ? "● trực tuyến" : "● mất kết nối"}</span>
        </div>
        {ol.rooms.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line-2 p-5 text-[13px] text-ink-3">Chưa có phòng nào. Tạo phòng đầu tiên đi.</p>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {ol.rooms.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3.5">
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold">{GAME_LABEL[r.game]}</div>
                  <div className="truncate text-[12px] text-ink-3">{r.players.filter(Boolean).join(" vs ") || "đang chờ"} · {r.moves} nước</div>
                </div>
                {r.waiting ? (
                  <button onClick={() => ol.join(r.id)} className="shrink-0 rounded-lg border border-vermilion px-3.5 py-1.5 text-[12.5px] font-semibold text-vermilion transition-all duration-150 hover:bg-vermilion hover:text-accent-ink active:scale-[0.97]">Vào</button>
                ) : (
                  <button onClick={() => ol.watch(r.id)} className="shrink-0 rounded-lg border border-line-2 px-3.5 py-1.5 text-[12.5px] font-semibold text-ink-2 transition-all duration-150 hover:border-ink-2 hover:text-ink active:scale-[0.97]">Xem</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

function GameRoom({ ol }: { ol: ReturnType<typeof useOnline> }) {
  const r = ol.room!;
  const adapter = adapters[r.game];
  const myTurn = r.seat !== "spec" && !r.result && adapter.seatToMove(r.state as never) === r.seat;
  const waiting = !r.players[0] || !r.players[1];

  const status = r.result
    ? r.result === "draw" ? "Hòa." : (r.result === r.seat ? "Bạn thắng." : "Bạn thua.") : "";
  const delta = r.deltas && r.seat !== "spec" ? r.deltas[r.seat as Seat] : null;

  return (
    <div className="grid gap-[clamp(28px,4vw,56px)] lg:grid-cols-[1fr_320px]">
      <div>
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <h1 className="font-display text-[clamp(26px,3vw,36px)] font-bold tracking-[-0.02em]">{GAME_LABEL[r.game]}</h1>
          <button onClick={ol.toLobby} className="text-[13px] font-medium text-ink-2 transition-colors hover:text-ink">← Sảnh</button>
        </div>
        {waiting && (
          <div className="mb-4 rounded-xl border border-dashed border-line-2 p-4 text-[13.5px] text-ink-2">
            Đang chờ đối thủ… mã phòng <span className="tabular font-semibold text-ink">{r.id}</span>
          </div>
        )}
        <div className="mx-auto max-w-[640px]">
          <BoardSwitch room={r} myTurn={myTurn} onMove={ol.move} />
        </div>
      </div>

      <aside className="self-start lg:sticky lg:top-[96px]">
        <div className="border-b border-line pb-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">Ván đấu</div>
          <div className="mt-2 space-y-1 text-[14px]">
            <div className="flex justify-between"><span>{r.players[0] ?? "…"}</span><span className="text-ink-3">P1</span></div>
            <div className="flex justify-between"><span>{r.players[1] ?? "…"}</span><span className="text-ink-3">P2</span></div>
          </div>
          <div className="mt-3 text-[13px] text-ink-2">
            {r.seat === "spec" ? "Bạn đang xem ván này." : `Bạn là ${SEAT_LABEL[r.seat as Seat]}.`}
            {r.result ? <span className="mt-1 block font-display text-[18px] font-semibold text-vermilion">{status} {delta != null && <span className="tabular text-[14px]">({delta > 0 ? "+" : ""}{delta} ELO)</span>}</span> : myTurn ? "Tới lượt bạn." : "Lượt đối thủ."}
          </div>
        </div>
        {r.seat !== "spec" && !r.result && (
          <div className="border-b border-line py-5">
            <button onClick={ol.resign} className="w-full rounded-lg border border-line-2 py-2.5 text-[13.5px] font-semibold text-ink-2 transition-all duration-150 hover:border-vermilion hover:text-vermilion active:scale-[0.97]">Đầu hàng</button>
          </div>
        )}
        {r.result && (
          <div className="border-b border-line py-5">
            <button onClick={ol.toLobby} className="w-full rounded-xl bg-vermilion py-3 text-[14px] font-semibold text-accent-ink transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.97]">Về sảnh</button>
          </div>
        )}
      </aside>
    </div>
  );
}

function BoardSwitch({ room, myTurn, onMove }: { room: { game: GameId; state: unknown }; myTurn: boolean; onMove: (m: unknown) => void }) {
  const [sel, setSel] = useState<string | number | null>(null);

  if (room.game === "caro") {
    return <CaroBoard state={room.state as CaroState} onCell={(i) => myTurn && onMove(i)} disabled={!myTurn} />;
  }
  if (room.game === "chess") {
    const g = room.state as Chess;
    const targets = new Set(sel != null ? g.moves({ square: sel as Square, verbose: true }).map((m) => m.to) : []);
    return (
      <ChessBoard
        game={g}
        selected={sel as Square | null}
        targets={targets}
        disabled={!myTurn}
        onSquare={(sq) => {
          if (sel && targets.has(sq)) { onMove({ from: sel, to: sq }); setSel(null); return; }
          const p = g.get(sq);
          setSel(p && p.color === g.turn() ? sq : null);
        }}
      />
    );
  }
  if (room.game === "xiangqi") {
    const s = room.state as XqState;
    const targets = new Set<number>();
    if (sel != null && myTurn) for (const m of legalMoves(s)) if (m.from === sel) targets.add(m.to);
    return (
      <XiangqiBoard
        state={s}
        selected={sel as number | null}
        targets={targets}
        disabled={!myTurn}
        onPoint={(i) => {
          if (sel != null && targets.has(i)) { onMove({ from: sel, to: i }); setSel(null); return; }
          const p = s.board[i];
          setSel(p && colorOf(p) === s.turn ? i : null);
        }}
      />
    );
  }
  return (
    <>
      <GoBoard state={room.state as GoState} onPoint={(i) => myTurn && onMove(i)} disabled={!myTurn} />
      {myTurn && (
        <button onClick={() => onMove(-1)} className="mt-4 w-full rounded-lg border border-line-2 py-2.5 text-[13.5px] font-semibold transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.97]">
          Pass (bỏ lượt)
        </button>
      )}
    </>
  );
}
