import { createServer } from "http";
import { WebSocketServer } from "ws";
import next from "next";
import { handleApi } from "./api";
import { handleWs, sweepRooms } from "./rooms";
import "./tour"; // đăng ký hook kết quả giải
import { userByToken, cookieOf } from "./auth";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT ?? 3000);
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
      if (await handleApi(req, res, url)) return;
      handle(req, res);
    } catch (e) {
      console.error(e);
      res.writeHead(500).end("Internal error");
    }
  });

  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 16 * 1024,
    verifyClient: (info, cb) => {
      // chống cross-site WS hijacking: nếu có Origin thì phải cùng host
      const origin = info.req.headers.origin;
      if (!origin) return cb(true);
      try {
        cb(new URL(origin).host === info.req.headers.host);
      } catch {
        cb(false);
      }
    },
  });
  wss.on("connection", (ws, req) => {
    handleWs(ws, userByToken(cookieOf(req)));
  });

  setInterval(sweepRooms, 10 * 60_000).unref();
  setInterval(sweepRooms, 1000).unref(); // bắt cờ hết giờ (sweep rẻ — chỉ loop Map)

  server.listen(port, () => {
    console.log(`Sân Cờ → http://localhost:${port} (${dev ? "dev" : "prod"})`);
  });
});
