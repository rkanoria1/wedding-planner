"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  BadgeCheck, CalendarClock, CircleCheckBig, ClipboardList, FileSignature,
  MessageCircle, Phone, Plus, Scissors, Sparkles, TriangleAlert,
} from "lucide-react";
import { useWedding } from "@/lib/data-context";
import { useLang } from "@/lib/i18n";
import type { Booking } from "@/lib/types";
import {
  BOOKING_STATUS_META, BOOKING_URGENCY_META, bookingStats, bookingUrgency,
  categoryMeta, idealBookByDate, isSecured, upcomingMilestones, urgencyRank,
} from "@/lib/bookings";
import { formatDate, whatsappLink } from "@/lib/wedding";
import { ProgressRing } from "@/components/shared/progress-ring";
import { ShareWhatsApp, PrintButton } from "@/components/shared/share-print";
import { EmptyState } from "@/components/shared/empty-state";
import { BookingDialog } from "@/components/bookings/booking-dialog";
import { CategoryBoard } from "@/components/bookings/category-board";
import { CategoryIcon } from "@/components/bookings/category-icon";
import { StatusStepper } from "@/components/bookings/status-stepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

function BookingsPageInner() {
  const { t: tr } = useLang();
  const params = useSearchParams();
  const { db, isAdmin, bookings, events, settings, refresh, logActivity } = useWedding();
  const weddingDate = settings.wedding_date;

  const [dialog, setDialog] = useState<{ open: boolean; booking: Booking | null; category?: string }>({
    open: Boolean(params.get("new")),
    booking: null,
  });
  const [view, setView] = useState("board");

  const stats = useMemo(() => bookingStats(bookings, weddingDate), [bookings, weddingDate]);
  const milestones = useMemo(() => upcomingMilestones(bookings), [bookings]);

  const overdue = useMemo(
    () =>
      bookings
        .filter((b) => b.status !== "cancelled" && !isSecured(b.status) && bookingUrgency(b, weddingDate) === "overdue")
        .sort((a, b) => categoryMeta(b.category).leadMonths - categoryMeta(a.category).leadMonths),
    [bookings, weddingDate]
  );

  const sortedBookings = useMemo(
    () =>
      [...bookings].sort((a, b) => {
        const ua = urgencyRank(bookingUrgency(a, weddingDate));
        const ub = urgencyRank(bookingUrgency(b, weddingDate));
        if (ua !== ub) return ua - ub;
        return a.category.localeCompare(b.category);
      }),
    [bookings, weddingDate]
  );

  async function setStatus(b: Booking, status: Booking["status"]) {
    const { error } = await db.from("bookings").update({ status }).eq("id", b.id);
    if (error) return;
    await logActivity(
      isSecured(status) ? "secured booking" : "updated booking",
      "booking",
      `${tr("bcat." + b.category, b.category)}${b.vendor_name ? ` — ${b.vendor_name}` : ""} → ${tr("bstatus." + status, BOOKING_STATUS_META[status].label)}`,
      b.id
    );
    refresh("bookings");
  }

  const openEdit = (booking: Booking) => setDialog({ open: true, booking });
  const openAdd = (category?: string) => setDialog({ open: true, booking: null, category });

  // WhatsApp summary of everything still to be booked
  const pendingShareText = useMemo(() => {
    const pending = sortedBookings.filter((b) => b.status !== "cancelled" && !isSecured(b.status));
    const lines = pending.map((b) => {
      const u = bookingUrgency(b, weddingDate);
      const uLabel = tr("burgency." + u, BOOKING_URGENCY_META[u].label);
      const by = formatDate(idealBookByDate(b.category, weddingDate).toISOString(), "d MMM");
      const cat = tr("bcat." + b.category, b.category);
      return `• ${cat}${b.vendor_name ? ` (${b.vendor_name})` : ""} ${tr("bookings.share.line", "— {urgency}, book by {date}", { urgency: uLabel, date: by })}`;
    });
    return (
      `${tr("bookings.share.header", "💍 Wedding vendor bookings — still to confirm")}\n\n` +
      (lines.length ? lines.join("\n") : tr("bookings.share.allDone", "All vendors are booked! 🎉")) +
      `\n\n` +
      tr("bookings.share.footer", "Secured {secured}/{total}. Wedding on {date}.", {
        secured: stats.secured,
        total: stats.total,
        date: formatDate(weddingDate, "d MMM yyyy"),
      })
    );
  }, [sortedBookings, weddingDate, stats, tr]);

  const statTiles = [
    { id: "needed", label: tr("bookings.stat.needed", "Bookings needed"), value: stats.total, icon: ClipboardList, tint: "text-primary", bg: "bg-primary/10" },
    { id: "confirmed", label: tr("bookings.stat.confirmed", "Confirmed"), value: stats.confirmed, icon: BadgeCheck, tint: "text-primary", bg: "bg-primary/10" },
    { id: "pending", label: tr("bookings.stat.pending", "Pending"), value: stats.pending, icon: CalendarClock, tint: "text-amber-600", bg: "bg-amber-500/10" },
    { id: "overdue", label: tr("bookings.stat.overdue", "Overdue"), value: stats.overdue, icon: TriangleAlert, tint: "text-red-600", bg: "bg-red-500/10" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card-lux relative overflow-hidden p-6 sm:p-7"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(560px 200px at 92% -25%, color-mix(in oklch, var(--gold) 20%, transparent), transparent 70%)",
          }}
        />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
              <Sparkles className="size-4 text-gold" /> {tr("bookings.eyebrow", "Critical Booking Tracker")}
            </div>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl">
              {tr("bookings.title.prefix", "Lock in every")}{" "}
              <span className="text-gradient-gold">{tr("bookings.title.highlight", "vendor")}</span>{" "}
              {tr("bookings.title.suffix", "on time")}
            </h1>
            <p className="mt-1 max-w-lg text-sm text-muted-foreground">
              {tr(
                "bookings.sub",
                "Each essential service has a typical lead time. We flag what needs booking now so nothing slips before {date}.",
                { date: formatDate(weddingDate, "d MMM yyyy") }
              )}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {isAdmin && (
                <Button onClick={() => openAdd()}>
                  <Plus className="size-4" /> {tr("action.addBooking", "Add booking")}
                </Button>
              )}
              <ShareWhatsApp text={pendingShareText} label={tr("bookings.sharePending", "Share pending")} />
              <PrintButton />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <ProgressRing
              value={stats.progress}
              size={132}
              strokeWidth={10}
              label={
                <>
                  <span className="font-display text-3xl">{stats.progress}%</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {tr("bookings.securedPct", "secured")}
                  </span>
                </>
              }
            />
            <div className="space-y-1 text-sm">
              <p className="flex items-center gap-1.5">
                <CircleCheckBig className="size-4 text-primary" />
                <span className="text-muted-foreground">{tr("bookings.securedLabel", "Secured:")}</span>
                <span className="font-medium">{stats.secured}/{stats.total}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <CalendarClock className="size-4 text-amber-600" />
                <span className="text-muted-foreground">{tr("bookings.pendingLabel", "Pending:")}</span>
                <span className="font-medium">{stats.pending}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <FileSignature className="size-4 text-gold" />
                <span className="text-muted-foreground">{tr("bookings.contractsSigned", "Contracts signed:")}</span>
                <span className="font-medium">
                  {bookings.filter((b) => b.contract_signed && b.status !== "cancelled").length}
                </span>
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statTiles.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 + i * 0.05 }}
          >
            <Card className={cn("card-lux shadow-none", s.id === "overdue" && stats.overdue > 0 && "border-red-500/40")}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className={cn("flex size-12 items-center justify-center rounded-xl", s.bg)}>
                  <s.icon className={cn("size-6", s.tint)} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="font-display text-3xl">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* overdue alert */}
      {overdue.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="overflow-hidden rounded-2xl border border-red-500/40 bg-red-500/8"
        >
          <div className="flex items-center gap-2 border-b border-red-500/20 bg-red-500/10 px-4 py-2.5">
            <TriangleAlert className="size-4 text-red-600" />
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">
              {overdue.length === 1
                ? tr("bookings.overdue.one", "{n} booking is past the ideal book-by date", { n: overdue.length })
                : tr("bookings.overdue.many", "{n} bookings are past the ideal book-by date", { n: overdue.length })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 p-3">
            {overdue.map((b) => (
              <button
                key={b.id}
                onClick={() => openEdit(b)}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-card px-3 py-1.5 text-sm transition-colors hover:bg-red-500/10"
              >
                <CategoryIcon name={categoryMeta(b.category).icon} className="size-3.5 text-red-600" />
                {tr("bcat." + b.category, b.category)}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* upcoming trials & fittings timeline */}
      {milestones.length > 0 && (
        <Card className="card-lux shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg font-normal">
              <Scissors className="size-5 text-gold" /> {tr("bookings.milestones.title", "Upcoming trials, tastings & fittings")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {milestones.map((m, i) => (
                <button
                  key={`${m.booking.id}-${m.kind}`}
                  onClick={() => openEdit(m.booking)}
                  className="relative flex w-52 shrink-0 flex-col gap-2 rounded-xl border bg-gradient-to-br from-gold-soft/50 to-transparent p-4 text-left transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      {m.kind === "trial"
                        ? tr("bookings.milestones.trial", "Trial / Tasting")
                        : tr("bookings.milestones.fitting", "Fitting")}
                    </span>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {m.daysAway === 0 ? tr("misc.today", "Today") : `${m.daysAway}d`}
                    </span>
                  </div>
                  <p className="text-sm font-semibold leading-tight">
                    {m.booking.vendor_name ?? tr("bcat." + m.booking.category, m.booking.category)}
                  </p>
                  <p className="text-xs text-muted-foreground">{tr("bcat." + m.booking.category, m.booking.category)}</p>
                  <p className="mt-auto flex items-center gap-1 text-xs font-medium">
                    <CalendarClock className="size-3.5 text-gold" />
                    {formatDate(m.date, "EEE, d MMM")}
                  </p>
                  {i === 0 && (
                    <span className="absolute -right-1 -top-1 flex size-3">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold opacity-60" />
                      <span className="relative inline-flex size-3 rounded-full bg-gold" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* view switch */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl">{tr("bookings.coverage", "Category coverage")}</h2>
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="board">{tr("bookings.tab.board", "Board")}</TabsTrigger>
            <TabsTrigger value="list">{tr("bookings.tab.list", "All bookings")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "board" ? (
        <CategoryBoard onOpenBooking={openEdit} onAddForCategory={openAdd} />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={tr("bookings.empty.title", "No bookings yet")}
          hint={tr("bookings.empty.hint", "Add your first vendor booking to start tracking.")}
          action={isAdmin ? <Button onClick={() => openAdd()}><Plus className="size-4" /> {tr("action.addBooking", "Add booking")}</Button> : undefined}
        />
      ) : (
        <div className="space-y-3">
          {sortedBookings.map((b) => {
            const urgency = bookingUrgency(b, weddingDate);
            const meta = BOOKING_URGENCY_META[urgency];
            const fn = b.event_id ? events.find((e) => e.id === b.event_id)?.name : null;
            return (
              <Card key={b.id} className="card-lux overflow-hidden shadow-none">
                <div className="flex">
                  <span className="w-1.5 shrink-0" style={{ background: meta.ring }} />
                  <CardContent className="flex flex-1 flex-col gap-3 py-4 lg:flex-row lg:items-center">
                    {/* identity */}
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div
                        className="flex size-11 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: `${meta.ring}1f`, color: meta.ring }}
                      >
                        <CategoryIcon name={categoryMeta(b.category).icon} className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{b.vendor_name ?? tr("bcat." + b.category, b.category)}</p>
                          {b.contract_signed && (
                            <Badge variant="outline" className="gap-1 border-primary/30 text-primary dark:text-primary">
                              <FileSignature className="size-3" /> {tr("bookings.badge.signed", "Signed")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {tr("bcat." + b.category, b.category)}{fn ? ` · ${fn}` : ""}
                          {!isSecured(b.status) && (
                            <span className={cn("ml-1 font-medium", meta.text)}>
                              · {tr("burgency." + urgency, meta.label)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* stepper */}
                    <div className="w-full lg:w-64">
                      <StatusStepper
                        status={b.status}
                        size="sm"
                        onChange={isAdmin ? (s) => setStatus(b, s) : undefined}
                      />
                    </div>

                    {/* actions */}
                    <div className="flex shrink-0 items-center gap-1">
                      {b.contact_phone && (
                        <>
                          <a
                            href={`tel:${b.contact_phone}`}
                            className="inline-flex size-8 items-center justify-center rounded-full border text-muted-foreground hover:bg-accent"
                            aria-label={tr("action.call", "Call")}
                          >
                            <Phone className="size-3.5" />
                          </a>
                          <a
                            href={whatsappLink(
                              b.contact_phone,
                              tr("wa.booking", "Hi{who}! Regarding {category} for our wedding —", {
                                who: b.contact_person ? ` ${b.contact_person}` : "",
                                category: tr("bcat." + b.category, b.category),
                              })
                            )}
                            target="_blank" rel="noreferrer"
                            className="inline-flex size-8 items-center justify-center rounded-full border text-primary hover:bg-primary/10 dark:text-primary"
                            aria-label={tr("action.whatsapp", "WhatsApp")}
                          >
                            <MessageCircle className="size-3.5" />
                          </a>
                        </>
                      )}
                      {isAdmin && (
                        <Button size="sm" variant="outline" onClick={() => openEdit(b)}>
                          {tr("action.edit", "Edit")}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <BookingDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog({ ...dialog, open })}
        booking={dialog.booking}
        defaultCategory={dialog.category}
      />
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><ClipboardList className="size-6 animate-pulse text-muted-foreground" /></div>}>
      <BookingsPageInner />
    </Suspense>
  );
}
