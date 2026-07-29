"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck2, LayoutDashboard, ListChecks, Menu, ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck2 },
  { href: "/shopping", label: "Shopping", icon: ShoppingBag },
];

/**
 * Always-visible bottom navigation for phones — bigger, thumb-friendly targets
 * so nothing important is hidden behind a menu. "More" opens the full drawer.
 */
export function MobileTabBar({ onMore }: { onMore: () => void }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/90 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-md grid-cols-5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                  active && "bg-primary/12"
                )}
              >
                <Icon className="size-[22px]" />
              </span>
              {label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onMore}
          className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground transition-colors active:text-primary"
        >
          <span className="flex h-8 w-14 items-center justify-center rounded-full">
            <Menu className="size-[22px]" />
          </span>
          More
        </button>
      </div>
    </nav>
  );
}
