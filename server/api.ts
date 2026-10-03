import type { IncomingMessage, ServerResponse } from "http";
import { q } from "./db";
import { register, login, logout, userByToken, cookieOf, cookieHeader } from "./auth";
import { listTours, tourDetail, createTour, joinTour, startTour } from "./tour";

function json(res: ServerResponse, code: number, body: unknown, headers: Record<string, string> = {}) {
  res.writeHead(code, { "Content-Type": "application/json", ...headers });
  res.end(JSON.stringify(body));
}

const BODY_CAP = 16 * 1024;

function body(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let d = "";
    let over = false;
    req.on("data", (c) => {
      d += c;
      if (d.length > BODY_CAP && !over) { over = true; resolve({}); req.destroy(); }
    });
    req.on("end", () => {
      if (over) return;
      try { resolve(JSON.parse(d || "{}")); } catch { resolve({}); }
    });
  });
}

// rate limit đơn giản cho auth endpoints: 10 req/phút/IP
const authHits = new Map<string, number[]>();
function authLimited(req: IncomingMessage): boolean {
  const ip = req.socket.remoteAddress ?? "?";
  const now = Date.now();
  const hits = (authHits.get(ip) ?? []).filter((t) => now - t < 60_000);
  hits.push(now);
  authHits.set(ip, hits);
  return hits.length > 10;
}

export async function handleApi(req: IncomingMessage, res: ServerResponse, url: URL): Promise<boolean> {
  const p = url.pathname;
  const me = userByToken(cookieOf(req));

  if (p === "/api/health") {
    json(res, 200, { ok: true });
    return true;
  }

  if (p === "/api/register" && req.method === "POST") {
    if (authLimited(req)) return json(res, 429, { error: "Quá nhiều yêu cầu. Thử lại sau." }), true;
    const b = await body(req);
    const r = register(String(b.username ?? ""), String(b.password ?? ""));
    if (!r.ok) return json(res, 400, { error: r.error }), true;
    const l = login(String(b.username), String(b.password));
    if (!l.ok) return json(res, 500, { error: "Lỗi tạo phiên." }), true;
    json(res, 200, { ok: true }, { "Set-Cookie": cookieHeader(l.token, 30 * 86400) });
    return true;
  }

  if (p === "/api/login" && req.method === "POST") {
    if (authLimited(req)) return json(res, 429, { error: "Quá nhiều yêu cầu. Thử lại sau." }), true;
    const b = await body(req);
    const l = login(String(b.username ?? ""), String(b.password ?? ""));
    if (!l.ok) return json(res, 401, { error: l.error }), true;
    json(res, 200, { ok: true }, { "Set-Cookie": cookieHeader(l.token, 30 * 86400) });
    return true;
  }

  if (p === "/api/logout" && req.method === "POST") {
    const t = cookieOf(req);
    if (t) logout(t);
    json(res, 200, { ok: true }, { "Set-Cookie": cookieHeader("", 0) });
    return true;
  }

  if (p === "/api/me" && req.method === "GET") {
    if (!me) return json(res, 200, { user: null }), true;
    json(res, 200, { user: { ...me, ratings: q.allRatings.all(me.id) } });
    return true;
  }

  if (p === "/api/leaderboard" && req.method === "GET") {
    const game = url.searchParams.get("game") ?? "caro";
    json(res, 200, { rows: q.leaderboard.all(game) });
    return true;
  }

  if (p === "/api/history" && req.method === "GET") {
    if (!me) return json(res, 401, { error: "Chưa đăng nhập." }), true;
    json(res, 200, { games: q.userGames.all(me.id, me.id) });
    return true;
  }

  if (p === "/api/lesson/complete" && req.method === "POST") {
    if (!me) return json(res, 401, { error: "Chưa đăng nhập." }), true;
    const b = await body(req);
    q.markLesson.run(me.id, String(b.lessonId ?? ""));
    json(res, 200, { ok: true });
    return true;
  }

  if (p === "/api/progress" && req.method === "GET") {
    if (!me) return json(res, 200, { lessons: [] }), true;
    json(res, 200, { lessons: q.lessonDone.all(me.id).map((r) => (r as { lesson_id: string }).lesson_id) });
    return true;
  }

  if (p === "/api/progress/puzzle" && req.method === "GET") {
    if (!me) return json(res, 200, { puzzles: [] }), true;
    json(res, 200, { puzzles: q.puzzleDone.all(me.id).map((r) => (r as { puzzle_id: string }).puzzle_id) });
    return true;
  }

  if (p === "/api/puzzle/attempt" && req.method === "POST") {
    if (!me) return json(res, 401, { error: "Chưa đăng nhập." }), true;
    const b = await body(req);
    q.puzzleAttempt.run(me.id, String(b.puzzleId ?? ""), b.solved ? 1 : 0);
    json(res, 200, { ok: true });
    return true;
  }

  if (p === "/api/tour" && req.method === "GET") {
    json(res, 200, { tours: listTours() });
    return true;
  }

  if (p === "/api/tour" && req.method === "POST") {
    if (!me) return json(res, 401, { error: "Đăng nhập để tạo giải." }), true;
    const b = await body(req);
    const r = createTour(me.id, {
      name: String(b.name ?? ""), game: String(b.game ?? ""),
      format: String(b.format ?? ""), tc: String(b.tc ?? "0"),
      maxPlayers: Number(b.maxPlayers ?? 8),
    });
    if (r.error) return json(res, 400, { error: r.error }), true;
    json(res, 200, { id: r.id });
    return true;
  }

  const tourMatch = p.match(/^\/api\/tour\/(\d+)(\/(join|start))?$/);
  if (tourMatch) {
    const id = Number(tourMatch[1]);
    const action = tourMatch[3];
    if (req.method === "GET" && !action) {
      const d = tourDetail(id, me?.id);
      if (!d) return json(res, 404, { error: "Giải không tồn tại." }), true;
      json(res, 200, d);
      return true;
    }
    if (!me) return json(res, 401, { error: "Chưa đăng nhập." }), true;
    if (req.method === "POST" && action === "join") {
      const r = joinTour(me.id, id);
      json(res, r.ok ? 200 : 400, r);
      return true;
    }
    if (req.method === "POST" && action === "start") {
      const r = startTour(me.id, id);
      json(res, r.ok ? 200 : 400, r);
      return true;
    }
  }

  if (p.startsWith("/api/")) {
    json(res, 404, { error: "Not found" });
    return true;
  }
  return false;
}
