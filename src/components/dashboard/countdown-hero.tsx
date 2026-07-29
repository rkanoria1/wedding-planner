"use client";

import { useEffect, useState } from "react";
import { differenceInSeconds, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { useWedding } from "@/lib/data-context";
import {
  daysRemaining, formatDate, planningElapsed, taskListProgress, weeksRemaining,
} from "@/lib/wedding";
import { ProgressRing } from "@/components/shared/progress-ring";
import { GradientBar } from "@/components/shared/gradient-bar";

function useCountdown(target: string) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const total = Math.max(0, differenceInSeconds(parseISO(target), now));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function CountdownHero() {
  const { settings, tasks, branding } = useWedding();
  const cd = useCountdown(settings.wedding_date + "T00:00:00");
  const progress = taskListProgress(tasks);
  const elapsed = planningElapsed(settings.planning_start, settings.wedding_date);
  const firstName = branding.greetingName || "there";

  const units = [
    { v: cd.days, l: "days" },
    { v: cd.hours, l: "hrs" },
    { v: cd.minutes, l: "min" },
    { v: cd.seconds, l: "sec" },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="card-lux relative overflow-hidden p-6 sm:p-8"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(600px 220px at 90% -20%, color-mix(in oklch, var(--gold) 18%, transparent), transparent 70%)",
        }}
      />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {greeting()}, <span className="font-medium text-foreground">{firstName}</span> ✨
          </p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl">
            <span className="text-gradient-gold">{branding.coupleNames}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(settings.wedding_date, "EEEE, d MMMM yyyy")} ·{" "}
            {daysRemaining(settings.wedding_date)} days ({weeksRemaining(settings.wedding_date)}{" "}
            weeks) remaining
          </p>

          {/* live countdown */}
          <div className="mt-5 flex gap-3">
            {units.map((u) => (
              <div
                key={u.l}
                className="flex w-16 flex-col items-center rounded-xl border bg-background/60 py-2.5 backdrop-blur"
              >
                <span className="font-display text-2xl tabular-nums">
                  {String(u.v).padStart(2, "0")}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {u.l}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 max-w-md">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Planning time elapsed</span>
              <span>{elapsed}%</span>
            </div>
            <GradientBar value={elapsed} className="mt-1.5" />
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-2">
          <ProgressRing
            value={progress}
            size={150}
            strokeWidth={11}
            label={
              <>
                <span className="font-display text-3xl">{progress}%</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  planned
                </span>
              </>
            }
          />
        </div>
      </div>
    </motion.section>
  );
}
