"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
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

const LINKS = [
  { href: "/choi", label: "Chơi" },
  { href: "/online", label: "Online" },
  { href: "/hoc", label: "Học" },
  { href: "/puzzle", label: "Puzzle" },
  { href: "/ho-so", label: "Hồ sơ" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  // đóng menu khi đổi route (adjust-state-during-render pattern)
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 border-b border-line"
      style={{ background: "color-mix(in srgb, var(--canvas) 62%, transparent)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}
    >
      <div className="flex h-[68px] items-center justify-between px-5 md:px-11">
        <Logo />
        <div className="flex items-center gap-3 md:gap-8">
          <div className="hidden items-center gap-6 md:flex">
            {LINKS.slice(0, 4).map((l) => (
              <Link key={l.href} href={l.href} className="text-sm font-medium text-ink-2 transition-colors duration-150 hover:text-ink">{l.label}</Link>
            ))}
          </div>
          <ThemeToggle />
          <Link
            href="/choi"
            className="hidden items-center rounded-[12px] bg-vermilion px-[18px] py-2 text-[13.5px] font-semibold text-accent-ink transition-all duration-150 ease-out hover:-translate-y-0.5 active:scale-[0.97] sm:inline-flex"
            style={{ boxShadow: "0 10px 26px -12px rgba(0,0,0,.55)" }}
          >
            Chơi ngay
          </Link>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-line-2 text-ink transition-transform active:scale-[0.95] md:hidden"
            aria-label={open ? "Đóng menu" : "Mở menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {open ? <path d="M4 4l10 10M14 4L4 14" /> : <path d="M2.5 5h13M2.5 9h13M2.5 13h13" />}
            </svg>
          </button>
        </div>
      </div>
      {/* menu mobile */}
      <div
        className={`grid overflow-hidden border-line transition-[grid-template-rows] duration-250 ease-out md:hidden ${open ? "border-t" : ""}`}
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="min-h-0">
          <div className="flex flex-col px-5 py-2">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`border-b border-line py-3.5 text-[15px] font-medium last:border-0 ${pathname === l.href ? "text-vermilion" : "text-ink"}`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
