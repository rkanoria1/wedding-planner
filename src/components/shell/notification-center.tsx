"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Bell, CheckCheck } from "lucide-react";
import { useWedding } from "@/lib/data-context";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function NotificationCenter() {
  const router = useRouter();
  const { t: tr } = useLang();
  const { db, notifications, refresh } = useWedding();
  const unread = notifications.filter((n) => !n.read);

  async function markAllRead() {
    if (unread.length === 0) return;
    await db.from("notifications").update({ read: true }).eq("read", false);
    refresh("notifications");
  }

  async function open(id: string, link: string | null) {
    await db.from("notifications").update({ read: true }).eq("id", id);
    refresh("notifications");
    if (link) router.push(link);
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={tr("notif.aria", "Notifications")}
            className="relative"
          />
        }
      >
        <Bell className="size-5" />
        {unread.length > 0 && (
          <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="font-display">{tr("notif.title", "Notifications")}</p>
          <Button variant="ghost" size="sm" onClick={markAllRead} disabled={unread.length === 0}>
            <CheckCheck className="size-4" /> {tr("notif.markAll", "Mark all read")}
          </Button>
        </div>
        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              {tr("notif.empty", "All quiet — you're up to date.")}
            </p>
          ) : (
            <ul className="divide-y">
              {notifications.slice(0, 30).map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => open(n.id, n.link)}
                    className={cn(
                      "w-full px-4 py-3 text-left transition-colors hover:bg-accent",
                      !n.read && "bg-gold-soft/40"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-gold" />}
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{n.title}</p>
                        {n.body && (
                          <p className="truncate text-xs text-muted-foreground">{n.body}</p>
                        )}
                        <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                          {formatDistanceToNow(parseISO(n.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
