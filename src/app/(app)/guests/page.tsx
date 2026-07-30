"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Mail, MailCheck, MessageCircle, Pencil, Plus, Trash2, Users,
} from "lucide-react";
import { toast } from "sonner";
import { useWedding } from "@/lib/data-context";
import type { Guest, GuestGroup, GuestSide, RsvpStatus } from "@/lib/types";
import { EVENT_THEMES, whatsappLink } from "@/lib/wedding";
import { ShareWhatsApp, PrintButton } from "@/components/shared/share-print";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const RSVP_META: Record<RsvpStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-muted text-muted-foreground border-border" },
  confirmed: { label: "Confirmed", className: "bg-primary/10 text-primary dark:text-primary border-primary/30" },
  declined: { label: "Declined", className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30" },
  maybe: { label: "Maybe", className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/30" },
};

const SIDE_LABEL: Record<GuestSide, string> = { bride: "Bride's side", groom: "Groom's side", both: "Both sides" };
const GROUP_LABEL: Record<GuestGroup, string> = { family: "Family", friends: "Friends", vip: "VIP" };

const FOOD_OPTIONS = ["Veg", "Non-veg", "Jain", "No onion-garlic", "Halal"];

function GuestsPageInner() {
  const params = useSearchParams();
  const { db, isAdmin, guests, events, refresh, logActivity } = useWedding();
  const activeEvents = useMemo(() => events.filter((e) => !e.archived), [events]);

  const [q, setQ] = useState("");
  const [side, setSide] = useState("all");
  const [grp, setGrp] = useState("all");
  const [rsvp, setRsvp] = useState("all");
  const [fn, setFn] = useState("all");

  const empty = {
    id: "", name: "", side: "groom" as GuestSide, grp: "family" as GuestGroup,
    rsvp: "pending" as RsvpStatus, invitation_sent: false, food_pref: "",
    phone: "", head_count: "1", invited_events: [] as string[], notes: "",
  };
  const [dialogOpen, setDialogOpen] = useState(Boolean(params.get("new")));
  const [form, setForm] = useState(empty);
  const editing = Boolean(form.id);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return guests.filter((g) => {
      if (needle && !g.name.toLowerCase().includes(needle)) return false;
      if (side !== "all" && g.side !== side) return false;
      if (grp !== "all" && g.grp !== grp) return false;
      if (rsvp !== "all" && g.rsvp !== rsvp) return false;
      if (fn !== "all" && !(g.invited_events ?? []).includes(fn)) return false;
      return true;
    });
  }, [guests, q, side, grp, rsvp, fn]);

  // heads invited & confirmed per function — feeds catering numbers
  const perFunction = useMemo(
    () =>
      activeEvents.map((e) => {
        const invited = guests.filter((g) => (g.invited_events ?? []).includes(e.id));
        return {
          event: e,
          invitedHeads: invited.reduce((s, g) => s + g.head_count, 0),
          confirmedHeads: invited
            .filter((g) => g.rsvp === "confirmed")
            .reduce((s, g) => s + g.head_count, 0),
        };
      }),
    [activeEvents, guests]
  );

  const totals = useMemo(() => {
    const confirmed = guests.filter((g) => g.rsvp === "confirmed");
    return {
      invitesSent: guests.filter((g) => g.invitation_sent).length,
      confirmedHeads: confirmed.reduce((s, g) => s + g.head_count, 0),
      totalHeads: guests.reduce((s, g) => s + g.head_count, 0),
      vip: guests.filter((g) => g.grp === "vip").length,
    };
  }, [guests]);

  function openAdd() {
    // new guests default to every function invited
    setForm({ ...empty, invited_events: activeEvents.map((e) => e.id) });
    setDialogOpen(true);
  }

  function openEdit(g: Guest) {
    setForm({
      id: g.id, name: g.name, side: g.side, grp: g.grp, rsvp: g.rsvp,
      invitation_sent: g.invitation_sent, food_pref: g.food_pref ?? "",
      phone: g.phone ?? "", head_count: String(g.head_count),
      invited_events: g.invited_events ?? [], notes: g.notes ?? "",
    });
    setDialogOpen(true);
  }

  function toggleInvited(id: string) {
    setForm((f) => ({
      ...f,
      invited_events: f.invited_events.includes(id)
        ? f.invited_events.filter((x) => x !== id)
        : [...f.invited_events, id],
    }));
  }

  async function save() {
    if (!form.name.trim()) return toast.error("Guest needs a name");
    const payload = {
      name: form.name.trim(), side: form.side, grp: form.grp, rsvp: form.rsvp,
      invitation_sent: form.invitation_sent,
      food_pref: form.food_pref.trim() || null,
      phone: form.phone.trim() || null,
      head_count: Number(form.head_count) || 1,
      invited_events: form.invited_events,
      notes: form.notes.trim() || null,
    };
    if (editing) {
      const { error } = await db.from("guests").update(payload).eq("id", form.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await db.from("guests").insert(payload);
      if (error) return toast.error(error.message);
      await logActivity("added", "guest", payload.name);
    }
    refresh("guests");
    setDialogOpen(false);
    setForm(empty);
    toast.success(editing ? "Guest updated" : "Guest added");
  }

  async function quickRsvp(g: Guest, value: RsvpStatus) {
    await db.from("guests").update({ rsvp: value }).eq("id", g.id);
    refresh("guests");
  }

  async function toggleInvite(g: Guest) {
    await db.from("guests").update({ invitation_sent: !g.invitation_sent }).eq("id", g.id);
    refresh("guests");
  }

  async function remove(g: Guest) {
    await db.from("guests").delete().eq("id", g.id);
    await logActivity("removed", "guest", g.name);
    refresh("guests");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Guests</h1>
          <p className="text-sm text-muted-foreground">
            The people who make it a celebration.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <Button onClick={openAdd}>
              <Plus className="size-4" /> Add guest
            </Button>
          )}
          <ShareWhatsApp
            label="Share headcount"
            text={
              `👰 Guest headcount\n\n` +
              `Total invited: ${totals.totalHeads} heads · Confirmed: ${totals.confirmedHeads}\n\n` +
              `Per function:\n` +
              perFunction
                .map((p) => `• ${p.event.name} — ${p.invitedHeads} invited (${p.confirmedHeads} confirmed)`)
                .join("\n")
            }
          />
          <PrintButton label="Print list" />
        </div>
      </div>

      {/* stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total invited heads", value: totals.totalHeads },
          { label: "Confirmed heads", value: totals.confirmedHeads },
          { label: "Invitations sent", value: `${totals.invitesSent}/${guests.length}` },
          { label: "VIP families", value: totals.vip },
        ].map((s) => (
          <Card key={s.label} className="card-lux shadow-none">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="font-display text-2xl">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* heads per function — catering numbers at a glance */}
      {perFunction.length > 0 && (
        <div className="card-lux p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Heads invited per function
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {perFunction.map(({ event, invitedHeads, confirmedHeads }) => (
              <div key={event.id} className="rounded-xl border p-3">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: EVENT_THEMES[event.theme]?.chip ?? "var(--primary)" }}
                  />
                  <p className="truncate text-sm font-medium">{event.name}</p>
                </div>
                <p className="mt-1 font-display text-2xl">{invitedHeads}</p>
                <p className="text-[11px] text-muted-foreground">
                  invited · <span className="text-primary">{confirmedHeads} confirmed</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* filters */}
      <div className="flex flex-wrap gap-2">
        <Input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search guests…" className="h-9 w-full sm:w-56"
        />
        <Select value={side} onValueChange={setSide}>
          <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Both sides</SelectItem>
            <SelectItem value="groom">Groom&apos;s side</SelectItem>
            <SelectItem value="bride">Bride&apos;s side</SelectItem>
          </SelectContent>
        </Select>
        <Select value={grp} onValueChange={setGrp}>
          <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All groups</SelectItem>
            <SelectItem value="family">Family</SelectItem>
            <SelectItem value="friends">Friends</SelectItem>
            <SelectItem value="vip">VIP</SelectItem>
          </SelectContent>
        </Select>
        <Select value={rsvp} onValueChange={setRsvp}>
          <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any RSVP</SelectItem>
            {(Object.keys(RSVP_META) as RsvpStatus[]).map((r) => (
              <SelectItem key={r} value={r}>{RSVP_META[r].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={fn} onValueChange={setFn}>
          <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any function</SelectItem>
            {activeEvents.map((e) => (
              <SelectItem key={e.id} value={e.id}>Invited: {e.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* table */}
      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No guests match" hint="Adjust filters or add your first guest." />
      ) : (
        <div className="card-lux overflow-x-auto scrollbar-thin">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Group</TableHead>
                <TableHead className="text-right">Heads</TableHead>
                <TableHead>RSVP</TableHead>
                <TableHead>Invitation</TableHead>
                <TableHead>Food</TableHead>
                <TableHead>Contact</TableHead>
                {isAdmin && <TableHead className="w-20" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((g) => (
                <TableRow key={g.id}>
                  <TableCell>
                    <p className="font-medium">{g.name}</p>
                    {(g.invited_events?.length ?? 0) > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {g.invited_events.map((id) => {
                          const ev = events.find((e) => e.id === id);
                          if (!ev) return null;
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] text-muted-foreground"
                            >
                              <span
                                className="size-1.5 rounded-full"
                                style={{ background: EVENT_THEMES[ev.theme]?.chip ?? "var(--primary)" }}
                              />
                              {ev.name}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    {g.notes && <p className="mt-1 max-w-44 truncate text-xs text-muted-foreground">{g.notes}</p>}
                  </TableCell>
                  <TableCell className="text-sm">{SIDE_LABEL[g.side]}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(g.grp === "vip" && "border-gold bg-gold-soft text-gold-foreground")}
                    >
                      {GROUP_LABEL[g.grp]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{g.head_count}</TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <Select value={g.rsvp} onValueChange={(v) => quickRsvp(g, v as RsvpStatus)}>
                        <SelectTrigger
                          size="sm"
                          className={cn("h-7 w-30 border text-xs", RSVP_META[g.rsvp].className)}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(RSVP_META) as RsvpStatus[]).map((r) => (
                            <SelectItem key={r} value={r}>{RSVP_META[r].label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className={RSVP_META[g.rsvp].className}>
                        {RSVP_META[g.rsvp].label}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => isAdmin && toggleInvite(g)}
                      className={cn(
                        "inline-flex items-center gap-1 text-xs",
                        g.invitation_sent ? "text-primary dark:text-primary" : "text-muted-foreground"
                      )}
                    >
                      {g.invitation_sent ? <MailCheck className="size-4" /> : <Mail className="size-4" />}
                      {g.invitation_sent ? "Sent" : "Not sent"}
                    </button>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{g.food_pref ?? "—"}</TableCell>
                  <TableCell>
                    {g.phone ? (
                      <a
                        href={whatsappLink(g.phone)}
                        target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline dark:text-primary"
                      >
                        <MessageCircle className="size-3.5" /> WhatsApp
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="size-7" aria-label="Edit" onClick={() => openEdit(g)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="size-7 text-destructive" aria-label="Delete" onClick={() => remove(g)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display font-normal">
              {editing ? "Edit guest" : "Add guest"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Name / family</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Side</Label>
              <Select value={form.side} onValueChange={(v) => setForm({ ...form, side: v as GuestSide })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="groom">Groom&apos;s side</SelectItem>
                  <SelectItem value="bride">Bride&apos;s side</SelectItem>
                  <SelectItem value="both">Both sides</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Group</Label>
              <Select value={form.grp} onValueChange={(v) => setForm({ ...form, grp: v as GuestGroup })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="friends">Friends</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>RSVP</Label>
              <Select value={form.rsvp} onValueChange={(v) => setForm({ ...form, rsvp: v as RsvpStatus })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(RSVP_META) as RsvpStatus[]).map((r) => (
                    <SelectItem key={r} value={r}>{RSVP_META[r].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Heads</Label>
              <Input type="number" min={1} value={form.head_count} onChange={(e) => setForm({ ...form, head_count: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Phone (WhatsApp)</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91…" />
            </div>
            <div className="space-y-2">
              <Label>Food preference</Label>
              <Select
                value={form.food_pref || "none"}
                onValueChange={(v) => setForm({ ...form, food_pref: v === "none" ? "" : v })}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Any / not set</SelectItem>
                  {FOOD_OPTIONS.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {activeEvents.length > 0 && (
              <div className="col-span-2 space-y-2">
                <Label>Invited to</Label>
                <div className="flex flex-wrap gap-2">
                  {activeEvents.map((e) => {
                    const on = form.invited_events.includes(e.id);
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => toggleInvited(e.id)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                          on
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-accent"
                        )}
                      >
                        <span
                          className="size-2 rounded-full"
                          style={{ background: EVENT_THEMES[e.theme]?.chip ?? "var(--primary)" }}
                        />
                        {e.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="col-span-2 flex items-center gap-2">
              <input
                id="inv" type="checkbox" checked={form.invitation_sent}
                onChange={(e) => setForm({ ...form, invitation_sent: e.target.checked })}
                className="size-4 accent-[var(--gold)]"
              />
              <Label htmlFor="inv">Invitation sent</Label>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <Button className="col-span-2" onClick={save}>
              {editing ? "Save changes" : "Add guest"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function GuestsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Users className="size-6 animate-pulse text-muted-foreground" /></div>}>
      <GuestsPageInner />
    </Suspense>
  );
}
