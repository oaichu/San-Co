import type { Metadata } from "next";
import { PuzzleApp } from "@/components/puzzle/PuzzleApp";

export const metadata: Metadata = { title: "Thế cờ — Sân Cờ" };

export default function PuzzlePage() {
  return <PuzzleApp />;
}
