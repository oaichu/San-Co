import { CARO_N, candidates, type CaroPlayer } from "./rules";

/** Độ khó 0..4: Người mới → Cao thủ */
export interface CaroAiOpts {
  level: number;
}

const DIRS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
] as const;

function inb(r: number, c: number) {
  return r >= 0 && r < CARO_N && c >= 0 && c < CARO_N;
}

/**
 * Điểm tấn công khi đặt p tại idx: tổng độ dài chuỗi 4 hướng,
 * bonus nếu mở 2 đầu, bonus lớn nếu tạo đúng-5.
 */
function attackScore(board: number[], idx: number, p: CaroPlayer): number {
  const r = Math.floor(idx / CARO_N);
  const c = idx % CARO_N;
  let score = 0;
  for (const [dr, dc] of DIRS) {
    let len = 1;
    let open = 0;
    for (const s of [-1, 1]) {
      let rr = r + dr * s,
        cc = c + dc * s;
      while (inb(rr, cc) && board[rr * CARO_N + cc] === p) {
        len++;
        rr += dr * s;
        cc += dc * s;
      }
      if (inb(rr, cc) && board[rr * CARO_N + cc] === 0) open++;
    }
    if (len >= 5) score += 100000;
    else if (len === 4) score += open === 2 ? 12000 : open === 1 ? 2500 : 0;
    else if (len === 3) score += open === 2 ? 900 : open === 1 ? 120 : 0;
    else if (len === 2) score += open === 2 ? 60 : open === 1 ? 15 : 0;
    else score += open * 3;
  }
  // ơn vị trí trung tâm
  const ctr = (CARO_N - 1) / 2;
  score += 14 - (Math.abs(r - ctr) + Math.abs(c - ctr));
  return score;
}

const CFG = [
  { def: 0.5, noise: 1.6, top: 8 }, // Người mới — đánh bừa gần quân
  { def: 0.7, noise: 1.0, top: 5 }, // Dễ
  { def: 0.85, noise: 0.5, top: 3 }, // Trung bình
  { def: 0.95, noise: 0.2, top: 2 }, // Khó
  { def: 1.0, noise: 0.05, top: 1 }, // Cao thủ
] as const;

/** Chọn nước đi cho `me`. Trả về index ô hoặc null nếu bàn đầy */
export function pickCaroMove(board: number[], me: CaroPlayer, opts: CaroAiOpts): number | null {
  const cfg = CFG[Math.max(0, Math.min(4, opts.level))];
  const opp = me === 1 ? 2 : 1;
  const cands = candidates(board);
  if (cands.length === 0) return null;

  const scored = cands.map((idx) => ({
    idx,
    s: attackScore(board, idx, me) + attackScore(board, idx, opp) * cfg.def + Math.random() * cfg.noise * 100,
  }));
  scored.sort((a, b) => b.s - a.s);
  const pick = scored[Math.floor(Math.random() * Math.min(cfg.top, scored.length))];
  return pick.idx;
}
