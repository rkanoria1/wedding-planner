"use client";

import { useWedding } from "@/lib/data-context";
import type { Task } from "@/lib/types";
import {
  EVENT_THEMES, PRIORITY_META, URGENCY_META, formatDate, taskUrgency,
} from "@/lib/wedding";
import { MemberAvatars } from "@/components/shared/member-avatars";
import { Badge } from "@/components/ui/badge";
import { GradientBar } from "@/components/shared/gradient-bar";

export function UrgencyBadge({ task }: { task: Task }) {
  const u = taskUrgency(task);
  if (u === "none") return null;
  const meta = URGENCY_META[u];
  return (
    <Badge variant="outline" className={meta.className}>
      <span className={`mr-1 size-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </Badge>
  );
}

export function TaskCard({ task, onOpen }: { task: Task; onOpen: (id: string) => void }) {
  const { events, profiles, taskAssignees, checklistItems } = useWedding();
  const event = events.find((e) => e.id === task.event_id);
  const assignees = profiles.filter((p) =>
    taskAssignees.some((a) => a.task_id === task.id && a.profile_id === p.id)
  );
  const items = checklistItems.filter((c) => c.task_id === task.id);

  return (
    <button
      onClick={() => onOpen(task.id)}
      className="card-lux w-full space-y-2.5 p-3.5 text-left"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{task.name}</p>
        <Badge variant="outline" className={`${PRIORITY_META[task.priority].className} shrink-0`}>
          {PRIORITY_META[task.priority].label}
        </Badge>
      </div>

      {(task.completion > 0 || items.length > 0) && (
        <div className="flex items-center gap-2">
          <GradientBar value={task.completion} className="h-1.5 flex-1" />
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {task.completion}%
          </span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {event && (
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: EVENT_THEMES[event.theme]?.chip ?? "#7b1e3b" }}
              title={event.name}
            />
          )}
          <span className="truncate text-[11px] text-muted-foreground">
            {event?.name ?? "General"} · {formatDate(task.due_date, "d MMM")}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <UrgencyBadge task={task} />
          {assignees.length > 0 && <MemberAvatars profiles={assignees} max={3} />}
        </div>
      </div>
    </button>
  );
}
