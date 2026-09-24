"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";

/** Gợi ý tính cách từng mức — giọng riêng của Sân Cờ */
export const LEVEL_HINTS = ["Chơi vui, không áp lực", "Tập đọc nước đi", "Đối thủ cân bằng", "Phải tính trước", "Không tha thứ"] as const;

/** Dòng trạng thái: chấm quân của bên đang đi + chữ đổi mượt (cross-blur) */
export function StatusLine({ text, over, stone, sub }: { text: string; over?: boolean; stone?: string; sub?: ReactNode }) {
  return (
    <div className="border-b border-line pb-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">Trạng thái</div>
      <div className="mt-2.5 flex items-center gap-3" aria-live="polite">
        {stone != null && (
          <motion.span
            key={stone}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 26 }}
            className="h-3.5 w-3.5 shrink-0 rounded-full"
            style={{ background: stone, boxShadow: "0 2px 6px rgba(0,0,0,.35)" }}
            aria-hidden="true"
          />
        )}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={text}
            initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className={`font-display text-[20px] font-semibold leading-tight ${over ? "text-vermilion" : ""}`}
          >
            {text}
          </motion.span>
        </AnimatePresence>
      </div>
      {sub}
    </div>
  );
}

/** Chọn độ khó: thanh ray 5 chấm quân, chấm son trượt theo lựa chọn */
export function LevelTrack({ levels, level, onLevel }: { levels: readonly string[]; level: number; onLevel: (i: number) => void }) {
  return (
    <div className="border-b border-line py-5">
      <div className="flex items-baseline justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">Độ khó</div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={level}
            initial={{ opacity: 0, filter: "blur(2px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(2px)" }}
            transition={{ duration: 0.15 }}
            className="text-[12px] font-medium text-ink-2"
          >
            {LEVEL_HINTS[level]}
          </motion.span>
        </AnimatePresence>
      </div>

      <div role="radiogroup" aria-label="Độ khó" className="relative mt-4 flex justify-between px-1">
        <span className="absolute left-2 right-2 top-1/2 h-px -translate-y-1/2 bg-line-2" aria-hidden="true" />
        {levels.map((l, i) => {
          const active = i === level;
          return (
            <button
              key={l}
              role="radio"
              aria-checked={active}
              aria-label={l}
              onClick={() => onLevel(i)}
              className="group relative z-10 flex h-8 w-8 items-center justify-center rounded-full"
            >
              <span
                className={`h-2.5 w-2.5 rounded-full border transition-all duration-200 ease-out ${
                  active
                    ? "border-transparent"
                    : "border-line-2 bg-surface-2 group-hover:border-ink-2 group-hover:bg-surface group-active:scale-90"
                }`}
                style={active ? { background: "var(--vermilion)", boxShadow: "0 3px 10px -2px rgba(0,0,0,.5)" } : undefined}
              />
              {active && (
                <motion.span
                  layoutId="level-ring"
                  className="absolute inset-0 rounded-full border border-vermilion"
                  transition={{ type: "spring", stiffness: 480, damping: 32 }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-2 text-center text-[13px] font-semibold text-ink">{levels[level]}</div>
    </div>
  );
}

/** Hàng nút hành động: ghost button hairline */
export function PanelActions({ actions }: { actions: { label: string; onClick: () => void; disabled?: boolean }[] }) {
  return (
    <div className="flex gap-2 border-b border-line py-5">
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={a.onClick}
          disabled={a.disabled}
          className="flex-1 rounded-lg border border-line-2 py-2.5 text-[13.5px] font-semibold transition-all duration-150 enabled:hover:-translate-y-0.5 enabled:hover:border-ink-2 enabled:active:scale-[0.97] disabled:opacity-40"
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}

/** Biên bản nước đi: nước mới nhất nổi son, tự cuộn xuống */
export function MoveList({ rows, empty, lastIdx }: { rows: [string, string?][]; empty: string; lastIdx?: number }) {
  return (
    <div className="pt-5">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">Nước đi</div>
      {rows.length === 0 ? (
        <p className="text-[13px] text-ink-3">{empty}</p>
      ) : (
        <ol
          className="tabular max-h-[220px] overflow-y-auto pr-1 text-[13px] text-ink-2"
          ref={(el) => {
            if (el) el.scrollTop = el.scrollHeight;
          }}
        >
          {rows.map((r, ri) => (
            <li key={ri} className="flex items-baseline gap-3 py-1">
              <span className="w-6 shrink-0 text-[11.5px] text-ink-3">{ri + 1}.</span>
              <span className={`w-16 ${ri * 2 === lastIdx ? "font-semibold text-vermilion" : ""}`}>{r[0]}</span>
              <span className={`w-16 ${ri * 2 + 1 === lastIdx ? "font-semibold text-vermilion" : ""}`}>{r[1] ?? ""}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
