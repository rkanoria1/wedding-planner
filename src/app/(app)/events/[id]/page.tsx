"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { motion } from "framer-motion";
import {
  CalendarDays, ListChecks, MapPin, Pencil, Plus, Sparkles,
} from "lucide-react";
import { useWedding } from "@/lib/data-context";
import {
  EVENT_THEMES, STATUS_META, fireConfetti, formatDate,
  isOpen, shoppingProgress, taskListProgress,
} from "@/lib/wedding";
import { EventIcon } from "@/components/shared/event-icon";
import { ProgressRing } from "@/components/shared/progress-ring";
import { GradientBar } from "@/components/shared/gradient-bar";
import { MemberAvatars } from "@/components/shared/member-avatars";
import { EmptyState } from "@/components/shared/empty-state";
import { EventDialog } from "@/components/events/event-dialog";
import {
  FilesSection, MembersSection, NotesSection,
} from "@/components/events/event-sections";
import { KanbanBoard } from "@/components/tasks/kanban";
import { TaskSheet } from "@/components/tasks/task-sheet";
import { ShoppingSection } from "@/components/shopping/shopping-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const {
    isAdmin, events, tasks, shoppingItems, profiles, eventMembers,
  } = useWedding();

  const event = events.find((e) => e.id === id);
  const [editOpen, setEditOpen] = useState(false);
  const [openTask, setOpenTask] = useState<string | null>(null);

  const evTasks = useMemo(() => tasks.filter((t) => t.event_id === id), [tasks, id]);
  const progress = taskListProgress(evTasks);

  // celebrate the moment every task lands
  const prevProgress = useRef(progress);
  useEffect(() => {
    if (prevProgress.current < 100 && progress === 100 && evTasks.length > 0) {
      fireConfetti(true);
    }
    prevProgress.current = progress;
  }, [progress, evTasks.length]);

  if (!event) {
    return (
      <div className="mx-auto max-w-4xl pt-16">
        <EmptyState
          icon={Sparkles}
          title="Event not found"
          hint="It may have been removed or archived."
        />
      </div>
    );
  }

  const theme = EVENT_THEMES[event.theme] ?? EVENT_THEMES.emerald;
  const members = profiles.filter((p) =>
    eventMembers.some((m) => m.event_id === event.id && m.profile_id === p.id)
  );
  const evShopping = shoppingItems.filter((s) => s.event_id === event.id);
  const daysToGo = event.event_date
    ? differenceInCalendarDays(parseISO(event.event_date), new Date())
    : null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`${theme.gradient} relative overflow-hidden rounded-3xl p-6 text-white sm:p-8`}
      >
        <EventIcon
          name={event.icon}
          className="pointer-events-none absolute -right-6 -top-6 size-40 opacity-15"
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-4xl drop-shadow-sm">{event.name}</h1>
              {event.archived && <Badge className="bg-white/20 text-white">Archived</Badge>}
              {isAdmin && (
                <Button
                  size="icon" variant="ghost" aria-label="Edit event"
                  className="text-white/80 hover:bg-white/15 hover:text-white"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="size-4" />
                </Button>
              )}
            </div>
            {event.description && (
              <p className="mt-1 max-w-xl text-sm text-white/85">{event.description}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/90">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4" />
                {formatDate(event.event_date, "EEEE, d MMM yyyy")}
                {daysToGo != null && daysToGo >= 0 && (
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
                    {daysToGo === 0 ? "Today! 🎉" : `${daysToGo} days`}
                  </span>
                )}
              </span>
              {event.venue && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" /> {event.venue}
                </span>
              )}
              {members.length > 0 && <MemberAvatars profiles={members} />}
            </div>
          </div>
          <div className="shrink-0 rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
            <ProgressRing
              value={progress}
              size={110}
              strokeWidth={9}
              label={
                <>
                  <span className="font-display text-2xl text-white">{progress}%</span>
                  <span className="text-[9px] uppercase tracking-wider text-white/80">complete</span>
                </>
              }
            />
          </div>
        </div>
      </motion.section>

      {/* tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="shopping">Shopping</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="card-lux shadow-none">
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Tasks completed</p>
                <p className="font-display text-2xl">
                  {evTasks.filter((t) => t.status === "completed").length}/{evTasks.length}
                </p>
                <GradientBar value={progress} className="mt-2" />
              </CardContent>
            </Card>
            <Card className="card-lux shadow-none">
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Shopping done</p>
                <p className="font-display text-2xl">
                  {evShopping.filter((i) => i.purchased).length}/{evShopping.length}
                </p>
                <GradientBar value={shoppingProgress(evShopping)} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* event checklist: open tasks by due date */}
          <Card className="card-lux shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 font-display text-lg font-normal">
                <ListChecks className="size-5 text-gold" /> Checklist — what&apos;s left
              </CardTitle>
              {isAdmin && (
                <Button size="sm" variant="outline" onClick={() => setOpenTask("new")}>
                  <Plus className="size-4" /> Add task
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {evTasks.filter(isOpen).length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {evTasks.length === 0
                    ? "No tasks yet — add the first one."
                    : "Everything's done. Time to celebrate! 🎉"}
                </p>
              ) : (
                <div className="divide-y">
                  {evTasks
                    .filter(isOpen)
                    .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"))
                    .map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setOpenTask(t.id)}
                        className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-accent"
                      >
                        <span className="size-2 rounded-full bg-muted-foreground/40" />
                        <span className="min-w-0 flex-1 truncate text-sm">{t.name}</span>
                        <Badge variant="outline" className={STATUS_META[t.status].className}>
                          {STATUS_META[t.status].label}
                        </Badge>
                        <span className="w-16 text-right text-xs text-muted-foreground">
                          {formatDate(t.due_date, "d MMM")}
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4 space-y-4">
          {isAdmin && (
            <div className="flex justify-end">
              <Button onClick={() => setOpenTask("new")}>
                <Plus className="size-4" /> New task for {event.name}
              </Button>
            </div>
          )}
          <KanbanBoard tasks={evTasks} onOpen={setOpenTask} />
        </TabsContent>

        <TabsContent value="shopping" className="mt-4">
          <ShoppingSection eventId={event.id} />
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <NotesSection eventId={event.id} />
        </TabsContent>

        <TabsContent value="files" className="mt-4">
          <FilesSection eventId={event.id} />
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <MembersSection eventId={event.id} />
        </TabsContent>
      </Tabs>

      <EventDialog open={editOpen} onOpenChange={setEditOpen} event={event} />
      <TaskSheet taskId={openTask} defaultEventId={event.id} onClose={() => setOpenTask(null)} />
    </div>
  );
}
