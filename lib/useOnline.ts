"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adapters, type GameId, type Seat } from "./games/registry";

export interface RoomInfo { id: string; game: GameId; waiting: boolean; players: (string | undefined)[]; moves: number }
export interface Me { id: number; username: string }

export interface RoomSession {
  id: string;
  game: GameId;
  seat: Seat | "spec";
  state: unknown;
  players: (string | undefined)[];
  result?: "p1" | "p2" | "draw";
  deltas?: { p1: number; p2: number };
  lastMove?: { from: string; to: string } | null;
}

export function useOnline() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [room, setRoom] = useState<RoomSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendRaw = useCallback((m: unknown) => wsRef.current?.readyState === 1 && wsRef.current.send(JSON.stringify(m)), []);

  useEffect(() => {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${location.host}/ws`);
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.t === "me") setMe(m.user);
      else if (m.t === "rooms") setRooms(m.rooms);
      else if (m.t === "joined") setRoom({ id: m.room, game: m.game, seat: m.seat, state: adapters[m.game as GameId].decode(m.state), players: m.players });
      else if (m.t === "state") setRoom((r) => (r ? { ...r, state: adapters[r.game].decode(m.state), lastMove: m.last ?? null } : r));
      else if (m.t === "end") setRoom((r) => (r ? { ...r, result: m.result, deltas: m.deltas, state: adapters[r.game].decode(m.state) } : r));
      else if (m.t === "start") setRoom((r) => (r ? { ...r, players: m.players } : r));
      else if (m.t === "err") setError(m.error);
    };
    return () => ws.close();
  }, []);

  const create = useCallback((game: GameId) => sendRaw({ t: "create", game }), [sendRaw]);
  const quick = useCallback((game: GameId) => sendRaw({ t: "quick", game }), [sendRaw]);
  const join = useCallback((id: string) => sendRaw({ t: "join", room: id }), [sendRaw]);
  const watch = useCallback((id: string) => sendRaw({ t: "watch", room: id }), [sendRaw]);
  const move = useCallback((mv: unknown) => setRoom((r) => (r ? (sendRaw({ t: "move", room: r.id, move: mv }), r) : r)), [sendRaw]);
  const resign = useCallback(() => room && sendRaw({ t: "resign", room: room.id }), [room, sendRaw]);
  const toLobby = useCallback(() => { setRoom(null); sendRaw({ t: "lobby" }); }, [sendRaw]);

  return { connected, me, rooms, room, error, clearError: () => setError(null), create, quick, join, watch, move, resign, toLobby };
}
