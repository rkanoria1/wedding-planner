"use client";

import {
  DragDropContext, Draggable, Droppable, type DropResult,
} from "@hello-pangea/dnd";
import { toast } from "sonner";
import { useWedding } from "@/lib/data-context";
import { useLang } from "@/lib/i18n";
import type { Task, TaskStatus } from "@/lib/types";
import { STATUS_META, STATUS_ORDER, fireConfetti } from "@/lib/wedding";
import { TaskCard } from "./task-card";
import { cn } from "@/lib/utils";

export function KanbanBoard({
  tasks,
  onOpen,
}: {
  tasks: Task[];
  onOpen: (id: string) => void;
}) {
  const { t: tr } = useLang();
  const { db, me, isAdmin, taskAssignees, refresh, logActivity } = useWedding();

  function canMove(task: Task) {
    return (
      isAdmin ||
      taskAssignees.some((a) => a.task_id === task.id && a.profile_id === me?.id)
    );
  }

  async function onDragEnd(result: DropResult) {
    const { draggableId, destination, source } = result;
    if (!destination || destination.droppableId === source.droppableId) return;
    const task = tasks.find((t) => t.id === draggableId);
    if (!task) return;
    if (!canMove(task)) {
      toast.error(tr("task.toast.moveDenied", "You can only move tasks assigned to you"));
      return;
    }
    const status = destination.droppableId as TaskStatus;
    const { error } = await db
      .from("tasks")
      .update({ status, ...(status === "completed" ? { completion: 100 } : {}) })
      .eq("id", task.id);
    if (error) return toast.error(error.message);
    if (status === "completed") fireConfetti();
    await logActivity(
      status === "completed" ? "completed" : "moved",
      "task",
      status === "completed" ? task.name : `${task.name} → ${tr("status." + status, STATUS_META[status].label)}`,
      task.id
    );
    refresh("tasks");
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {STATUS_ORDER.map((status) => {
          const column = tasks.filter((t) => t.status === status);
          return (
            <Droppable droppableId={status} key={status}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "flex w-72 shrink-0 flex-col rounded-2xl border bg-muted/40 p-3 transition-colors",
                    snapshot.isDraggingOver && "border-gold bg-gold-soft/30"
                  )}
                >
                  <div className="mb-3 flex items-center justify-between px-1">
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        STATUS_META[status].className
                      )}
                    >
                      {tr("status." + status, STATUS_META[status].label)}
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {column.length}
                    </span>
                  </div>
                  <div className="flex min-h-24 flex-col gap-2.5">
                    {column.map((task, index) => (
                      <Draggable draggableId={task.id} index={index} key={task.id}>
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className={cn(dragSnapshot.isDragging && "rotate-2 opacity-90")}
                          >
                            <TaskCard task={task} onOpen={onOpen} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
}
