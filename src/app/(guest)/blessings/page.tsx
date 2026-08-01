"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { HeartHandshake, Send } from "lucide-react";
import { toast } from "sonner";
import { useWedding } from "@/lib/data-context";
import { useLang } from "@/lib/i18n";
import { getGuestDisplayName } from "@/lib/guest";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function GuestBlessingsPage() {
  const { t: tr } = useLang();
  const { db, me, blessings, refresh } = useWedding();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const visible = useMemo(
    () => blessings.filter((b) => !b.hidden),
    [blessings]
  );

  async function post() {
    const author = getGuestDisplayName();
    if (!author) return toast.error(tr("guest.blessings.toast.name", "Please set your name first"));
    if (!body.trim()) return toast.error(tr("guest.blessings.toast.empty", "Write a short blessing"));
    setBusy(true);
    const { error } = await db.from("blessings").insert({
      body: body.trim(),
      author_label: author,
      created_by: me?.id ?? null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setBody("");
    refresh("blessings");
    toast.success(tr("guest.blessings.toast.ok", "Blessing shared ✨"));
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          {tr("guest.blessings.eyebrow", "Guestbook")}
        </p>
        <h1 className="font-display text-3xl">
          {tr("guest.blessings.title", "Blessings Wall")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {tr("guest.blessings.sub", "Leave warm words for Rahul & Somya.")}
        </p>
      </div>

      <div className="rounded-2xl border bg-card/80 p-4 shadow-sm">
        <Textarea
          rows={3}
          placeholder={tr("guest.blessings.ph", "May your pheras be as endless as your laughter…")}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <Button className="mt-3 w-full sm:w-auto" disabled={busy} onClick={post}>
          <Send className="size-4" /> {tr("guest.blessings.share", "Share blessing")}
        </Button>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={HeartHandshake}
          title={tr("guest.blessings.empty.title", "Be the first")}
          hint={tr("guest.blessings.empty.hint", "Your words will appear here for everyone to read.")}
        />
      ) : (
        <div className="columns-1 gap-4 sm:columns-2">
          {visible.map((b) => (
            <article
              key={b.id}
              className="mb-4 break-inside-avoid rounded-2xl border bg-gradient-to-br from-card to-gold-soft/30 p-4 shadow-sm"
            >
              <p className="font-display text-lg leading-snug">&ldquo;{b.body}&rdquo;</p>
              <p className="mt-3 text-xs text-muted-foreground">
                — {b.author_label}
                <span className="mx-1.5">·</span>
                {formatDistanceToNow(parseISO(b.created_at), { addSuffix: true })}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
