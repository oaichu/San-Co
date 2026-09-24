"use client";

import { useEffect, useRef } from "react";

const N = 11;

/** Scripted caro game: X builds a diagonal, O chases, X wins, loop. */
const SCRIPT: [number, number, 1 | 2][] = [
  [5, 5, 1], [4, 6, 2], [4, 4, 1], [6, 4, 2], [6, 6, 1], [3, 7, 2],
  [3, 3, 1], [7, 3, 2], [7, 7, 1], [2, 8, 2], [2, 2, 1], [8, 2, 2],
  [8, 8, 1],
];
const WIN: [number, number][] = [[4, 4], [5, 5], [6, 6], [7, 7], [8, 8]];

export function HeroBoard() {
  const boardRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  /* self-playing loop */
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      SCRIPT.forEach(([r, c, p]) => {
        const st = document.createElement("div");
        st.className = `hero-stone ${p === 1 ? "x" : "o"}`;
        board.children[r * N + c].appendChild(st);
      });
      WIN.forEach(([r, c]) => board.children[r * N + c].firstElementChild?.classList.add("win"));
      return;
    }

    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      if (i >= SCRIPT.length) {
        WIN.forEach(([r, c]) => board.children[r * N + c].firstElementChild?.classList.add("win"));
        timer = setTimeout(() => {
          board.querySelectorAll(".hero-stone").forEach((s) => s.remove());
          i = 0;
          step();
        }, 2600);
        return;
      }
      const [r, c, p] = SCRIPT[i++];
      board.querySelectorAll(".hero-stone.last").forEach((s) => s.classList.remove("last"));
      const st = document.createElement("div");
      st.className = `hero-stone ${p === 1 ? "x" : "o"} last`;
      board.children[r * N + c].appendChild(st);
      timer = setTimeout(step, 620 + Math.random() * 380);
    };
    step();
    return () => clearTimeout(timer);
  }, []);

  /* pointer parallax tilt (lerp) */
  useEffect(() => {
    const board = boardRef.current;
    const hero = board?.closest("header");
    if (!board || !hero) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let tx = 0, ty = 0, px = 0, py = 0, raf = 0;
    const onMove = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      tx = e.clientX / r.width - 0.5;
      ty = e.clientY / r.height - 0.5;
    };
    const tick = () => {
      px += (tx - px) * 0.06;
      py += (ty - py) * 0.06;
      board.style.transform = `rotateX(${14 - py * 7}deg) rotateY(${-16 + px * 9}deg) rotateZ(4deg)`;
      raf = requestAnimationFrame(tick);
    };
    hero.addEventListener("pointermove", onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      hero.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="pointer-events-none absolute right-0 top-1/2 z-[1] aspect-square w-[min(560px,46vw)] -translate-y-1/2 max-md:right-[-30vw] max-md:top-[62%] max-md:w-[88vw] max-md:opacity-60"
      style={{ perspective: "1400px" }}
      aria-hidden="true"
    >
      <div
        ref={boardRef}
        className="grid h-full w-full grid-cols-11 rounded-2xl border border-edge bg-surface p-[3.5%] shadow-lift"
        style={{ transform: "rotateX(14deg) rotateY(-16deg) rotateZ(4deg)", transformStyle: "preserve-3d" }}
      >
        {Array.from({ length: N * N }, (_, i) => (
          <div
            key={i}
            className={`relative ${i % N < N - 1 ? "border-r border-line" : ""} ${Math.floor(i / N) < N - 1 ? "border-b border-line" : ""}`}
          />
        ))}
      </div>
      <style jsx>{`
        .hero-stone {
          position: absolute; inset: 16%; border-radius: 50%;
          animation: stone-in 300ms cubic-bezier(0.34, 1.4, 0.64, 1);
          box-shadow: 0 6px 14px -4px rgba(0, 0, 0, 0.5);
        }
        .hero-stone.x { background: var(--stone-x); }
        .hero-stone.o { background: var(--stone-o); }
        .hero-stone.last { outline: 2px solid var(--vermilion); outline-offset: 2px; }
        .hero-stone.win { animation: win-pop 600ms cubic-bezier(0.34, 1.4, 0.64, 1); }
      `}</style>
    </div>
  );
}
