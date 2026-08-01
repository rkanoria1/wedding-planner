"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { useWedding } from "@/lib/data-context";
import { useLang } from "@/lib/i18n";
import { EmptyState } from "@/components/shared/empty-state";
import { ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GuestTimelinePage() {
  const { t: tr } = useLang();
  const { events, timelineItems } = useWedding();
  const active = useMemo(
    () => events.filter((e) => !e.archived).sort((a, b) => a.sort_order - b.sort_order),
    [events]
  );
  const [eventId, setEventId] = useState(active[0]?.id ?? "");
  const selected = eventId || active[0]?.id;
  const items = useMemo(
    () =>
      timelineItems
        .filter((t) => t.event_id === selected && t.published)
        .sort((a, b) => a.sort_order - b.sort_order || a.starts_at.localeCompare(b.starts_at)),
    [timelineItems, selected]
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          {tr("guest.timeline.eyebrow", "Run of show")}
        </p>
        <h1 className="font-display text-3xl">
          {tr("guest.timeline", "Ceremony Timeline")}
        </h1>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {active.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => setEventId(e.id)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm transition-colors",
              selected === e.id
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-accent"
            )}
          >
            {e.name}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title={tr("guest.timeline.empty.title", "Timeline coming soon")}
          hint={tr("guest.timeline.empty.hint", "The family is still polishing the run of show.")}
        />
      ) : (
        <div className="relative space-y-0 pl-2">
          <div className="absolute bottom-2 left-[19px] top-2 w-px bg-border" />
          {items.map((item, i) => {
            let timeLabel = "—";
            try {
              timeLabel = format(parseISO(item.starts_at), "h:mm a");
            } catch { /* ignore */ }
            return (
              <div key={item.id} className="relative flex gap-4 pb-8">
                <div className="relative z-10 mt-1 flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-gold bg-background text-[10px] font-semibold text-gold">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1 rounded-2xl border bg-card/80 p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wider text-gold">{timeLabel}</p>
                  <p className="mt-1 font-display text-xl">{item.title}</p>
                  {item.people && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {tr("guest.timeline.with", "With {people}", { people: item.people })}
                    </p>
                  )}
                  {item.note && (
                    <p className="mt-2 text-sm leading-relaxed text-foreground/80">{item.note}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
