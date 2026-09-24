import bcrypt from "bcryptjs";
import crypto from "crypto";
import { q, type UserRow } from "./db";

export const COOKIE = "sc_session";
const SESSION_DAYS = 30;

export function register(username: string, password: string): { ok: true; userId: number } | { ok: false; error: string } {
  const name = username.trim();
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(name)) return { ok: false, error: "Tên đăng nhập 3–20 ký tự, chỉ chữ/số/gạch dưới." };
  if (password.length < 6) return { ok: false, error: "Mật khẩu tối thiểu 6 ký tự." };
  if (q.userByName.get(name)) return { ok: false, error: "Tên đăng nhập đã tồn tại." };
  const hash = bcrypt.hashSync(password, 10);
  const r = q.createUser.run(name, hash);
  const uid = Number(r.lastInsertRowid);
  for (const g of ["caro", "chess", "xiangqi", "go"])
    q.upsertRating.run({ user_id: uid, game: g, rating: 1200, wins: 0, losses: 0, draws: 0 });
  return { ok: true, userId: uid };
}

export function login(username: string, password: string): { ok: true; token: string } | { ok: false; error: string } {
  const row = q.userByName.get(username.trim()) as UserRow | undefined;
  if (!row || !bcrypt.compareSync(password, row.pass_hash)) return { ok: false, error: "Sai tên đăng nhập hoặc mật khẩu." };
  const token = crypto.randomBytes(32).toString("hex");
  q.createSession.run(token, row.id, Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400);
  return { ok: true, token };
}

export function userByToken(token: string | undefined): { id: number; username: string } | null {
  if (!token) return null;
  const row = q.sessionByToken.get(token) as { user_id: number; username: string; expires_at: number } | undefined;
  if (!row || row.expires_at < Date.now() / 1000) return null;
  return { id: row.user_id, username: row.username };
}

export function logout(token: string) {
  q.deleteSession.run(token);
}

export function cookieOf(req: { headers: { cookie?: string } }): string | undefined {
  return req.headers.cookie?.split(";").map((s) => s.trim()).find((s) => s.startsWith(COOKIE + "="))?.slice(COOKIE.length + 1);
}

export function cookieHeader(token: string, maxAge: number) {
  const secure = process.env.SC_SECURE_COOKIE === "1" ? "; Secure" : "";
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}
