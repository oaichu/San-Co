import type { WebSocket } from "ws";
import crypto from "crypto";
import { adapters, type GameId, type Seat } from "../lib/games/registry";
import { q } from "./db";
import { eloDelta } from "../lib/elo";

interface Player { userId: number; username: string; ws: WebSocket }

interface Room {
  id: string;
  game: GameId;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any;
  p1?: Player;
  p2?: Player;
  dbId?: number;
  moves: unknown[];
  createdAt: number;
  spectators: Set<WebSocket>;
}

const rooms = new Map<string, Room>();
const socketRoom = new Map<WebSocket, string>();

const send = (ws: WebSocket, msg: unknown) => {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
};

function roomInfo(r: Room) {
  return { id: r.id, game: r.game, waiting: !(r.p1 && r.p2), players: [r.p1?.username, r.p2?.username], moves: r.moves.length, createdAt: r.createdAt };
}

export function broadcastLobby() {
  const list = [...rooms.values()].filter((r) => !(r.p1 && r.p2) || r.moves.length < 3).map(roomInfo);
  for (const ws of socketRoom.keys()) if (socketRoom.get(ws) === "lobby") send(ws, { t: "rooms", rooms: list });
}

function broadcast(r: Room, msg: unknown) {
  for (const p of [r.p1, r.p2]) if (p) send(p.ws, msg);
  for (const s of r.spectators) send(s, msg);
}

function finish(r: Room, result: "p1" | "p2" | "draw") {
  const adapter = adapters[r.game];
  let deltas: Record<Seat, number> | null = null;
  if (r.p1 && r.p2) {
    const ra = (q.getRating.get(r.p1.userId, r.game) as { rating: number } | undefined)?.rating ?? 1200;
    const rb = (q.getRating.get(r.p2.userId, r.game) as { rating: number } | undefined)?.rating ?? 1200;
    const res = result === "p1" ? 1 : result === "p2" ? 0 : 0.5;
    const d = eloDelta(ra, rb, res);
    const rp1 = (q.getRating.get(r.p1.userId, r.game) ?? { wins: 0, losses: 0, draws: 0 }) as { wins: number; losses: number; draws: number };
    const rp2 = (q.getRating.get(r.p2.userId, r.game) ?? { wins: 0, losses: 0, draws: 0 }) as { wins: number; losses: number; draws: number };
    q.upsertRating.run({ user_id: r.p1.userId, game: r.game, rating: ra + d, wins: rp1.wins + (result === "p1" ? 1 : 0), losses: rp1.losses + (result === "p2" ? 1 : 0), draws: rp1.draws + (result === "draw" ? 1 : 0) });
    q.upsertRating.run({ user_id: r.p2.userId, game: r.game, rating: rb - d, wins: rp2.wins + (result === "p2" ? 1 : 0), losses: rp2.losses + (result === "p1" ? 1 : 0), draws: rp2.draws + (result === "draw" ? 1 : 0) });
    deltas = { p1: d, p2: -d };
  }
  if (r.dbId) q.endGame.run(JSON.stringify(r.moves), result, r.dbId);
  broadcast(r, { t: "end", room: r.id, result, deltas, state: adapter.encode(r.state) });
}

export function handleWs(ws: WebSocket, user: { id: number; username: string } | null) {
  socketRoom.set(ws, "lobby");
  send(ws, { t: "me", user });
  send(ws, { t: "rooms", rooms: [...rooms.values()].map(roomInfo) });

  ws.on("message", (raw) => {
    let msg: Record<string, unknown>;
    try { msg = JSON.parse(String(raw)); } catch { return; }

    const requireUser = (): boolean => {
      if (!user) { send(ws, { t: "err", error: "Đăng nhập để chơi online." }); return false; }
      return true;
    };

    if (msg.t === "create" || msg.t === "quick") {
      if (!requireUser()) return;
      const game = String(msg.game) as GameId;
      if (!adapters[game]) return send(ws, { t: "err", error: "Loại cờ không hợp lệ." });

      // quick: vào phòng đang chờ cùng game
      let room: Room | undefined;
      if (msg.t === "quick") {
        room = [...rooms.values()].find((r) => r.game === game && !(r.p1 && r.p2) && r.p1?.userId !== user!.id && !adapterResult(r));
      }
      if (!room) {
        room = { id: crypto.randomBytes(4).toString("hex"), game, state: adapters[game].init(), moves: [], createdAt: Date.now(), spectators: new Set() };
        rooms.set(room.id, room);
      }
      joinRoom(ws, user!, room);
      return;
    }

    if (msg.t === "join") {
      if (!requireUser()) return;
      const r = rooms.get(String(msg.room));
      if (!r) return send(ws, { t: "err", error: "Phòng không tồn tại." });
      joinRoom(ws, user!, r);
      return;
    }

    if (msg.t === "watch") {
      const r = rooms.get(String(msg.room));
      if (!r) return send(ws, { t: "err", error: "Phòng không tồn tại." });
      r.spectators.add(ws);
      socketRoom.set(ws, r.id);
      send(ws, { t: "joined", room: r.id, seat: "spec", game: r.game, state: adapters[r.game].encode(r.state), players: [r.p1?.username, r.p2?.username] });
      return;
    }

    if (msg.t === "move" || msg.t === "resign") {
      const r = rooms.get(String(msg.room));
      if (!r || !user) return;
      const seat: Seat | null = r.p1?.userId === user.id ? "p1" : r.p2?.userId === user.id ? "p2" : null;
      if (!seat) return;
      const adapter = adapters[r.game];

      if (msg.t === "resign") {
        finish(r, seat === "p1" ? "p2" : "p1");
        rooms.delete(r.id);
        broadcastLobby();
        return;
      }

      if (adapter.result(r.state)) return;
      if (adapter.seatToMove(r.state) !== seat) return send(ws, { t: "err", error: "Chưa tới lượt bạn." });
      const next = adapter.apply(r.state, msg.move as never);
      if (!next) return send(ws, { t: "err", error: "Nước đi không hợp lệ." });
      r.state = next;
      r.moves.push(msg.move);
      broadcast(r, { t: "state", room: r.id, state: adapter.encode(r.state), moves: r.moves.length });

      const res = adapter.result(r.state);
      if (res) {
        finish(r, res);
        rooms.delete(r.id);
      }
      broadcastLobby();
      return;
    }

    if (msg.t === "lobby") {
      socketRoom.set(ws, "lobby");
      send(ws, { t: "rooms", rooms: [...rooms.values()].map(roomInfo) });
    }
  });

  ws.on("close", () => {
    socketRoom.delete(ws);
    for (const r of rooms.values()) {
      r.spectators.delete(ws);
      if (r.p1?.ws === ws || r.p2?.ws === ws) broadcast(r, { t: "peer", connected: false });
    }
  });
}

function adapterResult(r: Room) {
  return adapters[r.game].result(r.state);
}

function joinRoom(ws: WebSocket, user: { id: number; username: string }, r: Room) {
  if (r.p1?.userId === user.id || r.p2?.userId === user.id) {
    // reconnect
    const seat: Seat = r.p1?.userId === user.id ? "p1" : "p2";
    if (seat === "p1") r.p1!.ws = ws; else r.p2!.ws = ws;
    socketRoom.set(ws, r.id);
    send(ws, { t: "joined", room: r.id, seat, game: r.game, state: adapters[r.game].encode(r.state), players: [r.p1?.username, r.p2?.username] });
    broadcast(r, { t: "peer", connected: true });
    return;
  }
  if (!r.p1) r.p1 = { userId: user.id, username: user.username, ws };
  else if (!r.p2) r.p2 = { userId: user.id, username: user.username, ws };
  else {
    r.spectators.add(ws);
    socketRoom.set(ws, r.id);
    send(ws, { t: "joined", room: r.id, seat: "spec", game: r.game, state: adapters[r.game].encode(r.state), players: [r.p1?.username, r.p2?.username] });
    return;
  }
  const seat: Seat = r.p2?.userId === user.id ? "p2" : "p1";
  socketRoom.set(ws, r.id);
  send(ws, { t: "joined", room: r.id, seat, game: r.game, state: adapters[r.game].encode(r.state), players: [r.p1?.username, r.p2?.username] });

  if (r.p1 && r.p2 && !r.dbId) {
    const res = q.createGame.run(r.game, r.p1.userId, r.p2.userId, 1);
    r.dbId = Number(res.lastInsertRowid);
    broadcast(r, { t: "start", room: r.id, players: [r.p1.username, r.p2.username] });
  }
  broadcastLobby();
}
