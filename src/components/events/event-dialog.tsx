"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useWedding } from "@/lib/data-context";
import type { EventTheme, WeddingEvent } from "@/lib/types";
import { EVENT_THEMES } from "@/lib/wedding";
import { EVENT_ICONS, EventIcon } from "@/components/shared/event-icon";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export function EventDialog({
  open,
  onOpenChange,
  event,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  event?: WeddingEvent | null;
}) {
  const router = useRouter();
  const { db, events, refresh, logActivity } = useWedding();
  const editing = Boolean(event);

  const [form, setForm] = useState({
    name: "", description: "", event_date: "", venue: "",
    theme: "emerald" as EventTheme, icon: "Sparkles", archived: false,
  });

  useEffect(() => {
    if (event) {
      setForm({
        name: event.name,
        description: event.description ?? "",
        event_date: event.event_date ?? "",
        venue: event.venue ?? "",
        theme: event.theme,
        icon: event.icon,
        archived: event.archived,
      });
    } else {
      setForm({
        name: "", description: "", event_date: "", venue: "",
        theme: "emerald", icon: "Sparkles", archived: false,
      });
    }
  }, [event, open]);

  async function save() {
    if (!form.name.trim()) return toast.error("Name the celebration");
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      event_date: form.event_date || null,
      venue: form.venue.trim() || null,
      theme: form.theme,
      icon: form.icon,
      archived: form.archived,
    };
    if (editing && event) {
      const { error } = await db.from("events").update(payload).eq("id", event.id);
      if (error) return toast.error(error.message);
      await logActivity(form.archived && !event.archived ? "archived" : "updated", "event", payload.name, event.id);
      toast.success("Event updated");
    } else {
      const { data, error } = await db
        .from("events")
        .insert({ ...payload, sort_order: events.length + 1 })
        .select("id")
        .single();
      if (error) return toast.error(error.message);
      await logActivity("created", "event", payload.name, data.id);
      toast.success(`${payload.name} added — plan away!`);
      onOpenChange(false);
      refresh("events");
      router.push(`/events/${data.id}`);
      return;
    }
    refresh("events");
    onOpenChange(false);
  }

  async function remove() {
    if (!event) return;
    const { error } = await db.from("events").delete().eq("id", event.id);
    if (error) return toast.error(error.message);
    await logActivity("deleted", "event", event.name);
    refresh("events");
    onOpenChange(false);
    router.push("/");
    toast.success("Event removed");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display font-normal">
            {editing ? `Edit ${event?.name}` : "New celebration"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Event name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Sangeet, Engagement…"
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date" value={form.event_date}
                onChange={(e) => setForm({ ...form, event_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Venue</Label>
              <Input
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={2} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Festive theme</Label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(EVENT_THEMES) as EventTheme[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, theme: t })}
                  className={cn(
                    "h-12 rounded-xl transition-all",
                    EVENT_THEMES[t].gradient,
                    form.theme === t
                      ? "ring-2 ring-gold ring-offset-2 ring-offset-background"
                      : "opacity-80 hover:opacity-100"
                  )}
                  title={EVENT_THEMES[t].label}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(EVENT_ICONS).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setForm({ ...form, icon: name })}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg border transition-colors",
                    form.icon === name
                      ? "border-gold bg-gold-soft text-gold-foreground"
                      : "hover:bg-accent"
                  )}
                >
                  <EventIcon name={name} className="size-4.5" />
                </button>
              ))}
            </div>
          </div>

          {editing && (
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Archive event</p>
                <p className="text-xs text-muted-foreground">
                  Hidden from navigation, data preserved.
                </p>
              </div>
              <Switch
                checked={form.archived}
                onCheckedChange={(v) => setForm({ ...form, archived: v })}
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button className="flex-1" onClick={save}>
              {editing ? "Save changes" : "Create event"}
            </Button>
            {editing && (
              <AlertDialog>
                <AlertDialogTrigger
                  render={<Button variant="outline" size="icon" className="text-destructive" aria-label="Delete event" />}
                >
                  <Trash2 className="size-4" />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {event?.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      All its tasks, shopping items, budgets and expenses will be deleted too.
                      Consider archiving instead.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={remove} className="bg-destructive text-white hover:bg-destructive/90">
                      Delete permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
