# Sân Cờ — MVP Design Spec

**Date:** 2026-09-23 · **Status:** Approved direction (demo v2 reviewed + accepted)

## 1. Product

Sân cờ online cho cộng đồng Việt Nam. 4 loại cờ: **cờ vua (Chess), cờ tướng (Xiangqi), cờ caro (Gomoku), cờ vây (Go 19×19)**. Chơi vs AI 5 cấp độ (client-side engines), PvP online xếp hạng ELO, giáo trình học tương tác + puzzle mỗi ngày. Miễn phí, mở mã nguồn.

## 2. Architecture

```
Browser ── Next.js 15 (App Router, TS, Tailwind v4, shadcn/ui, Motion)
   │           React UI + Web Workers (AI engines, client-side WASM/TS)
   │
   ├─ HTTP ──► server.mjs (custom Node server: Next handler + routes)
   │                ├─ /api/*  REST: auth, lobby, lessons, puzzles, leaderboard
   │                └─ SQLite (better-sqlite3) — file DB at /data volume
   │
   └─ WS /ws ──► ws server (same process): rooms, move validation, broadcast
                └─ shared game rules imported from lib/games/*
```

- **One container**: `Dockerfile` → node:22, `next build` standalone, `server.mjs` serves Next + WS + SQLite. Volume `/data` for `sanco.db`.
- **Shared rule engines**: `lib/games/{caro,chess,xiangqi,go}/` pure TS — rules, move gen, state. Used by: UI (render/legal highlights), AI workers (search), WS server (PvP validation). Single source of truth.
- **Auth**: username + password (bcryptjs), session cookie httpOnly + `sessions` table. Guest = anonymous session cookie, chơi AI/puzzle được, xếp hạng cần account.

## 3. Game rules (shared, pure TS)

| Game | Board | Rules MVP |
|---|---|---|
| caro | 15×15 | Luật VN: đúng 5 quân mới thắng (overline không tính), chặn 2 đầu = hòa cờ |
| chess | 8×8 | Đủ luật qua chess.js (npm) — castling, en passant, promotion, draw rules |
| xiangqi | 9×10 | Tự viết: move gen đầy đủ, palace/river rules, chiếu tướng, cấm đối mặt tướng |
| go | 19×19 | Tự viết: liberty, capture, ko đơn giản; chấm điểm area scoring khi 2 bên pass |

Chess dùng `chess.js` cho rules (battle-tested) + `stockfish.wasm` npm cho AI.

## 4. AI engines (Web Worker, client-side)

Interface chung: `getMove(state, level) → move` trong `workers/<game>.worker.ts`.

| Game | Engine | Levels 1→5 |
|---|---|---|
| caro | heuristic threat-space (đã prove trong demo) | noise + depth |
| chess | stockfish.wasm | Skill Level + depth cap + blunder inject ở level thấp |
| xiangqi | alpha-beta tự viết (piece values + PST + quiescence cơ bản) | depth 1→4 + noise |
| go | light MCTS (random playout + capture heuristic) | playouts 50→800 |

## 5. Realtime PvP

- `ws` server, path `/ws`, rooms in-memory + persisted games.
- Lobby REST: `GET /api/rooms?game=` list, `POST` create (game, rated?, clock preset), join → ws channel.
- Move flow: client → ws `{move}` → server validate bằng shared rules → persist `moves` → broadcast state + clock.
- Clock: preset none | 10+0 | 5+3; server tracks, timeout → resign.
- Disconnect: 60s reconnect grace; else lose (rated) / abort (casual).
- ELO: K=32 (first 30 games), K=16 after. Transactional update on game end.

## 6. Data model (SQLite)

```sql
users(id TEXT PK, username UNIQUE, pass_hash, display_name, created_at)
sessions(token PK, user_id, expires_at)
ratings(user_id, game_type, rating INTEGER, games INTEGER, PK(user_id, game_type))
games(id PK, game_type, white_id, black_id, result, moves_json, rated, clock_preset, created_at, ended_at)
rooms(id PK, game_type, creator_id, options_json, status, created_at)
lessons(id PK, game_type, slug UNIQUE, ord, title, summary, content_json)   -- steps: text + board state + highlights
puzzles(id PK, game_type, pos_json, solution_json, difficulty, daily_date)
lesson_progress(user_id, lesson_id, done_at, PK(user_id, lesson_id))
puzzle_attempts(user_id, puzzle_id, solved, at)
```

## 7. Pages

- `/` — landing (port demo v2: liquid canvas, hero live-board signature, Bốn-sân cycler, learn teaser, close)
- `/choi` — chọn game + difficulty → `/choi/[game]` vs AI board full-feature (move list, undo vs AI, hint level ≥3 gợi ý 1 nước/turn? — MVP: undo only)
- `/online` — lobby: room list per game, create room, quick match
- `/phong/[id]` — PvP board: clock, status, resign/offer-draw, move sync
- `/hoc` — curriculum index 4 games; `/hoc/[game]/[slug]` — lesson player (steps + embedded interactive board)
- `/puzzle` — puzzle of the day + practice theo game
- `/xep-hang` — leaderboard per game
- `/tai-khoan` — profile: ratings, history, theme pref
- `/dang-nhap`, `/dang-ky` — auth

## 8. Design system (port từ demo v2, đã duyệt)

- Tokens CSS vars 2 theme (`data-theme`), warm lacquer: dark `#14100B` canvas / accent vermilion `#E0552F`; light `#F4EFE3` / `#C7431E`
- Font: **Be Vietnam Pro** duy nhất (next/font), display 700/800 tracking -.028em
- shadcn/ui primitives; Motion cho JS-driven; CSS transitions cho UI state; chỉ transform/opacity/clip-path; ease-out `cubic-bezier(0.23,1,0.32,1)`; UI ≤300ms
- LiquidCanvas component (blobs ấm), grain overlay, boards = shared `<Board>` + skin per game (DOM pieces, FLIP-style move animation)
- Anti-tells: không eyebrow/gradient-text/purple/card-lồng-card/emoji-icons/pulsing-dot

## 9. Content (đầy đủ giáo trình — user chọn)

- Lessons: mỗi game 8–12 bài theo lộ trình (luật → chiến thuật → khai cuộc/tàn cục), format JSON: steps[{text, board, highlights, tryMove?}]. Viết bằng tiếng Việt, seed vào DB.
- Puzzles: mỗi game ~10 seed puzzles phân độ khó; daily = hash(date) pick.

## 10. Build order

- **M1** Shell: design tokens, theme, LiquidCanvas, nav, landing page port (hero self-play + cycler)
- **M2** Caro full: rules + AI worker + `/choi/caro` playable + move list + undo
- **M3** Chess: chess.js + stockfish.wasm worker + board skin + `/choi/chess`
- **M4** Xiangqi: rules engine + AI + board skin
- **M5** Go 19×19: rules + light MCTS + board skin
- **M6** Auth + users/ratings + profile
- **M7** Lobby + rooms + ws PvP + clock + ELO settle
- **M8** Lessons system + seed 4 games × ~8 bài + puzzles + daily
- **M9** Leaderboard, polish pass (impeccable detect + web-design-guidelines audit), Dockerfile, README, verify end-to-end

## 11. Risks

- stockfish.wasm npm packaging trong Next/webpack → load từ `public/` worker script, không bundle
- Xiangqi/Go rules tự viết — test bằng move-gen unit tests (perft-ish) + fixtures
- MCTS Go yếu — chấp nhận, ghi rõ "AI tập luyện" trong UI
- WS trong container: cần sticky single instance (OK cho MVP single-container)

## 12. Out of scope (phase sau)

Chat trong phòng, tournament, friends/social, i18n en, mobile app, spectator mode, engine-analysis review ván đấu.
