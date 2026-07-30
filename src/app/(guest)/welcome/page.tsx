"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Camera, HeartHandshake, ScrollText } from "lucide-react";
import { useWedding } from "@/lib/data-context";
import { daysRemaining, formatDate } from "@/lib/wedding";
import { getGuestDisplayName } from "@/lib/guest";

const CARDS = [
  {
    href: "/timeline",
    title: "Ceremony Timeline",
    hint: "The run of each celebration",
    icon: ScrollText,
    tone: "from-[#1a1210] to-[#7b1e3b]",
  },
  {
    href: "/lookbook",
    title: "Lookbook",
    hint: "Outfits, jewelry & color stories",
    icon: BookOpen,
    tone: "from-[#8b5a4a] to-[#c4a484]",
  },
  {
    href: "/blessings",
    title: "Blessings",
    hint: "Leave a note for the couple",
    icon: HeartHandshake,
    tone: "from-[#5c3d2e] to-[#a67c52]",
  },
  {
    href: "/moments",
    title: "Moments",
    hint: "Share photos from the festivities",
    icon: Camera,
    tone: "from-[#2f4f4f] to-[#6b8f71]",
  },
];

export default function GuestHomePage() {
  const { settings, events } = useWedding();
  const days = daysRemaining(settings.wedding_date);
  const name = getGuestDisplayName();
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
          {name ? `Welcome, ${name}` : "Welcome"}
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight">
          {settings.couple_names}
        </h1>
        <p className="mt-3 text-white/75">
          {formatDate(settings.wedding_date, "EEEE, d MMMM yyyy")}
        </p>
        <p className="mt-6 font-display text-5xl text-amber-200">{days}</p>
        <p className="text-sm text-white/70">days to the wedding</p>
        {nextEvent && (
          <p className="mt-5 rounded-2xl bg-white/10 px-4 py-3 text-sm backdrop-blur-sm">
            Up next: <span className="font-medium">{nextEvent.name}</span>
            {nextEvent.event_date && (
              <> · {formatDate(nextEvent.event_date, "d MMM")}</>
            )}
            {nextEvent.venue && <> · {nextEvent.venue}</>}
          </p>
        )}
      </motion.section>

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
              <p className="font-display text-xl">{c.title}</p>
              <p className="text-sm text-white/75">{c.hint}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
