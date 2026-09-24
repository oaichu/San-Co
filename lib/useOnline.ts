"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adapters, type GameId, type Seat } from "./games/registry";

export interface RoomInfo { id: string; game: GameId; waiting: boolean; players: (string | undefined)[]; moves: number; tc?: string }
export interface Me { id: number; username: string }
export interface TourNotice { room: string }

export interface RoomSession {
  id: string;
  game: GameId;
  seat: Seat | "spec";
  state: unknown;
  players: (string | undefined)[];
  result?: "p1" | "p2" | "draw";
  deltas?: { p1: number; p2: number };
  lastMove?: { from: string; to: string } | null;
  tc?: string;
  /** ms còn lại của [p1, p2] tại thời điểm clockAt */
  clock?: [number, number] | null;
  clockAt?: number;
}

/** đồng hồ hiển thị: ms còn lại của seat tại thời điểm now (trừ nhịp đang chạy) */
export function clockDisplay(room: RoomSession, seat: "p1" | "p2", now: number): number | null {
  if (!room.clock) return null;
  const i = seat === "p1" ? 0 : 1;
  let left = room.clock[i];
  if (!room.result && room.state) {
    const mover = (adapters[room.game] as { seatToMove: (s: never) => Seat }).seatToMove(room.state as never);
    if (mover === seat) left -= now - (room.clockAt ?? now);
  }
  return Math.max(0, left);
}

export function useOnline() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [room, setRoom] = useState<RoomSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tourNotice, setTourNotice] = useState<TourNotice | null>(null);

  const sendRaw = useCallback((m: unknown) => wsRef.current?.readyState === 1 && wsRef.current.send(JSON.stringify(m)), []);

  useEffect(() => {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${location.host}/ws`);
    wsRef.current = ws;
    ws.onopen = () => {
      setConnected(true);
      // auto-vào trận từ link /online?room=xxx
      const target = new URLSearchParams(location.search).get("room");
      if (target) sendRaw({ t: "join", room: target });
    };
    ws.onclose = () => setConnected(false);
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.t === "me") setMe(m.user);
      else if (m.t === "rooms") setRooms(m.rooms);
      else if (m.t === "joined") setRoom({ id: m.room, game: m.game, seat: m.seat, state: adapters[m.game as GameId].decode(m.state), players: m.players, tc: m.tc, clock: m.clock ?? null, clockAt: Date.now() });
      else if (m.t === "state") setRoom((r) => (r ? { ...r, state: adapters[r.game].decode(m.state), lastMove: m.last ?? null, clock: m.clock ?? r.clock, clockAt: Date.now() } : r));
      else if (m.t === "end") setRoom((r) => (r ? { ...r, result: m.result, deltas: m.deltas, state: adapters[r.game].decode(m.state), clock: m.clock ?? r.clock } : r));
      else if (m.t === "start") setRoom((r) => (r ? { ...r, players: m.players, clock: m.clock ?? r.clock, clockAt: Date.now() } : r));
      else if (m.t === "tour") setTourNotice({ room: m.room });
      else if (m.t === "err") setError(m.error);
    };
    return () => ws.close();
  }, [sendRaw]);

  const create = useCallback((game: GameId, tc = "0") => sendRaw({ t: "create", game, tc }), [sendRaw]);
  const quick = useCallback((game: GameId, tc = "0") => sendRaw({ t: "quick", game, tc }), [sendRaw]);
  const join = useCallback((id: string) => sendRaw({ t: "join", room: id }), [sendRaw]);
  const watch = useCallback((id: string) => sendRaw({ t: "watch", room: id }), [sendRaw]);
  const move = useCallback((mv: unknown) => setRoom((r) => (r ? (sendRaw({ t: "move", room: r.id, move: mv }), r) : r)), [sendRaw]);
  const resign = useCallback(() => room && sendRaw({ t: "resign", room: room.id }), [room, sendRaw]);
  const toLobby = useCallback(() => { setRoom(null); sendRaw({ t: "lobby" }); }, [sendRaw]);

  return { connected, me, rooms, room, error, tourNotice, clearError: () => setError(null), clearTourNotice: () => setTourNotice(null), create, quick, join, watch, move, resign, toLobby };
}
