import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = process.env.SC_DB ?? path.join(process.cwd(), "data", "san-co.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  pass_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS ratings (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 1200,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, game)
);
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game TEXT NOT NULL,
  p1 INTEGER NOT NULL REFERENCES users(id),
  p2 INTEGER NOT NULL REFERENCES users(id),
  moves TEXT NOT NULL DEFAULT '[]',
  result TEXT,           -- 'p1' | 'p2' | 'draw' | NULL = đang chơi
  rated INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  ended_at INTEGER
);
CREATE INDEX IF NOT EXISTS games_p1 ON games(p1);
CREATE INDEX IF NOT EXISTS games_p2 ON games(p2);
CREATE TABLE IF NOT EXISTS puzzle_attempts (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  puzzle_id TEXT NOT NULL,
  solved INTEGER NOT NULL,
  tried_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (user_id, puzzle_id)
);
CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  completed_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (user_id, lesson_id)
);
`);

export interface UserRow { id: number; username: string; pass_hash: string; created_at: number }

export const q = {
  userByName: db.prepare("SELECT * FROM users WHERE username = ?"),
  userById: db.prepare("SELECT id, username, created_at FROM users WHERE id = ?"),
  createUser: db.prepare("INSERT INTO users (username, pass_hash) VALUES (?, ?)"),
  createSession: db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)"),
  sessionByToken: db.prepare("SELECT s.token, s.user_id, s.expires_at, u.username FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?"),
  deleteSession: db.prepare("DELETE FROM sessions WHERE token = ?"),
  getRating: db.prepare("SELECT * FROM ratings WHERE user_id = ? AND game = ?"),
  upsertRating: db.prepare(`INSERT INTO ratings (user_id, game, rating, wins, losses, draws) VALUES (@user_id, @game, @rating, @wins, @losses, @draws)
    ON CONFLICT(user_id, game) DO UPDATE SET rating=@rating, wins=@wins, losses=@losses, draws=@draws`),
  allRatings: db.prepare("SELECT * FROM ratings WHERE user_id = ?"),
  createGame: db.prepare("INSERT INTO games (game, p1, p2, rated) VALUES (?, ?, ?, ?)"),
  endGame: db.prepare("UPDATE games SET moves = ?, result = ?, ended_at = unixepoch() WHERE id = ?"),
  userGames: db.prepare(`SELECT g.id, g.game, g.result, g.moves, g.created_at, g.ended_at,
      u1.username AS p1_name, u2.username AS p2_name, g.p1, g.p2
    FROM games g JOIN users u1 ON u1.id=g.p1 JOIN users u2 ON u2.id=g.p2
    WHERE g.p1 = ? OR g.p2 = ? ORDER BY g.id DESC LIMIT 50`),
  leaderboard: db.prepare(`SELECT r.game, r.rating, r.wins, r.losses, r.draws, u.username
    FROM ratings r JOIN users u ON u.id = r.user_id
    WHERE r.game = ? ORDER BY r.rating DESC LIMIT 20`),
  markLesson: db.prepare("INSERT OR IGNORE INTO lesson_progress (user_id, lesson_id) VALUES (?, ?)"),
  lessonDone: db.prepare("SELECT lesson_id FROM lesson_progress WHERE user_id = ?"),
  puzzleAttempt: db.prepare("INSERT OR REPLACE INTO puzzle_attempts (user_id, puzzle_id, solved) VALUES (?, ?, ?)"),
};
