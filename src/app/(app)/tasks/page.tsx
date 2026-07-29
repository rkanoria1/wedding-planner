"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Columns3, LayoutList, ListChecks, Plus, Rows3, CalendarDays, Trash2, X,
} from "lucide-react";
import { toast } from "sonner";
import { useWedding } from "@/lib/data-context";
import type { TaskPriority, TaskStatus } from "@/lib/types";
import { PRIORITY_META, STATUS_META, STATUS_ORDER, isOpen, taskUrgency } from "@/lib/wedding";
import { TaskSheet } from "@/components/tasks/task-sheet";
import { KanbanBoard } from "@/components/tasks/kanban";
import { TaskCalendar, TaskList, TaskTable } from "@/components/tasks/task-views";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function TasksPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { db, isAdmin, me, tasks, events, profiles, taskAssignees, refresh, logActivity } =
    useWedding();

  const [openTask, setOpenTask] = useState<string | null>(null);
  const [view, setView] = useState("kanban");
  const [q, setQ] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("open");
  const [selected, setSelected] = useState<string[]>([]);

  // deep links: /tasks?task=<id> and /tasks?new=1
  useEffect(() => {
    const t = params.get("task");
    if (t) setOpenTask(t);
    if (params.get("new")) setOpenTask("new");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  function closeSheet() {
    setOpenTask(null);
    if (params.get("task") || params.get("new")) router.replace("/tasks");
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return tasks.filter((t) => {
      if (needle && !t.name.toLowerCase().includes(needle) && !t.category.toLowerCase().includes(needle))
        return false;
      if (eventFilter === "general" && t.event_id !== null) return false;
      if (eventFilter !== "all" && eventFilter !== "general" && t.event_id !== eventFilter)
        return false;
      if (
        assigneeFilter !== "all" &&
        !taskAssignees.some((a) => a.task_id === t.id && a.profile_id === assigneeFilter)
      )
        return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (statusFilter === "open" && !isOpen(t)) return false;
      if (statusFilter === "overdue" && taskUrgency(t) !== "overdue") return false;
      if (
        statusFilter !== "all" && statusFilter !== "open" && statusFilter !== "overdue" &&
        t.status !== statusFilter
      )
        return false;
      return true;
    });
  }, [tasks, q, eventFilter, assigneeFilter, priorityFilter, statusFilter, taskAssignees]);

  async function bulkUpdate(field: "status" | "priority", value: TaskStatus | TaskPriority) {
    const { error } = await db.from("tasks").update({ [field]: value }).in("id", selected);
    if (error) return toast.error(error.message);
    await logActivity("bulk-updated", "task", `${selected.length} tasks → ${value}`);
    refresh("tasks");
    setSelected([]);
    toast.success(`${selected.length} tasks updated`);
  }

  async function bulkDelete() {
    const { error } = await db.from("tasks").delete().in("id", selected);
    if (error) return toast.error(error.message);
    await logActivity("bulk-deleted", "task", `${selected.length} tasks`);
    refresh("tasks");
    setSelected([]);
    toast.success("Tasks deleted");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            {tasks.filter(isOpen).length} open · {tasks.filter((t) => t.status === "completed").length} done
            {me && !isAdmin && " — you can edit tasks assigned to you"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={setView}>
            <TabsList>
              <TabsTrigger value="kanban" aria-label="Kanban"><Columns3 className="size-4" /></TabsTrigger>
              <TabsTrigger value="table" aria-label="Table"><Rows3 className="size-4" /></TabsTrigger>
              <TabsTrigger value="list" aria-label="List"><LayoutList className="size-4" /></TabsTrigger>
              <TabsTrigger value="calendar" aria-label="Calendar"><CalendarDays className="size-4" /></TabsTrigger>
            </TabsList>
          </Tabs>
          {isAdmin && (
            <Button onClick={() => setOpenTask("new")}>
              <Plus className="size-4" /> New task
            </Button>
          )}
        </div>
      </div>

      {/* filters */}
      <div className="flex flex-wrap gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tasks…"
          className="h-9 w-full sm:w-56"
        />
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All events</SelectItem>
            <SelectItem value="general">General</SelectItem>
            {events.filter((e) => !e.archived).map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Anyone</SelectItem>
            {profiles.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any priority</SelectItem>
            {(Object.keys(PRIORITY_META) as TaskPriority[]).map((p) => (
              <SelectItem key={p} value={p}>{PRIORITY_META[p].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open tasks</SelectItem>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            {STATUS_ORDER.map((s) => (
              <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* bulk bar */}
      {isAdmin && selected.length > 0 && view === "table" && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gold bg-gold-soft/50 px-4 py-2.5">
          <span className="text-sm font-medium">{selected.length} selected</span>
          <Select onValueChange={(v) => bulkUpdate("status", v as TaskStatus)}>
            <SelectTrigger className="h-8 w-36"><SelectValue placeholder="Set status…" /></SelectTrigger>
            <SelectContent>
              {STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={(v) => bulkUpdate("priority", v as TaskPriority)}>
            <SelectTrigger className="h-8 w-36"><SelectValue placeholder="Set priority…" /></SelectTrigger>
            <SelectContent>
              {(Object.keys(PRIORITY_META) as TaskPriority[]).map((p) => (
                <SelectItem key={p} value={p}>{PRIORITY_META[p].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button variant="outline" size="sm" className="text-destructive" />}
            >
              <Trash2 className="size-4" /> Delete
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {selected.length} tasks?</AlertDialogTitle>
                <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={bulkDelete} className="bg-destructive text-white hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
            <X className="size-4" /> Clear
          </Button>
        </div>
      )}

      {/* views */}
      {view === "kanban" && <KanbanBoard tasks={filtered} onOpen={setOpenTask} />}
      {view === "table" && (
        <TaskTable tasks={filtered} onOpen={setOpenTask} selected={selected} setSelected={setSelected} />
      )}
      {view === "list" && <TaskList tasks={filtered} onOpen={setOpenTask} />}
      {view === "calendar" && <TaskCalendar tasks={filtered} onOpen={setOpenTask} />}

      <TaskSheet taskId={openTask} onClose={closeSheet} />
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><ListChecks className="size-6 animate-pulse text-muted-foreground" /></div>}>
      <TasksPageInner />
    </Suspense>
  );
}
