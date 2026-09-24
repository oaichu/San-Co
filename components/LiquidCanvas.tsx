"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "./theme";

const PALETTES: Record<string, number[][]> = {
  dark: [
    [224, 85, 47],
    [190, 120, 50],
    [120, 60, 35],
    [45, 130, 110],
  ],
  light: [
    [235, 150, 90],
    [215, 110, 60],
    [190, 170, 120],
    [140, 190, 170],
  ],
};

/** Warm liquid gradient blobs on a fixed canvas. Pauses under reduced motion. */
export function LiquidCanvas({ intensity = 1 }: { intensity?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = (cv.width = innerWidth);
    let H = (cv.height = innerHeight);
    let raf = 0;

    const blobs = Array.from({ length: 4 }, (_, i) => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.min(W, H) * (0.3 + Math.random() * 0.25),
      c: i,
      a: Math.random() * Math.PI * 2,
      s: 0.00013 + Math.random() * 0.00016,
      ox: 0.14 + Math.random() * 0.18,
      oy: 0.1 + Math.random() * 0.16,
    }));

    const frame = (t: number) => {
      const pal = PALETTES[themeRef.current];
      const alpha = (themeRef.current === "dark" ? 0.3 : 0.42) * intensity;
      ctx.clearRect(0, 0, W, H);
      for (const b of blobs) {
        const x = b.x + Math.cos(t * b.s + b.a) * W * b.ox;
        const y = b.y + Math.sin(t * b.s * 1.25 + b.a) * H * b.oy;
        const c = pal[b.c % pal.length];
        const g = ctx.createRadialGradient(x, y, 0, x, y, b.r);
        g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${alpha})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
      raf = requestAnimationFrame(frame);
    };

    const onResize = () => {
      W = cv.width = innerWidth;
      H = cv.height = innerHeight;
    };
    addEventListener("resize", onResize);

    if (reduced) frame(0);
    else raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", onResize);
    };
  }, [intensity]);

  return <canvas ref={ref} className="fixed inset-0 -z-20" aria-hidden="true" />;
}

/** One-shot noise grain overlay, painted to a data URL. */
export function Grain() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const n = document.createElement("canvas");
    n.width = n.height = 128;
    const nx = n.getContext("2d");
    if (!nx) return;
    const img = nx.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.floor(Math.random() * 255);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    nx.putImageData(img, 0, 0);
    if (ref.current) ref.current.style.backgroundImage = `url(${n.toDataURL()})`;
  }, []);
  return <div ref={ref} className="pointer-events-none fixed inset-0 -z-10 opacity-[0.05]" aria-hidden="true" />;
}
