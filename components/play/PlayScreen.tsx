"use client";

import { useGame, type Mode } from "@/lib/play/useGame";
import { GameShell } from "./GameShell";
import type { GameId } from "@/lib/games/registry";

export function PlayScreen({ game, initialMode }: { game: GameId; initialMode?: Mode }) {
  // mặc định lần đầu: đấu máy mức Dễ, người đi trước, cờ vây 9×9 — setup đã lưu sẽ ghi đè trong useGame
  const g = useGame(game, { mode: initialMode ?? "ai", level: 1, humanSeat: "p1", goSize: 9 });
  return <GameShell game={game} g={g} />;
}
