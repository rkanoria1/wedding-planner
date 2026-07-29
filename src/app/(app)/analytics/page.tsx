"use client";

import { useMemo } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { format, parseISO, startOfMonth } from "date-fns";
import { useWedding } from "@/lib/data-context";
import { formatMoney, isOpen } from "@/lib/wedding";
import { AXIS_PROPS, ChartTooltip, GRID_PROPS, seriesColor } from "@/components/charts/chart-kit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AnalyticsPage() {
  const { events, tasks, expenses, guests, shoppingItems, settings } = useWedding();
  const currency = settings.currency;

  /* tasks per event: done vs open */
  const taskByEvent = useMemo(() => {
    const active = events.filter((e) => !e.archived);
    const rows = active.map((e) => {
      const evTasks = tasks.filter((t) => t.event_id === e.id && t.status !== "cancelled");
      return {
        name: e.name,
        Completed: evTasks.filter((t) => t.status === "completed").length,
        Open: evTasks.filter(isOpen).length,
      };
    });
    const general = tasks.filter((t) => t.event_id === null && t.status !== "cancelled");
    if (general.length) {
      rows.push({
        name: "General",
        Completed: general.filter((t) => t.status === "completed").length,
        Open: general.filter(isOpen).length,
      });
    }
    return rows;
  }, [events, tasks]);

  /* cumulative spend over time */
  const spendOverTime = useMemo(() => {
    const paid = expenses
      .filter((e) => e.paid && e.paid_on)
      .sort((a, b) => a.paid_on!.localeCompare(b.paid_on!));
    const byMonth = new Map<string, number>();
    for (const e of paid) {
      const key = format(startOfMonth(parseISO(e.paid_on!)), "yyyy-MM-dd");
      byMonth.set(key, (byMonth.get(key) ?? 0) + Number(e.amount));
    }
    let running = 0;
    return [...byMonth.entries()].map(([month, amt]) => {
      running += amt;
      return { month: format(parseISO(month), "MMM yy"), "Total spent": running };
    });
  }, [expenses]);

  /* rsvp breakdown (heads) */
  const rsvpData = useMemo(() => {
    const buckets = { Confirmed: 0, Pending: 0, Maybe: 0, Declined: 0 };
    for (const g of guests) {
      if (g.rsvp === "confirmed") buckets.Confirmed += g.head_count;
      else if (g.rsvp === "pending") buckets.Pending += g.head_count;
      else if (g.rsvp === "maybe") buckets.Maybe += g.head_count;
      else buckets.Declined += g.head_count;
    }
    return Object.entries(buckets)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [guests]);

  /* shopping by category */
  const shoppingByCat = useMemo(() => {
    const map = new Map<string, { category: string; Purchased: number; Pending: number }>();
    for (const i of shoppingItems) {
      const row = map.get(i.category) ?? { category: i.category, Purchased: 0, Pending: 0 };
      if (i.purchased) row.Purchased += 1;
      else row.Pending += 1;
      map.set(i.category, row);
    }
    return [...map.values()].sort(
      (a, b) => b.Purchased + b.Pending - (a.Purchased + a.Pending)
    );
  }, [shoppingItems]);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div>
        <h1 className="font-display text-3xl">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          The full picture across tasks, money, guests and shopping.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="card-lux shadow-none">
          <CardHeader>
            <CardTitle className="font-display text-lg font-normal">Task progress by event</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskByEvent} barGap={2}>
                <CartesianGrid {...GRID_PROPS} />
                <XAxis dataKey="name" {...AXIS_PROPS} />
                <YAxis {...AXIS_PROPS} allowDecimals={false} width={30} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Completed" stackId="a" fill={seriesColor(0)} maxBarSize={36} />
                <Bar dataKey="Open" stackId="a" fill={seriesColor(1)} radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-lux shadow-none">
          <CardHeader>
            <CardTitle className="font-display text-lg font-normal">Cumulative spend</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {spendOverTime.length === 0 ? (
              <p className="pt-24 text-center text-sm text-muted-foreground">No paid expenses yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spendOverTime}>
                  <defs>
                    <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...GRID_PROPS} />
                  <XAxis dataKey="month" {...AXIS_PROPS} />
                  <YAxis {...AXIS_PROPS} tickFormatter={(v: number) => `${Math.round(v / 100000)}L`} width={35} />
                  <Tooltip content={<ChartTooltip formatter={(v) => formatMoney(v, currency)} />} />
                  <Area
                    type="monotone" dataKey="Total spent"
                    stroke="var(--chart-1)" strokeWidth={2}
                    fill="url(#spendFill)"
                    dot={{ r: 3, fill: "var(--chart-1)" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="card-lux shadow-none">
          <CardHeader>
            <CardTitle className="font-display text-lg font-normal">RSVP heads</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {rsvpData.length === 0 ? (
              <p className="pt-24 text-center text-sm text-muted-foreground">No guests yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Pie
                    data={rsvpData} dataKey="value" nameKey="name"
                    innerRadius="55%" outerRadius="80%"
                    paddingAngle={2} stroke="var(--card)" strokeWidth={2}
                  >
                    {rsvpData.map((_, i) => (
                      <Cell key={i} fill={seriesColor(i)} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="card-lux shadow-none">
          <CardHeader>
            <CardTitle className="font-display text-lg font-normal">Shopping by category</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {shoppingByCat.length === 0 ? (
              <p className="pt-24 text-center text-sm text-muted-foreground">No shopping items yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shoppingByCat} layout="vertical" barGap={2}>
                  <CartesianGrid {...GRID_PROPS} vertical horizontal={false} />
                  <XAxis type="number" {...AXIS_PROPS} allowDecimals={false} />
                  <YAxis type="category" dataKey="category" {...AXIS_PROPS} width={95} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Purchased" stackId="a" fill={seriesColor(0)} maxBarSize={16} />
                  <Bar dataKey="Pending" stackId="a" fill={seriesColor(1)} radius={[0, 4, 4, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
