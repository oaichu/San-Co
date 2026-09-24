/**
 * Logic giải đấu — hàm thuần, test được.
 * Thể thức: ko = loại trực tiếp, rr = vòng tròn một lượt, swiss = Thụy Sĩ.
 * Điểm: thắng 1, hòa 0.5, thua 0. Bye = 1 điểm.
 */

export interface TcDef { key: string; label: string; /** giây */ initial: number; /** giây/nước */ inc: number }

export const TIME_CONTROLS: TcDef[] = [
  { key: "0", label: "Không giờ", initial: 0, inc: 0 },
  { key: "1+0", label: "Siêu chớp 1+0", initial: 60, inc: 0 },
  { key: "3+0", label: "Chớp 3+0", initial: 180, inc: 0 },
  { key: "3+2", label: "Chớp 3+2", initial: 180, inc: 2 },
  { key: "5+3", label: "Nhanh 5+3", initial: 300, inc: 3 },
  { key: "10+0", label: "Nhanh 10+0", initial: 600, inc: 0 },
  { key: "15+10", label: "Cổ điển 15+10", initial: 900, inc: 10 },
];

export const TC_MAP = new Map(TIME_CONTROLS.map((t) => [t.key, t]));
export function tcOf(key: string | null | undefined): TcDef | null {
  const t = key ? TC_MAP.get(key) : undefined;
  return t && t.initial > 0 ? t : null;
}

export type Pair = [number, number | null]; // null = bye
export type TourFormat = "ko" | "rr" | "swiss";

export const FORMAT_LABEL: Record<TourFormat, string> = {
  ko: "Loại trực tiếp",
  rr: "Vòng tròn",
  swiss: "Thụy Sĩ",
};

/**
 * Loại trực tiếp: cặp theo seed (đầu gặp cuối). `seeded` đã xếp theo rating giảm dần.
 * Số lẻ → hạt giống giữa bảng được bye. Mỗi vòng gọi lại với người còn lại.
 */
export function koPairs(seeded: number[]): Pair[] {
  const n = seeded.length;
  const pairs: Pair[] = [];
  for (let i = 0; i < Math.floor(n / 2); i++) pairs.push([seeded[i], seeded[n - 1 - i]]);
  if (n % 2 === 1) pairs.push([seeded[Math.floor(n / 2)], null]);
  return pairs;
}

/**
 * Vòng tròn một lượt — phương pháp vòng xoay (circle method).
 * Trả về lịch đầy đủ: rounds[vòng][cặp]. Lẻ người → mỗi vòng một bye.
 */
export function rrSchedule(ids: number[]): Pair[][] {
  const list = ids.slice();
  if (list.length % 2 === 1) list.push(-1); // -1 = chỗ trống bye
  const n = list.length;
  if (n < 2) return [];
  const rounds: Pair[][] = [];
  for (let r = 0; r < n - 1; r++) {
    const round: Pair[] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = list[i], b = list[n - 1 - i];
      if (a === -1) round.push([b, null]);
      else if (b === -1) round.push([a, null]);
      else round.push([a, b]);
    }
    rounds.push(round);
    list.splice(1, 0, list.pop()!); // giữ vị trí 0, xoay phần còn lại
  }
  return rounds;
}

/** Tổng số vòng vòng tròn (lẻ người vẫn đúng số vòng do có bye). */
export function rrRoundCount(n: number): number {
  return n <= 1 ? 0 : n % 2 === 0 ? n - 1 : n;
}

export interface SwissPlayer {
  id: number;
  score: number;
  buchholz: number;
  opponents: ReadonlySet<number>;
  hadBye: boolean;
}

/**
 * Bốc cặp Thụy Sĩ: xếp theo điểm rồi Buchholz, ghép đôi gần nhất chưa gặp nhau.
 * Lẻ người → người xếp cuối chưa từng bye được bye (1 điểm).
 */
export function swissPairs(players: SwissPlayer[]): Pair[] {
  const sorted = [...players].sort((a, b) => b.score - a.score || b.buchholz - a.buchholz);
  const used = new Set<number>();
  const pairs: Pair[] = [];

  // lẻ người → chọn bye trước: người xếp cuối chưa từng bye (đúng chuẩn Swiss)
  let bye: SwissPlayer | null = null;
  if (sorted.length % 2 === 1) {
    bye = [...sorted].reverse().find((p) => !p.hadBye) ?? sorted[sorted.length - 1];
    used.add(bye.id);
  }

  const tryPair = (respectHistory: boolean) => {
    for (const p of sorted) {
      if (used.has(p.id)) continue;
      const opp = sorted.find(
        (o) => !used.has(o.id) && o.id !== p.id && (!respectHistory || !p.opponents.has(o.id)),
      );
      if (opp) {
        pairs.push([p.id, opp.id]);
        used.add(p.id);
        used.add(opp.id);
      }
    }
  };

  tryPair(true);
  tryPair(false); // còn ai kẹt vì đã gặp nhau hết → chấp nhận tái đấu

  if (bye) pairs.push([bye.id, null]);
  return pairs;
}

/** Số vòng Thụy Sĩ chuẩn: ceil(log2 n), tối thiểu 1. */
export function swissRounds(n: number): number {
  return n <= 1 ? 0 : Math.max(1, Math.ceil(Math.log2(n)));
}

/** Buchholz = tổng điểm các đối thủ đã gặp (bye tính 0.5 như đối thủ hòa). */
export function buchholz(oppScores: number[]): number {
  return oppScores.reduce((a, b) => a + b, 0);
}

/** Điểm từ kết quả ván: "p1" | "p2" | "draw". */
export function scoreOf(result: "p1" | "p2" | "draw", seat: "p1" | "p2"): number {
  if (result === "draw") return 0.5;
  return result === seat ? 1 : 0;
}
