"use client";

import { useMemo, useState } from "react";
import {
  addDays, endOfMonth, endOfWeek, format, isSameDay, isSameMonth,
  parseISO, startOfMonth, startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, ListChecks } from "lucide-react";
import { useWedding } from "@/lib/data-context";
import type { Task } from "@/lib/types";
import {
  EVENT_THEMES, PRIORITY_META, STATUS_META, formatDate,
} from "@/lib/wedding";
import { MemberAvatars } from "@/components/shared/member-avatars";
import { EmptyState } from "@/components/shared/empty-state";
import { UrgencyBadge } from "./task-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { GradientBar } from "@/components/shared/gradient-bar";
import { cn } from "@/lib/utils";

/* ————— table view (with bulk selection) ————— */

export function TaskTable({
  tasks,
  onOpen,
  selected,
  setSelected,
}: {
  tasks: Task[];
  onOpen: (id: string) => void;
  selected: string[];
  setSelected: (ids: string[]) => void;
}) {
  const { events, profiles, taskAssignees, isAdmin } = useWedding();

  if (tasks.length === 0) {
    return <EmptyState icon={ListChecks} title="No tasks match" hint="Try changing the filters." />;
  }

  const allSelected = tasks.length > 0 && tasks.every((t) => selected.includes(t.id));

  return (
    <div className="card-lux overflow-x-auto scrollbar-thin">
      <Table>
        <TableHeader>
          <TableRow>
            {isAdmin && (
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(v) =>
                    setSelected(v ? tasks.map((t) => t.id) : [])
                  }
                />
              </TableHead>
            )}
            <TableHead>Task</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Urgency</TableHead>
            <TableHead>Due</TableHead>
            <TableHead>Assigned</TableHead>
            <TableHead className="w-28">Progress</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const event = events.find((e) => e.id === task.event_id);
            const assignees = profiles.filter((p) =>
              taskAssignees.some((a) => a.task_id === task.id && a.profile_id === p.id)
            );
            return (
              <TableRow
                key={task.id}
                className="cursor-pointer"
                onClick={() => onOpen(task.id)}
              >
                {isAdmin && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selected.includes(task.id)}
                      onCheckedChange={(v) =>
                        setSelected(
                          v
                            ? [...selected, task.id]
                            : selected.filter((id) => id !== task.id)
                        )
                      }
                    />
                  </TableCell>
                )}
                <TableCell className="max-w-56">
                  <p className="truncate font-medium">{task.name}</p>
                </TableCell>
                <TableCell>
                  {event ? (
                    <span className="flex items-center gap-1.5 text-sm">
                      <span
                        className="size-2 rounded-full"
                        style={{ background: EVENT_THEMES[event.theme]?.chip }}
                      />
                      {event.name}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">General</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{task.category}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={PRIORITY_META[task.priority].className}>
                    {PRIORITY_META[task.priority].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={STATUS_META[task.status].className}>
                    {STATUS_META[task.status].label}
                  </Badge>
                </TableCell>
                <TableCell><UrgencyBadge task={task} /></TableCell>
                <TableCell className="text-sm tabular-nums">
                  {formatDate(task.due_date, "d MMM yy")}
                </TableCell>
                <TableCell>
                  <MemberAvatars profiles={assignees} max={3} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <GradientBar value={task.completion} className="h-1.5 w-16" />
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {task.completion}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

/* ————— list view (grouped by event) ————— */

export function TaskList({
  tasks,
  onOpen,
}: {
  tasks: Task[];
  onOpen: (id: string) => void;
}) {
  const { events } = useWedding();
  const groups = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      const key = t.event_id ?? "general";
      map.set(key, [...(map.get(key) ?? []), t]);
    }
    return map;
  }, [tasks]);

  if (tasks.length === 0) {
    return <EmptyState icon={ListChecks} title="No tasks match" hint="Try changing the filters." />;
  }

  return (
    <div className="space-y-5">
      {[...groups.entries()].map(([key, group]) => {
        const event = events.find((e) => e.id === key);
        return (
          <section key={key}>
            <h3 className="mb-2 flex items-center gap-2 font-display text-lg">
              {event && (
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: EVENT_THEMES[event.theme]?.chip }}
                />
              )}
              {event?.name ?? "General"}
              <span className="text-sm text-muted-foreground">({group.length})</span>
            </h3>
            <div className="card-lux divide-y">
              {group.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onOpen(task.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent"
                >
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      task.status === "completed" ? "bg-primary" : "bg-muted-foreground/40"
                    )}
                  />
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-sm",
                      task.status === "completed" && "text-muted-foreground line-through"
                    )}
                  >
                    {task.name}
                  </span>
                  <UrgencyBadge task={task} />
                  <Badge variant="outline" className={STATUS_META[task.status].className}>
                    {STATUS_META[task.status].label}
                  </Badge>
                  <span className="hidden w-20 text-right text-xs tabular-nums text-muted-foreground sm:block">
                    {formatDate(task.due_date, "d MMM")}
                  </span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* ————— calendar view ————— */

export function TaskCalendar({
  tasks,
  onOpen,
}: {
  tasks: Task[];
  onOpen: (id: string) => void;
}) {
  const { events } = useWedding();
  const [month, setMonth] = useState(() => new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    const out: Date[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
    return out;
  }, [month]);

  const eventDays = events.filter((e) => e.event_date && !e.archived);

  return (
    <div className="card-lux p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-xl">{format(month, "MMMM yyyy")}</h3>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={() => setMonth(addDays(startOfMonth(month), -1))} aria-label="Previous month">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMonth(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setMonth(addDays(endOfMonth(month), 1))} aria-label="Next month">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border bg-border">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="bg-muted px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const dayTasks = tasks.filter(
            (t) => t.due_date && isSameDay(parseISO(t.due_date), day)
          );
          const dayEvents = eventDays.filter((e) => isSameDay(parseISO(e.event_date!), day));
          const today = isSameDay(day, new Date());
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-24 bg-card p-1.5",
                !isSameMonth(day, month) && "opacity-40"
              )}
            >
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-full text-xs",
                  today && "bg-gold font-bold text-white"
                )}
              >
                {format(day, "d")}
              </span>
              <div className="mt-0.5 space-y-0.5">
                {dayEvents.map((e) => (
                  <div
                    key={e.id}
                    className={`${EVENT_THEMES[e.theme]?.gradient ?? "bg-event-emerald"} truncate rounded px-1.5 py-0.5 text-[10px] font-medium text-white`}
                  >
                    🎉 {e.name}
                  </div>
                ))}
                {dayTasks.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onOpen(t.id)}
                    className={cn(
                      "block w-full truncate rounded px-1.5 py-0.5 text-left text-[10px] transition-colors",
                      t.status === "completed"
                        ? "bg-primary/15 text-primary line-through dark:text-primary"
                        : "bg-muted hover:bg-accent"
                    )}
                  >
                    {t.name}
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <p className="px-1.5 text-[10px] text-muted-foreground">
                    +{dayTasks.length - 3} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
