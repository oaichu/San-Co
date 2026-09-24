"use client";

import Link from "next/link";
import { ThemeToggle } from "./theme";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 font-display text-[19px] font-bold tracking-tight">
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="24" height="24" rx="6" fill="var(--vermilion)" />
        <circle cx="13" cy="9" r="4.2" fill="var(--accent-ink)" />
        <path d="M8.5 21 L13 13.5 L17.5 21 Z" fill="var(--accent-ink)" />
      </svg>
      Sân Cờ
    </Link>
  );
}

export function Nav() {
  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 flex h-[68px] items-center justify-between border-b border-line px-5 md:px-11"
      style={{ background: "color-mix(in srgb, var(--canvas) 62%, transparent)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}
    >
      <Logo />
      <div className="flex items-center gap-4 md:gap-8">
        <div className="hidden items-center gap-6 md:flex">
          <Link href="/choi" className="text-sm font-medium text-ink-2 transition-colors duration-150 hover:text-ink">Chơi</Link>
          <Link href="/online" className="text-sm font-medium text-ink-2 transition-colors duration-150 hover:text-ink">Online</Link>
          <Link href="/hoc" className="text-sm font-medium text-ink-2 transition-colors duration-150 hover:text-ink">Học</Link>
          <Link href="/puzzle" className="text-sm font-medium text-ink-2 transition-colors duration-150 hover:text-ink">Puzzle</Link>
        </div>
        <ThemeToggle />
        <Link
          href="/choi"
          className="inline-flex items-center rounded-[12px] bg-vermilion px-[18px] py-2 text-[13.5px] font-semibold text-accent-ink transition-all duration-150 ease-out hover:-translate-y-0.5 active:scale-[0.97]"
          style={{ boxShadow: "0 10px 26px -12px rgba(0,0,0,.55)" }}
        >
          Chơi ngay
        </Link>
      </div>
    </nav>
  );
}
