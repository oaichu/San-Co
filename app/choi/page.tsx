import type { Metadata } from "next";
import { ChoiHub } from "@/components/play/ChoiHub";

export const metadata: Metadata = { title: "Chơi — Sân Cờ" };

export default function ChoiPage() {
  return <ChoiHub />;
}
