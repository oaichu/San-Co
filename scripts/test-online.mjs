// Integration test: register 2 users, WS create/join, play caro to win, check ELO
import WebSocket from "ws";

const BASE = "http://localhost:3000";

async function reg(name) {
  const r = await fetch(`${BASE}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: name, password: "test123456" }),
  });
  const setCookie = r.headers.get("set-cookie") ?? "";
  const token = setCookie.match(/sc_session=([a-f0-9]+)/)?.[1];
  const d = await r.json();
  if (!r.ok && !d.ok) console.log(name, "register:", r.status, d);
  return token;
}

function connect(token) {
  return new Promise((res) => {
    const ws = new WebSocket("ws://localhost:3000/ws", { headers: { cookie: `sc_session=${token}` } });
    const inbox = [];
    const waiters = [];
    ws.on("message", (d) => {
      const m = JSON.parse(d);
      const w = waiters.findIndex((w) => w.pred(m));
      if (w >= 0) waiters.splice(w, 1)[0].res(m);
      else inbox.push(m);
    });
    ws.on("open", () => res({
      ws,
      send: (m) => ws.send(JSON.stringify(m)),
      wait: (pred, ms = 8000) => {
        const hit = inbox.findIndex(pred);
        if (hit >= 0) return Promise.resolve(inbox.splice(hit, 1)[0]);
        return new Promise((res2, rej) => {
          const t = setTimeout(() => rej(new Error("timeout waiting")), ms);
          waiters.push({ pred, res: (m) => { clearTimeout(t); res2(m); } });
        });
      },
    }));
  });
}

const t1 = await reg("testa_" + Date.now());
const t2 = await reg("testb_" + Date.now());
console.log("tokens:", !!t1, !!t2);

const c1 = await connect(t1);
const c2 = await connect(t2);
await c1.wait((m) => m.t === "me" && m.user);
await c2.wait((m) => m.t === "me" && m.user);

c1.send({ t: "create", game: "caro" });
const j1 = await c1.wait((m) => m.t === "joined");
console.log("created room", j1.room, "seat", j1.seat);

c2.send({ t: "join", room: j1.room });
const j2 = await c2.wait((m) => m.t === "joined");
console.log("p2 joined, seat", j2.seat);
await c1.wait((m) => m.t === "start");

// p1 (X) đánh 5 quân hàng 7: p1 đi 7,3 7,4 7,5 7,6 7,7; p2 đánh hàng 0
const N = 15;
const seq = [[7, 3, c1], [0, 0, c2], [7, 4, c1], [0, 1, c2], [7, 5, c1], [0, 2, c2], [7, 6, c1], [0, 3, c2], [7, 7, c1]];
for (const [r, c, cli] of seq) {
  cli.send({ t: "move", room: j1.room, move: r * N + c });
  await c1.wait((m) => m.t === "state" || m.t === "end");
}
const end = await c1.wait((m) => m.t === "end");
console.log("END:", end.result, "deltas:", JSON.stringify(end.deltas));

// check history + leaderboard
const me = await (await fetch(`${BASE}/api/me`, { headers: { cookie: `sc_session=${t1}` } })).json();
console.log("p1 caro rating:", me.user.ratings.find((r) => r.game === "caro"));
const hist = await (await fetch(`${BASE}/api/history`, { headers: { cookie: `sc_session=${t2}` } })).json();
console.log("p2 history games:", hist.games.length, "result:", hist.games[0]?.result);

process.exit(0);
