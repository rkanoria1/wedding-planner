"use client";

/**
 * Shown instantly on every tab change while the next route streams in.
 * Without this the app looked frozen for a couple of seconds on navigation.
 * Kept deliberately light: a shimmering skeleton in the app's own shapes.
 */
import { useLang } from "@/lib/i18n";

export default function Loading() {
  const { t: tr } = useLang();
  return (
    <div className="mx-auto max-w-7xl space-y-5" aria-busy="true" aria-live="polite">
      <span className="sr-only">{tr("misc.loading", "Loading…")}</span>

      {/* page heading */}
      <div className="space-y-2">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded bg-muted/70" />
      </div>

      {/* stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="card-lux h-24 animate-pulse bg-muted/40"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>

      {/* content rows */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="card-lux flex items-center gap-4 p-4"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="size-11 shrink-0 animate-pulse rounded-xl bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-muted/70" />
            </div>
            <div className="h-6 w-16 animate-pulse rounded-full bg-muted/70" />
          </div>
        ))}
      </div>
    </div>
  );
}
