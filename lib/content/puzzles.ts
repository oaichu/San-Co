import type { Puzzle } from "./types";

const N = 15;
const c = (r: number, col: number) => r * N + col;
const x = (r: number, col: number) => r * 9 + col;
const g = (r: number, col: number) => r * 19 + col;

export const PUZZLES: Puzzle[] = [
  /* caro */
  { id: "caro-1", game: "caro", title: "Năm quân một đường", difficulty: 1,
    setup: { moves: [c(7, 4), c(0, 0), c(7, 5), c(0, 1), c(7, 6), c(0, 2), c(7, 7), c(0, 3)] },
    solution: [c(7, 8)], hint: "Hàng ngang của X sắp đủ 5." },
  { id: "caro-2", game: "caro", title: "Đường chéo ẩn", difficulty: 1,
    setup: { moves: [c(4, 4), c(0, 0), c(5, 5), c(0, 1), c(6, 6), c(0, 2), c(7, 7), c(0, 3)] },
    solution: [c(8, 8)], hint: "Nhìn đường chéo xuôi từ góc trên." },
  { id: "caro-3", game: "caro", title: "Chặn trước khi muộn", difficulty: 2,
    setup: { moves: [c(3, 3), c(8, 4), c(3, 4), c(8, 5), c(3, 5), c(8, 6), c(3, 6), c(5, 10), c(10, 10)] },
    solution: [c(8, 3)], hint: "O có 4 quân hàng 9 — chặn đầu nào cũng được, nhưng chỉ một đầu còn trống mở." },

  /* chess — mate in 1 */
  { id: "chess-1", game: "chess", title: "Chiếu hết hàng cuối", difficulty: 1,
    setup: { fen: "6k1/5ppp/8/8/8/8/5PPP/4Q1K1 w - - 0 1" },
    solution: [{ from: "e1", to: "e8" }], hint: "Vua đen không có ô thoát — đưa hậu xuống đáy." },
  { id: "chess-2", game: "chess", title: "Bẫy học trò", difficulty: 1,
    setup: { fen: "r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1" },
    solution: [{ from: "h5", to: "f7" }], hint: "Hậu + tượng cùng nhắm f7 — tốt yếu nhất bàn cờ." },
  { id: "chess-3", game: "chess", title: "Xe chiếu hết hàng cuối", difficulty: 2,
    setup: { fen: "6k1/5ppp/8/8/8/8/5PPP/1R4K1 w - - 0 1" },
    solution: [{ from: "b1", to: "b8" }], hint: "Đưa xe xuống hàng 8 — vua đen kẹt sau 3 tốt." },

  /* xiangqi */
  { id: "xq-1", game: "xiangqi", title: "Pháo ăn mã đầu ván", difficulty: 1,
    setup: { moves: [] },
    solution: [{ from: x(7, 1), to: x(0, 1) }], hint: "Pháo đỏ (7,1) nhảy qua ngòi pháo đen (2,1) để ăn mã." },
  { id: "xq-2", game: "xiangqi", title: "Pháo trung lộ ăn tốt", difficulty: 1,
    setup: { moves: [{ from: x(7, 1), to: x(7, 4) }, { from: x(0, 1), to: x(2, 2) }] },
    solution: [{ from: x(7, 4), to: x(3, 4) }], hint: "Tốt đỏ (6,4) là ngòi — pháo ăn tốt đen giữa sông." },

  /* go */
  { id: "go-1", game: "go", title: "Bắt quân đầu tiên", difficulty: 1,
    setup: { moves: [g(9, 10), g(10, 10), g(10, 9), g(0, 0), g(11, 10), g(0, 1)] },
    solution: [g(10, 11)], hint: "Trắng (10,10) chỉ còn 1 khí." },
  { id: "go-2", game: "go", title: "Bắt nhóm hai quân", difficulty: 2,
    setup: { moves: [g(9, 9), g(10, 9), g(8, 9), g(10, 10), g(9, 8), g(0, 0), g(11, 9), g(0, 1), g(10, 8), g(0, 2), g(11, 10), g(0, 3), g(9, 10), g(0, 4)] },
    solution: [g(10, 11)], hint: "Nhóm trắng (10,9)-(10,10) chỉ còn đúng 1 khí — bít nốt." },
];
