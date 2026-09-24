<div align="center">

<img src="readme-assets/banner.gif" alt="Sân Cờ" width="100%" />

**Sân chơi cờ trực tuyến cho cộng đồng** — caro, cờ vua, cờ tướng, cờ vây

[![Next.js](https://img.shields.io/badge/Next.js-16-14100B?style=flat-square&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-14100B?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-14100B?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![WebSocket](https://img.shields.io/badge/Realtime-WebSocket-E0552F?style=flat-square)](server/rooms.ts)
[![SQLite](https://img.shields.io/badge/DB-SQLite-14100B?style=flat-square&logo=sqlite)](https://sqlite.org)
[![Docker](https://img.shields.io/badge/Deploy-Docker-E0552F?style=flat-square&logo=docker)](docker-compose.yml)

[Chơi ngay](#chạy-bằng-docker-khuyến-nghị) · [Giải đấu](#giải-đấu) · [Deploy lên cloud miễn phí](docs/DEPLOY.md)

</div>

---

<img src="readme-assets/showcase.gif" alt="Bốn sân cờ" width="100%" />

## Tính năng

| | |
|---|---|
| **4 loại cờ** | Caro (đúng luật 5 không chặn 2 đầu), cờ vua quốc tế, cờ tướng, cờ vây 19×19 |
| **AI 5 cấp độ** | Từ "Tập chơi" tới "Cao thủ" — heuristic, minimax và alpha-beta theo game |
| **Đấu online** | WebSocket realtime, server validate mọi nước đi, ELO cập nhật tự động |
| **Đồng hồ thi đấu** | Bullet 1+0 đến rapid 15+10, increment, hết giờ = thua |
| **Giải đấu** | Loại trực tiếp, vòng tròn, Thụy Sĩ (Buchholz) — tự bốc cặp, tự tiến vòng |
| **Học & luyện** | Giáo trình tương tác 4 game, 41 cờ thế được engine kiểm chứng |
| **Giao diện** | Sơn mài — canvas nâu đen + son đỏ, light/dark, mobile đầy đủ |
| **Tự chủ** | Một container: Next.js + WS + SQLite. Không dịch vụ trả phí |

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

Dev mode: `npm run dev` · Test: `npm test` · Lint: `npm run lint`

## Giải đấu

Tạo giải tại `/giai-dau` — chọn loại cờ, thể thức, nhịp giờ:

- **Loại trực tiếp** — hòa thì kỳ thủ rating cao đi tiếp
- **Vòng tròn** — mỗi cặp gặp nhau một lần, xếp theo điểm
- **Thụy Sĩ** — ghép cặp theo điểm, không tái đấu, phá hòa bằng Buchholz

Trận giải tự mở phòng riêng với đồng hồ chuẩn, hệ thống tự ghi điểm và dựng vòng tiếp theo.

## Biến môi trường

| Biến | Mặc định | Mô tả |
|---|---|---|
| `PORT` | `3000` | Cổng HTTP + WS |
| `SC_DB` | `./data/san-co.db` | Đường dẫn file SQLite |
| `SC_SECURE_COOKIE` | `0` | Đặt `1` khi chạy sau reverse proxy HTTPS |
| `NODE_ENV` | — | `production` khi chạy `npm start` |

## Kiến trúc

```
app/            Next.js App Router — /, /choi/*, /online, /giai-dau, /hoc, /puzzle, /ho-so
components/     board components, landing, learn widgets, Nav, LiquidCanvas
lib/games/      engine 4 game + AI + adapter registry (dùng chung client & server)
lib/content/    giáo trình + 41 cờ thế (được test validate bằng chính engine)
lib/tournament.ts  bốc cặp KO / vòng tròn / Thụy Sĩ + nhịp giờ
server/         custom Node server: api.ts, rooms.ts (WS + clock), tour.ts, db.ts
```

- **Online**: WS `/ws`, server validate qua `lib/games/registry`, ELO ghi SQL khi ván kết thúc
- **Auth**: username/password, bcrypt, cookie `HttpOnly; SameSite=Lax`, 30 ngày
- **Health check**: `GET /api/health` → `{"ok":true}`

## Deploy

Hướng dẫn đầy đủ: **[docs/DEPLOY.md](docs/DEPLOY.md)** — Oracle Cloud Always Free + Coolify,
miễn phí vĩnh viễn, push lên GitHub là tự động deploy.

---

<div align="center">
<sub>Media trong README được render bằng <a href="readme-media/">Remotion</a> — <code>cd readme-media && npm i && npx remotion render src/index.ts Banner ../readme-assets/banner.gif --codec=gif</code></sub>
</div>
