"use client";

/** Instant fallback while a guest page streams in. */
import { useLang } from "@/lib/i18n";

export default function Loading() {
  const { t: tr } = useLang();
  return (
    <div className="mx-auto max-w-4xl space-y-5" aria-busy="true" aria-live="polite">
      <span className="sr-only">{tr("misc.loading", "Loading…")}</span>
      <div className="space-y-2">
        <div className="h-8 w-52 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted/70" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="card-lux h-28 animate-pulse bg-muted/40"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
