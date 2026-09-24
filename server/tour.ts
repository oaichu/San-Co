import { db, q } from "./db";
import { createTourRoom, setGameEndHook } from "./rooms";
import { adapters, type GameId } from "../lib/games/registry";
import {
  koPairs, rrSchedule, rrRoundCount, swissPairs, swissRounds, scoreOf,
  tcOf, type Pair, type TourFormat, type SwissPlayer,
} from "../lib/tournament";

interface TourRow {
  id: number; name: string; game: GameId; format: TourFormat; tc_key: string;
  max_players: number; total_rounds: number; current_round: number;
  status: "open" | "running" | "done"; created_by: number; winner: number | null;
}
interface TourPlayerRow {
  tournament_id: number; user_id: number; score: number; buchholz: number;
  had_bye: number; alive: number; joined_at: number; username: string;
}
interface TourGameRow {
  id: number; tournament_id: number; round: number; p1: number; p2: number | null;
  result: "p1" | "p2" | "draw" | null; room_id: string | null;
  p1_name?: string; p2_name?: string | null;
}

const ratingOf = (userId: number, game: GameId) =>
  (q.getRating.get(userId, game) as { rating: number } | undefined)?.rating ?? 1200;

const setTotalRounds = db.prepare("UPDATE tournaments SET total_rounds = ? WHERE id = ?");
const setRoomId = db.prepare("UPDATE tour_games SET room_id = ? WHERE id = ?");
const setAlive = db.prepare("UPDATE tour_players SET alive = ? WHERE tournament_id = ? AND user_id = ?");

export function listTours() {
  return q.tourList.all() as (TourRow & { creator: string; players: number })[];
}

export function tourDetail(id: number, viewerId?: number) {
  const t = q.tourById.get(id) as TourRow | undefined;
  if (!t) return null;
  const players = q.tourPlayers.all(id) as TourPlayerRow[];
  const games = q.tourGames.all(id) as TourGameRow[];
  const joined = viewerId != null && players.some((p) => p.user_id === viewerId);
  const myGame = viewerId == null ? null : games.find(
    (g) => g.result === null && g.p2 !== null && (g.p1 === viewerId || g.p2 === viewerId),
  ) ?? null;
  return { tour: t, players, games, joined, myGame };
}

export function createTour(
  userId: number,
  opts: { name: string; game: string; format: string; tc: string; maxPlayers: number },
): { id?: number; error?: string } {
  const name = opts.name.trim().slice(0, 60);
  if (name.length < 3) return { error: "Tên giải tối thiểu 3 ký tự." };
  if (!adapters[opts.game as GameId]) return { error: "Loại cờ không hợp lệ." };
  if (!["ko", "rr", "swiss"].includes(opts.format)) return { error: "Thể thức không hợp lệ." };
  const max = Math.min(64, Math.max(2, Math.floor(opts.maxPlayers) || 8));
  const tc = String(opts.tc ?? "0");
  if (!tcOf(tc) && tc !== "0") return { error: "Nhịp giờ không hợp lệ." };
  const res = q.createTour.run(name, opts.game, opts.format, tc, max, 0, userId);
  const id = Number(res.lastInsertRowid);
  q.joinTour.run(id, userId);
  return { id };
}

export function joinTour(userId: number, tourId: number): { ok: boolean; error?: string } {
  const t = q.tourById.get(tourId) as TourRow | undefined;
  if (!t) return { ok: false, error: "Giải không tồn tại." };
  if (t.status !== "open") return { ok: false, error: "Giải đã bắt đầu." };
  const players = q.tourPlayers.all(tourId) as TourPlayerRow[];
  if (players.length >= t.max_players && !players.some((p) => p.user_id === userId))
    return { ok: false, error: "Giải đã đủ người." };
  q.joinTour.run(tourId, userId);
  return { ok: true };
}

export function startTour(userId: number, tourId: number): { ok: boolean; error?: string } {
  const t = q.tourById.get(tourId) as TourRow | undefined;
  if (!t) return { ok: false, error: "Giải không tồn tại." };
  if (t.created_by !== userId) return { ok: false, error: "Chỉ người tạo mới được bắt đầu." };
  if (t.status !== "open") return { ok: false, error: "Giải đã bắt đầu." };
  const n = (q.tourPlayers.all(tourId) as TourPlayerRow[]).length;
  if (n < 2) return { ok: false, error: "Cần ít nhất 2 người chơi." };
  const rounds = t.format === "rr" ? rrRoundCount(n) : t.format === "swiss" ? swissRounds(n) : 0;
  setTotalRounds.run(rounds, t.id);
  q.tourSetStatus.run("running", 1, t.id);
  generateRound({ ...t, current_round: 1 });
  return { ok: true };
}

/** Xếp cặp một vòng và tạo phòng. */
function generateRound(t: TourRow) {
  const players = q.tourPlayers.all(t.id) as TourPlayerRow[];
  let pairs: Pair[] = [];

  if (t.format === "ko") {
    const alive = players.filter((p) => p.alive).sort((a, b) => ratingOf(b.user_id, t.game) - ratingOf(a.user_id, t.game));
    pairs = koPairs(alive.map((p) => p.user_id));
  } else if (t.format === "rr") {
    const ids = players.slice().sort((a, b) => a.joined_at - b.joined_at).map((p) => p.user_id);
    pairs = rrSchedule(ids)[t.current_round - 1] ?? [];
  } else {
    const games = q.tourGames.all(t.id) as TourGameRow[];
    const opps = new Map<number, Set<number>>();
    for (const g of games) {
      if (g.p2 == null) continue;
      (opps.get(g.p1) ?? opps.set(g.p1, new Set()).get(g.p1)!).add(g.p2);
      (opps.get(g.p2) ?? opps.set(g.p2, new Set()).get(g.p2)!).add(g.p1);
    }
    const sp: SwissPlayer[] = players.map((p) => ({
      id: p.user_id, score: p.score, buchholz: p.buchholz,
      opponents: opps.get(p.user_id) ?? new Set(), hadBye: !!p.had_bye,
    }));
    pairs = swissPairs(sp);
  }

  const nameOf = new Map(players.map((p) => [p.user_id, p.username]));
  for (const [a, b] of pairs) {
    if (b === null) {
      q.addTourGame.run(t.id, t.current_round, a, null, "p1", null); // bye = thắng
    } else {
      const res = q.addTourGame.run(t.id, t.current_round, a, b, null, null);
      const gameId = Number(res.lastInsertRowid);
      const roomId = createTourRoom(
        t.game, t.tc_key,
        { id: a, username: nameOf.get(a) ?? "?" },
        { id: b, username: nameOf.get(b) ?? "?" },
        gameId,
      );
      setRoomId.run(roomId, gameId);
    }
  }
  recalc(t.id);
}

/** Tính lại điểm + Buchholz cho mọi kỳ thủ từ kết quả đã ghi. */
function recalc(tourId: number) {
  const players = q.tourPlayers.all(tourId) as TourPlayerRow[];
  const games = q.tourGames.all(tourId) as TourGameRow[];
  const score = new Map<number, number>();
  const opps = new Map<number, number[]>();
  const hadBye = new Map<number, boolean>();
  for (const p of players) { score.set(p.user_id, 0); opps.set(p.user_id, []); hadBye.set(p.user_id, false); }
  for (const g of games) {
    if (g.result === null) continue;
    if (g.p2 === null) { score.set(g.p1, (score.get(g.p1) ?? 0) + 1); hadBye.set(g.p1, true); continue; }
    score.set(g.p1, (score.get(g.p1) ?? 0) + scoreOf(g.result, "p1"));
    score.set(g.p2, (score.get(g.p2) ?? 0) + scoreOf(g.result, "p2"));
    opps.get(g.p1)!.push(g.p2);
    opps.get(g.p2)!.push(g.p1);
  }
  for (const p of players) {
    const buch = (opps.get(p.user_id) ?? []).reduce((s, o) => s + (score.get(o) ?? 0), 0);
    q.tourSetScore.run(score.get(p.user_id) ?? 0, buch, hadBye.get(p.user_id) ? 1 : 0, p.alive, tourId, p.user_id);
  }
}

/** Ván giải kết thúc → ghi kết quả, tính điểm, chuyển vòng/chốt giải nếu vòng xong. */
function onTourGameEnd(roomId: string, result: "p1" | "p2" | "draw") {
  const g = q.tourGameByRoom.get(roomId) as TourGameRow | undefined;
  if (!g || g.result !== null) return;
  q.setTourGameResult.run(result, g.id);
  const t = q.tourById.get(g.tournament_id) as TourRow | undefined;
  if (!t || t.status !== "running") return;
  recalc(t.id);

  const pending = q.tourPendingGames.all(t.id, t.current_round) as TourGameRow[];
  if (pending.length > 0) return; // vòng chưa xong

  if (t.format === "ko") {
    // người thua vòng này bị loại; hòa → rating cao hơn đi tiếp
    const roundGames = (q.tourGames.all(t.id) as TourGameRow[]).filter((x) => x.round === t.current_round);
    for (const x of roundGames) {
      if (x.p2 === null) continue;
      let winner: number;
      if (x.result === "draw") {
        const ra = ratingOf(x.p1, t.game), rb = ratingOf(x.p2, t.game);
        winner = ra >= rb ? x.p1 : x.p2;
      } else {
        winner = x.result === "p1" ? x.p1 : x.p2!;
      }
      const loser = winner === x.p1 ? x.p2 : x.p1;
      setAlive.run(0, t.id, loser);
    }
    const alive = (q.tourPlayers.all(t.id) as TourPlayerRow[]).filter((p) => p.alive);
    if (alive.length <= 1) {
      q.tourSetWinner.run(alive[0]?.user_id ?? null, t.id);
      return;
    }
    const nr = t.current_round + 1;
    q.tourSetStatus.run("running", nr, t.id);
    generateRound({ ...t, current_round: nr });
    return;
  }

  // rr / swiss: hết vòng → chốt giải
  if (t.current_round >= t.total_rounds) {
    const players = q.tourPlayers.all(t.id) as TourPlayerRow[]; // đã sort score desc, buchholz desc
    q.tourSetWinner.run(players[0]?.user_id ?? null, t.id);
    return;
  }
  const nr = t.current_round + 1;
  q.tourSetStatus.run("running", nr, t.id);
  generateRound({ ...t, current_round: nr });
}

// đăng ký hook — rooms.finish() gọi vào đây
setGameEndHook((roomId, result) => {
  try { onTourGameEnd(roomId, result); } catch (e) { console.error("tour advance error", e); }
});
