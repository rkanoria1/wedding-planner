import {
  differenceInCalendarDays,
  differenceInCalendarWeeks,
  format,
  isPast,
  isToday,
  parseISO,
} from "date-fns";
import type {
  EventTheme,
  ShoppingItem,
  Task,
  TaskPriority,
  TaskStatus,
  Vendor,
} from "./types";

/* ————— urgency engine ————— */

export type Urgency = "overdue" | "critical" | "urgent" | "upcoming" | "can_wait" | "none";

export const URGENCY_META: Record<
  Urgency,
  { label: string; className: string; dot: string }
> = {
  overdue: {
    label: "Overdue",
    className: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/40",
    dot: "bg-red-500",
  },
  critical: {
    label: "Critical",
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
    dot: "bg-red-500",
  },
  urgent: {
    label: "Urgent",
    className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
    dot: "bg-orange-500",
  },
  upcoming: {
    label: "Upcoming",
    className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/30",
    dot: "bg-yellow-500",
  },
  can_wait: {
    label: "Can wait",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  none: {
    label: "No due date",
    className: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground/50",
  },
};

const OPEN_STATUSES: TaskStatus[] = ["not_started", "in_progress", "waiting", "blocked"];

export function isOpen(task: Task) {
  return OPEN_STATUSES.includes(task.status);
}

export function taskUrgency(task: Task): Urgency {
  if (!isOpen(task) || !task.due_date) return "none";
  const due = parseISO(task.due_date);
  if (isPast(due) && !isToday(due)) return "overdue";
  const days = differenceInCalendarDays(due, new Date());
  if (days <= 3) return "critical";
  if (days <= 7) return "urgent";
  if (days <= 21) return "upcoming";
  return "can_wait";
}

/* ————— status & priority meta ————— */

export const STATUS_META: Record<TaskStatus, { label: string; className: string }> = {
  not_started: { label: "Not Started", className: "bg-muted text-muted-foreground border-border" },
  in_progress: { label: "In Progress", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30" },
  waiting: { label: "Waiting", className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30" },
  blocked: { label: "Blocked", className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30" },
  completed: { label: "Completed", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground/70 border-border line-through" },
};

export const STATUS_ORDER: TaskStatus[] = [
  "not_started",
  "in_progress",
  "waiting",
  "blocked",
  "completed",
  "cancelled",
];

export const PRIORITY_META: Record<TaskPriority, { label: string; className: string; rank: number }> = {
  critical: { label: "Critical", className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30", rank: 0 },
  high: { label: "High", className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30", rank: 1 },
  medium: { label: "Medium", className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/30", rank: 2 },
  low: { label: "Low", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30", rank: 3 },
};

/* ————— event themes ————— */

export const EVENT_THEMES: Record<EventTheme, { label: string; gradient: string; chip: string }> = {
  henna: { label: "Henna Green", gradient: "bg-event-henna", chip: "#3f7d3a" },
  marigold: { label: "Marigold", gradient: "bg-event-marigold", chip: "#e59312" },
  emerald: { label: "Emerald & Gold", gradient: "bg-event-emerald", chip: "#0c7a5a" },
  champagne: { label: "Champagne", gradient: "bg-event-champagne", chip: "#c2a061" },
  rose: { label: "Rose", gradient: "bg-event-rose", chip: "#c94f7c" },
  sapphire: { label: "Sapphire", gradient: "bg-event-sapphire", chip: "#2f5fb3" },
  sunset: { label: "Sunset", gradient: "bg-event-sunset", chip: "#d1571f" },
  lavender: { label: "Lavender", gradient: "bg-event-lavender", chip: "#7c5cbf" },
};

/* ————— progress ————— */

export function taskListProgress(tasks: Task[]): number {
  const counted = tasks.filter((t) => t.status !== "cancelled");
  if (counted.length === 0) return 0;
  const sum = counted.reduce(
    (acc, t) => acc + (t.status === "completed" ? 100 : t.completion),
    0
  );
  return Math.round(sum / counted.length);
}

export function shoppingProgress(items: ShoppingItem[]): number {
  if (items.length === 0) return 0;
  return Math.round((items.filter((i) => i.purchased).length / items.length) * 100);
}

export function bookingProgress(vendors: Vendor[]): number {
  if (vendors.length === 0) return 0;
  return Math.round((vendors.filter((v) => v.booked).length / vendors.length) * 100);
}

export function planningElapsed(planningStart: string, weddingDate: string): number {
  const start = parseISO(planningStart).getTime();
  const end = parseISO(weddingDate).getTime();
  const now = Date.now();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

export function daysRemaining(weddingDate: string): number {
  return Math.max(0, differenceInCalendarDays(parseISO(weddingDate), new Date()));
}

export function weeksRemaining(weddingDate: string): number {
  return Math.max(0, differenceInCalendarWeeks(parseISO(weddingDate), new Date()));
}

/* ————— formatters ————— */

export function formatMoney(amount: number | null | undefined, currency = "₹"): string {
  if (amount == null) return "—";
  return `${currency}${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount)}`;
}

export function formatDate(date: string | null | undefined, fmt = "d MMM yyyy"): string {
  if (!date) return "—";
  try {
    return format(parseISO(date), fmt);
  } catch {
    return "—";
  }
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function whatsappLink(phone: string, message?: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
}

/* ————— confetti ————— */

export async function fireConfetti(big = false) {
  const confetti = (await import("canvas-confetti")).default;
  const colors = ["#0c7a5a", "#c9a227", "#f5e6c4", "#3f7d3a", "#e5b912"];
  confetti({
    particleCount: big ? 180 : 80,
    spread: big ? 100 : 70,
    origin: { y: 0.7 },
    colors,
  });
  if (big) {
    setTimeout(
      () => confetti({ particleCount: 120, angle: 60, spread: 70, origin: { x: 0 }, colors }),
      250
    );
    setTimeout(
      () => confetti({ particleCount: 120, angle: 120, spread: 70, origin: { x: 1 }, colors }),
      450
    );
  }
}
