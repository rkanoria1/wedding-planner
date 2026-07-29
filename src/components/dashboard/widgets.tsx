"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { formatDistanceToNow, isToday, parseISO } from "date-fns";
import {
  ArrowRight, CalendarCheck2, CalendarClock, CheckCircle2, Flame, History,
  PiggyBank, Plus, ShoppingBag, StickyNote, Store, TriangleAlert, Users, Wallet,
} from "lucide-react";
import { useWedding } from "@/lib/data-context";
import type { Booking, Task } from "@/lib/types";
import {
  BOOKING_URGENCY_META, bookingStats, bookingUrgency, categoryMeta, isSecured,
} from "@/lib/bookings";
import { CategoryIcon } from "@/components/bookings/category-icon";
import {
  EVENT_THEMES, PRIORITY_META, URGENCY_META, bookingProgress, formatDate,
  formatMoney, isOpen, shoppingProgress, taskListProgress, taskUrgency,
} from "@/lib/wedding";
import { EventIcon } from "@/components/shared/event-icon";
import { GradientBar } from "@/components/shared/gradient-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/* —— framer helpers —— */
const rise = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

function WidgetCard({
  title, icon, action, children, delay = 0,
}: {
  title: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div {...rise} transition={{ duration: 0.5, delay, ease: "easeOut" }}>
      <Card className="card-lux h-full border shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2 font-display text-lg font-normal">
            {icon} {title}
          </CardTitle>
          {action}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const urgency = taskUrgency(task);
  const meta = URGENCY_META[urgency];
  return (
    <Link
      href={`/tasks?task=${task.id}`}
      className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent"
    >
      <span className={`size-2 shrink-0 rounded-full ${meta.dot}`} />
      <span className="min-w-0 flex-1 truncate text-sm">{task.name}</span>
      <Badge variant="outline" className={PRIORITY_META[task.priority].className}>
        {PRIORITY_META[task.priority].label}
      </Badge>
      <span className="hidden w-20 text-right text-xs text-muted-foreground sm:block">
        {formatDate(task.due_date, "d MMM")}
      </span>
    </Link>
  );
}

/* —— urgent + today + upcoming —— */

export function UrgentTasksWidget({ delay = 0 }: { delay?: number }) {
  const { tasks } = useWedding();
  const urgent = tasks
    .filter((t) => isOpen(t) && ["overdue", "critical", "urgent"].includes(taskUrgency(t)))
    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))
    .slice(0, 6);

  return (
    <WidgetCard
      title="Needs attention"
      icon={<Flame className="size-5 text-destructive" />}
      delay={delay}
      action={
        <Button variant="ghost" size="sm" render={<Link href="/tasks" />}>
          All tasks <ArrowRight className="size-3.5" />
        </Button>
      }
    >
      {urgent.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Nothing urgent — the calm before the celebration. 🌿
        </p>
      ) : (
        <div className="-mx-2 space-y-0.5">
          {urgent.map((t) => <TaskRow key={t.id} task={t} />)}
        </div>
      )}
    </WidgetCard>
  );
}

export function TodayWidget({ delay = 0 }: { delay?: number }) {
  const { tasks } = useWedding();
  const today = tasks.filter(
    (t) => isOpen(t) && t.due_date && isToday(parseISO(t.due_date))
  );
  const upcoming = tasks
    .filter((t) => isOpen(t) && t.due_date && !isToday(parseISO(t.due_date)) && parseISO(t.due_date) > new Date())
    .sort((a, b) => a.due_date!.localeCompare(b.due_date!))
    .slice(0, Math.max(0, 6 - today.length));

  return (
    <WidgetCard
      title="Today & up next"
      icon={<CalendarClock className="size-5 text-gold" />}
      delay={delay}
    >
      {today.length === 0 && upcoming.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No deadlines on the horizon.
        </p>
      ) : (
        <div className="-mx-2 space-y-0.5">
          {today.map((t) => <TaskRow key={t.id} task={t} />)}
          {upcoming.map((t) => <TaskRow key={t.id} task={t} />)}
        </div>
      )}
    </WidgetCard>
  );
}

/* —— money, shopping, booking —— */

export function BudgetWidget({ delay = 0 }: { delay?: number }) {
  const { budgets, expenses, settings } = useWedding();
  const allocated = budgets.reduce((s, b) => s + Number(b.allocated), 0);
  const spent = expenses.filter((e) => e.paid).reduce((s, e) => s + Number(e.amount), 0);
  const pending = expenses.filter((e) => !e.paid).reduce((s, e) => s + Number(e.amount), 0);
  const pct = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;

  return (
    <WidgetCard
      title="Budget"
      icon={<Wallet className="size-5 text-primary" />}
      delay={delay}
      action={
        <Button variant="ghost" size="sm" render={<Link href="/budget" />}>
          Details <ArrowRight className="size-3.5" />
        </Button>
      }
    >
      <div className="space-y-3">
        <div>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-2xl">{formatMoney(spent, settings.currency)}</span>
            <span className="text-xs text-muted-foreground">
              of {formatMoney(allocated, settings.currency)}
            </span>
          </div>
          <GradientBar value={pct} className="mt-2" />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Remaining</span>
          <span className="font-medium">{formatMoney(Math.max(0, allocated - spent), settings.currency)}</span>
        </div>
        {pending > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Pending payments</span>
            <span className="font-medium text-orange-600 dark:text-orange-400">
              {formatMoney(pending, settings.currency)}
            </span>
          </div>
        )}
      </div>
    </WidgetCard>
  );
}

export function ShoppingWidget({ delay = 0 }: { delay?: number }) {
  const { shoppingItems, settings } = useWedding();
  const pct = shoppingProgress(shoppingItems);
  const bought = shoppingItems.filter((i) => i.purchased);
  const spent = bought.reduce((s, i) => s + Number(i.actual_price ?? 0), 0);

  return (
    <WidgetCard
      title="Shopping"
      icon={<ShoppingBag className="size-5 text-chart-3" />}
      delay={delay}
      action={
        <Button variant="ghost" size="sm" render={<Link href="/shopping" />}>
          List <ArrowRight className="size-3.5" />
        </Button>
      }
    >
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="font-display text-2xl">
            {bought.length}/{shoppingItems.length}
          </span>
          <span className="text-xs text-muted-foreground">items purchased</span>
        </div>
        <GradientBar value={pct} />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Spent so far</span>
          <span className="font-medium">{formatMoney(spent, settings.currency)}</span>
        </div>
      </div>
    </WidgetCard>
  );
}

export function BookingWidget({ delay = 0 }: { delay?: number }) {
  const { vendors, settings } = useWedding();
  const pct = bookingProgress(vendors);
  const advances = vendors.reduce((s, v) => s + Number(v.advance_paid), 0);

  return (
    <WidgetCard
      title="Bookings"
      icon={<Store className="size-5 text-chart-4" />}
      delay={delay}
      action={
        <Button variant="ghost" size="sm" render={<Link href="/vendors" />}>
          Vendors <ArrowRight className="size-3.5" />
        </Button>
      }
    >
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="font-display text-2xl">
            {vendors.filter((v) => v.booked).length}/{vendors.length}
          </span>
          <span className="text-xs text-muted-foreground">vendors booked</span>
        </div>
        <GradientBar value={pct} />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Advances paid</span>
          <span className="font-medium">{formatMoney(advances, settings.currency)}</span>
        </div>
      </div>
    </WidgetCard>
  );
}

export function GuestsWidget({ delay = 0 }: { delay?: number }) {
  const { guests } = useWedding();
  const confirmed = guests.filter((g) => g.rsvp === "confirmed");
  const heads = confirmed.reduce((s, g) => s + g.head_count, 0);
  const invited = guests.filter((g) => g.invitation_sent).length;

  return (
    <WidgetCard
      title="Guests"
      icon={<Users className="size-5 text-chart-5" />}
      delay={delay}
      action={
        <Button variant="ghost" size="sm" render={<Link href="/guests" />}>
          Manage <ArrowRight className="size-3.5" />
        </Button>
      }
    >
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="font-display text-2xl">{heads}</span>
          <span className="text-xs text-muted-foreground">confirmed heads</span>
        </div>
        <GradientBar value={guests.length ? Math.round((confirmed.length / guests.length) * 100) : 0} />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Invitations sent</span>
          <span className="font-medium">{invited}/{guests.length}</span>
        </div>
      </div>
    </WidgetCard>
  );
}

/* —— events strip —— */

export function EventStatusStrip({ delay = 0 }: { delay?: number }) {
  const { events, tasks } = useWedding();
  const active = events.filter((e) => !e.archived);

  return (
    <motion.div
      {...rise}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {active.map((event) => {
        const evTasks = tasks.filter((t) => t.event_id === event.id);
        const pct = taskListProgress(evTasks);
        const theme = EVENT_THEMES[event.theme] ?? EVENT_THEMES.emerald;
        return (
          <Link key={event.id} href={`/events/${event.id}`} className="group">
            <div className={`card-lux overflow-hidden`}>
              <div className={`${theme.gradient} relative flex h-24 items-end p-4 text-white`}>
                <EventIcon
                  name={event.icon}
                  className="absolute right-3 top-3 size-8 opacity-40 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                />
                <div>
                  <p className="font-display text-xl drop-shadow">{event.name}</p>
                  <p className="text-xs text-white/85">{formatDate(event.event_date, "EEE, d MMM yyyy")}</p>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {evTasks.filter((t) => t.status === "completed").length}/{evTasks.length} tasks
                  </span>
                  <span className="font-medium text-foreground">{pct}%</span>
                </div>
                <GradientBar value={pct} className="mt-2" />
              </div>
            </div>
          </Link>
        );
      })}
    </motion.div>
  );
}

/* —— activity + notes + quick actions —— */

export function ActivityWidget({ delay = 0 }: { delay?: number }) {
  const { activity, profiles } = useWedding();
  const name = (id: string | null) =>
    profiles.find((p) => p.id === id)?.full_name ?? "Someone";

  return (
    <WidgetCard
      title="Recent activity"
      icon={<History className="size-5 text-muted-foreground" />}
      delay={delay}
      action={
        <Button variant="ghost" size="sm" render={<Link href="/activity" />}>
          Full log <ArrowRight className="size-3.5" />
        </Button>
      }
    >
      {activity.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">No activity yet.</p>
      ) : (
        <ul className="space-y-3">
          {activity.slice(0, 6).map((a) => (
            <li key={a.id} className="flex gap-3 text-sm">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-gold" />
              <div className="min-w-0">
                <p className="truncate">
                  <span className="font-medium">{name(a.actor_id)}</span>{" "}
                  <span className="text-muted-foreground">{a.action}</span>{" "}
                  {a.detail}
                </p>
                <p className="text-[11px] text-muted-foreground/70">
                  {formatDistanceToNow(parseISO(a.created_at), { addSuffix: true })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}

export function QuickNotesWidget({ delay = 0 }: { delay?: number }) {
  const { notes, profiles } = useWedding();
  const pinnedFirst = [...notes].sort((a, b) => Number(b.pinned) - Number(a.pinned)).slice(0, 4);
  const name = (id: string | null) =>
    profiles.find((p) => p.id === id)?.full_name.split(" ")[0] ?? "Someone";

  return (
    <WidgetCard
      title="Quick notes"
      icon={<StickyNote className="size-5 text-gold" />}
      delay={delay}
      action={
        <Button variant="ghost" size="sm" render={<Link href="/settings?tab=notes" />}>
          All notes <ArrowRight className="size-3.5" />
        </Button>
      }
    >
      {pinnedFirst.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <ul className="space-y-2.5">
          {pinnedFirst.map((n) => (
            <li key={n.id} className="rounded-lg bg-gold-soft/50 px-3 py-2 text-sm">
              <p className="line-clamp-2">{n.body}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {n.pinned && "📌 "}{name(n.author_id)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}

export function QuickActions({ delay = 0 }: { delay?: number }) {
  const actions = [
    { href: "/tasks?new=1", label: "New task", icon: Plus },
    { href: "/bookings?new=1", label: "Add booking", icon: CalendarCheck2 },
    { href: "/shopping?new=1", label: "Shopping item", icon: ShoppingBag },
    { href: "/budget?new=1", label: "Add expense", icon: PiggyBank },
    { href: "/guests?new=1", label: "Add guest", icon: Users },
    { href: "/vendors?new=1", label: "Add vendor", icon: Store },
  ];
  return (
    <motion.div
      {...rise}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="flex flex-wrap gap-2"
    >
      {actions.map(({ href, label, icon: Icon }) => (
        <Button
          key={href} variant="outline" size="sm" className="rounded-full"
          render={<Link href={href} />}
        >
          <Icon className="size-4 text-gold" /> {label}
        </Button>
      ))}
    </motion.div>
  );
}

/* —— overdue bookings red-flag banner —— */

export function OverdueBookingsBanner({ delay = 0 }: { delay?: number }) {
  const { bookings, settings } = useWedding();
  const overdue = bookings
    .filter(
      (b: Booking) =>
        b.status !== "cancelled" &&
        !isSecured(b.status) &&
        bookingUrgency(b, settings.wedding_date) === "overdue"
    )
    .sort((a, b) => categoryMeta(b.category).leadMonths - categoryMeta(a.category).leadMonths);

  if (overdue.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="overflow-hidden rounded-2xl border border-red-500/40 bg-red-500/8"
    >
      <div className="flex items-center justify-between gap-2 border-b border-red-500/20 bg-red-500/10 px-4 py-2.5">
        <p className="flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-300">
          <TriangleAlert className="size-4" />
          {overdue.length} booking{overdue.length > 1 ? "s" : ""} overdue — past the ideal book-by date
        </p>
        <Button variant="ghost" size="sm" render={<Link href="/bookings" />}>
          Fix now <ArrowRight className="size-3.5" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 p-3">
        {overdue.map((b) => (
          <Link
            key={b.id}
            href="/bookings"
            className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-card px-3 py-1.5 text-sm transition-colors hover:bg-red-500/10"
          >
            <CategoryIcon name={categoryMeta(b.category).icon} className="size-3.5 text-red-600" />
            {b.category}
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

/* —— booking status compact widget —— */

export function BookingStatusWidget({ delay = 0 }: { delay?: number }) {
  const { bookings, settings } = useWedding();
  const stats = bookingStats(bookings, settings.wedding_date);

  return (
    <WidgetCard
      title="Bookings"
      icon={<CalendarCheck2 className="size-5 text-chart-3" />}
      delay={delay}
      action={
        <Button variant="ghost" size="sm" render={<Link href="/bookings" />}>
          Tracker <ArrowRight className="size-3.5" />
        </Button>
      }
    >
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="font-display text-2xl">{stats.secured}/{stats.total}</span>
          <span className="text-xs text-muted-foreground">vendors secured</span>
        </div>
        <GradientBar value={stats.progress} />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Overdue to book</span>
          <span className={`font-medium ${stats.overdue > 0 ? "text-red-600 dark:text-red-400" : ""}`}>
            {stats.overdue}
          </span>
        </div>
      </div>
    </WidgetCard>
  );
}
