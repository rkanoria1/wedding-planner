"use client";

import { format, isToday, isYesterday, parseISO } from "date-fns";
import { History } from "lucide-react";
import { useWedding } from "@/lib/data-context";
import { useLang } from "@/lib/i18n";
import { MemberAvatar } from "@/components/shared/member-avatars";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";

export default function ActivityPage() {
  const { t: tr } = useLang();
  const { activity, profiles } = useWedding();

  function dayLabel(date: string) {
    const d = parseISO(date);
    if (isToday(d)) return tr("misc.today", "Today");
    if (isYesterday(d)) return tr("misc.yesterday", "Yesterday");
    return format(d, "EEEE, d MMMM yyyy");
  }

  const grouped = activity.reduce<Record<string, typeof activity>>((acc, a) => {
    const key = a.created_at.slice(0, 10);
    (acc[key] ??= []).push(a);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">{tr("activity.title", "Activity Log")}</h1>
        <p className="text-sm text-muted-foreground">
          {tr("page.activity.sub", "Everything everyone has done, newest first.")}
        </p>
      </div>

      {activity.length === 0 ? (
        <EmptyState
          icon={History}
          title={tr("activity.empty.title", "No activity yet")}
          hint={tr("activity.empty.hint", "Actions across the planner will appear here.")}
        />
      ) : (
        Object.entries(grouped).map(([day, entries]) => (
          <section key={day}>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
              {dayLabel(entries[0].created_at)}
            </h2>
            <div className="card-lux divide-y">
              {entries.map((a) => {
                const actor = profiles.find((p) => p.id === a.actor_id);
                return (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                    {actor && <MemberAvatar profile={actor} size="size-8" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium">
                          {actor?.full_name ?? tr("misc.someone", "Someone")}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {tr("activity.action." + a.action, a.action)}
                        </span>{" "}
                        {a.detail}
                      </p>
                    </div>
                    <Badge variant="outline" className="hidden sm:inline-flex">
                      {tr("activity.entity." + a.entity, a.entity.replace("_", " "))}
                    </Badge>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {format(parseISO(a.created_at), "h:mm a")}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
