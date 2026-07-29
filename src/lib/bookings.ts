import { differenceInCalendarDays, parseISO, subMonths } from "date-fns";
import type { Booking, BookingStatus } from "./types";

/* ————— required booking categories + typical lead times ————— */
/** Months before the wedding a category should ideally be locked in. */
export interface BookingCategoryMeta {
  label: string;
  leadMonths: number;
  icon: string; // lucide name
}

export const BOOKING_CATEGORIES: BookingCategoryMeta[] = [
  { label: "Venue", leadMonths: 9, icon: "Landmark" },
  { label: "Food Catering", leadMonths: 9, icon: "UtensilsCrossed" },
  { label: "Photographer", leadMonths: 7, icon: "Camera" },
  { label: "Videographer", leadMonths: 7, icon: "Video" },
  { label: "Jeweler", leadMonths: 6, icon: "Gem" },
  { label: "Decoration", leadMonths: 6, icon: "Sparkles" },
  { label: "Accommodation / Guest Hotel", leadMonths: 5, icon: "BedDouble" },
  { label: "Wedding Clothes / Tailor", leadMonths: 4, icon: "Shirt" },
  { label: "Invitation Cards Printing", leadMonths: 4, icon: "Mail" },
  { label: "DJ / Sound", leadMonths: 4, icon: "Disc3" },
  { label: "Makeup Artist", leadMonths: 3, icon: "Brush" },
  { label: "Mehendi Artist", leadMonths: 3, icon: "Hand" },
  { label: "Lighting", leadMonths: 3, icon: "Lightbulb" },
  { label: "Transportation", leadMonths: 2, icon: "Car" },
  { label: "Flowers", leadMonths: 1, icon: "Flower2" },
  { label: "Others", leadMonths: 3, icon: "CircleEllipsis" },
];

export const BOOKING_CATEGORY_NAMES = BOOKING_CATEGORIES.map((c) => c.label);

export function categoryMeta(category: string): BookingCategoryMeta {
  return (
    BOOKING_CATEGORIES.find((c) => c.label === category) ?? {
      label: category,
      leadMonths: 3,
      icon: "CircleEllipsis",
    }
  );
}

/* ————— status meta ————— */

export const BOOKING_STATUS_ORDER: BookingStatus[] = [
  "not_booked",
  "enquired",
  "negotiating",
  "booked",
  "confirmed",
];

/** A booking counts as "secured" once it reaches booked/confirmed. */
export function isSecured(status: BookingStatus) {
  return status === "booked" || status === "confirmed";
}

export const BOOKING_STATUS_META: Record<
  BookingStatus,
  { label: string; className: string; dot: string; step: number }
> = {
  not_booked: {
    label: "Not Booked",
    className: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground/50",
    step: 0,
  },
  enquired: {
    label: "Enquired",
    className: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30",
    dot: "bg-sky-500",
    step: 1,
  },
  negotiating: {
    label: "Negotiating",
    className: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30",
    dot: "bg-violet-500",
    step: 2,
  },
  booked: {
    label: "Booked",
    className: "bg-primary/10 text-primary dark:text-primary border-primary/30",
    dot: "bg-primary",
    step: 3,
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-primary/15 text-primary dark:text-primary border-primary/40",
    dot: "bg-primary",
    step: 4,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 line-through",
    dot: "bg-red-500",
    step: -1,
  },
};

/* ————— lead-time urgency for UNBOOKED categories ————— */

export type BookingUrgency = "overdue" | "critical" | "urgent" | "soon" | "on_track" | "done";

export const BOOKING_URGENCY_META: Record<
  BookingUrgency,
  { label: string; ring: string; text: string; bg: string; dot: string }
> = {
  overdue: { label: "Overdue", ring: "#dc2626", text: "text-red-700 dark:text-red-300", bg: "bg-red-500/12", dot: "bg-red-600" },
  critical: { label: "Book now", ring: "#dc2626", text: "text-red-600 dark:text-red-400", bg: "bg-red-500/10", dot: "bg-red-500" },
  urgent: { label: "Urgent", ring: "#ea580c", text: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10", dot: "bg-orange-500" },
  soon: { label: "Book soon", ring: "#ca8a04", text: "text-yellow-700 dark:text-yellow-300", bg: "bg-yellow-500/10", dot: "bg-yellow-500" },
  on_track: { label: "On track", ring: "#7b1e3b", text: "text-primary dark:text-primary", bg: "bg-primary/10", dot: "bg-primary" },
  done: { label: "Secured", ring: "#7b1e3b", text: "text-primary dark:text-primary", bg: "bg-primary/10", dot: "bg-primary" },
};

/** Ideal "book by" date = wedding date minus the category's lead time. */
export function idealBookByDate(category: string, weddingDate: string): Date {
  return subMonths(parseISO(weddingDate), categoryMeta(category).leadMonths);
}

/** Days remaining until the ideal book-by date (negative = past it). */
export function daysUntilBookBy(category: string, weddingDate: string): number {
  return differenceInCalendarDays(idealBookByDate(category, weddingDate), new Date());
}

export function bookingUrgency(booking: Booking, weddingDate: string): BookingUrgency {
  if (isSecured(booking.status)) return "done";
  if (booking.status === "cancelled") return "on_track";
  const days = daysUntilBookBy(booking.category, weddingDate);
  if (days < 0) return "overdue";
  if (days <= 14) return "critical";
  if (days <= 30) return "urgent";
  if (days <= 60) return "soon";
  return "on_track";
}

/** Rank for sorting — most pressing first. */
export function urgencyRank(u: BookingUrgency): number {
  return ["overdue", "critical", "urgent", "soon", "on_track", "done"].indexOf(u);
}

/* ————— dashboard aggregates ————— */

export interface BookingStats {
  total: number;
  secured: number;
  confirmed: number;
  pending: number;
  overdue: number;
  progress: number; // % secured
  advancePaid: number;
  balanceDue: number;
}

export function bookingStats(bookings: Booking[], weddingDate: string): BookingStats {
  const active = bookings.filter((b) => b.status !== "cancelled");
  const secured = active.filter((b) => isSecured(b.status));
  const confirmed = active.filter((b) => b.status === "confirmed");
  const overdue = active.filter(
    (b) => !isSecured(b.status) && bookingUrgency(b, weddingDate) === "overdue"
  );
  return {
    total: active.length,
    secured: secured.length,
    confirmed: confirmed.length,
    pending: active.length - secured.length,
    overdue: overdue.length,
    progress: active.length ? Math.round((secured.length / active.length) * 100) : 0,
    advancePaid: active.reduce((s, b) => s + Number(b.advance_paid), 0),
    balanceDue: active.reduce((s, b) => s + Number(b.balance_due), 0),
  };
}

/** Upcoming trials, tastings and fittings across all bookings, soonest first. */
export interface UpcomingMilestone {
  booking: Booking;
  kind: "trial" | "fitting";
  date: string;
  daysAway: number;
}

export function upcomingMilestones(bookings: Booking[]): UpcomingMilestone[] {
  const out: UpcomingMilestone[] = [];
  for (const b of bookings) {
    if (b.status === "cancelled") continue;
    if (b.trial_scheduled) {
      const daysAway = differenceInCalendarDays(parseISO(b.trial_scheduled), new Date());
      if (daysAway >= 0) out.push({ booking: b, kind: "trial", date: b.trial_scheduled, daysAway });
    }
    if (b.fitting_date) {
      const daysAway = differenceInCalendarDays(parseISO(b.fitting_date), new Date());
      if (daysAway >= 0) out.push({ booking: b, kind: "fitting", date: b.fitting_date, daysAway });
    }
  }
  return out.sort((a, b) => a.daysAway - b.daysAway);
}
