"use client";

import { useEffect, useMemo, useState } from "react";
import { EyeOff, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useWedding } from "@/lib/data-context";
import type { TimelineItem } from "@/lib/types";
import { storageKey, storagePathFromUrl } from "@/lib/storage";
import { compressImage } from "@/lib/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

function toLocalInput(iso: string) {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

export function TimelineEditor({ eventId }: { eventId: string }) {
  const { db, isAdmin, timelineItems, refresh } = useWedding();
  const items = useMemo(
    () =>
      timelineItems
        .filter((t) => t.event_id === eventId)
        .sort((a, b) => a.sort_order - b.sort_order || a.starts_at.localeCompare(b.starts_at)),
    [timelineItems, eventId]
  );

  const empty = {
    id: "", starts_at: "", title: "", note: "", people: "", published: true,
  };
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  function openEdit(item?: TimelineItem) {
    if (item) {
      setForm({
        id: item.id,
        starts_at: toLocalInput(item.starts_at),
        title: item.title,
        note: item.note ?? "",
        people: item.people ?? "",
        published: item.published,
      });
    } else {
      setForm(empty);
    }
    setOpen(true);
  }

  async function save() {
    if (!form.title.trim() || !form.starts_at) {
      return toast.error("Title and time are required");
    }
    const payload = {
      event_id: eventId,
      starts_at: new Date(form.starts_at).toISOString(),
      title: form.title.trim(),
      note: form.note.trim() || null,
      people: form.people.trim() || null,
      published: form.published,
      sort_order: form.id ? undefined : items.length + 1,
    };
    if (form.id) {
      const { sort_order: _, ...update } = payload;
      const { error } = await db.from("timeline_items").update(update).eq("id", form.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await db.from("timeline_items").insert(payload);
      if (error) return toast.error(error.message);
    }
    refresh("timeline_items");
    setOpen(false);
    toast.success(form.id ? "Updated" : "Added to timeline");
  }

  async function remove(id: string) {
    await db.from("timeline_items").delete().eq("id", id);
    refresh("timeline_items");
  }

  if (!isAdmin) {
    return <p className="text-sm text-muted-foreground">Only admins can edit the timeline.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => openEdit()}>
          <Plus className="size-4" /> Add moment
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No timeline items yet.</p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3 p-3">
              <div className="min-w-0 flex-1">
                <button type="button" className="text-left font-medium hover:underline" onClick={() => openEdit(item)}>
                  {item.title}
                </button>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.starts_at).toLocaleString()}
                  {!item.published && " · unpublished"}
                </p>
              </div>
              <Button size="icon" variant="ghost" className="size-8 text-destructive" onClick={() => remove(item.id)}>
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display font-normal">
              {form.id ? "Edit timeline item" : "Add timeline item"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>When</Label>
              <Input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>People (optional)</Label>
              <Input value={form.people} onChange={(e) => setForm({ ...form, people: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
              <Label>Published for guests</Label>
            </div>
            <Button className="w-full" onClick={save}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function LookbookEditor({ eventId }: { eventId: string }) {
  const { db, isAdmin, lookbooks, lookbookPhotos, refresh } = useWedding();
  const book = lookbooks.find((l) => l.event_id === eventId);
  const photos = lookbookPhotos.filter((p) => p.lookbook_id === book?.id);

  const [outfit, setOutfit] = useState(book?.outfit_notes ?? "");
  const [jewelry, setJewelry] = useState(book?.jewelry_notes ?? "");
  const [colorsText, setColorsText] = useState(
    (book?.colors ?? []).map((c) => `${c.label}:${c.hex}`).join(", ")
  );
  const [published, setPublished] = useState(book?.published ?? true);
  const [coverUrl, setCoverUrl] = useState(book?.cover_url ?? "");

  useEffect(() => {
    setOutfit(book?.outfit_notes ?? "");
    setJewelry(book?.jewelry_notes ?? "");
    setColorsText((book?.colors ?? []).map((c) => `${c.label}:${c.hex}`).join(", "));
    setPublished(book?.published ?? true);
    setCoverUrl(book?.cover_url ?? "");
  }, [book?.id, book?.updated_at, book?.outfit_notes, book?.jewelry_notes, book?.colors, book?.published, book?.cover_url]);

  function parseColors(raw: string) {
    return raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [label, hex] = part.split(":").map((s) => s.trim());
        return { label: label || hex || "Color", hex: hex || "#c4a484" };
      });
  }

  async function save() {
    const payload = {
      event_id: eventId,
      outfit_notes: outfit.trim() || null,
      jewelry_notes: jewelry.trim() || null,
      colors: parseColors(colorsText),
      published,
      cover_url: coverUrl.trim() || null,
      updated_at: new Date().toISOString(),
    };
    if (book) {
      const { error } = await db.from("lookbooks").update(payload).eq("id", book.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await db.from("lookbooks").insert(payload);
      if (error) return toast.error(error.message);
    }
    refresh("lookbooks");
    toast.success("Lookbook saved");
  }

  async function addPhoto(file: File) {
    let lookbookId = book?.id;
    if (!lookbookId) {
      const { data, error } = await db
        .from("lookbooks")
        .insert({ event_id: eventId, published: true, colors: [] })
        .select("id")
        .single();
      if (error || !data) return toast.error(error?.message ?? "Could not create lookbook");
      lookbookId = data.id;
      refresh("lookbooks");
    }
    const img = await compressImage(file);
    const path = storageKey(`lookbook/${lookbookId}`, img.name);
    const { error: upErr } = await db.storage
      .from("wedding-files")
      .upload(path, img, { contentType: img.type });
    if (upErr) return toast.error(upErr.message);
    const { data } = db.storage.from("wedding-files").getPublicUrl(path);
    await db.from("lookbook_photos").insert({
      lookbook_id: lookbookId,
      url: data.publicUrl,
      sort_order: photos.length + 1,
    });
    refresh("lookbook_photos");
    toast.success("Photo added");
  }

  async function removePhoto(id: string) {
    const { data } = await db.from("lookbook_photos").select("url").eq("id", id).single();
    const path = data?.url ? storagePathFromUrl(data.url) : null;
    if (path) await db.storage.from("wedding-files").remove([path]);
    await db.from("lookbook_photos").delete().eq("id", id);
    refresh("lookbook_photos");
  }

  if (!isAdmin) {
    return <p className="text-sm text-muted-foreground">Only admins can edit the lookbook.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Cover image URL</Label>
        <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://…" />
      </div>
      <div className="space-y-2">
        <Label>Outfit notes</Label>
        <Textarea rows={3} value={outfit} onChange={(e) => setOutfit(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Jewelry notes</Label>
        <Textarea rows={3} value={jewelry} onChange={(e) => setJewelry(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Colors (label:#hex, comma-separated)</Label>
        <Input
          value={colorsText}
          onChange={(e) => setColorsText(e.target.value)}
          placeholder="Marigold:#d4af37, Wine:#7b1e3b"
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={published} onCheckedChange={setPublished} />
        <Label>Published for guests</Label>
      </div>
      <Button onClick={save}>Save lookbook</Button>

      <div className="border-t pt-4">
        <div className="mb-2 flex items-center justify-between">
          <Label>Reference photos</Label>
          <label className="inline-flex cursor-pointer items-center gap-1 text-sm text-primary">
            <Plus className="size-4" /> Add
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) addPhoto(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <div key={p.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="aspect-square rounded-lg object-cover" />
              <Button
                size="icon"
                variant="secondary"
                className="absolute right-1 top-1 size-7"
                onClick={() => removePhoto(p.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BlessingsModeration() {
  const { db, isAdmin, blessings, refresh } = useWedding();
  if (!isAdmin) return null;

  async function hide(id: string, hidden: boolean) {
    await db.from("blessings").update({ hidden }).eq("id", id);
    refresh("blessings");
  }

  async function remove(id: string) {
    await db.from("blessings").delete().eq("id", id);
    refresh("blessings");
  }

  return (
    <div className="space-y-3">
      <h2 className="font-display text-xl">Guest blessings</h2>
      {blessings.length === 0 ? (
        <p className="text-sm text-muted-foreground">No blessings yet.</p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {blessings.map((b) => (
            <li key={b.id} className="flex gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm">{b.body}</p>
                <p className="text-xs text-muted-foreground">
                  {b.author_label}{b.hidden ? " · hidden" : ""}
                </p>
              </div>
              <Button size="icon" variant="ghost" className="size-8" onClick={() => hide(b.id, !b.hidden)} title="Hide/show">
                <EyeOff className="size-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="size-8 text-destructive" onClick={() => remove(b.id)}>
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
