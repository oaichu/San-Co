"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, Puzzle, GraduationCap, Globe, UserRound } from "lucide-react";

const TABS = [
  { href: "/choi", label: "Chơi", icon: Gamepad2 },
  { href: "/puzzle", label: "Thế cờ", icon: Puzzle },
  { href: "/hoc", label: "Học", icon: GraduationCap },
  { href: "/online", label: "Online", icon: Globe },
  { href: "/ho-so", label: "Hồ sơ", icon: UserRound },
];

/**
 * Tab bar dưới cho màn hình nhỏ — ẩn trên trang chơi (/choi/[game])
 * và khi đang trong phòng online (body[data-inroom]).
 */
export function TabBar() {
  const pathname = usePathname();
  const hidden = pathname.startsWith("/choi/");

  return (
    <>
      {/* chừa chỗ để nội dung không bị bar che — chỉ khi bar hiện */}
      {!hidden && <div className="h-[calc(56px+env(safe-area-inset-bottom))] md:hidden" aria-hidden="true" />}
      <nav
        className={`fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface md:hidden ${hidden ? "hidden" : ""} [body[data-inroom]_&]:hidden`}
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
        aria-label="Điều hướng chính"
      >
        <div className="flex h-14 items-stretch justify-around">
          {TABS.map((t) => {
            const active = pathname === t.href || pathname.startsWith(t.href + "/");
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[10.5px] font-semibold transition-colors duration-150 ${
                  active ? "text-vermilion" : "text-ink-3"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
