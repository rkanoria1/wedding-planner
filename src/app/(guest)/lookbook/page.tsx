"use client";

import { useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import { useWedding } from "@/lib/data-context";
import { useLang } from "@/lib/i18n";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

export default function GuestLookbookPage() {
  const { t: tr } = useLang();
  const { events, lookbooks, lookbookPhotos } = useWedding();
  const active = useMemo(
    () => events.filter((e) => !e.archived).sort((a, b) => a.sort_order - b.sort_order),
    [events]
  );
  const [eventId, setEventId] = useState(active[0]?.id ?? "");
  const selected = eventId || active[0]?.id;
  const book = lookbooks.find((l) => l.event_id === selected && l.published);
  const photos = lookbookPhotos
    .filter((p) => p.lookbook_id === book?.id)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          {tr("guest.lookbook.eyebrow", "Style story")}
        </p>
        <h1 className="font-display text-3xl">{tr("guest.lookbook", "Lookbook")}</h1>
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

      {!book ? (
        <EmptyState
          icon={BookOpen}
          title={tr("guest.lookbook.empty.title", "Lookbook coming soon")}
          hint={tr("guest.lookbook.empty.hint", "Outfits and jewelry notes will appear here.")}
        />
      ) : (
        <div className="space-y-5">
          {book.cover_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.cover_url}
              alt={tr("lookbook.alt.cover", "Lookbook cover")}
              className="aspect-[4/5] w-full rounded-3xl object-cover shadow-lg"
            />
          )}
          {book.colors?.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {book.colors.map((c) => (
                <div key={c.hex + c.label} className="flex items-center gap-2 text-sm">
                  <span
                    className="size-8 rounded-full border shadow-inner"
                    style={{ background: c.hex }}
                  />
                  {c.label}
                </div>
              ))}
            </div>
          )}
          {book.outfit_notes && (
            <section className="rounded-2xl border bg-card/80 p-5">
              <h2 className="font-display text-xl">
                {tr("guest.lookbook.outfit", "Outfit")}
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
                {book.outfit_notes}
              </p>
            </section>
          )}
          {book.jewelry_notes && (
            <section className="rounded-2xl border bg-card/80 p-5">
              <h2 className="font-display text-xl">
                {tr("guest.lookbook.jewelry", "Jewelry")}
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
                {book.jewelry_notes}
              </p>
            </section>
          )}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {photos.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={p.id}
                  src={p.url}
                  alt={p.caption ?? tr("lookbook.alt.ref", "Reference")}
                  className="aspect-square rounded-2xl object-cover"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
