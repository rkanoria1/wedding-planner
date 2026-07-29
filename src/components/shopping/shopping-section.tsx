"use client";

import { useMemo, useRef, useState } from "react";
import {
  CheckCircle2, Circle, Paperclip, Plus, ShoppingBag, Trash2, Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useWedding } from "@/lib/data-context";
import type { ShoppingItem } from "@/lib/types";
import { formatMoney, shoppingProgress } from "@/lib/wedding";
import { GradientBar } from "@/components/shared/gradient-bar";
import { MemberAvatar } from "@/components/shared/member-avatars";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

export const SHOPPING_CATEGORIES = [
  "Clothes", "Jewelry", "Decorations", "Flowers", "Food", "Return Gifts",
  "Wedding Cards", "Stage", "Lighting", "Makeup", "Footwear", "Gifts", "Other",
];

export function ShoppingSection({ eventId, openNew = false }: { eventId?: string | null; openNew?: boolean }) {
  const {
    db, me, isAdmin, shoppingItems, events, profiles, settings, refresh, logActivity, notify,
  } = useWedding();
  const currency = settings.currency;
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const scoped = useMemo(
    () =>
      shoppingItems.filter((i) => {
        if (eventId !== undefined && i.event_id !== eventId) return false;
        if (catFilter !== "all" && i.category !== catFilter) return false;
        if (statusFilter === "purchased" && !i.purchased) return false;
        if (statusFilter === "pending" && i.purchased) return false;
        return true;
      }),
    [shoppingItems, eventId, catFilter, statusFilter]
  );
  const scopedAll = useMemo(
    () => shoppingItems.filter((i) => (eventId === undefined ? true : i.event_id === eventId)),
    [shoppingItems, eventId]
  );

  const totalBudget = scopedAll.reduce((s, i) => s + Number(i.budget), 0);
  const totalSpent = scopedAll
    .filter((i) => i.purchased)
    .reduce((s, i) => s + Number(i.actual_price ?? 0), 0);

  /* ————— dialog ————— */
  const empty = {
    id: "", name: "", category: "Clothes", quantity: "1", budget: "",
    actual_price: "", store: "", assigned_to: "none",
    event_id: eventId ?? "none", notes: "",
  };
  const [dialogOpen, setDialogOpen] = useState(openNew);
  const [form, setForm] = useState(empty);
  const editing = Boolean(form.id);

  function openEdit(item: ShoppingItem) {
    setForm({
      id: item.id, name: item.name, category: item.category,
      quantity: String(item.quantity), budget: String(item.budget),
      actual_price: item.actual_price != null ? String(item.actual_price) : "",
      store: item.store ?? "", assigned_to: item.assigned_to ?? "none",
      event_id: item.event_id ?? "none", notes: item.notes ?? "",
    });
    setDialogOpen(true);
  }

  function canEditItem(item: ShoppingItem) {
    return isAdmin || item.assigned_to === me?.id;
  }

  async function save() {
    if (!form.name.trim()) return toast.error("Item needs a name");
    const payload = {
      name: form.name.trim(),
      category: form.category,
      quantity: Number(form.quantity) || 1,
      budget: Number(form.budget) || 0,
      actual_price: form.actual_price === "" ? null : Number(form.actual_price),
      store: form.store.trim() || null,
      assigned_to: form.assigned_to === "none" ? null : form.assigned_to,
      event_id: form.event_id === "none" ? null : form.event_id,
      notes: form.notes.trim() || null,
    };
    if (editing) {
      const { error } = await db.from("shopping_items").update(payload).eq("id", form.id);
      if (error) return toast.error(error.message);
      await logActivity("updated", "shopping_item", payload.name, form.id);
    } else {
      const { error } = await db.from("shopping_items").insert(payload);
      if (error) return toast.error(error.message);
      await logActivity("added", "shopping_item", payload.name);
      if (payload.assigned_to && payload.assigned_to !== me?.id) {
        notify(payload.assigned_to, "Shopping assigned to you", payload.name, "/shopping");
      }
    }
    refresh("shopping_items");
    setDialogOpen(false);
    setForm(empty);
    toast.success(editing ? "Item updated" : "Item added");
  }

  async function togglePurchased(item: ShoppingItem) {
    if (!canEditItem(item)) return toast.error("Only admins or the assigned member can update this");
    const { error } = await db
      .from("shopping_items")
      .update({ purchased: !item.purchased })
      .eq("id", item.id);
    if (error) return toast.error(error.message);
    if (!item.purchased) {
      await logActivity("purchased", "shopping_item", `${item.name}${item.actual_price ? ` — ${formatMoney(Number(item.actual_price), currency)}` : ""}`, item.id);
    }
    refresh("shopping_items");
  }

  async function remove(item: ShoppingItem) {
    await db.from("shopping_items").delete().eq("id", item.id);
    await logActivity("deleted", "shopping_item", item.name);
    refresh("shopping_items");
  }

  async function uploadReceipt(item: ShoppingItem, file: File) {
    const path = `${item.id}/${Date.now()}-${file.name}`;
    const { error } = await db.storage.from("receipts").upload(path, file);
    if (error) return toast.error(error.message);
    const { data } = db.storage.from("receipts").getPublicUrl(path);
    await db.from("shopping_items").update({ receipt_url: data.publicUrl }).eq("id", item.id);
    refresh("shopping_items");
    toast.success("Receipt attached");
  }

  const eventName = (id: string | null) =>
    id ? events.find((e) => e.id === id)?.name ?? "—" : "General";

  return (
    <div className="space-y-5">
      {/* summary */}
      <Card className="card-lux shadow-none">
        <CardContent className="flex flex-wrap items-center gap-6 pt-6">
          <div>
            <p className="text-xs text-muted-foreground">Purchased</p>
            <p className="font-display text-2xl">
              {scopedAll.filter((i) => i.purchased).length}/{scopedAll.length}
            </p>
          </div>
          <div className="min-w-40 flex-1">
            <GradientBar value={shoppingProgress(scopedAll)} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Budgeted</p>
            <p className="font-display text-xl">{formatMoney(totalBudget, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Spent</p>
            <p className="font-display text-xl">{formatMoney(totalSpent, currency)}</p>
          </div>
        </CardContent>
      </Card>

      {/* filters + add */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {SHOPPING_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All items</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="purchased">Purchased</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        {isAdmin && (
          <Button onClick={() => { setForm(empty); setDialogOpen(true); }}>
            <Plus className="size-4" /> Add item
          </Button>
        )}
      </div>

      {/* table */}
      {scoped.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="Nothing here yet" hint="Add items to build the trousseau." />
      ) : (
        <div className="card-lux overflow-x-auto scrollbar-thin">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                {eventId === undefined && <TableHead>Event</TableHead>}
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Receipt</TableHead>
                {isAdmin && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {scoped.map((item) => {
                const assignee = profiles.find((p) => p.id === item.assigned_to);
                return (
                  <TableRow
                    key={item.id}
                    className={item.purchased ? "opacity-70" : ""}
                  >
                    <TableCell>
                      <button
                        onClick={() => togglePurchased(item)}
                        aria-label={item.purchased ? "Mark pending" : "Mark purchased"}
                      >
                        {item.purchased ? (
                          <CheckCircle2 className="size-5 text-emerald-600" />
                        ) : (
                          <Circle className="size-5 text-muted-foreground/50" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <button
                        className="text-left font-medium hover:underline"
                        onClick={() => canEditItem(item) && openEdit(item)}
                      >
                        {item.name}
                      </button>
                      {item.notes && (
                        <p className="max-w-44 truncate text-xs text-muted-foreground">{item.notes}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.category}</Badge>
                    </TableCell>
                    {eventId === undefined && (
                      <TableCell className="text-sm text-muted-foreground">
                        {eventName(item.event_id)}
                      </TableCell>
                    )}
                    <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(Number(item.budget), currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.actual_price != null ? formatMoney(Number(item.actual_price), currency) : "—"}
                    </TableCell>
                    <TableCell className="max-w-32 truncate text-sm text-muted-foreground">
                      {item.store ?? "—"}
                    </TableCell>
                    <TableCell>
                      {assignee ? <MemberAvatar profile={assignee} /> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {item.receipt_url ? (
                        <a
                          href={item.receipt_url} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <Paperclip className="size-3.5" /> View
                        </a>
                      ) : canEditItem(item) ? (
                        <button
                          onClick={() => { setUploadingFor(item.id); fileRef.current?.click(); }}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Upload className="size-3.5" /> Attach
                        </button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Button
                          size="icon" variant="ghost" className="size-7 text-destructive" aria-label="Delete"
                          onClick={() => remove(item)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* hidden receipt input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          const item = scoped.find((i) => i.id === uploadingFor);
          if (f && item) uploadReceipt(item, f);
          e.target.value = "";
        }}
      />

      {/* add/edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display font-normal">
              {editing ? "Edit item" : "Add shopping item"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Item name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SHOPPING_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Budget ({currency})</Label>
              <Input type="number" min={0} value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Actual price ({currency})</Label>
              <Input type="number" min={0} value={form.actual_price} onChange={(e) => setForm({ ...form, actual_price: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Store</Label>
              <Input value={form.store} onChange={(e) => setForm({ ...form, store: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Assigned to</Label>
              <Select value={form.assigned_to} onValueChange={(v) => setForm({ ...form, assigned_to: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {eventId === undefined && (
              <div className="col-span-2 space-y-2">
                <Label>Event</Label>
                <Select value={form.event_id} onValueChange={(v) => setForm({ ...form, event_id: v })}>
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
            <div className="col-span-2 space-y-2">
              <Label>Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <Button className="col-span-2" onClick={save}>
              {editing ? "Save changes" : "Add item"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
