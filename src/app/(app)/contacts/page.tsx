"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Phone, PhoneCall } from "lucide-react";
import { useWedding } from "@/lib/data-context";
import { categoryMeta } from "@/lib/bookings";
import { EVENT_THEMES, whatsappLink } from "@/lib/wedding";
import { CategoryIcon } from "@/components/bookings/category-icon";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

interface Contact {
  key: string;
  name: string;      // vendor / business name
  role: string;      // category
  person: string | null;
  phone: string;
  icon: string;      // booking-category icon
}

/**
 * Day-of contacts — a one-tap "who to call" directory, grouped by function.
 * Pulls contacts already entered on Bookings and Vendors (no new data).
 */
export default function ContactsPage() {
  const { bookings, vendors, events } = useWedding();

  const groups = useMemo(() => {
    const byEvent = new Map<string, Contact[]>();
    const add = (eventKey: string, c: Contact) => {
      const list = byEvent.get(eventKey) ?? [];
      list.push(c);
      byEvent.set(eventKey, list);
    };

    for (const b of bookings) {
      if (!b.contact_phone || b.status === "cancelled") continue;
      add(b.event_id ?? "general", {
        key: `b-${b.id}`,
        name: b.vendor_name ?? b.category,
        role: b.category,
        person: b.contact_person,
        phone: b.contact_phone,
        icon: categoryMeta(b.category).icon,
      });
    }
    for (const v of vendors) {
      if (!v.phone) continue;
      add("general", {
        key: `v-${v.id}`,
        name: v.name,
        role: v.category,
        person: null,
        phone: v.phone,
        icon: categoryMeta(v.category).icon,
      });
    }

    // order: each function (by sort_order), then general last
    const ordered = [...events]
      .filter((e) => !e.archived && byEvent.has(e.id))
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((e) => ({ id: e.id, name: e.name, theme: e.theme, contacts: byEvent.get(e.id)! }));
    if (byEvent.has("general")) {
      ordered.push({ id: "general", name: "General", theme: "emerald", contacts: byEvent.get("general")! });
    }
    return ordered;
  }, [bookings, vendors, events]);

  const total = groups.reduce((s, g) => s + g.contacts.length, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="card-lux relative overflow-hidden p-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(480px 180px at 88% -30%, color-mix(in oklch, var(--gold) 18%, transparent), transparent 70%)",
          }}
        />
        <div className="relative flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
          <PhoneCall className="size-4 text-gold" /> Day-of Contacts
        </div>
        <h1 className="relative mt-1 font-display text-3xl">Who to call, in one tap</h1>
        <p className="relative mt-1 max-w-lg text-sm text-muted-foreground">
          Every vendor and point-of-contact you&apos;ve saved, grouped by function —
          so on the day, anyone can call or WhatsApp without hunting for numbers.
        </p>
      </div>

      {total === 0 ? (
        <EmptyState
          icon={PhoneCall}
          title="No contacts yet"
          hint="Add a phone number to your bookings or vendors and they'll appear here automatically."
        />
      ) : (
        groups.map((g) => (
          <section key={g.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ background: EVENT_THEMES[g.theme as keyof typeof EVENT_THEMES]?.chip ?? "var(--primary)" }}
              />
              <h2 className="font-display text-xl">{g.name}</h2>
              <span className="text-xs text-muted-foreground">· {g.contacts.length}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {g.contacts.map((c, i) => (
                <motion.div
                  key={c.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
                  className="card-lux flex items-center gap-3 p-3.5"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <CategoryIcon name={c.icon} className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.role}{c.person ? ` · ${c.person}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <a
                      href={`tel:${c.phone}`}
                      className={cn(
                        "inline-flex size-9 items-center justify-center rounded-full border text-muted-foreground",
                        "hover:bg-accent"
                      )}
                      aria-label={`Call ${c.name}`}
                    >
                      <Phone className="size-4" />
                    </a>
                    <a
                      href={whatsappLink(c.phone, `Hi${c.person ? ` ${c.person}` : ""}! Regarding ${c.role} for Rahul & Somya's wedding —`)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex size-9 items-center justify-center rounded-full border text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400"
                      aria-label={`WhatsApp ${c.name}`}
                    >
                      <MessageCircle className="size-4" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
