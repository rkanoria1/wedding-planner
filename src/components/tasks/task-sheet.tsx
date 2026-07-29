"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Copy, Loader2, MessageCircle, Plus, Send, Trash2, X,
} from "lucide-react";
import { toast } from "sonner";
import { useWedding } from "@/lib/data-context";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";
import {
  PRIORITY_META, STATUS_META, STATUS_ORDER, fireConfetti, initials,
  whatsappLink,
} from "@/lib/wedding";
import { MemberAvatar } from "@/components/shared/member-avatars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const TASK_CATEGORIES = [
  "General", "Venue", "Ceremony", "Guests", "Food", "Clothes", "Jewelry",
  "Decorations", "Flowers", "Music", "Stage", "Lighting", "Photography",
  "Wedding Cards", "Return Gifts", "Mehendi", "Makeup", "Logistics",
  "Digital", "Legal", "Honeymoon",
];

interface TaskSheetProps {
  taskId: string | null; // null = closed, "new" = create
  defaultEventId?: string | null;
  onClose: () => void;
}

export function TaskSheet({ taskId, defaultEventId, onClose }: TaskSheetProps) {
  const {
    db, me, isAdmin, tasks, events, profiles, taskAssignees, checklistItems,
    comments, refresh, logActivity, notify,
  } = useWedding();

  const isNew = taskId === "new";
  const existing = useMemo(
    () => (taskId && !isNew ? tasks.find((t) => t.id === taskId) ?? null : null),
    [taskId, isNew, tasks]
  );

  const [form, setForm] = useState({
    name: "", description: "", category: "General",
    event_id: defaultEventId ?? "none",
    priority: "medium" as TaskPriority,
    status: "not_started" as TaskStatus,
    due_date: "", completion: 0,
  });
  const [assigned, setAssigned] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");
  const [newComment, setNewComment] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        description: existing.description ?? "",
        category: existing.category,
        event_id: existing.event_id ?? "none",
        priority: existing.priority,
        status: existing.status,
        due_date: existing.due_date ?? "",
        completion: existing.completion,
      });
      setAssigned(
        taskAssignees.filter((a) => a.task_id === existing.id).map((a) => a.profile_id)
      );
    } else if (isNew) {
      setForm({
        name: "", description: "", category: "General",
        event_id: defaultEventId ?? "none",
        priority: "medium", status: "not_started", due_date: "", completion: 0,
      });
      setAssigned([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, existing?.id]);

  const amAssignee = existing
    ? taskAssignees.some((a) => a.task_id === existing.id && a.profile_id === me?.id)
    : false;
  const canEdit = isAdmin || amAssignee || isNew;

  const items = existing
    ? checklistItems.filter((c) => c.task_id === existing.id)
    : [];
  const taskComments = existing
    ? comments.filter((c) => c.task_id === existing.id)
    : [];
  const assignedProfiles = profiles.filter((p) => assigned.includes(p.id));

  async function syncAssignees(id: string, before: string[]) {
    const toAdd = assigned.filter((a) => !before.includes(a));
    const toRemove = before.filter((a) => !assigned.includes(a));
    if (toAdd.length) {
      await db.from("task_assignees").insert(toAdd.map((profile_id) => ({ task_id: id, profile_id })));
    }
    if (toRemove.length) {
      await db.from("task_assignees").delete().eq("task_id", id).in("profile_id", toRemove);
    }
    if (toAdd.length || toRemove.length) refresh("task_assignees");
  }

  async function save() {
    if (!form.name.trim()) return toast.error("Give the task a name");
    setBusy(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category,
      event_id: form.event_id === "none" ? null : form.event_id,
      priority: form.priority,
      status: form.status,
      due_date: form.due_date || null,
      completion: form.status === "completed" ? 100 : form.completion,
    };

    if (isNew) {
      const { data, error } = await db
        .from("tasks")
        .insert({ ...payload, created_by: me?.id })
        .select("id")
        .single();
      if (error) {
        setBusy(false);
        return toast.error(error.message);
      }
      await syncAssignees(data.id, []);
      await logActivity("created", "task", payload.name, data.id);
      toast.success("Task created");
    } else if (existing) {
      const before = taskAssignees
        .filter((a) => a.task_id === existing.id)
        .map((a) => a.profile_id);
      const { error } = await db.from("tasks").update(payload).eq("id", existing.id);
      if (error) {
        setBusy(false);
        return toast.error(error.message);
      }
      if (isAdmin) await syncAssignees(existing.id, before);

      if (payload.status === "completed" && existing.status !== "completed") {
        await logActivity("completed", "task", payload.name, existing.id);
        // event fully done? celebrate loudly
        const evId = payload.event_id;
        const evTasks = tasks.filter((t) => t.event_id === evId && t.status !== "cancelled");
        const allDone =
          Boolean(evId) &&
          evTasks.length > 0 &&
          evTasks.every((t) => t.id === existing.id || t.status === "completed");
        fireConfetti(Boolean(allDone));
        if (allDone) {
          const ev = events.find((e) => e.id === evId);
          toast.success(`🎉 Every task for ${ev?.name ?? "this event"} is complete!`);
        }
      } else {
        await logActivity("updated", "task", payload.name, existing.id);
      }
      toast.success("Task updated");
    }

    await refresh("tasks");
    setBusy(false);
    onClose();
  }

  async function duplicate() {
    if (!existing) return;
    const { data, error } = await db
      .from("tasks")
      .insert({
        event_id: existing.event_id,
        name: `${existing.name} (copy)`,
        description: existing.description,
        category: existing.category,
        priority: existing.priority,
        status: "not_started",
        due_date: existing.due_date,
        created_by: me?.id,
      })
      .select("id")
      .single();
    if (error) return toast.error(error.message);
    const assigneeRows = taskAssignees
      .filter((a) => a.task_id === existing.id)
      .map((a) => ({ task_id: data.id, profile_id: a.profile_id }));
    if (assigneeRows.length) await db.from("task_assignees").insert(assigneeRows);
    await Promise.all([refresh("tasks"), refresh("task_assignees")]);
    await logActivity("duplicated", "task", existing.name, data.id);
    toast.success("Task duplicated");
    onClose();
  }

  async function remove() {
    if (!existing) return;
    const { error } = await db.from("tasks").delete().eq("id", existing.id);
    if (error) return toast.error(error.message);
    await logActivity("deleted", "task", existing.name);
    refresh("tasks");
    toast.success("Task deleted");
    onClose();
  }

  async function addChecklistItem() {
    if (!existing || !newItem.trim()) return;
    await db.from("task_checklist_items").insert({
      task_id: existing.id,
      label: newItem.trim(),
      sort_order: items.length,
    });
    setNewItem("");
    refresh("task_checklist_items");
  }

  async function toggleItem(id: string, done: boolean) {
    await db.from("task_checklist_items").update({ done }).eq("id", id);
    refresh("task_checklist_items");
  }

  async function removeItem(id: string) {
    await db.from("task_checklist_items").delete().eq("id", id);
    refresh("task_checklist_items");
  }

  async function addComment() {
    if (!existing || !newComment.trim() || !me) return;
    await db.from("task_comments").insert({
      task_id: existing.id,
      author_id: me.id,
      body: newComment.trim(),
    });
    // let other assignees know
    for (const a of taskAssignees.filter(
      (a) => a.task_id === existing.id && a.profile_id !== me.id
    )) {
      notify(a.profile_id, `New comment on “${existing.name}”`, newComment.trim(), `/tasks?task=${existing.id}`);
    }
    setNewComment("");
    refresh("task_comments");
  }

  const author = (id: string | null) => profiles.find((p) => p.id === id);

  return (
    <Sheet open={taskId !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="font-display text-xl font-normal">
            {isNew ? "New task" : existing?.name ?? "Task"}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-5 px-6 py-5">
          {/* form */}
          <div className="space-y-2">
            <Label>Task name</Label>
            <Input
              value={form.name}
              disabled={!canEdit}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Book the qazi"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              disabled={!canEdit}
              rows={2}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Event</Label>
              <Select
                value={form.event_id}
                onValueChange={(v) => setForm({ ...form, event_id: v })}
                disabled={!isAdmin && !isNew}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General (no event)</SelectItem>
                  {events.filter((e) => !e.archived).map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
                disabled={!canEdit}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm({ ...form, priority: v as TaskPriority })}
                disabled={!canEdit}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_META) as TaskPriority[]).map((p) => (
                    <SelectItem key={p} value={p}>{PRIORITY_META[p].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as TaskStatus })}
                disabled={!canEdit}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due date</Label>
              <Input
                type="date"
                value={form.due_date}
                disabled={!canEdit}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Completion — {form.completion}%</Label>
              <input
                type="range" min={0} max={100} step={5}
                value={form.completion}
                disabled={!canEdit}
                onChange={(e) => setForm({ ...form, completion: Number(e.target.value) })}
                className="w-full accent-[var(--gold)]"
              />
            </div>
          </div>

          {/* assignees */}
          <div className="space-y-2">
            <Label>Assigned to</Label>
            <div className="flex flex-wrap gap-2">
              {profiles.map((p) => {
                const on = assigned.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={!isAdmin && !isNew}
                    onClick={() =>
                      setAssigned(on ? assigned.filter((a) => a !== p.id) : [...assigned, p.id])
                    }
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors disabled:opacity-60 ${
                      on
                        ? "border-gold bg-gold-soft text-gold-foreground"
                        : "hover:bg-accent"
                    }`}
                  >
                    <span className="flex size-4 items-center justify-center rounded-full bg-muted text-[8px] font-bold">
                      {initials(p.full_name)}
                    </span>
                    {p.full_name.split(" ")[0]}
                  </button>
                );
              })}
            </div>
            {assignedProfiles.some((p) => p.phone) && (
              <div className="flex flex-wrap gap-2 pt-1">
                {assignedProfiles
                  .filter((p) => p.phone && p.id !== me?.id)
                  .map((p) => (
                    <a
                      key={p.id}
                      href={whatsappLink(
                        p.phone!,
                        `Hi ${p.full_name.split(" ")[0]}! About the wedding task “${form.name}” —`
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary hover:bg-primary/20 dark:text-primary"
                    >
                      <MessageCircle className="size-3.5" /> WhatsApp {p.full_name.split(" ")[0]}
                    </a>
                  ))}
              </div>
            )}
          </div>

          {/* checklist */}
          {!isNew && existing && (
            <>
              <Separator />
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>
                    Checklist{" "}
                    {items.length > 0 && (
                      <span className="text-muted-foreground">
                        ({items.filter((i) => i.done).length}/{items.length})
                      </span>
                    )}
                  </Label>
                </div>
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <div key={item.id} className="group flex items-center gap-2">
                      <Checkbox
                        checked={item.done}
                        disabled={!canEdit}
                        onCheckedChange={(v) => toggleItem(item.id, Boolean(v))}
                      />
                      <span
                        className={`flex-1 text-sm ${item.done ? "text-muted-foreground line-through" : ""}`}
                      >
                        {item.label}
                      </span>
                      {canEdit && (
                        <button
                          onClick={() => removeItem(item.id)}
                          className="opacity-0 transition-opacity group-hover:opacity-100"
                          aria-label="Remove item"
                        >
                          <X className="size-3.5 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  ))}
                  {canEdit && (
                    <div className="flex gap-2 pt-1">
                      <Input
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addChecklistItem()}
                        placeholder="Add checklist item…"
                        className="h-8 text-sm"
                      />
                      <Button size="sm" variant="outline" onClick={addChecklistItem}>
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* comments */}
              <Separator />
              <div>
                <Label>Comments</Label>
                <div className="mt-2 space-y-3">
                  {taskComments.map((c) => {
                    const a = author(c.author_id);
                    return (
                      <div key={c.id} className="flex gap-2.5">
                        {a && <MemberAvatar profile={a} />}
                        <div className="min-w-0 flex-1 rounded-xl bg-muted px-3 py-2">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="text-xs font-medium">{a?.full_name ?? "Someone"}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {format(parseISO(c.created_at), "d MMM, h:mm a")}
                            </p>
                          </div>
                          <p className="text-sm">{c.body}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex gap-2">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addComment()}
                      placeholder="Write a comment…"
                      className="h-9"
                    />
                    <Button size="sm" onClick={addComment} aria-label="Send comment">
                      <Send className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* footer */}
        <div className="sticky bottom-0 flex items-center gap-2 border-t bg-background px-6 py-4">
          {canEdit && (
            <Button onClick={save} disabled={busy} className="flex-1">
              {busy && <Loader2 className="size-4 animate-spin" />}
              {isNew ? "Create task" : "Save changes"}
            </Button>
          )}
          {!isNew && isAdmin && existing && (
            <>
              <Button variant="outline" size="icon" onClick={duplicate} aria-label="Duplicate">
                <Copy className="size-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button variant="outline" size="icon" aria-label="Delete"
                      className="text-destructive hover:text-destructive" />
                  }
                >
                  <Trash2 className="size-4" />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                    <AlertDialogDescription>
                      “{existing.name}” and its checklist and comments will be removed permanently.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={remove} className="bg-destructive text-white hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          {!canEdit && (
            <p className="flex-1 text-center text-xs text-muted-foreground">
              Only admins and assigned members can edit this task.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
