"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ImagePlus, Images, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useWedding } from "@/lib/data-context";
import type { Photo } from "@/lib/types";
import { EVENT_THEMES, formatDate } from "@/lib/wedding";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function GalleryPage() {
  const { db, me, isAdmin, photos, events, refresh, logActivity } = useWedding();
  const fileRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<string>("all");
  const [uploadEvent, setUploadEvent] = useState<string>("all");
  const [busy, setBusy] = useState(false);
  const [lightbox, setLightbox] = useState<Photo | null>(null);

  const activeEvents = useMemo(() => events.filter((e) => !e.archived), [events]);
  const shown = useMemo(
    () => (filter === "all" ? photos : photos.filter((p) => p.event_id === filter)),
    [photos, filter]
  );

  async function upload(files: FileList) {
    setBusy(true);
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const path = `gallery/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
      const { error: upErr } = await db.storage.from("wedding-files").upload(path, file);
      if (upErr) { toast.error(upErr.message); continue; }
      const { data } = db.storage.from("wedding-files").getPublicUrl(path);
      await db.from("photos").insert({
        url: data.publicUrl,
        event_id: uploadEvent === "all" ? null : uploadEvent,
        caption: file.name.replace(/\.[^.]+$/, ""),
        uploaded_by: me?.id ?? null,
      });
    }
    await logActivity("added", "photo", "to the gallery");
    refresh("photos");
    setBusy(false);
    toast.success("Photos added ✨");
  }

  async function remove(p: Photo) {
    await db.from("photos").delete().eq("id", p.id);
    refresh("photos");
    setLightbox(null);
    toast.success("Photo removed");
  }

  const canDelete = (p: Photo) => isAdmin || p.uploaded_by === me?.id;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* header */}
      <div className="card-lux relative overflow-hidden p-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(480px 180px at 88% -30%, color-mix(in oklch, var(--gold) 18%, transparent), transparent 70%)",
          }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
              <Images className="size-4 text-gold" /> Moments
            </div>
            <h1 className="mt-1 font-display text-3xl">Inspiration &amp; memories</h1>
            <p className="mt-1 max-w-lg text-sm text-muted-foreground">
              Outfit, decor and jewellery ideas before the day — and everyone&apos;s
              photos after. Shared by both families.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={uploadEvent}
              onChange={(e) => setUploadEvent(e.target.value)}
              className="h-9 rounded-lg border bg-card px-2 text-sm"
              aria-label="Add photos to function"
            >
              <option value="all">General</option>
              {activeEvents.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
            <input
              ref={fileRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => { if (e.target.files?.length) upload(e.target.files); e.target.value = ""; }}
            />
            <Button onClick={() => fileRef.current?.click()} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
              Add photos
            </Button>
          </div>
        </div>
      </div>

      {/* function filter */}
      <div className="flex flex-wrap gap-2">
        <FilterChip label="All" active={filter === "all"} onClick={() => setFilter("all")} />
        {activeEvents.map((e) => (
          <FilterChip
            key={e.id}
            label={e.name}
            color={EVENT_THEMES[e.theme]?.chip}
            active={filter === e.id}
            onClick={() => setFilter(e.id)}
          />
        ))}
      </div>

      {/* grid */}
      {shown.length === 0 ? (
        <EmptyState
          icon={Images}
          title="No photos yet"
          hint="Add outfit, decor or jewellery inspiration to get started."
          action={<Button onClick={() => fileRef.current?.click()}><ImagePlus className="size-4" /> Add photos</Button>}
        />
      ) : (
        <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
          {shown.map((p, i) => {
            const ev = events.find((e) => e.id === p.event_id);
            return (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.3) }}
                onClick={() => setLightbox(p)}
                className="group relative block w-full overflow-hidden rounded-xl border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.caption ?? "Wedding photo"} className="w-full transition-transform duration-500 group-hover:scale-105" />
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                {ev && (
                  <span
                    className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                    style={{ background: EVENT_THEMES[ev.theme]?.chip ?? "#7b1e3b" }}
                  >
                    {ev.name}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* lightbox */}
      <Dialog open={Boolean(lightbox)} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-3xl overflow-hidden p-0">
          {lightbox && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lightbox.url} alt={lightbox.caption ?? ""} className="max-h-[80dvh] w-full object-contain bg-black" />
              <div className="flex items-center justify-between gap-2 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{lightbox.caption}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(lightbox.created_at, "d MMM yyyy")}
                  </p>
                </div>
                {canDelete(lightbox) && (
                  <Button variant="outline" size="sm" className="text-destructive" onClick={() => remove(lightbox)}>
                    <Trash2 className="size-4" /> Remove
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterChip({
  label, active, onClick, color,
}: {
  label: string; active: boolean; onClick: () => void; color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
        active ? "border-primary/40 bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
      )}
    >
      {color && <span className="size-2 rounded-full" style={{ background: color }} />}
      {label}
    </button>
  );
}

