# Sân Cờ

Sân chơi cờ trực tuyến cho cộng đồng — cờ caro, cờ vua, cờ tướng, cờ vây. Chơi với máy 5 cấp độ, đấu online có ELO, giáo trình tương tác và puzzle. Tự host hoàn toàn, không phụ thuộc dịch vụ trả phí.

## Chạy bằng Docker (khuyến nghị)

```bash
docker compose up -d --build
# mở http://localhost:3000
```

Một container duy nhất chứa Next.js + WebSocket + SQLite. Dữ liệu nằm trong volume `san-co-data` (`/app/data`).

## Chạy thủ công

```bash
npm ci
npm run build
npm start        # NODE_ENV=production tsx server/index.ts
```

Dev mode: `npm run dev`. Test: `npm test`. Lint: `npm run lint`.

## Biến môi trường

| Biến | Mặc định | Mô tả |
|---|---|---|
| `PORT` | `3000` | Cổng HTTP + WS |
| `SC_DB` | `./data/san-co.db` | Đường dẫn file SQLite |
| `SC_SECURE_COOKIE` | `0` | Đặt `1` khi chạy sau reverse proxy HTTPS (thêm `Secure` vào cookie phiên) |
| `NODE_ENV` | — | `production` khi chạy `npm start` |

## Kiến trúc

```
app/            Next.js App Router — landing, /choi/*, /online, /hoc, /puzzle, /ho-so
components/     board components, landing, learn widgets, Nav, LiquidCanvas
lib/games/      engine 4 game + AI + adapter registry (dùng chung client & server)
lib/content/    giáo trình + puzzle (được test validate bằng chính engine)
server/         custom Node server: api.ts (REST), rooms.ts (WS), auth.ts, db.ts (SQLite)
```

- **Online**: WebSocket `/ws`, server validate mọi nước đi qua `lib/games/registry`, ELO cập nhật qua SQL khi ván kết thúc.
- **Auth**: username/password, bcrypt, session cookie `HttpOnly; SameSite=Lax`, 30 ngày.
- **Health check**: `GET /api/health` → `{"ok":true}`.

## Sau reverse proxy HTTPS

Đặt `SC_SECURE_COOKIE=1` và đảm bảo proxy forward WebSocket (ví dụ nginx: `proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade";`).
