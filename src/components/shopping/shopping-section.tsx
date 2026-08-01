"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2, Circle, Plus, ShoppingBag, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useWedding } from "@/lib/data-context";
import { useLang } from "@/lib/i18n";
import type { ShoppingItem } from "@/lib/types";
import { shoppingProgress } from "@/lib/wedding";
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
  const { t: tr } = useLang();
  const {
    db, me, isAdmin, shoppingItems, events, profiles, refresh, logActivity, notify,
  } = useWedding();

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

  const empty = {
    id: "", name: "", category: "Clothes", quantity: "1",
    store: "", assigned_to: "none",
    event_id: eventId ?? "none", notes: "",
  };
  const [dialogOpen, setDialogOpen] = useState(openNew);
  const [form, setForm] = useState(empty);
  const editing = Boolean(form.id);

  function openEdit(item: ShoppingItem) {
    setForm({
      id: item.id, name: item.name, category: item.category,
      quantity: String(item.quantity),
      store: item.store ?? "", assigned_to: item.assigned_to ?? "none",
      event_id: item.event_id ?? "none", notes: item.notes ?? "",
    });
    setDialogOpen(true);
  }

  function canEditItem(item: ShoppingItem) {
    return isAdmin || item.assigned_to === me?.id;
  }

  async function save() {
    if (!form.name.trim()) return toast.error(tr("shopping.toast.needName", "Item needs a name"));
    const payload = {
      name: form.name.trim(),
      category: form.category,
      quantity: Number(form.quantity) || 1,
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
        notify(payload.assigned_to, tr("shopping.notify.assigned", "Shopping assigned to you"), payload.name, "/shopping");
      }
    }
    refresh("shopping_items");
    setDialogOpen(false);
    setForm(empty);
    toast.success(editing
      ? tr("shopping.toast.updated", "Item updated")
      : tr("shopping.toast.added", "Item added"));
  }

  async function togglePurchased(item: ShoppingItem) {
    if (!canEditItem(item)) return toast.error(tr("shopping.toast.forbidden", "Only admins or the assigned member can update this"));
    const { error } = await db
      .from("shopping_items")
      .update({ purchased: !item.purchased })
      .eq("id", item.id);
    if (error) return toast.error(error.message);
    if (!item.purchased) {
      await logActivity("purchased", "shopping_item", item.name, item.id);
    }
    refresh("shopping_items");
  }

  async function remove(item: ShoppingItem) {
    await db.from("shopping_items").delete().eq("id", item.id);
    await logActivity("deleted", "shopping_item", item.name);
    refresh("shopping_items");
  }

  const eventName = (id: string | null) =>
    id ? events.find((e) => e.id === id)?.name ?? "—" : tr("misc.general", "General");

  return (
    <div className="space-y-5">
      <Card className="card-lux shadow-none">
        <CardContent className="flex flex-wrap items-center gap-6 pt-6">
          <div>
            <p className="text-xs text-muted-foreground">{tr("shopping.bought", "Bought")}</p>
            <p className="font-display text-2xl">
              {scopedAll.filter((i) => i.purchased).length}/{scopedAll.length}
            </p>
          </div>
          <div className="min-w-40 flex-1">
            <GradientBar value={shoppingProgress(scopedAll)} />
          </div>
          <p className="text-sm text-muted-foreground">
            {tr("shopping.checklistHint", "Checklist only — tick items as they are bought.")}
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tr("shopping.filter.allCategories", "All categories")}</SelectItem>
            {SHOPPING_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{tr("shopping.cat." + c, c)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tr("shopping.filter.allItems", "All items")}</SelectItem>
            <SelectItem value="pending">{tr("shopping.filter.pending", "Pending")}</SelectItem>
            <SelectItem value="purchased">{tr("shopping.filter.bought", "Bought")}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        {isAdmin && (
          <Button onClick={() => { setForm(empty); setDialogOpen(true); }}>
            <Plus className="size-4" /> {tr("shopping.addItem", "Add item")}
          </Button>
        )}
      </div>

      {scoped.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={tr("shopping.empty.title", "Nothing here yet")}
          hint={tr("shopping.empty.hint", "Add items to build the shopping checklist.")}
        />
      ) : (
        <div className="card-lux overflow-x-auto scrollbar-thin">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>{tr("shopping.col.item", "Item")}</TableHead>
                <TableHead>{tr("shopping.col.category", "Category")}</TableHead>
                {eventId === undefined && <TableHead>{tr("shopping.col.event", "Event")}</TableHead>}
                <TableHead className="text-right">{tr("shopping.col.qty", "Qty")}</TableHead>
                <TableHead>{tr("shopping.col.store", "Store")}</TableHead>
                <TableHead>{tr("shopping.col.assigned", "Assigned")}</TableHead>
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
                        aria-label={item.purchased
                          ? tr("shopping.markPending", "Mark pending")
                          : tr("shopping.markBought", "Mark bought")}
                      >
                        {item.purchased ? (
                          <CheckCircle2 className="size-5 text-primary" />
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
                      <Badge variant="outline">{tr("shopping.cat." + item.category, item.category)}</Badge>
                    </TableCell>
                    {eventId === undefined && (
                      <TableCell className="text-sm text-muted-foreground">
                        {eventName(item.event_id)}
                      </TableCell>
                    )}
                    <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                    <TableCell className="max-w-32 truncate text-sm text-muted-foreground">
                      {item.store ?? "—"}
                    </TableCell>
                    <TableCell>
                      {assignee ? <MemberAvatar profile={assignee} /> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Button
                          size="icon" variant="ghost" className="size-7 text-destructive" aria-label={tr("action.delete", "Delete")}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display font-normal">
              {editing
                ? tr("shopping.dialog.edit", "Edit item")
                : tr("shopping.dialog.add", "Add shopping item")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>{tr("shopping.field.name", "Item name")}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{tr("shopping.field.category", "Category")}</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SHOPPING_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{tr("shopping.cat." + c, c)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{tr("shopping.field.qty", "Quantity")}</Label>
              <Input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>{tr("shopping.field.store", "Store")}</Label>
              <Input
                value={form.store}
                onChange={(e) => setForm({ ...form, store: e.target.value })}
                placeholder={tr("shopping.ph.store", "Where to buy")}
              />
            </div>
            <div className="space-y-2">
              <Label>{tr("shopping.field.assigned", "Assigned to")}</Label>
              <Select value={form.assigned_to} onValueChange={(v) => setForm({ ...form, assigned_to: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{tr("shopping.unassigned", "Unassigned")}</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {eventId === undefined && (
              <div className="space-y-2">
                <Label>{tr("shopping.field.event", "Event")}</Label>
                <Select value={form.event_id} onValueChange={(v) => setForm({ ...form, event_id: v })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{tr("misc.general", "General")}</SelectItem>
                    {events.filter((e) => !e.archived).map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="col-span-2 space-y-2">
              <Label>{tr("shopping.field.notes", "Notes")}</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <Button className="col-span-2" onClick={save}>
              {editing
                ? tr("shopping.save", "Save changes")
                : tr("shopping.addItem", "Add item")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
