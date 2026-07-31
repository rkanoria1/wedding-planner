"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarCheck2, Gem, History, Images, LayoutDashboard, ListChecks,
  LogOut, Music2, PhoneCall, Plus, Settings, ShoppingBag, Store, Users,
} from "lucide-react";
import { useWedding } from "@/lib/data-context";
import { daysRemaining, taskListProgress } from "@/lib/wedding";
import { EventIcon } from "@/components/shared/event-icon";
import { GradientBar } from "@/components/shared/gradient-bar";
import { MemberAvatar } from "@/components/shared/member-avatars";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck2 },
  { href: "/shopping", label: "Shopping", icon: ShoppingBag },
  { href: "/guests", label: "Guests", icon: Users },
  { href: "/performances", label: "Sangeet", icon: Music2 },
  { href: "/gallery", label: "Moments", icon: Images },
  { href: "/vendors", label: "Vendors", icon: Store },
  { href: "/contacts", label: "Contacts", icon: PhoneCall },
  { href: "/activity", label: "Activity", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { db, me, isAdmin, events, tasks, settings, branding } = useWedding();

  const activeEvents = events.filter((e) => !e.archived);
  const progress = taskListProgress(tasks);
  const days = daysRemaining(settings.wedding_date);

  async function signOut() {
    await db.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* brand */}
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-3 px-5 py-5"
      >
        <div className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
          <Gem className="size-5" />
        </div>
        <div>
          <p className="font-display text-lg leading-tight">{branding.appTitle}</p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-sidebar-foreground/60">
            Planner
          </p>
        </div>
      </Link>

      {/* countdown chip */}
      <div className="mx-4 mb-3 rounded-xl bg-sidebar-accent px-4 py-3">
        <div className="flex items-baseline justify-between">
          <span className="font-display text-2xl text-sidebar-primary">{days}</span>
          <span className="text-xs text-sidebar-foreground/70">days to go</span>
        </div>
        <GradientBar value={progress} className="mt-2 h-1.5 bg-sidebar/60" />
        <p className="mt-1.5 text-[11px] text-sidebar-foreground/60">
          {progress}% of planning complete
        </p>
      </div>

      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-0.5 pb-2">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                pathname === href
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4.5" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-3 border-t border-sidebar-border pt-3 pb-4">
          <div className="mb-1 flex items-center justify-between px-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              Celebrations
            </p>
            {isAdmin && (
              <Link
                href="/settings?tab=events"
                onClick={onNavigate}
                aria-label="Add event"
                className="text-sidebar-foreground/50 hover:text-sidebar-primary"
              >
                <Plus className="size-4" />
              </Link>
            )}
          </div>
          {activeEvents.map((event) => {
            const href = `/events/${event.id}`;
            const active = pathname.startsWith(href);
            return (
              <Link
                key={event.id}
                href={href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )}
              >
                <EventIcon name={event.icon} className="size-4.5" />
                <span className="truncate">{event.name}</span>
              </Link>
            );
          })}
          {activeEvents.length === 0 && (
            <p className="px-3 py-2 text-xs text-sidebar-foreground/50">
              No events yet — add one in Settings.
            </p>
          )}
        </div>
      </ScrollArea>

      {/* user */}
      {me && (
        <div className="flex items-center gap-3 border-t border-sidebar-border px-4 py-4">
          <MemberAvatar profile={me} size="size-9" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{me.full_name}</p>
            <p className="text-[11px] capitalize text-sidebar-foreground/60">{me.role}</p>
          </div>
          <Button
            variant="ghost" size="icon" aria-label="Sign out"
            className="text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={signOut}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
