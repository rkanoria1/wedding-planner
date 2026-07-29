"use client";

import { useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import {
  Check, CircleDollarSign, Pencil, PiggyBank, Plus, Trash2, Wallet, X,
} from "lucide-react";
import { toast } from "sonner";
import { useWedding } from "@/lib/data-context";
import type { PaymentKind } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/wedding";
import { AXIS_PROPS, ChartTooltip, GRID_PROPS, seriesColor } from "@/components/charts/chart-kit";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const BUDGET_CATEGORIES = [
  "Venue", "Catering", "Food", "Decorations", "Flowers", "Clothes", "Jewelry",
  "Photography", "Makeup", "Mehendi Artist", "Music", "DJ", "Stage", "Lighting",
  "Wedding Cards", "Return Gifts", "Transport", "Gifts", "General",
];

const KIND_LABEL: Record<PaymentKind, string> = {
  expense: "Expense",
  advance: "Advance",
  vendor_payment: "Vendor payment",
};

/** Budget module. Scope with eventId (string = that event, null = general-only, undefined = everything). */
export function BudgetSection({ eventId, openNew = false }: { eventId?: string | null; openNew?: boolean }) {
  const {
    db, isAdmin, budgets, expenses, events, vendors, settings, refresh, logActivity,
  } = useWedding();
  const currency = settings.currency;

  const scopedBudgets = useMemo(
    () => budgets.filter((b) => (eventId === undefined ? true : b.event_id === eventId)),
    [budgets, eventId]
  );
  const scopedExpenses = useMemo(
    () => expenses.filter((e) => (eventId === undefined ? true : e.event_id === eventId)),
    [expenses, eventId]
  );

  const allocated = scopedBudgets.reduce((s, b) => s + Number(b.allocated), 0);
  const spent = scopedExpenses.filter((e) => e.paid).reduce((s, e) => s + Number(e.amount), 0);
  const pending = scopedExpenses.filter((e) => !e.paid).reduce((s, e) => s + Number(e.amount), 0);

  /* per-category chart data */
  const byCategory = useMemo(() => {
    const map = new Map<string, { category: string; Allocated: number; Spent: number }>();
    for (const b of scopedBudgets) {
      const row = map.get(b.category) ?? { category: b.category, Allocated: 0, Spent: 0 };
      row.Allocated += Number(b.allocated);
      map.set(b.category, row);
    }
    for (const e of scopedExpenses.filter((e) => e.paid)) {
      const row = map.get(e.category) ?? { category: e.category, Allocated: 0, Spent: 0 };
      row.Spent += Number(e.amount);
      map.set(e.category, row);
    }
    return [...map.values()].sort((a, b) => b.Allocated - a.Allocated);
  }, [scopedBudgets, scopedExpenses]);

  const donut = byCategory
    .filter((c) => c.Spent > 0)
    .map((c) => ({ name: c.category, value: c.Spent }));

  /* ————— expense dialog ————— */
  const [expenseOpen, setExpenseOpen] = useState(openNew);
  const [expForm, setExpForm] = useState({
    description: "", category: "General", amount: "",
    kind: "expense" as PaymentKind,
    event_id: eventId ?? "none", vendor_id: "none",
    paid: true, paid_on: new Date().toISOString().slice(0, 10),
  });

  async function addExpense() {
    if (!expForm.description.trim() || !expForm.amount) {
      return toast.error("Description and amount are required");
    }
    const { error } = await db.from("expenses").insert({
      description: expForm.description.trim(),
      category: expForm.category,
      amount: Number(expForm.amount),
      kind: expForm.kind,
      event_id: expForm.event_id === "none" ? null : expForm.event_id,
      vendor_id: expForm.vendor_id === "none" ? null : expForm.vendor_id,
      paid: expForm.paid,
      paid_on: expForm.paid_on || null,
    });
    if (error) return toast.error(error.message);
    await logActivity("added", "expense", `${expForm.description} — ${formatMoney(Number(expForm.amount), currency)}`);
    refresh("expenses");
    setExpenseOpen(false);
    setExpForm({ ...expForm, description: "", amount: "" });
    toast.success("Expense recorded");
  }

  async function togglePaid(id: string, paid: boolean) {
    await db.from("expenses").update({ paid }).eq("id", id);
    refresh("expenses");
  }

  async function deleteExpense(id: string, description: string) {
    await db.from("expenses").delete().eq("id", id);
    await logActivity("deleted", "expense", description);
    refresh("expenses");
  }

  /* ————— allocation editor ————— */
  const [allocOpen, setAllocOpen] = useState(false);
  const [allocForm, setAllocForm] = useState({ category: "Venue", allocated: "" });
  const [editingAlloc, setEditingAlloc] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  async function addAllocation() {
    if (!allocForm.allocated) return toast.error("Enter an amount");
    const { error } = await db.from("budgets").insert({
      event_id: eventId ?? null,
      category: allocForm.category,
      allocated: Number(allocForm.allocated),
    });
    if (error) return toast.error(error.message);
    refresh("budgets");
    setAllocOpen(false);
    setAllocForm({ category: "Venue", allocated: "" });
    toast.success("Budget added");
  }

  async function saveAllocation(id: string) {
    await db.from("budgets").update({ allocated: Number(editValue) }).eq("id", id);
    refresh("budgets");
    setEditingAlloc(null);
  }

  async function deleteAllocation(id: string) {
    await db.from("budgets").delete().eq("id", id);
    refresh("budgets");
  }

  const eventName = (id: string | null) =>
    id ? events.find((e) => e.id === id)?.name ?? "—" : "General";
  const vendorName = (id: string | null) =>
    id ? vendors.find((v) => v.id === id)?.name ?? "—" : null;

  return (
    <div className="space-y-6">
      {/* stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Allocated", value: allocated, icon: Wallet, tint: "text-primary" },
          { label: "Spent", value: spent, icon: CircleDollarSign, tint: "text-gold" },
          { label: "Remaining", value: Math.max(0, allocated - spent), icon: PiggyBank, tint: "text-chart-3" },
          { label: "Pending payments", value: pending, icon: CircleDollarSign, tint: "text-chart-4" },
        ].map((s) => (
          <Card key={s.label} className="card-lux shadow-none">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
                <s.icon className={`size-5 ${s.tint}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-display text-2xl">{formatMoney(s.value, currency)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* charts */}
      {byCategory.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-5">
          <Card className="card-lux shadow-none lg:col-span-3">
            <CardHeader>
              <CardTitle className="font-display text-lg font-normal">
                Allocated vs spent by category
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCategory.slice(0, 8)} barGap={2}>
                  <CartesianGrid {...GRID_PROPS} />
                  <XAxis dataKey="category" {...AXIS_PROPS} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis {...AXIS_PROPS} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} width={40} />
                  <Tooltip
                    content={<ChartTooltip formatter={(v) => formatMoney(v, currency)} />}
                    cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Allocated" fill={seriesColor(0)} radius={[4, 4, 0, 0]} maxBarSize={22} />
                  <Bar dataKey="Spent" fill={seriesColor(1)} radius={[4, 4, 0, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="card-lux shadow-none lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-display text-lg font-normal">Spend breakdown</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {donut.length === 0 ? (
                <p className="pt-16 text-center text-sm text-muted-foreground">No spending yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<ChartTooltip formatter={(v) => formatMoney(v, currency)} />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Pie
                      data={donut} dataKey="value" nameKey="name"
                      innerRadius="55%" outerRadius="80%"
                      paddingAngle={2} stroke="var(--card)" strokeWidth={2}
                    >
                      {donut.map((_, i) => (
                        <Cell key={i} fill={seriesColor(i)} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* allocations */}
      <Card className="card-lux shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="font-display text-lg font-normal">Budget allocations</CardTitle>
          {isAdmin && (
            <Dialog open={allocOpen} onOpenChange={setAllocOpen}>
              <DialogTrigger render={<Button size="sm" variant="outline" />}>
                <Plus className="size-4" /> Allocate
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle className="font-display font-normal">New allocation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={allocForm.category} onValueChange={(v) => setAllocForm({ ...allocForm, category: v })}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {BUDGET_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount ({currency})</Label>
                    <Input
                      type="number" min={0} value={allocForm.allocated}
                      onChange={(e) => setAllocForm({ ...allocForm, allocated: e.target.value })}
                    />
                  </div>
                  <Button className="w-full" onClick={addAllocation}>Add allocation</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {scopedBudgets.length === 0 ? (
            <EmptyState icon={Wallet} title="No budget set" hint="Allocate amounts per category to start tracking." />
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    {eventId === undefined && <TableHead>Event</TableHead>}
                    <TableHead className="text-right">Allocated</TableHead>
                    <TableHead className="text-right">Spent</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    {isAdmin && <TableHead className="w-20" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scopedBudgets.map((b) => {
                    const catSpent = scopedExpenses
                      .filter((e) => e.paid && e.category === b.category && e.event_id === b.event_id)
                      .reduce((s, e) => s + Number(e.amount), 0);
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.category}</TableCell>
                        {eventId === undefined && (
                          <TableCell className="text-sm text-muted-foreground">{eventName(b.event_id)}</TableCell>
                        )}
                        <TableCell className="text-right tabular-nums">
                          {editingAlloc === b.id ? (
                            <div className="flex items-center justify-end gap-1">
                              <Input
                                type="number" value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="h-7 w-28 text-right"
                              />
                              <Button size="icon" variant="ghost" className="size-7" onClick={() => saveAllocation(b.id)}>
                                <Check className="size-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="size-7" onClick={() => setEditingAlloc(null)}>
                                <X className="size-3.5" />
                              </Button>
                            </div>
                          ) : (
                            formatMoney(Number(b.allocated), currency)
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatMoney(catSpent, currency)}</TableCell>
                        <TableCell className={`text-right tabular-nums ${Number(b.allocated) - catSpent < 0 ? "text-destructive font-medium" : ""}`}>
                          {formatMoney(Number(b.allocated) - catSpent, currency)}
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon" variant="ghost" className="size-7" aria-label="Edit"
                                onClick={() => { setEditingAlloc(b.id); setEditValue(String(b.allocated)); }}
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                size="icon" variant="ghost" className="size-7 text-destructive" aria-label="Delete"
                                onClick={() => deleteAllocation(b.id)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* expenses */}
      <Card className="card-lux shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="font-display text-lg font-normal">Expense history</CardTitle>
          {isAdmin && (
            <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
              <DialogTrigger render={<Button size="sm" />}>
                <Plus className="size-4" /> Add expense
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display font-normal">Record expense</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={expForm.description}
                      onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                      placeholder="e.g. Decor advance for Haldi"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount ({currency})</Label>
                    <Input
                      type="number" min={0} value={expForm.amount}
                      onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={expForm.category} onValueChange={(v) => setExpForm({ ...expForm, category: v })}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {BUDGET_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={expForm.kind} onValueChange={(v) => setExpForm({ ...expForm, kind: v as PaymentKind })}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(KIND_LABEL) as PaymentKind[]).map((k) => (
                          <SelectItem key={k} value={k}>{KIND_LABEL[k]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Vendor</Label>
                    <Select value={expForm.vendor_id} onValueChange={(v) => setExpForm({ ...expForm, vendor_id: v })}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No vendor</SelectItem>
                        {vendors.map((v) => (
                          <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {eventId === undefined && (
                    <div className="space-y-2">
                      <Label>Event</Label>
                      <Select value={expForm.event_id} onValueChange={(v) => setExpForm({ ...expForm, event_id: v })}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">General</SelectItem>
                          {events.filter((e) => !e.archived).map((e) => (
                            <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date" value={expForm.paid_on}
                      onChange={(e) => setExpForm({ ...expForm, paid_on: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <Checkbox
                      id="paid" checked={expForm.paid}
                      onCheckedChange={(v) => setExpForm({ ...expForm, paid: Boolean(v) })}
                    />
                    <Label htmlFor="paid">Already paid</Label>
                  </div>
                  <Button className="col-span-2" onClick={addExpense}>Save expense</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {scopedExpenses.length === 0 ? (
            <EmptyState icon={CircleDollarSign} title="No expenses yet" hint="Record advances and payments as they happen." />
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    {eventId === undefined && <TableHead>Event</TableHead>}
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead className="w-10" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scopedExpenses.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="max-w-52">
                        <p className="truncate font-medium">{e.description}</p>
                        {vendorName(e.vendor_id) && (
                          <p className="text-xs text-muted-foreground">{vendorName(e.vendor_id)}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.category}</TableCell>
                      {eventId === undefined && (
                        <TableCell className="text-sm text-muted-foreground">{eventName(e.event_id)}</TableCell>
                      )}
                      <TableCell>
                        <Badge variant="outline">{KIND_LABEL[e.kind]}</Badge>
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">{formatDate(e.paid_on)}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatMoney(Number(e.amount), currency)}
                      </TableCell>
                      <TableCell>
                        {isAdmin ? (
                          <button
                            onClick={() => togglePaid(e.id, !e.paid)}
                            className={`rounded-full border px-2 py-0.5 text-xs transition-colors ${
                              e.paid
                                ? "border-primary/30 bg-primary/10 text-primary dark:text-primary"
                                : "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                            }`}
                          >
                            {e.paid ? "Paid" : "Pending"}
                          </button>
                        ) : (
                          <Badge variant="outline">{e.paid ? "Paid" : "Pending"}</Badge>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Button
                            size="icon" variant="ghost" className="size-7 text-destructive" aria-label="Delete"
                            onClick={() => deleteExpense(e.id, e.description)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
