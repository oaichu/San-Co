import type { GameId } from "@/lib/games/registry";

/** setup cho board demo/try: moves = danh sách nước đi áp từ thế mở; fen = riêng cờ vua */
export type Setup = { moves?: unknown[] } | { fen: string };

export interface TextBlock { t: "text"; md: string }
export interface DemoBlock { t: "demo"; note?: string; setup: Setup; moves?: unknown[] }
export interface TryBlock { t: "try"; prompt: string; setup: Setup; solution: unknown; hint?: string }
export type Block = TextBlock | DemoBlock | TryBlock;

export interface Lesson {
  id: string;
  game: GameId;
  order: number;
  title: string;
  sub: string;
  blocks: Block[];
}

export interface Puzzle {
  id: string;
  game: GameId;
  title: string;
  setup: Setup;
  /** chuỗi nước giải: nước người chơi xen kẽ nước đối thủ (nếu có) */
  solution: unknown[];
  hint?: string;
  difficulty: 1 | 2 | 3;
}
