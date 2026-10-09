import Link from "next/link";
import { LiquidCanvas, Grain } from "@/components/LiquidCanvas";
import { Nav } from "@/components/Nav";
import { HeroBoard } from "@/components/landing/HeroBoard";
import { Cycler } from "@/components/landing/Cycler";
import { StartHere } from "@/components/landing/StartHere";

export default function Home() {
  return (
    <main className="relative">
      <LiquidCanvas />
      <Grain />
      <Nav />

      {/* HERO — bàn cờ sống */}
      <header className="relative flex min-h-dvh flex-col justify-center overflow-hidden px-5 pb-16 pt-[calc(120px+env(safe-area-inset-top))] md:flex-row md:items-center md:justify-start md:px-11 lg:px-[72px]">
        <div
          className="pointer-events-none absolute inset-0 z-[2] max-md:hidden"
          style={{ background: "linear-gradient(90deg, var(--canvas) 0%, color-mix(in srgb, var(--canvas) 55%, transparent) 42%, transparent 70%)" }}
        />
        <div className="relative z-[3] max-w-[640px] md:max-w-[44vw] xl:max-w-[640px]">
          <h1 className="font-display text-[clamp(44px,6.4vw,88px)] font-bold leading-[1.02] tracking-[-0.028em] [text-wrap:balance]">
            Sân cờ<br />của <em className="italic text-vermilion">người Việt</em>.
          </h1>
          <p className="mt-6 max-w-[46ch] text-[clamp(16px,1.6vw,18.5px)] leading-[1.66] text-ink-2 [text-wrap:pretty]">
            Cờ vua, cờ tướng, cờ caro, cờ vây. Đấu với AI năm cấp độ, chơi hai người trên một máy, thi đấu xếp hạng, học từng nước đi ngay trên bàn cờ.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3.5">
            <Link
              href="/choi"
              className="inline-flex items-center rounded-xl bg-vermilion px-7 py-3.5 text-[15px] font-semibold text-accent-ink transition-transform duration-150 ease-out hover:-translate-y-0.5 active:scale-[0.97]"
              style={{ boxShadow: "0 10px 26px -12px rgba(0,0,0,.55)" }}
            >
              Chơi ngay
            </Link>
            <Link
              href="/hoc"
              className="inline-flex items-center rounded-xl border border-line-2 px-7 py-3.5 text-[15px] font-semibold text-ink transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-ink-2 active:scale-[0.97]"
            >
              Xem cách học
            </Link>
          </div>
          <div className="mt-9 inline-flex items-center gap-2.5 text-[13px] font-medium text-ink-2">
            <span className="h-2 w-2 rounded-full bg-vermilion" />
            Ván caro đang diễn ra trên sân
          </div>
        </div>
        <HeroBoard />
      </header>

      {/* BẮT ĐẦU TỪ ĐÂU */}
      <StartHere />

      {/* BỐN SÂN — scrollytelling cycler */}
      <Cycler />

      {/* HỌC — asymmetric hairline list */}
      <section id="hoc" className="mx-auto max-w-[1240px] px-5 py-[clamp(80px,12vh,140px)] md:px-11 lg:px-[72px]">
        <div className="grid gap-[clamp(36px,7vw,110px)] md:grid-cols-[1fr_1.2fr]">
          <div className="self-start md:sticky md:top-[120px]">
            <h2 className="font-display text-[clamp(32px,4.4vw,56px)] font-bold leading-[1.06] tracking-[-0.025em] [text-wrap:balance]">
              Học như<br />đang chơi.
            </h2>
            <p className="mt-4 max-w-[52ch] text-[16.5px] leading-[1.65] text-ink-2 [text-wrap:pretty]">
              Không đọc luật khô. Bàn cờ ngay trong bài học, nước đi hợp lệ được tô sáng, thế cờ chấm tự động.
            </p>
          </div>
          <div>
            {[
              { t: "Giáo trình tương tác", tag: "4 loại cờ", d: "Từ cách đi quân tới chiến thuật cơ bản và khai cuộc. Mỗi bài có bàn cờ mini để bạn tự đi thử, không phải đoán từ hình vẽ." },
              { t: "Thế cờ mỗi ngày", tag: "100 thế", d: "Một thế mới mỗi ngày, cùng thư viện 100 thế bốn loại cờ. Giải sai được chỉ nước mấu chốt; chế độ liên hoàn ba mạng để thử sức." },
              { t: "Xếp hạng từng sân", tag: "ELO", d: "Rating riêng cho từng loại cờ. Đấu online qua phòng, hoặc chơi hai người trên một máy khi không có mạng." },
            ].map((f, i) => (
              <div key={f.t} className={`border-b border-line py-9 ${i === 0 ? "border-t border-t-line-2" : ""}`}>
                <h3 className="mb-2.5 flex items-baseline gap-3 font-display text-[22px] font-semibold tracking-[-0.015em]">
                  {f.t}
                  <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-vermilion">{f.tag}</span>
                </h3>
                <p className="max-w-[52ch] text-[14.5px] leading-[1.7] text-ink-2">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSE */}
      <section className="px-6 py-[clamp(100px,16vh,180px)] text-center">
        <h2 className="font-display text-[clamp(48px,8vw,110px)] font-bold leading-none tracking-[-0.03em]">Vào sân.</h2>
        <p className="my-7 text-[15.5px] text-ink-2">Miễn phí. Mã nguồn mở. Xây cho cộng đồng cờ thủ Việt.</p>
        <Link
          href="/choi"
          className="inline-flex items-center rounded-xl bg-vermilion px-8 py-4 text-[15px] font-semibold text-accent-ink transition-transform duration-150 ease-out hover:-translate-y-0.5 active:scale-[0.97]"
          style={{ boxShadow: "0 10px 26px -12px rgba(0,0,0,.55)" }}
        >
          Chơi ngay
        </Link>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-line px-5 py-7 text-[12.5px] text-ink-3 md:px-11">
        <span>Sân Cờ, 2026 · Cờ vua · Cờ tướng · Cờ caro · Cờ vây</span>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Chân trang">
          <Link href="/choi" className="transition-colors hover:text-ink">Chơi</Link>
          <Link href="/puzzle" className="transition-colors hover:text-ink">Thế cờ</Link>
          <Link href="/hoc" className="transition-colors hover:text-ink">Học</Link>
          <Link href="/online" className="transition-colors hover:text-ink">Online</Link>
          <Link href="/giai-dau" className="transition-colors hover:text-ink">Giải đấu</Link>
        </nav>
      </footer>
    </main>
  );
}
