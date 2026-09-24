"use client";

import { useEffect, useRef, useState } from "react";
import { BoardSkin, GAMES } from "../board/skins";

/** Sticky scroll section: cuộn để lướt qua 4 sân cờ, board wipe bằng clip-path */
export function Cycler() {
  const secRef = useRef<HTMLElement>(null);
  const [idx, setIdx] = useState(0);
  const [swapping, setSwapping] = useState(false);

  useEffect(() => {
    const sec = secRef.current;
    if (!sec) return;
    const onScroll = () => {
      const rect = sec.getBoundingClientRect();
      const total = rect.height - innerHeight;
      const prog = Math.min(1, Math.max(0, -rect.top / total));
      const next = Math.min(GAMES.length - 1, Math.floor(prog * GAMES.length));
      setIdx((prev) => {
        if (next === prev) return prev;
        setSwapping(true);
        setTimeout(() => setSwapping(false), 300);
        return next;
      });
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  const jump = (i: number) => {
    const sec = secRef.current;
    if (!sec) return;
    const top = sec.offsetTop;
    scrollTo({ top: top + innerHeight * 1.02 * (i + 0.5), behavior: "smooth" });
  };

  return (
    <section ref={secRef} id="san" aria-label="Bốn loại cờ" className="relative" style={{ height: "420vh" }}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden px-5 md:px-11 lg:px-[72px]">
        {/* rail */}
        <div className="absolute left-5 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-6 md:left-11 lg:left-[72px] max-md:bottom-[6vh] max-md:left-5 max-md:top-auto max-md:translate-y-0 max-md:flex-row max-md:gap-3.5">
          {GAMES.map((g, i) => (
            <button
              key={g.id}
              onClick={() => jump(i)}
              className={`flex items-center gap-3 py-1 text-left text-[13.5px] font-semibold transition-colors duration-200 ${i === idx ? "text-ink" : "text-ink-3"}`}
              aria-label={g.name}
            >
              <span className="tabular font-display text-[11.5px]">0{i + 1}</span>
              <span
                className="h-0.5 transition-all duration-200"
                style={{ width: i === idx ? 40 : 22, background: i === idx ? "var(--vermilion)" : "var(--line-2)" }}
              />
              <span className="max-md:hidden">{g.name}</span>
            </button>
          ))}
        </div>

        {/* copy */}
        <div className="relative z-[3] ml-[clamp(0px,10vw,140px)] max-w-[38ch] max-md:ml-0 max-md:pt-[12vh] max-md:self-start">
          <div className="overflow-hidden">
            <span
              className="block font-display text-[clamp(40px,5.4vw,76px)] font-bold leading-[1.02] tracking-[-0.028em] transition-all duration-300"
              style={{ transform: swapping ? "translateY(16px)" : "none", opacity: swapping ? 0 : 1 }}
            >
              {GAMES[idx].name}
            </span>
          </div>
          <p
            className="mt-4 text-[clamp(15px,1.4vw,17px)] leading-[1.65] text-ink-2 transition-all duration-300"
            style={{ transform: swapping ? "translateY(16px)" : "none", opacity: swapping ? 0 : 1 }}
          >
            {GAMES[idx].desc}
          </p>
        </div>

        {/* stage */}
        <div className="absolute right-5 top-1/2 aspect-square w-[min(480px,44vw)] -translate-y-1/2 md:right-[7vw] lg:right-[120px] max-md:right-1/2 max-md:top-[60%] max-md:w-[min(78vw,420px)] max-md:translate-x-1/2">
          {GAMES.map((g, i) => (
            <div
              key={g.id}
              className="absolute inset-0 overflow-hidden rounded-2xl border border-edge bg-surface shadow-lift transition-all duration-500"
              style={{
                clipPath: i === idx ? "inset(0 0 0 0)" : i < idx ? "inset(100% 0 0 0)" : "inset(0 0 100% 0)",
                opacity: i === idx ? 1 : 0,
                transitionTimingFunction: "var(--ease-in-out-strong)",
              }}
            >
              <BoardSkin game={g.id} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
