"use client";

import { motion } from "framer-motion";
import { CalendarClock, Plus, TriangleAlert } from "lucide-react";
import { useWedding } from "@/lib/data-context";
import type { Booking } from "@/lib/types";
import {
  BOOKING_CATEGORIES, BOOKING_STATUS_META, BOOKING_URGENCY_META, bookingUrgency,
  daysUntilBookBy, idealBookByDate, isSecured,
} from "@/lib/bookings";
import { formatDate } from "@/lib/wedding";
import { CategoryIcon } from "./category-icon";
import { cn } from "@/lib/utils";

/**
 * The festive centerpiece: one tile per REQUIRED booking category, colour-coded
 * by lead-time urgency. A category is "secured" once any of its bookings is
 * booked/confirmed; otherwise it shows a red/orange/yellow/green urgency ribbon
 * and a "book by" countdown.
 */
export function CategoryBoard({
  onOpenBooking,
  onAddForCategory,
}: {
  onOpenBooking: (b: Booking) => void;
  onAddForCategory: (category: string) => void;
}) {
  const { bookings, events, settings, isAdmin } = useWedding();
  const weddingDate = settings.wedding_date;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {BOOKING_CATEGORIES.filter((c) => c.label !== "Others").map((cat, i) => {
        const catBookings = bookings.filter(
          (b) => b.category === cat.label && b.status !== "cancelled"
        );
        const secured = catBookings.find((b) => isSecured(b.status));
        const best =
          secured ??
          [...catBookings].sort(
            (a, b) => BOOKING_STATUS_META[b.status].step - BOOKING_STATUS_META[a.status].step
          )[0];

        // urgency: secured → done; unbooked → lead-time urgency; empty slot → urgency of a virtual not_booked
        const urgency = best
          ? bookingUrgency(best, weddingDate)
          : bookingUrgency(
              { category: cat.label, status: "not_booked" } as Booking,
              weddingDate
            );
        const meta = BOOKING_URGENCY_META[urgency];
        const days = daysUntilBookBy(cat.label, weddingDate);
        const fn = best?.event_id ? events.find((e) => e.id === best.event_id)?.name : null;

        return (
          <motion.button
            key={cat.label}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.4) }}
            onClick={() => (best ? onOpenBooking(best) : isAdmin && onAddForCategory(cat.label))}
            className={cn(
              "card-lux group relative overflow-hidden p-4 text-left",
              urgency === "overdue" && "border-red-500/50"
            )}
          >
            {/* urgency ribbon down the left edge */}
            <span
              className="absolute inset-y-0 left-0 w-1.5"
              style={{ background: meta.ring }}
            />

            <div className="flex items-start justify-between gap-2 pl-1.5">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex size-10 items-center justify-center rounded-xl"
                  style={{ background: `${meta.ring}1f`, color: meta.ring }}
                >
                  <CategoryIcon name={cat.icon} className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">{cat.label}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Lead time ~{cat.leadMonths} mo
                  </p>
                </div>
              </div>
              {urgency === "overdue" && (
                <TriangleAlert className="size-4 shrink-0 text-red-500" />
              )}
            </div>

            <div className="mt-3 pl-1.5">
              {best ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className={cn("size-2 rounded-full", BOOKING_STATUS_META[best.status].dot)} />
                    <span className="truncate text-sm">
                      {best.vendor_name ?? <span className="text-muted-foreground italic">Vendor TBD</span>}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        BOOKING_STATUS_META[best.status].className
                      )}
                    >
                      {BOOKING_STATUS_META[best.status].label}
                    </span>
                    {fn && (
                      <span className="truncate text-[11px] text-muted-foreground">{fn}</span>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm italic text-muted-foreground">No booking yet</p>
              )}

              {/* urgency footer */}
              <div className={cn("mt-3 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium", meta.bg, meta.text)}>
                {isSecured(best?.status ?? "not_booked") ? (
                  <>✓ {meta.label}</>
                ) : (
                  <>
                    <CalendarClock className="size-3.5" />
                    {days < 0 ? (
                      <>Overdue — book by {formatDate(idealBookByDate(cat.label, weddingDate).toISOString(), "d MMM")}</>
                    ) : (
                      <>{meta.label} · book by {formatDate(idealBookByDate(cat.label, weddingDate).toISOString(), "d MMM")} ({days}d)</>
                    )}
                  </>
                )}
              </div>
            </div>

            {isAdmin && !best && (
              <span className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-gold-soft text-gold-foreground opacity-0 transition-opacity group-hover:opacity-100">
                <Plus className="size-3.5" />
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
