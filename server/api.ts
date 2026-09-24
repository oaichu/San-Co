import type { IncomingMessage, ServerResponse } from "http";
import { q } from "./db";
import { register, login, logout, userByToken, cookieOf, cookieHeader } from "./auth";

function json(res: ServerResponse, code: number, body: unknown, headers: Record<string, string> = {}) {
  res.writeHead(code, { "Content-Type": "application/json", ...headers });
  res.end(JSON.stringify(body));
}

function body(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let d = "";
    req.on("data", (c) => (d += c));
    req.on("end", () => {
      try { resolve(JSON.parse(d || "{}")); } catch { resolve({}); }
    });
  });
}

export async function handleApi(req: IncomingMessage, res: ServerResponse, url: URL): Promise<boolean> {
  const p = url.pathname;
  const me = userByToken(cookieOf(req));

  if (p === "/api/register" && req.method === "POST") {
    const b = await body(req);
    const r = register(String(b.username ?? ""), String(b.password ?? ""));
    if (!r.ok) return json(res, 400, { error: r.error }), true;
    const l = login(String(b.username), String(b.password));
    if (!l.ok) return json(res, 500, { error: "Lỗi tạo phiên." }), true;
    json(res, 200, { ok: true }, { "Set-Cookie": cookieHeader(l.token, 30 * 86400) });
    return true;
  }

  if (p === "/api/login" && req.method === "POST") {
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

  if (p === "/api/puzzle/attempt" && req.method === "POST") {
    if (!me) return json(res, 401, { error: "Chưa đăng nhập." }), true;
    const b = await body(req);
    q.puzzleAttempt.run(me.id, String(b.puzzleId ?? ""), b.solved ? 1 : 0);
    json(res, 200, { ok: true });
    return true;
  }

  if (p.startsWith("/api/")) {
    json(res, 404, { error: "Not found" });
    return true;
  }
  return false;
}
