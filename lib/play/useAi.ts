"use client";

import { useCallback, useEffect, useRef } from "react";
import { adapters, type GameId } from "@/lib/games/registry";
import { pickMove } from "./ai";
import type { Level } from "./levels";

/**
 * Cầu nối tới ai.worker.ts. request() trả Promise<nước đi>;
 * cancel() vô hiệu mọi request đang chờ (id cũ bị bỏ qua).
 * Nếu Worker không dựng được → chạy pickMove trên main thread trong setTimeout.
 */
export function useAi() {
  const workerRef = useRef<Worker | null>(null);
  const brokenRef = useRef(false);
  const pendingRef = useRef(new Map<number, (m: unknown) => void>());
  const idRef = useRef(0);
  const genRef = useRef(0);

  const getWorker = useCallback((): Worker | null => {
    if (brokenRef.current) return null;
    if (workerRef.current) return workerRef.current;
    try {
      const w = new Worker(new URL("./ai.worker.ts", import.meta.url));
      w.onmessage = (ev: MessageEvent<{ id: number; move: unknown }>) => {
        const { id, move } = ev.data;
        const resolve = pendingRef.current.get(id);
        pendingRef.current.delete(id);
        resolve?.(move);
      };
      w.onerror = () => {
        brokenRef.current = true;
        workerRef.current?.terminate();
        workerRef.current = null;
      };
      workerRef.current = w;
      return w;
    } catch {
      brokenRef.current = true;
      return null;
    }
  }, []);

  const request = useCallback(
    (game: GameId, state: unknown, level: Level, opts?: { timeMs?: number }): Promise<unknown | null> => {
      const gen = genRef.current;
      const w = getWorker();
      if (!w) {
        // fallback: chạy trên main thread nhưng vẫn bất đồng bộ
        return new Promise((resolve) => {
          setTimeout(() => {
            if (gen !== genRef.current) return resolve(null);
            try {
              resolve(pickMove(game, state, level, opts));
            } catch {
              resolve(null);
            }
          }, 0);
        });
      }
      const id = ++idRef.current;
      return new Promise((resolve) => {
        pendingRef.current.set(id, (move) => resolve(gen === genRef.current ? (move as unknown) : null));
        try {
          w.postMessage({ id, game, state: adapters[game].encode(state as never), level, timeMs: opts?.timeMs });
        } catch {
          pendingRef.current.delete(id);
          resolve(null);
        }
      });
    },
    [getWorker]
  );

  const cancel = useCallback(() => {
    genRef.current++;
    const pending = [...pendingRef.current.values()];
    pendingRef.current.clear();
    for (const resolve of pending) resolve(null);
  }, []);

  useEffect(
    () => () => {
      genRef.current++;
      workerRef.current?.terminate();
      workerRef.current = null;
    },
    []
  );

  return { request, cancel };
}
