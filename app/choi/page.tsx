import Link from "next/link";
import { Nav } from "@/components/Nav";
import { BoardSkin, GAMES } from "@/components/board/skins";

export const metadata = { title: "Chơi — Sân Cờ" };

export default function ChoiPage() {
  return (
    <main className="relative min-h-screen">
      <Nav />
      <div className="mx-auto max-w-[1240px] px-5 pb-24 pt-[120px] md:px-11">
        <h1 className="font-display text-[clamp(34px,4.5vw,56px)] font-bold tracking-[-0.025em]">Vào sân.</h1>
        <p className="mt-3 max-w-[52ch] text-[15.5px] leading-[1.65] text-ink-2">
          Chọn một loại cờ để đấu với AI. Chơi online với người khác ở mục <Link href="/online" className="font-medium text-vermilion underline-offset-4 hover:underline">Online</Link>.
        </p>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
          {GAMES.map((g) => (
            <Link
              key={g.id}
              href={`/choi/${g.id}`}
              className="group relative flex items-center gap-6 bg-canvas p-6 transition-colors duration-200 hover:bg-surface md:p-8"
            >
              <div className="w-[clamp(120px,16vw,180px)] shrink-0 overflow-hidden rounded-lg border border-edge shadow-lift">
                <BoardSkin game={g.id} />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-[22px] font-semibold tracking-[-0.015em]">{g.name}</h2>
                <p className="mt-1 text-[13.5px] leading-[1.6] text-ink-2">{g.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-vermilion transition-transform duration-150 group-hover:translate-x-1">
                  Đấu với AI <span aria-hidden="true">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
