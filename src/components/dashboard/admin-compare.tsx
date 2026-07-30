"use client";

import { motion } from "framer-motion";
import { GitCompareArrows } from "lucide-react";
import { useWedding } from "@/lib/data-context";
import { GradientBar } from "@/components/shared/gradient-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const HOUSEHOLDS = [
  { id: "rahul", label: "Rahul's family" },
  { id: "somya", label: "Somya's family" },
] as const;

/** Admin-only side-by-side progress for both families (shown on "Both"). */
export function AdminCompare({ delay = 0 }: { delay?: number }) {
  const { isSuperadmin, viewHousehold, tasks, bookings, guests, shoppingItems } = useWedding();
  if (!isSuperadmin || viewHousehold !== "all") return null;

  const hh = (id: string) => {
    const has = <T,>(a: T[]) => a.filter((r) => (r as { household?: string }).household === id);
    const t = has(tasks);
    const done = t.filter((x) => x.status === "completed").length;
    const b = has(bookings).filter((x) => x.status !== "cancelled");
    const secured = b.filter((x) => x.status === "booked" || x.status === "confirmed").length;
    const g = has(guests);
    const heads = g.reduce((s, x) => s + x.head_count, 0);
    const conf = g.filter((x) => x.rsvp === "confirmed").reduce((s, x) => s + x.head_count, 0);
    const sh = has(shoppingItems);
    const bought = sh.filter((x) => x.purchased).length;
    return {
      taskPct: t.length ? Math.round((done / t.length) * 100) : 0,
      done, tTotal: t.length,
      secured, bTotal: b.length,
      conf, heads,
      bought, shTotal: sh.length,
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="card-lux shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-lg font-normal">
            <GitCompareArrows className="size-5 text-gold" /> Both families at a glance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {HOUSEHOLDS.map(({ id, label }) => {
              const s = hh(id);
              return (
                <div key={id} className="rounded-xl border p-4">
                  <p className="font-display text-lg">{label}</p>
                  <div className="mt-3 space-y-3 text-sm">
                    <Row label="Tasks done" value={`${s.done}/${s.tTotal}`} pct={s.taskPct} />
                    <Row
                      label="Vendors secured"
                      value={`${s.secured}/${s.bTotal}`}
                      pct={s.bTotal ? Math.round((s.secured / s.bTotal) * 100) : 0}
                    />
                    <Row
                      label="Guest heads confirmed"
                      value={`${s.conf}/${s.heads}`}
                      pct={s.heads ? Math.round((s.conf / s.heads) * 100) : 0}
                    />
                    <Row
                      label="Shopping bought"
                      value={`${s.bought}/${s.shTotal}`}
                      pct={s.shTotal ? Math.round((s.bought / s.shTotal) * 100) : 0}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Row({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value}</span>
      </div>
      <GradientBar value={pct} className="mt-1.5 h-1.5" />
    </div>
  );
}
