"use client";

import { useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Download, FileText, MessageCircle, Pin, PinOff, Plus, StickyNote,
  Trash2, Upload, UserMinus, UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { useWedding } from "@/lib/data-context";
import { whatsappLink } from "@/lib/wedding";
import { storageKey } from "@/lib/storage";
import { MemberAvatar } from "@/components/shared/member-avatars";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/* ————— notes ————— */

export function NotesSection({ eventId }: { eventId?: string | null }) {
  const { db, me, isAdmin, notes, profiles, refresh } = useWedding();
  const [body, setBody] = useState("");

  const scoped = notes
    .filter((n) => (eventId === undefined ? true : n.event_id === eventId))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned));

  async function add() {
    if (!body.trim() || !me) return;
    await db.from("notes").insert({
      body: body.trim(),
      event_id: eventId ?? null,
      author_id: me.id,
    });
    setBody("");
    refresh("notes");
  }

  async function togglePin(id: string, pinned: boolean) {
    await db.from("notes").update({ pinned }).eq("id", id);
    refresh("notes");
  }

  async function remove(id: string) {
    await db.from("notes").delete().eq("id", id);
    refresh("notes");
  }

  const author = (id: string | null) => profiles.find((p) => p.id === id);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Textarea
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Jot a quick note for the family…"
        />
        <Button onClick={add} className="self-end">
          <Plus className="size-4" /> Add
        </Button>
      </div>
      {scoped.length === 0 ? (
        <EmptyState icon={StickyNote} title="No notes yet" hint="Ideas, reminders, vendor quirks — capture them here." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {scoped.map((n) => {
            const a = author(n.author_id);
            const mine = n.author_id === me?.id;
            return (
              <Card
                key={n.id}
                className={cn("card-lux shadow-none", n.pinned && "border-gold bg-gold-soft/30")}
              >
                <CardContent className="pt-5">
                  <p className="whitespace-pre-wrap text-sm">{n.body}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {a && <MemberAvatar profile={a} size="size-6" />}
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(n.created_at), "d MMM, h:mm a")}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {(mine || isAdmin) && (
                        <>
                          <Button
                            size="icon" variant="ghost" className="size-7"
                            aria-label={n.pinned ? "Unpin" : "Pin"}
                            onClick={() => togglePin(n.id, !n.pinned)}
                          >
                            {n.pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                          </Button>
                          <Button
                            size="icon" variant="ghost" className="size-7 text-destructive"
                            aria-label="Delete note"
                            onClick={() => remove(n.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ————— files ————— */

export function FilesSection({ eventId }: { eventId: string }) {
  const { db, me, isAdmin, files, profiles, refresh, logActivity } = useWedding();
  const inputRef = useRef<HTMLInputElement>(null);
  const scoped = files.filter((f) => f.event_id === eventId);

  async function upload(file: File) {
    if (!me) return;
    const path = storageKey(eventId, file.name);
    const { error } = await db.storage
      .from("wedding-files")
      .upload(path, file, { contentType: file.type });
    if (error) return toast.error(error.message);
    await db.from("event_files").insert({
      event_id: eventId, name: file.name, path, size: file.size, uploaded_by: me.id,
    });
    await logActivity("uploaded", "file", file.name);
    refresh("event_files");
    toast.success("File uploaded");
  }

  async function remove(id: string, path: string, name: string) {
    await db.storage.from("wedding-files").remove([path]);
    await db.from("event_files").delete().eq("id", id);
    await logActivity("deleted", "file", name);
    refresh("event_files");
  }

  function urlFor(path: string) {
    return db.storage.from("wedding-files").getPublicUrl(path).data.publicUrl;
  }

  const uploader = (id: string | null) =>
    profiles.find((p) => p.id === id)?.full_name ?? "Someone";

  return (
    <div className="space-y-4">
      <input
        ref={inputRef} type="file" className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      <Button variant="outline" onClick={() => inputRef.current?.click()}>
        <Upload className="size-4" /> Upload file
      </Button>
      {scoped.length === 0 ? (
        <EmptyState icon={FileText} title="No files yet" hint="Contracts, quotes, mood boards, seating charts…" />
      ) : (
        <div className="card-lux divide-y">
          {scoped.map((f) => (
            <div key={f.id} className="flex items-center gap-3 px-4 py-3">
              <FileText className="size-5 shrink-0 text-gold" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{f.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(f.size / 1024).toFixed(0)} KB · {uploader(f.uploaded_by)} ·{" "}
                  {format(parseISO(f.created_at), "d MMM yyyy")}
                </p>
              </div>
              <a
                href={urlFor(f.path)} target="_blank" rel="noreferrer"
                className="text-muted-foreground hover:text-foreground" aria-label="Download"
              >
                <Download className="size-4" />
              </a>
              {(isAdmin || f.uploaded_by === me?.id) && (
                <Button
                  size="icon" variant="ghost" className="size-7 text-destructive" aria-label="Delete"
                  onClick={() => remove(f.id, f.path, f.name)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ————— members ————— */

export function MembersSection({ eventId }: { eventId: string }) {
  const { db, isAdmin, profiles, eventMembers, refresh } = useWedding();
  const memberIds = eventMembers.filter((m) => m.event_id === eventId).map((m) => m.profile_id);

  async function toggle(profileId: string, add: boolean) {
    if (add) {
      await db.from("event_members").insert({ event_id: eventId, profile_id: profileId });
    } else {
      await db.from("event_members").delete().eq("event_id", eventId).eq("profile_id", profileId);
    }
    refresh("event_members");
  }

  return (
    <div className="card-lux divide-y">
      {profiles.map((p) => {
        const isMember = memberIds.includes(p.id);
        return (
          <div key={p.id} className={cn("flex items-center gap-3 px-4 py-3", !isMember && "opacity-60")}>
            <MemberAvatar profile={p} size="size-9" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{p.full_name}</p>
              <p className="text-xs capitalize text-muted-foreground">{p.role}</p>
            </div>
            {isMember && p.phone && (
              <a
                href={whatsappLink(p.phone)} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary hover:bg-primary/20 dark:text-primary"
              >
                <MessageCircle className="size-3.5" /> WhatsApp
              </a>
            )}
            {isAdmin && (
              <Button
                size="sm"
                variant={isMember ? "outline" : "default"}
                onClick={() => toggle(p.id, !isMember)}
              >
                {isMember ? (
                  <><UserMinus className="size-4" /> Remove</>
                ) : (
                  <><UserPlus className="size-4" /> Add</>
                )}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
