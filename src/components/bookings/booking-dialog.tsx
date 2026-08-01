"use client";

import { useEffect, useRef, useState } from "react";
import { FileCheck2, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useWedding } from "@/lib/data-context";
import { useLang } from "@/lib/i18n";
import { storageKey, storagePathFromUrl } from "@/lib/storage";
import type { Booking, BookingStatus } from "@/lib/types";
import {
  BOOKING_CATEGORY_NAMES, BOOKING_STATUS_META, BOOKING_STATUS_ORDER, categoryMeta,
} from "@/lib/bookings";
import { StatusStepper } from "./status-stepper";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  booking?: Booking | null;
  defaultCategory?: string;
}

const TRIAL_CATEGORIES = new Set([
  "Makeup Artist", "Food Catering", "Mehendi Artist", "Photographer", "Decoration",
]);
const FITTING_CATEGORIES = new Set(["Wedding Clothes / Tailor", "Jeweler"]);

export function BookingDialog({ open, onOpenChange, booking, defaultCategory }: BookingDialogProps) {
  const { t: tr } = useLang();
  const { db, events, bookings, refresh, logActivity } = useWedding();
  const editing = Boolean(booking);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const blank = {
    category: defaultCategory ?? "Venue",
    vendor_name: "", event_id: "none",
    status: "not_booked" as BookingStatus,
    booking_date: "", contract_signed: false,
    contact_person: "", contact_phone: "",
    trial_scheduled: "", fitting_date: "", notes: "",
  };
  const [form, setForm] = useState(blank);
  const [contractUrl, setContractUrl] = useState<string | null>(null);

  useEffect(() => {
    if (booking) {
      setForm({
        category: booking.category,
        vendor_name: booking.vendor_name ?? "",
        event_id: booking.event_id ?? "none",
        status: booking.status,
        booking_date: booking.booking_date ?? "",
        contract_signed: booking.contract_signed,
        contact_person: booking.contact_person ?? "",
        contact_phone: booking.contact_phone ?? "",
        trial_scheduled: booking.trial_scheduled ?? "",
        fitting_date: booking.fitting_date ?? "",
        notes: booking.notes ?? "",
      });
      setContractUrl(booking.contract_url);
    } else {
      setForm({ ...blank, category: defaultCategory ?? "Venue" });
      setContractUrl(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking, open, defaultCategory]);

  const meta = categoryMeta(form.category);
  const showTrial = TRIAL_CATEGORIES.has(form.category);
  const showFitting = FITTING_CATEGORIES.has(form.category);

  async function uploadContract(file: File) {
    const path = storageKey("contracts", file.name);
    const { error } = await db.storage
      .from("wedding-files")
      .upload(path, file, { contentType: file.type });
    if (error) return toast.error(error.message);
    const { data } = db.storage.from("wedding-files").getPublicUrl(path);
    setContractUrl(data.publicUrl);
    toast.success(tr("bookings.toast.contract", "Contract attached"));
  }

  async function save() {
    if (!form.category) return toast.error(tr("bookings.toast.pickCategory", "Pick a category"));
    setBusy(true);
    const payload = {
      category: form.category,
      vendor_name: form.vendor_name.trim() || null,
      event_id: form.event_id === "none" ? null : form.event_id,
      status: form.status,
      booking_date: form.booking_date || null,
      contract_signed: form.contract_signed,
      contact_person: form.contact_person.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      trial_scheduled: showTrial ? form.trial_scheduled || null : null,
      fitting_date: showFitting ? form.fitting_date || null : null,
      notes: form.notes.trim() || null,
      contract_url: contractUrl,
    };

    if (editing && booking) {
      const { error } = await db.from("bookings").update(payload).eq("id", booking.id);
      if (error) { setBusy(false); return toast.error(error.message); }
      await logActivity("updated", "booking", `${form.category}${form.vendor_name ? ` — ${form.vendor_name}` : ""}`, booking.id);
    } else {
      const { error } = await db
        .from("bookings")
        .insert({ ...payload, sort_order: bookings.length + 1 });
      if (error) { setBusy(false); return toast.error(error.message); }
      await logActivity("added", "booking", `${form.category}${form.vendor_name ? ` — ${form.vendor_name}` : ""}`);
    }
    refresh("bookings");
    setBusy(false);
    onOpenChange(false);
    toast.success(editing
      ? tr("bookings.toast.updated", "Booking updated")
      : tr("bookings.toast.added", "Booking added"));
  }

  async function remove() {
    if (!booking) return;
    // free the contract file too, if any
    const cpath = booking.contract_url ? storagePathFromUrl(booking.contract_url) : null;
    if (cpath) await db.storage.from("wedding-files").remove([cpath]);
    const { error } = await db.from("bookings").delete().eq("id", booking.id);
    if (error) return toast.error(error.message);
    await logActivity("removed", "booking", booking.category);
    refresh("bookings");
    onOpenChange(false);
    toast.success(tr("bookings.toast.removed", "Booking removed"));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display font-normal">
            {editing
              ? tr("bookings.dialog.edit", "Edit booking — {category}", {
                  category: tr("bcat." + (booking?.category ?? ""), booking?.category ?? ""),
                })
              : tr("bookings.dialog.new", "New booking")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* status stepper */}
          <div className="rounded-xl border bg-muted/40 p-3">
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                {tr("bookings.dialog.status", "Booking status")}
              </Label>
              <span className="text-xs font-medium">{tr("bstatus." + form.status, BOOKING_STATUS_META[form.status].label)}</span>
            </div>
            <StatusStepper
              status={form.status}
              onChange={(status) => setForm({ ...form, status })}
            />
            <div className="mt-2 flex flex-wrap gap-1">
              {[...BOOKING_STATUS_ORDER, "cancelled" as BookingStatus].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, status: s })}
                  className={`rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
                    form.status === s ? BOOKING_STATUS_META[s].className : "hover:bg-accent"
                  }`}
                >
                  {tr("bstatus." + s, BOOKING_STATUS_META[s].label)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{tr("bookings.field.category", "Category")}</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BOOKING_CATEGORY_NAMES.map((c) => (
                    <SelectItem key={c} value={c}>{tr("bcat." + c, c)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                {tr("bookings.field.leadHint", "Ideally booked ~{n} months before the wedding.", { n: meta.leadMonths })}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{tr("bookings.field.function", "Wedding function")}</Label>
              <Select value={form.event_id} onValueChange={(v) => setForm({ ...form, event_id: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{tr("bookings.field.allGeneral", "All / general")}</SelectItem>
                  {events.filter((e) => !e.archived).map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>{tr("bookings.field.vendor", "Vendor name")}</Label>
              <Input
                value={form.vendor_name}
                onChange={(e) => setForm({ ...form, vendor_name: e.target.value })}
                placeholder={tr("bookings.ph.vendor", "e.g. Gulmohar Decor Co.")}
              />
            </div>
            <div className="space-y-2">
              <Label>{tr("bookings.field.contactPerson", "Contact person")}</Label>
              <Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{tr("bookings.field.contactPhone", "Contact phone")}</Label>
              <Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} placeholder="+91…" />
            </div>
            <div className="space-y-2">
              <Label>{tr("bookings.field.bookingDate", "Booking date")}</Label>
              <Input type="date" value={form.booking_date} onChange={(e) => setForm({ ...form, booking_date: e.target.value })} />
            </div>
            {showTrial && (
              <div className="space-y-2">
                <Label>{tr("bookings.field.trialDate", "Trial / tasting date")}</Label>
                <Input type="date" value={form.trial_scheduled} onChange={(e) => setForm({ ...form, trial_scheduled: e.target.value })} />
              </div>
            )}
            {showFitting && (
              <div className="space-y-2">
                <Label>{tr("bookings.field.fittingDate", "Fitting date")}</Label>
                <Input type="date" value={form.fitting_date} onChange={(e) => setForm({ ...form, fitting_date: e.target.value })} />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="contract-signed" checked={form.contract_signed}
              onCheckedChange={(v) => setForm({ ...form, contract_signed: Boolean(v) })}
            />
            <Label htmlFor="contract-signed">{tr("bookings.field.contractSigned", "Contract signed")}</Label>
          </div>

          <div className="space-y-2">
            <Label>{tr("bookings.field.contractFile", "Contract file")}</Label>
            <input
              ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadContract(f);
                e.target.value = "";
              }}
            />
            {contractUrl ? (
              <div className="flex items-center gap-2">
                <a
                  href={contractUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm text-primary hover:bg-accent"
                >
                  <FileCheck2 className="size-4" /> {tr("bookings.viewContract", "View contract")}
                </a>
                <Button variant="ghost" size="sm" onClick={() => setContractUrl(null)}>
                  <Trash2 className="size-4" /> {tr("action.remove", "Remove")}
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="size-4" /> {tr("bookings.uploadContract", "Upload contract")}
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label>{tr("bookings.field.notes", "Notes")}</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" onClick={save} disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              {editing
                ? tr("bookings.save", "Save booking")
                : tr("action.addBooking", "Add booking")}
            </Button>
            {editing && (
              <AlertDialog>
                <AlertDialogTrigger
                  render={<Button variant="outline" size="icon" className="text-destructive" aria-label={tr("action.delete", "Delete booking")} />}
                >
                  <Trash2 className="size-4" />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{tr("bookings.delete.title", "Delete this booking?")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {tr("bookings.delete.desc", "The {category} booking record will be removed permanently.", {
                        category: tr("bcat." + (booking?.category ?? ""), booking?.category ?? ""),
                      })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{tr("action.cancel", "Cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={remove} className="bg-destructive text-white hover:bg-destructive/90">
                      {tr("action.delete", "Delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
