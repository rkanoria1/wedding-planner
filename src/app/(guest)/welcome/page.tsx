"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Camera, HeartHandshake, ScrollText } from "lucide-react";
import { useWedding } from "@/lib/data-context";
import { useLang } from "@/lib/i18n";
import { EVENT_THEMES, daysRemaining, formatDate } from "@/lib/wedding";
import { getGuestDisplayName } from "@/lib/guest";
import { useInviteContext } from "@/lib/use-invite";

const CARDS = [
  {
    href: "/timeline",
    titleKey: "guest.card.timeline",
    title: "Ceremony Timeline",
    hintKey: "guest.card.timeline.hint",
    hint: "The run of each celebration",
    icon: ScrollText,
    tone: "from-[#1a1210] to-[#7b1e3b]",
  },
  {
    href: "/lookbook",
    titleKey: "guest.card.lookbook",
    title: "Lookbook",
    hintKey: "guest.card.lookbook.hint",
    hint: "Outfits, jewelry & color stories",
    icon: BookOpen,
    tone: "from-[#8b5a4a] to-[#c4a484]",
  },
  {
    href: "/blessings",
    titleKey: "guest.card.blessings",
    title: "Blessings",
    hintKey: "guest.card.blessings.hint",
    hint: "Leave a note for the couple",
    icon: HeartHandshake,
    tone: "from-[#5c3d2e] to-[#a67c52]",
  },
  {
    href: "/moments",
    titleKey: "guest.card.moments",
    title: "Moments",
    hintKey: "guest.card.moments.hint",
    hint: "Share photos from the festivities",
    icon: Camera,
    tone: "from-[#2f4f4f] to-[#6b8f71]",
  },
];

export default function GuestHomePage() {
  const { t: tr } = useLang();
  const { settings, events } = useWedding();
  const invite = useInviteContext();
  const days = daysRemaining(settings.wedding_date);
  const name = getGuestDisplayName();
  // the full run of functions, in order — what someone reading a card in
  // their hotel room actually wants to see
  const schedule = [...events]
    .filter((e) => !e.archived)
    .sort((a, b) => (a.event_date ?? "").localeCompare(b.event_date ?? ""));
  const today = new Date().toISOString().slice(0, 10);
  const nextEvent = [...events]
    .filter((e) => !e.archived && e.event_date)
    .sort((a, b) => (a.event_date ?? "").localeCompare(b.event_date ?? ""))
    .find((e) => (e.event_date ?? "") >= new Date().toISOString().slice(0, 10))
    ?? events.filter((e) => !e.archived)[0];

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1210] via-[#3d2a24] to-[#7b1e3b] p-7 text-white"
      >
        <p className="text-xs uppercase tracking-[0.25em] text-white/60">
          {invite?.heading ?? (name
            ? tr("guest.welcomeNamed", "Welcome, {name}", { name })
            : tr("guest.welcome", "Welcome"))}
        </p>
        {invite?.message && (
          <p className="mt-1 text-sm text-amber-200/90">{invite.message}</p>
        )}
        <h1 className="mt-2 font-display text-4xl leading-tight">
          {settings.couple_names}
        </h1>
        <p className="mt-3 text-white/75">
          {formatDate(settings.wedding_date, "EEEE, d MMMM yyyy")}
        </p>
        <p className="mt-6 font-display text-5xl text-amber-200">{days}</p>
        <p className="text-sm text-white/70">
          {tr("guest.daysToWedding", "days to the wedding")}
        </p>
        {nextEvent && (
          <p className="mt-5 rounded-2xl bg-white/10 px-4 py-3 text-sm backdrop-blur-sm">
            {tr("guest.upNext", "Up next")}: <span className="font-medium">{nextEvent.name}</span>
            {nextEvent.event_date && (
              <> · {formatDate(nextEvent.event_date, "d MMM")}</>
            )}
            {nextEvent.venue && <> · {nextEvent.venue}</>}
          </p>
        )}
      </motion.section>

      {/* A code in a hotel room is read while planning the days ahead —
          so show the whole sequence, not just what's next. */}
      {invite?.variant === "room" && schedule.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="rounded-2xl border bg-card p-5"
        >
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {tr("guest.schedule", "Your schedule")}
          </p>
          <ol className="mt-4 space-y-0">
            {schedule.map((e, i) => {
              const isToday = e.event_date === today;
              const past = (e.event_date ?? "") < today;
              return (
                <li key={e.id} className="flex gap-3.5">
                  {/* timeline rail */}
                  <div className="flex flex-col items-center">
                    <span
                      className="mt-1.5 size-3 shrink-0 rounded-full ring-4 ring-background"
                      style={{
                        background:
                          EVENT_THEMES[e.theme]?.chip ?? "var(--primary)",
                        opacity: past ? 0.35 : 1,
                      }}
                    />
                    {i < schedule.length - 1 && (
                      <span className="w-px flex-1 bg-border" />
                    )}
                  </div>
                  <div className={`pb-5 ${past ? "opacity-50" : ""}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-lg leading-none">{e.name}</p>
                      {isToday && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                          {tr("guest.today", "Today")}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDate(e.event_date, "EEEE, d MMM")}
                      {e.venue && ` · ${e.venue}`}
                    </p>
                    {e.description && (
                      <p className="mt-1 text-sm text-muted-foreground/80">
                        {e.description}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </motion.section>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {CARDS.map((c, i) => (
          <motion.div
            key={c.href}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.05 }}
          >
            <Link
              href={c.href}
              className={`flex min-h-[120px] flex-col justify-end rounded-2xl bg-gradient-to-br ${c.tone} p-5 text-white shadow-lg transition-transform hover:-translate-y-0.5`}
            >
              <c.icon className="mb-3 size-6 opacity-80" />
              <p className="font-display text-xl">{tr(c.titleKey, c.title)}</p>
              <p className="text-sm text-white/75">{tr(c.hintKey, c.hint)}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
