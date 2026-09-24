import type { WebSocket } from "ws";
import crypto from "crypto";
import { adapters, type GameId, type Seat } from "../lib/games/registry";
import { tcOf, type TcDef } from "../lib/tournament";
import { q } from "./db";
import { eloDelta } from "../lib/elo";

interface Player { userId: number; username: string; ws: WebSocket | null }

interface Clock { p1: number; p2: number; /** 0 = đã gắn nhưng chưa chạy (chờ đủ 2 người) */ stamp: number }

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
  tc: TcDef | null;
  clock: Clock | null;
  /** id bản ghi tour_games nếu là trận giải */
  tourGameId?: number;
}

const rooms = new Map<string, Room>();
const socketRoom = new Map<WebSocket, string>();
const userSockets = new Map<number, Set<WebSocket>>();

/** hook gọi khi ván kết thúc (giải đấu ghi nhận kết quả) */
let endHook: ((roomId: string, result: "p1" | "p2" | "draw") => void) | null = null;
export function setGameEndHook(fn: typeof endHook) { endHook = fn; }

/** Gửi thông báo tới mọi socket của một user (vd: trận giải sẵn sàng). */
export function notifyUser(userId: number, msg: unknown) {
  for (const ws of userSockets.get(userId) ?? []) send(ws, msg);
}

const send = (ws: WebSocket | null, msg: unknown) => {
  if (ws && ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
};

/** snapshot đồng hồ (ms còn lại tại thời điểm gọi) */
function clockNow(r: Room): [number, number] | null {
  if (!r.clock) return null;
  const out: [number, number] = [Math.max(0, r.clock.p1), Math.max(0, r.clock.p2)];
  if (r.clock.stamp > 0 && !adapterResult(r)) {
    const mover = adapters[r.game].seatToMove(r.state);
    out[mover === "p1" ? 0 : 1] = Math.max(0, out[mover === "p1" ? 0 : 1] - (Date.now() - r.clock.stamp));
  }
  return out;
}

/** trừ giờ bên đang đi; trả về true nếu hết giờ */
function tickClock(r: Room): boolean {
  if (!r.clock || r.clock.stamp <= 0) return false;
  const mover = adapters[r.game].seatToMove(r.state);
  const key = mover === "p1" ? "p1" : "p2";
  r.clock[key] -= Date.now() - r.clock.stamp;
  r.clock.stamp = Date.now();
  return r.clock[key] <= 0;
}

function roomInfo(r: Room) {
  return { id: r.id, game: r.game, waiting: !(r.p1 && r.p2), players: [r.p1?.username, r.p2?.username], moves: r.moves.length, createdAt: r.createdAt, tc: r.tc?.key ?? "0" };
}

/** Dọn phòng treo + bắt hết giờ. Gọi định kỳ từ server. */
export function sweepRooms() {
  const now = Date.now();
  for (const r of rooms.values()) {
    // hết giờ = thua (chỉ ván có clock đang chạy)
    if (r.clock && r.clock.stamp > 0 && !adapterResult(r) && r.p1?.ws && r.p2?.ws) {
      const mover = adapters[r.game].seatToMove(r.state);
      const left = r.clock[mover] - (now - r.clock.stamp);
      if (left <= 0) {
        finish(r, mover === "p1" ? "p2" : "p1");
        rooms.delete(r.id);
        broadcastLobby();
        continue;
      }
    }
    const waiting = !(r.p1 && r.p2);
    const stale = now - r.createdAt > (waiting ? 30 * 60_000 : 2 * 3600_000);
    if (stale && !adapterResult(r)) {
      if (r.tourGameId) {
        // trận giải bị bỏ hoang → hòa kỹ thuật để giải đi tiếp
        finish(r, "draw");
      } else {
        broadcast(r, { t: "end", room: r.id, result: null, deltas: null, state: adapters[r.game].encode(r.state) });
      }
      rooms.delete(r.id);
    }
  }
}

export function broadcastLobby() {
  const list = [...rooms.values()].filter((r) => !r.tourGameId && (!(r.p1 && r.p2) || r.moves.length < 3)).map(roomInfo);
  for (const ws of socketRoom.keys()) if (socketRoom.get(ws) === "lobby") send(ws, { t: "rooms", rooms: list });
}

function broadcast(r: Room, msg: unknown) {
  for (const p of [r.p1, r.p2]) if (p) send(p.ws, msg);
  for (const s of r.spectators) send(s, msg);
}

function joinedMsg(r: Room, seat: Seat | "spec") {
  return {
    t: "joined", room: r.id, seat, game: r.game,
    state: adapters[r.game].encode(r.state),
    players: [r.p1?.username, r.p2?.username],
    tc: r.tc?.key ?? "0",
    clock: clockNow(r),
  };
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
  broadcast(r, { t: "end", room: r.id, result, deltas, state: adapter.encode(r.state), clock: clockNow(r) });
  endHook?.(r.id, result);
}

/** Tạo phòng trận giải: 2 ghế định sẵn, clock gắn nhưng chờ cả hai vào mới chạy. */
export function createTourRoom(
  game: GameId,
  tcKey: string,
  u1: { id: number; username: string },
  u2: { id: number; username: string },
  tourGameId: number,
): string {
  const tc = tcOf(tcKey);
  const room: Room = {
    id: crypto.randomBytes(4).toString("hex"),
    game,
    state: adapters[game].init(),
    moves: [],
    createdAt: Date.now(),
    spectators: new Set(),
    tc,
    clock: tc ? { p1: tc.initial * 1000, p2: tc.initial * 1000, stamp: 0 } : null,
    tourGameId,
    p1: { userId: u1.id, username: u1.username, ws: null },
    p2: { userId: u2.id, username: u2.username, ws: null },
  };
  rooms.set(room.id, room);
  const res = q.createGame.run(game, u1.id, u2.id, 1);
  room.dbId = Number(res.lastInsertRowid);
  for (const u of [u1, u2]) notifyUser(u.id, { t: "tour", tourGame: tourGameId, room: room.id });
  return room.id;
}

export function handleWs(ws: WebSocket, user: { id: number; username: string } | null) {
  socketRoom.set(ws, "lobby");
  if (user) {
    if (!userSockets.has(user.id)) userSockets.set(user.id, new Set());
    userSockets.get(user.id)!.add(ws);
  }
  send(ws, { t: "me", user });
  send(ws, { t: "rooms", rooms: [...rooms.values()].filter((r) => !r.tourGameId).map(roomInfo) });

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
      const tc = tcOf(String(msg.tc ?? "0"));
      const tcKey = tc?.key ?? "0";

      // quick: vào phòng đang chờ cùng game + cùng nhịp giờ
      let room: Room | undefined;
      if (msg.t === "quick") {
        room = [...rooms.values()].find((r) => !r.tourGameId && r.game === game && (r.tc?.key ?? "0") === tcKey && !(r.p1 && r.p2) && r.p1?.userId !== user!.id && !adapterResult(r));
      }
      if (!room) {
        room = {
          id: crypto.randomBytes(4).toString("hex"), game, state: adapters[game].init(), moves: [],
          createdAt: Date.now(), spectators: new Set(),
          tc, clock: tc ? { p1: tc.initial * 1000, p2: tc.initial * 1000, stamp: 0 } : null,
        };
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
      send(ws, joinedMsg(r, "spec"));
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
      // trừ giờ trước khi chấp nhận nước đi — hết giờ thì thua luôn
      if (tickClock(r)) {
        finish(r, seat === "p1" ? "p2" : "p1");
        rooms.delete(r.id);
        broadcastLobby();
        return;
      }
      const next = adapter.apply(r.state, msg.move as never);
      if (!next) {
        // nước sai vẫn trả lại thời điểm bắt đầu lượt (clock.stamp đã reset ở tickClock)
        return send(ws, { t: "err", error: "Nước đi không hợp lệ." });
      }
      r.state = next;
      r.moves.push(msg.move);
      if (r.clock && r.tc) r.clock[seat] += r.tc.inc * 1000; // cộng increment sau khi đi
      broadcast(r, { t: "state", room: r.id, state: adapter.encode(r.state), moves: r.moves.length, last: msg.move, clock: clockNow(r) });

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
      send(ws, { t: "rooms", rooms: [...rooms.values()].filter((r) => !r.tourGameId).map(roomInfo) });
    }
  });

  ws.on("close", () => {
    socketRoom.delete(ws);
    if (user) {
      const set = userSockets.get(user.id);
      set?.delete(ws);
      if (set && !set.size) userSockets.delete(user.id);
    }
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
    // reconnect / vào trận giải đã được xếp ghế
    const seat: Seat = r.p1?.userId === user.id ? "p1" : "p2";
    if (seat === "p1") r.p1!.ws = ws; else r.p2!.ws = ws;
    socketRoom.set(ws, r.id);
    send(ws, joinedMsg(r, seat));
    broadcast(r, { t: "peer", connected: true });
    maybeStart(r);
    return;
  }
  if (r.tourGameId) {
    // trận giải: người ngoài chỉ được xem
    r.spectators.add(ws);
    socketRoom.set(ws, r.id);
    send(ws, joinedMsg(r, "spec"));
    return;
  }
  if (!r.p1) r.p1 = { userId: user.id, username: user.username, ws };
  else if (!r.p2) r.p2 = { userId: user.id, username: user.username, ws };
  else {
    r.spectators.add(ws);
    socketRoom.set(ws, r.id);
    send(ws, joinedMsg(r, "spec"));
    return;
  }
  const seat: Seat = r.p2?.userId === user.id ? "p2" : "p1";
  socketRoom.set(ws, r.id);
  send(ws, joinedMsg(r, seat));
  maybeStart(r);
  broadcastLobby();
}

/** Đủ 2 người → ghi ván vào DB + bật đồng hồ + báo start. */
function maybeStart(r: Room) {
  if (!r.p1 || !r.p2) return;
  if (!r.dbId) {
    const res = q.createGame.run(r.game, r.p1.userId, r.p2.userId, 1);
    r.dbId = Number(res.lastInsertRowid);
  }
  // đồng hồ chỉ chạy khi cả hai đã kết nối
  if (r.clock && r.clock.stamp === 0 && r.p1.ws && r.p2.ws) {
    r.clock.stamp = Date.now();
    broadcast(r, { t: "start", room: r.id, players: [r.p1.username, r.p2.username], clock: clockNow(r) });
    return;
  }
  broadcast(r, { t: "start", room: r.id, players: [r.p1.username, r.p2.username], clock: clockNow(r) });
}
