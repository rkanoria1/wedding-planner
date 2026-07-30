"use client";

import { CountdownHero } from "@/components/dashboard/countdown-hero";
import {
  ActivityWidget, BookingStatusWidget, EventStatusStrip,
  GuestsWidget, OverdueBookingsBanner, QuickActions, QuickNotesWidget, ShoppingWidget,
  TodayWidget, UrgentTasksWidget,
} from "@/components/dashboard/widgets";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <CountdownHero />
      <OverdueBookingsBanner delay={0.08} />
      <QuickActions delay={0.1} />
      <EventStatusStrip delay={0.15} />

      <div className="grid gap-4 lg:grid-cols-2">
        <UrgentTasksWidget delay={0.2} />
        <TodayWidget delay={0.25} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <ShoppingWidget delay={0.35} />
        <BookingStatusWidget delay={0.4} />
        <GuestsWidget delay={0.45} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ActivityWidget delay={0.5} />
        <QuickNotesWidget delay={0.55} />
      </div>
    </div>
  );
}
