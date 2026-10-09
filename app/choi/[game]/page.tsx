import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlayScreen } from "@/components/play/PlayScreen";
import { GAMES } from "@/components/board/skins";
import type { GameId } from "@/lib/games/registry";

const IDS: GameId[] = ["caro", "chess", "xiangqi", "go"];

export function generateStaticParams() {
  return IDS.map((game) => ({ game }));
}

export async function generateMetadata({ params }: { params: Promise<{ game: string }> }): Promise<Metadata> {
  const { game } = await params;
  const name = GAMES.find((g) => g.id === game)?.name;
  return { title: name ? `${name} — Sân Cờ` : "Chơi — Sân Cờ" };
}

export default async function GamePage({
  params,
  searchParams,
}: {
  params: Promise<{ game: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { game } = await params;
  if (!IDS.includes(game as GameId)) notFound();
  const { mode } = await searchParams;
  return <PlayScreen game={game as GameId} initialMode={mode === "local" ? "local" : undefined} />;
}
