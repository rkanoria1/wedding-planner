"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronDown, ChevronUp, Clock, Music, Pencil, Plus, Trash2, Users2,
} from "lucide-react";
import { toast } from "sonner";
import { useWedding } from "@/lib/data-context";
import { useLang } from "@/lib/i18n";
import type { Performance, PerformanceStatus } from "@/lib/types";
import { formatDate } from "@/lib/wedding";
import { EmptyState } from "@/components/shared/empty-state";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const STATUS_META: Record<PerformanceStatus, { label: string; className: string }> = {
  planned: { label: "Planned", className: "bg-muted text-muted-foreground border-border" },
  rehearsing: { label: "Rehearsing", className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  ready: { label: "Ready", className: "bg-primary/10 text-primary border-primary/30" },
};

function PerformancesInner() {
  const { t: tr } = useLang();
  const params = useSearchParams();
  const { db, isAdmin, performances, events, refresh, logActivity } = useWedding();

  const sangeet = useMemo(
    () => events.find((e) => /sangeet/i.test(e.name)) ?? null,
    [events]
  );

  const ordered = useMemo(
    () => [...performances].sort((a, b) => a.sort_order - b.sort_order),
    [performances]
  );

  const stats = useMemo(() => {
    const next = ordered
      .filter((p) => p.rehearsal_date && new Date(p.rehearsal_date) >= new Date(new Date().toDateString()))
      .sort((a, b) => (a.rehearsal_date! < b.rehearsal_date! ? -1 : 1))[0];
    return {
      total: performances.length,
      ready: performances.filter((p) => p.status === "ready").length,
      nextRehearsal: next?.rehearsal_date ?? null,
    };
  }, [performances, ordered]);

  const empty = {
    id: "", title: "", song: "", performers: "",
    rehearsal_date: "", duration_min: "", status: "planned" as PerformanceStatus,
    event_id: sangeet?.id ?? "none", notes: "",
  };
  const [open, setOpen] = useState(Boolean(params.get("new")));
  const [form, setForm] = useState(empty);
  const editing = Boolean(form.id);

  function openAdd() { setForm({ ...empty, event_id: sangeet?.id ?? "none" }); setOpen(true); }
  function openEdit(p: Performance) {
    setForm({
      id: p.id, title: p.title, song: p.song ?? "", performers: p.performers ?? "",
      rehearsal_date: p.rehearsal_date ?? "", duration_min: p.duration_min ? String(p.duration_min) : "",
      status: p.status, event_id: p.event_id ?? "none", notes: p.notes ?? "",
    });
    setOpen(true);
  }

  async function save() {
    if (!form.title.trim()) return toast.error(tr("sangeet.toast.needName", "Give the performance a name"));
    const payload = {
      title: form.title.trim(),
      song: form.song.trim() || null,
      performers: form.performers.trim() || null,
      rehearsal_date: form.rehearsal_date || null,
      duration_min: Number(form.duration_min) || null,
      status: form.status,
      event_id: form.event_id === "none" ? null : form.event_id,
      notes: form.notes.trim() || null,
    };
    if (editing) {
      const { error } = await db.from("performances").update(payload).eq("id", form.id);
      if (error) return toast.error(error.message);
      await logActivity("updated", "performance", payload.title, form.id);
    } else {
      const { error } = await db
        .from("performances")
        .insert({ ...payload, sort_order: performances.length + 1 });
      if (error) return toast.error(error.message);
      await logActivity("added", "performance", payload.title);
    }
    refresh("performances");
    setOpen(false);
    toast.success(
      editing
        ? tr("sangeet.toast.updated", "Performance updated")
        : tr("sangeet.toast.added", "Performance added")
    );
  }

  async function remove(p: Performance) {
    await db.from("performances").delete().eq("id", p.id);
    await logActivity("removed", "performance", p.title);
    refresh("performances");
  }

  async function move(p: Performance, dir: -1 | 1) {
    const idx = ordered.findIndex((x) => x.id === p.id);
    const swap = ordered[idx + dir];
    if (!swap) return;
    await Promise.all([
      db.from("performances").update({ sort_order: swap.sort_order }).eq("id", p.id),
      db.from("performances").update({ sort_order: p.sort_order }).eq("id", swap.id),
    ]);
    refresh("performances");
  }

  async function cycleStatus(p: Performance) {
    const order: PerformanceStatus[] = ["planned", "rehearsing", "ready"];
    const next = order[(order.indexOf(p.status) + 1) % order.length];
    await db.from("performances").update({ status: next }).eq("id", p.id);
    refresh("performances");
  }

  const statusLabel = (s: PerformanceStatus) =>
    tr(`sangeet.status.${s}`, STATUS_META[s].label);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* header */}
      <div className="card-lux relative overflow-hidden p-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(480px 180px at 90% -30%, color-mix(in oklch, var(--gold) 18%, transparent), transparent 70%)",
          }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
              <Music className="size-4 text-gold" /> {tr("sangeet.eyebrow", "Sangeet Night")}
            </div>
            <h1 className="mt-1 font-display text-3xl">
              {tr("page.sangeet", "Performance lineup")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {tr(
                "sangeet.sub",
                "The running order for the night — who's performing, to which song, and when they rehearse."
              )}
            </p>
          </div>
          {isAdmin && (
            <Button onClick={openAdd}>
              <Plus className="size-4" /> {tr("sangeet.add", "Add performance")}
            </Button>
          )}
        </div>
      </div>

      {/* stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { key: "performances", label: tr("sangeet.stat.performances", "Performances"), value: stats.total },
          { key: "ready", label: tr("sangeet.stat.ready", "Ready"), value: stats.ready },
          {
            key: "next",
            label: tr("sangeet.stat.nextRehearsal", "Next rehearsal"),
            value: stats.nextRehearsal ? formatDate(stats.nextRehearsal, "d MMM") : "—",
          },
        ].map((s) => (
          <Card key={s.key} className="card-lux shadow-none">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="font-display text-2xl">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* lineup */}
      {ordered.length === 0 ? (
        <EmptyState
          icon={Music}
          title={tr("sangeet.empty.title", "No performances yet")}
          hint={tr("sangeet.empty.hint", "Add the first dance or act to start building the lineup.")}
          action={
            isAdmin ? (
              <Button onClick={openAdd}>
                <Plus className="size-4" /> {tr("sangeet.add", "Add performance")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {ordered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
            >
              <Card className="card-lux shadow-none">
                <CardContent className="flex items-center gap-4 py-4">
                  {/* lineup number + reorder */}
                  <div className="flex flex-col items-center gap-1">
                    {isAdmin && (
                      <button
                        onClick={() => move(p, -1)}
                        disabled={i === 0}
                        className="text-muted-foreground disabled:opacity-30 hover:text-primary"
                        aria-label={tr("sangeet.moveUp", "Move up")}
                      >
                        <ChevronUp className="size-4" />
                      </button>
                    )}
                    <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 font-display text-lg text-primary">
                      {i + 1}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => move(p, 1)}
                        disabled={i === ordered.length - 1}
                        className="text-muted-foreground disabled:opacity-30 hover:text-primary"
                        aria-label={tr("sangeet.moveDown", "Move down")}
                      >
                        <ChevronDown className="size-4" />
                      </button>
                    )}
                  </div>

                  {/* details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{p.title}</p>
                      <button
                        onClick={() => isAdmin && cycleStatus(p)}
                        className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", STATUS_META[p.status].className)}
                        title={isAdmin ? tr("sangeet.status.hint", "Click to change") : undefined}
                      >
                        {statusLabel(p.status)}
                      </button>
                    </div>
                    {p.song && <p className="text-sm text-muted-foreground">♪ {p.song}</p>}
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {p.performers && (
                        <span className="inline-flex items-center gap-1"><Users2 className="size-3.5" /> {p.performers}</span>
                      )}
                      {p.rehearsal_date && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3.5" />{" "}
                          {tr("sangeet.rehearse", "Rehearse {date}", {
                            date: formatDate(p.rehearsal_date, "EEE, d MMM"),
                          })}
                        </span>
                      )}
                      {p.duration_min ? (
                        <span>{tr("sangeet.min", "{n} min", { n: p.duration_min })}</span>
                      ) : null}
                    </div>
                    {p.notes && <p className="mt-1 text-xs text-muted-foreground">{p.notes}</p>}
                  </div>

                  {/* actions */}
                  {isAdmin && (
                    <div className="flex shrink-0 gap-1">
                      <Button size="icon" variant="ghost" className="size-8" aria-label={tr("action.edit", "Edit")} onClick={() => openEdit(p)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="size-8 text-destructive" aria-label={tr("action.delete", "Delete")} onClick={() => remove(p)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-normal">
              {editing
                ? tr("sangeet.dialog.edit", "Edit performance")
                : tr("sangeet.dialog.new", "New performance")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>{tr("sangeet.field.title", "Performance")}</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={tr("sangeet.ph.title", "e.g. Cousins group dance")}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>{tr("sangeet.field.song", "Song")}</Label>
              <Input
                value={form.song}
                onChange={(e) => setForm({ ...form, song: e.target.value })}
                placeholder={tr("sangeet.ph.song", "e.g. Gallan Goodiyaan")}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>{tr("sangeet.field.performers", "Performers")}</Label>
              <Input
                value={form.performers}
                onChange={(e) => setForm({ ...form, performers: e.target.value })}
                placeholder={tr("sangeet.ph.performers", "e.g. Aisha, Rohan, Meera")}
              />
            </div>
            <div className="space-y-2">
              <Label>{tr("sangeet.field.rehearsal", "Rehearsal date")}</Label>
              <Input type="date" value={form.rehearsal_date} onChange={(e) => setForm({ ...form, rehearsal_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{tr("sangeet.field.duration", "Duration (min)")}</Label>
              <Input type="number" min={0} value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{tr("sangeet.field.status", "Status")}</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as PerformanceStatus })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_META) as PerformanceStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{tr("sangeet.field.function", "Function")}</Label>
              <Select value={form.event_id} onValueChange={(v) => setForm({ ...form, event_id: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{tr("misc.general", "General")}</SelectItem>
                  {events.filter((e) => !e.archived).map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>{tr("sangeet.field.notes", "Notes")}</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <Button className="col-span-2" onClick={save}>
              {editing
                ? tr("sangeet.save", "Save performance")
                : tr("sangeet.add", "Add performance")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PerformancesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Music className="size-6 animate-pulse text-muted-foreground" /></div>}>
      <PerformancesInner />
    </Suspense>
  );
}
