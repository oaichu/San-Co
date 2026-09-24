import { Piece, type PieceType } from "./ChessPieces";
import { MarkX, MarkO } from "./CaroBoard";

export type GameId = "caro" | "chess" | "xiangqi" | "go";

export const GAMES: { id: GameId; name: string; desc: string }[] = [
  { id: "caro", name: "Cờ caro", desc: "Năm quân một đường. Luật Việt: đúng năm mới thắng, chặn hai đầu vẫn cứu được." },
  { id: "chess", name: "Cờ vua", desc: "64 ô, AI alpha-beta chạy ngay trên máy bạn. Năm cấp độ, từ nhập môn tới cao thủ." },
  { id: "xiangqi", name: "Cờ tướng", desc: "Vượt sông, giữ thành. Bàn cờ quen thuộc nhất của người Việt, nay có AI đủ mạnh để luyện." },
  { id: "go", name: "Cờ vây", desc: "361 giao điểm, luật đơn giản nhất, chiều sâu lớn nhất. Học qua từng bàn 19 nhân 19 thật." },
];

/** Bàn caro 9×9 tĩnh, một thế cờ gần xong với đường thắng được tô sáng */
export function CaroSkin() {
  const stones: Record<string, "x" | "o"> = {
    "3,3": "x", "3,4": "x", "3,5": "x", "3,6": "x",
    "4,4": "o", "4,5": "o", "5,3": "o", "2,6": "o", "5,5": "o", "6,2": "x",
  };
  return (
    <div className="relative h-full w-full p-[5%]">
      <div className="grid h-full w-full grid-cols-9">
        {Array.from({ length: 81 }, (_, i) => {
          const r = Math.floor(i / 9), c = i % 9;
          const s = stones[`${r},${c}`];
          return (
            <div key={i} className={`relative ${c < 8 ? "border-r border-line" : ""} ${r < 8 ? "border-b border-line" : ""}`}>
              {s && <span className="absolute inset-0">{s === "x" ? <MarkX faint /> : <MarkO faint />}</span>}
            </div>
          );
        })}
      </div>
      {/* đường thắng */}
      <svg className="pointer-events-none absolute inset-[5%]" viewBox="0 0 9 9" aria-hidden="true">
        <line x1="3.5" y1="3.5" x2="3.5" y2="6.5" stroke="var(--vermilion)" strokeWidth="0.18" strokeLinecap="round" opacity="0.85" />
      </svg>
    </div>
  );
}

const BACK: PieceType[] = ["r", "n", "b", "q", "k", "b", "n", "r"];

/** Bàn cờ vua 8×8 tĩnh, thế trung cuộc — cùng bộ quân SVG với bàn thật */
export function ChessSkin() {
  return (
    <div className="grid h-full w-full grid-cols-8 overflow-hidden rounded-lg">
      {Array.from({ length: 64 }, (_, i) => {
        const r = Math.floor(i / 8), c = i % 8;
        let p: PieceType | null = null, enemy = false;
        if (r === 0) { p = BACK[c]; enemy = true; }
        if (r === 1) { p = "p"; enemy = true; }
        if (r === 6) p = "p";
        if (r === 7) p = BACK[c];
        if (r === 4 && c === 4) { p = "n"; enemy = true; }
        if (r === 3 && c === 3) p = "p";
        const light = (r + c) % 2 === 0;
        return (
          <div
            key={i}
            className="grid place-items-center"
            style={{ background: light ? "var(--chess-l)" : "var(--chess-d)" }}
          >
            {p && (
              <span className="block h-[86%] w-[86%]" style={{ filter: "drop-shadow(0 2px 2px rgba(20,12,4,.35))" }}>
                <Piece t={p} c={enemy ? "b" : "w"} />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

const XQ_SETUP: Record<string, string> = {
  "0,0": "車", "0,1": "馬", "0,2": "象", "0,3": "士", "0,4": "將", "0,5": "士", "0,6": "象", "0,7": "馬", "0,8": "車",
  "2,1": "砲", "2,7": "砲", "3,0": "卒", "3,2": "卒", "3,4": "卒", "3,6": "卒", "3,8": "卒",
  "9,0": "車", "9,1": "馬", "9,2": "相", "9,3": "仕", "9,4": "帥", "9,5": "仕", "9,6": "相", "9,7": "馬", "9,8": "車",
  "7,1": "炮", "7,7": "炮", "6,0": "兵", "6,2": "兵", "6,4": "兵", "6,6": "兵", "6,8": "兵",
};

/** Bàn cờ tướng 9×10 tĩnh, quân tròn chữ Hán */
export function XiangqiSkin() {
  return (
    <div className="grid h-full w-full grid-cols-9 grid-rows-10 rounded-lg p-[4%]" style={{ background: "linear-gradient(160deg, var(--wood-1), var(--wood-2))" }}>
      {Array.from({ length: 90 }, (_, i) => {
        const r = Math.floor(i / 9), c = i % 9;
        const ch = XQ_SETUP[`${r},${c}`];
        const red = r > 4;
        return (
          <div key={i} className="relative grid place-items-center">
            {ch && (
              <span
                className="relative grid aspect-square w-[80%] place-items-center rounded-full font-semibold"
                style={{
                  fontSize: "clamp(11px, 1.6vw, 17px)",
                  color: red ? "var(--xq-red)" : "var(--xq-ink)",
                  background: "radial-gradient(circle at 36% 28%, #faf0d6 0%, #ecd9ac 62%, #d8bd8a 100%)",
                  border: `1.5px solid ${red ? "var(--xq-red)" : "var(--xq-ink)"}`,
                  boxShadow: "0 3px 8px -2px rgba(30,18,4,.45), inset 0 1px 0 rgba(255,252,240,.6)",
                }}
              >
                {ch}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Bàn cờ vây 13×13 tĩnh với vài quân */
export function GoSkin() {
  const stones: Record<string, "b" | "w"> = {
    "3,3": "b", "9,9": "w", "3,9": "w", "9,3": "b", "6,6": "b",
    "6,7": "w", "7,6": "w", "7,7": "b", "4,4": "b", "10,10": "w", "2,10": "b",
  };
  return (
    <div className="grid h-full w-full rounded-lg p-[4%]" style={{ gridTemplateColumns: "repeat(13, 1fr)", background: "linear-gradient(155deg, var(--wood-1), var(--wood-2))" }}>
      {Array.from({ length: 169 }, (_, i) => {
        const r = Math.floor(i / 13), c = i % 13;
        const s = stones[`${r},${c}`];
        return (
          <div key={i} className={`relative ${c < 12 ? "border-r" : ""} ${r < 12 ? "border-b" : ""}`} style={{ borderColor: "rgba(64,40,14,.5)" }}>
            {s && (
              <span
                className="absolute inset-[10%] rounded-full"
                style={
                  s === "b"
                    ? { background: "radial-gradient(circle at 33% 27%, #5a5044 0%, #2e2619 42%, #120d07 78%)", boxShadow: "0 3px 6px -1px rgba(20,10,0,.5)" }
                    : { background: "radial-gradient(circle at 33% 27%, #fffdf4 0%, #f0e7d0 55%, #cbbc9c 100%)", boxShadow: "0 3px 6px -1px rgba(20,10,0,.35)" }
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function BoardSkin({ game }: { game: GameId }) {
  switch (game) {
    case "caro": return <CaroSkin />;
    case "chess": return <ChessSkin />;
    case "xiangqi": return <XiangqiSkin />;
    case "go": return <GoSkin />;
  }
}
