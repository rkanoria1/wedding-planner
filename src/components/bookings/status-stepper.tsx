"use client";

import { Check } from "lucide-react";
import type { BookingStatus } from "@/lib/types";
import { BOOKING_STATUS_META, BOOKING_STATUS_ORDER } from "@/lib/bookings";
import { cn } from "@/lib/utils";

/**
 * Interactive booking-status stepper:
 * Not Booked → Enquired → Negotiating → Booked → Confirmed.
 * Click a node to jump the booking to that stage (admins only).
 */
export function StatusStepper({
  status,
  onChange,
  size = "md",
}: {
  status: BookingStatus;
  onChange?: (s: BookingStatus) => void;
  size?: "sm" | "md";
}) {
  const currentStep =
    status === "cancelled" ? -1 : BOOKING_STATUS_META[status].step;
  const interactive = Boolean(onChange);
  const dot = size === "sm" ? "size-5" : "size-7";
  const gap = size === "sm" ? "gap-0" : "gap-0.5";

  return (
    <div className={cn("flex items-center", gap)}>
      {BOOKING_STATUS_ORDER.map((s, i) => {
        const meta = BOOKING_STATUS_META[s];
        const reached = currentStep >= meta.step;
        const isCurrent = currentStep === meta.step;
        return (
          <div key={s} className="flex flex-1 items-center">
            <button
              type="button"
              disabled={!interactive}
              onClick={() => onChange?.(s)}
              aria-label={meta.label}
              title={meta.label}
              className={cn(
                "relative flex shrink-0 items-center justify-center rounded-full border-2 transition-all",
                dot,
                reached
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-card text-muted-foreground",
                isCurrent && "ring-2 ring-gold ring-offset-1 ring-offset-background",
                interactive && "cursor-pointer hover:scale-110"
              )}
            >
              {reached ? (
                <Check className={size === "sm" ? "size-3" : "size-3.5"} strokeWidth={3} />
              ) : (
                <span className={cn("rounded-full bg-current", size === "sm" ? "size-1" : "size-1.5")} />
              )}
            </button>
            {i < BOOKING_STATUS_ORDER.length - 1 && (
              <span
                className={cn(
                  "h-0.5 flex-1 rounded-full transition-colors",
                  currentStep > meta.step ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
