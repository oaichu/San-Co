"use client";

import { useEffect, useRef, useState } from "react";

export function useMedia(q: string, fallback = false): boolean {
  const [v, setV] = useState(fallback);
  useEffect(() => {
    const m = matchMedia(q);
    const f = () => setV(m.matches);
    f();
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, [q]);
  return v;
}

/**
 * Đo vùng stage bằng ResizeObserver → kích thước bàn = min(stageW, (stageH − reserveH) × aspect).
 * aspect = rộng/cao (bàn vuông 1, cờ tướng 0.9); reserveH = chiều cao các thanh ghế bám sát bàn.
 */
export function useFitBoard(aspect = 1, reserveH = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const s = Math.max(0, Math.floor(Math.min(e.contentRect.width, (e.contentRect.height - reserveH) * aspect)));
        setSize((prev) => (prev === s ? prev : s));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [aspect, reserveH]);
  return { ref, size };
}
