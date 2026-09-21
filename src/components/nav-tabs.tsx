"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "홈", emoji: "🏠" },
  { href: "/cart", label: "장바구니", emoji: "🛒" },
  { href: "/ledger", label: "내 장부", emoji: "📒" },
  { href: "/mypage", label: "내 토끼굴", emoji: "🐰" },
] as const;

export function NavTabs({ cartCount }: { cartCount: number }) {
  const pathname = usePathname();

  return (
    <nav className="border-b border-line bg-card/70">
      <ul className="mx-auto flex max-w-5xl gap-1 px-2">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);

          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? "border-carrot text-carrot-deep"
                    : "border-transparent text-ink-soft hover:text-ink"
                }`}
              >
                <span aria-hidden="true">{tab.emoji}</span>
                {tab.label}
                {tab.href === "/cart" && cartCount > 0 && (
                  <span className="ml-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-rose px-1 text-[11px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
