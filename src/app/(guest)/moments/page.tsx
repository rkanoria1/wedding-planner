"use client";

import { useMemo, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useWedding } from "@/lib/data-context";
import type { Photo } from "@/lib/types";
import { getGuestDisplayName } from "@/lib/guest";
import { storageKey } from "@/lib/storage";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function GuestMomentsPage() {
  const { db, me, photos, refresh } = useWedding();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [lightbox, setLightbox] = useState<Photo | null>(null);

  const visible = useMemo(
    () => photos.filter((p) => !p.hidden),
    [photos]
  );

  async function upload(files: FileList) {
    const author = getGuestDisplayName();
    if (!author) return toast.error("Please set your name first");
    setBusy(true);
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const path = storageKey("gallery/guest", file.name);
      const { error: upErr } = await db.storage
        .from("wedding-files")
        .upload(path, file, { contentType: file.type });
      if (upErr) { toast.error(upErr.message); continue; }
      const { data } = db.storage.from("wedding-files").getPublicUrl(path);
      const { error } = await db.from("photos").insert({
        url: data.publicUrl,
        caption: file.name.replace(/\.[^.]+$/, ""),
        uploaded_by: me?.id ?? null,
        source: "guest",
        author_label: author,
        hidden: false,
      });
      if (error) toast.error(error.message);
    }
    refresh("photos");
    setBusy(false);
    toast.success("Photos shared ✨");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Album</p>
          <h1 className="font-display text-3xl">Moments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Share photos from the celebrations.
          </p>
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) upload(e.target.files);
              e.target.value = "";
            }}
          />
          <Button onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            Add photos
          </Button>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="No moments yet"
          hint="Be the first to upload a photo."
        />
      ) : (
        <div className="columns-2 gap-3 sm:columns-3">
          {visible.map((p) => (
            <button
              key={p.id}
              type="button"
              className="mb-3 block w-full break-inside-avoid overflow-hidden rounded-2xl"
              onClick={() => setLightbox(p)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.caption ?? ""} className="w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <Dialog open={Boolean(lightbox)} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-3xl border-0 bg-transparent p-0 shadow-none">
          {lightbox && (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightbox.url}
                alt={lightbox.caption ?? ""}
                className="max-h-[80vh] w-full rounded-2xl object-contain"
              />
              <p className="mt-2 text-center text-sm text-white/90 drop-shadow">
                {lightbox.author_label || lightbox.caption || "Moment"}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
