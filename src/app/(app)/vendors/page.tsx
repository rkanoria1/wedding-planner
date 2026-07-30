"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BadgeCheck, MessageCircle, Pencil, Phone, Plus, Star, Store, Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useWedding } from "@/lib/data-context";
import type { Vendor } from "@/lib/types";
import { whatsappLink } from "@/lib/wedding";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const VENDOR_CATEGORIES = [
  "Photographer", "Decorator", "Catering", "Makeup", "Mehendi Artist", "DJ",
  "Venue", "Flowers", "Jeweler", "Transport", "Priest/Qazi", "Band", "Other",
];

function Stars({
  value,
  onChange,
}: {
  value: number | null;
  onChange?: (v: number) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(i)}
          aria-label={`${i} stars`}
        >
          <Star
            className={cn(
              "size-4",
              value && i <= value
                ? "fill-gold text-gold"
                : "text-muted-foreground/30"
            )}
          />
        </button>
      ))}
    </div>
  );
}

function VendorsPageInner() {
  const params = useSearchParams();
  const { db, isAdmin, vendors, refresh, logActivity } = useWedding();

  const [catFilter, setCatFilter] = useState("all");
  const empty = {
    id: "", name: "", category: "Photographer", phone: "",
    booked: false, rating: 0, notes: "",
  };
  const [dialogOpen, setDialogOpen] = useState(Boolean(params.get("new")));
  const [form, setForm] = useState(empty);
  const editing = Boolean(form.id);

  const filtered = useMemo(
    () => vendors.filter((v) => catFilter === "all" || v.category === catFilter),
    [vendors, catFilter]
  );

  const bookedCount = vendors.filter((v) => v.booked).length;

  function openEdit(v: Vendor) {
    setForm({
      id: v.id, name: v.name, category: v.category, phone: v.phone ?? "",
      booked: v.booked, rating: v.rating ?? 0, notes: v.notes ?? "",
    });
    setDialogOpen(true);
  }

  async function save() {
    if (!form.name.trim()) return toast.error("Vendor needs a name");
    const payload = {
      name: form.name.trim(), category: form.category,
      phone: form.phone.trim() || null,
      booked: form.booked,
      rating: form.rating || null,
      notes: form.notes.trim() || null,
    };
    if (editing) {
      const { error } = await db.from("vendors").update(payload).eq("id", form.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await db.from("vendors").insert(payload);
      if (error) return toast.error(error.message);
      await logActivity("added", "vendor", payload.name);
    }
    refresh("vendors");
    setDialogOpen(false);
    setForm(empty);
    toast.success(editing ? "Vendor updated" : "Vendor added");
  }

  async function toggleBooked(v: Vendor) {
    await db.from("vendors").update({ booked: !v.booked }).eq("id", v.id);
    if (!v.booked) await logActivity("booked", "vendor", v.name, v.id);
    refresh("vendors");
  }

  async function rate(v: Vendor, rating: number) {
    await db.from("vendors").update({ rating }).eq("id", v.id);
    refresh("vendors");
  }

  async function remove(v: Vendor) {
    await db.from("vendors").delete().eq("id", v.id);
    await logActivity("removed", "vendor", v.name);
    refresh("vendors");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Vendors</h1>
          <p className="text-sm text-muted-foreground">
            {bookedCount} of {vendors.length} booked
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {VENDOR_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isAdmin && (
            <Button onClick={() => { setForm(empty); setDialogOpen(true); }}>
              <Plus className="size-4" /> Add vendor
            </Button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Store} title="No vendors yet" hint="Add photographers, caterers, decorators…" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((v, i) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.4) }}
            >
              <Card className="card-lux h-full shadow-none">
                <CardContent className="flex h-full flex-col gap-3 pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display text-lg leading-tight">{v.name}</p>
                      <Badge variant="outline" className="mt-1">{v.category}</Badge>
                    </div>
                    {v.booked ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary dark:text-primary">
                        <BadgeCheck className="size-3.5" /> Booked
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                        Exploring
                      </span>
                    )}
                  </div>

                  <Stars value={v.rating} onChange={isAdmin ? (r) => rate(v, r) : undefined} />

                  {v.notes && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">{v.notes}</p>
                  )}

                  <div className="mt-auto flex items-center gap-2 pt-1">
                    {v.phone && (
                      <>
                        <a
                          href={`tel:${v.phone}`}
                          className="inline-flex size-8 items-center justify-center rounded-full border text-muted-foreground hover:bg-accent"
                          aria-label="Call"
                        >
                          <Phone className="size-3.5" />
                        </a>
                        <a
                          href={whatsappLink(v.phone, `Hi! Regarding the wedding on 15 Jan 2027 —`)}
                          target="_blank" rel="noreferrer"
                          className="inline-flex size-8 items-center justify-center rounded-full border text-primary hover:bg-primary/10 dark:text-primary"
                          aria-label="WhatsApp"
                        >
                          <MessageCircle className="size-3.5" />
                        </a>
                      </>
                    )}
                    <div className="flex-1" />
                    {isAdmin && (
                      <>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">Booked</span>
                          <Switch checked={v.booked} onCheckedChange={() => toggleBooked(v)} />
                        </div>
                        <Button size="icon" variant="ghost" className="size-7" aria-label="Edit" onClick={() => openEdit(v)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="size-7 text-destructive" aria-label="Delete" onClick={() => remove(v)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display font-normal">
              {editing ? "Edit vendor" : "Add vendor"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Vendor name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VENDOR_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91…" />
            </div>
            <div className="space-y-2">
              <Label>Rating</Label>
              <Stars value={form.rating || null} onChange={(r) => setForm({ ...form, rating: r })} />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch checked={form.booked} onCheckedChange={(v) => setForm({ ...form, booked: v })} />
              <Label>Booked</Label>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <Button className="col-span-2" onClick={save}>
              {editing ? "Save changes" : "Add vendor"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function VendorsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Store className="size-6 animate-pulse text-muted-foreground" /></div>}>
      <VendorsPageInner />
    </Suspense>
  );
}
