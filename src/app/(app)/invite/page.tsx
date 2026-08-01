"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Loader2, Plus, QrCode as QrIcon, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useWedding } from "@/lib/data-context";
import { formatDate } from "@/lib/wedding";
import { PrintButton, ShareWhatsApp } from "@/components/shared/share-print";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Invite {
  token: string;
  label: string | null;
  active: boolean;
  uses: number;
  created_at: string;
}

/** URL-safe random token — not a password, just an opaque handle. */
function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export default function InvitePage() {
  const { db, settings, branding } = useWedding();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [selected, setSelected] = useState<Invite | null>(null);
  const [label, setLabel] = useState("");
  const [origin, setOrigin] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await db
      .from("guest_invites")
      .select("token,label,active,uses,created_at")
      .order("created_at", { ascending: false });
    const rows = (data as Invite[]) ?? [];
    setInvites(rows);
    setSelected((cur) => cur ?? rows.find((r) => r.active) ?? null);
  }, [db]);

  useEffect(() => {
    setOrigin(window.location.origin);
    load();
  }, [load]);

  const link = selected ? `${origin}/g/${selected.token}` : "";

  useEffect(() => {
    if (!link) { setQr(null); return; }
    let alive = true;
    QRCode.toDataURL(link, {
      width: 900,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#5c1029", light: "#ffffff" },
    })
      .then((u) => { if (alive) setQr(u); })
      .catch(() => { if (alive) setQr(null); });
    return () => { alive = false; };
  }, [link]);

  async function create() {
    setBusy(true);
    const token = newToken();
    const { error } = await db
      .from("guest_invites")
      .insert({ token, label: label.trim() || "Wedding invite" });
    setBusy(false);
    if (error) return toast.error(error.message);
    setLabel("");
    await load();
    setSelected({ token, label: label.trim() || "Wedding invite", active: true, uses: 0, created_at: new Date().toISOString() });
    toast.success("New invite QR created");
  }

  async function revoke(inv: Invite) {
    const { error } = await db
      .from("guest_invites")
      .update({ active: false })
      .eq("token", inv.token);
    if (error) return toast.error(error.message);
    if (selected?.token === inv.token) setSelected(null);
    await load();
    toast.success("Invite revoked — that QR no longer works");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="no-print card-lux relative overflow-hidden p-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(480px 180px at 88% -30%, color-mix(in oklch, var(--gold) 18%, transparent), transparent 70%)",
          }}
        />
        <div className="relative flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
          <QrIcon className="size-4 text-gold" /> Guest Invite
        </div>
        <h1 className="relative mt-1 font-display text-3xl">Scan to enter</h1>
        <p className="relative mt-1 max-w-lg text-sm text-muted-foreground">
          Print this on your invitations or a sign at the venue. Guests scan and
          land straight in the celebration portal — nothing to type.
        </p>

        <p className="relative mt-3 inline-flex items-start gap-2 rounded-lg bg-primary/8 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            The QR holds a random one-way token, <strong>not</strong> your guest
            code — so the code never appears in a link, screenshot or browser
            history. Revoke a token any time to kill a printed QR without
            changing the code everyone else uses.
          </span>
        </p>

        <div className="relative mt-5 flex max-w-md gap-2">
          <div className="flex-1 space-y-2">
            <Label htmlFor="label">New invite label</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Printed cards, Venue signage"
            />
          </div>
          <Button className="mt-auto" onClick={create} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Create QR
          </Button>
        </div>
      </div>

      {/* printable invite card */}
      {selected && (
        <div className="card-lux mx-auto max-w-md p-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            You&apos;re invited
          </p>
          <h2 className="mt-2 font-display text-4xl text-gradient-gold">
            {branding.coupleNames}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(settings.wedding_date, "EEEE, d MMMM yyyy")}
          </p>
          <div className="my-6 flex justify-center">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qr}
                alt="Scan to open the wedding guest portal"
                className="size-56 rounded-2xl border bg-white p-2"
              />
            ) : (
              <div className="flex size-56 items-center justify-center rounded-2xl border">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          <p className="font-display text-lg">Scan for timeline, lookbook &amp; photos</p>
        </div>
      )}

      {selected && (
        <div className="no-print flex flex-wrap justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(link);
              toast.success("Invite link copied");
            }}
          >
            <Copy className="size-4" /> Copy link
          </Button>
          <ShareWhatsApp
            label="Share invite"
            text={`💍 ${branding.coupleNames} — ${formatDate(settings.wedding_date, "d MMM yyyy")}\n\nOpen the celebration portal (timeline, lookbook, photos):\n${link}`}
          />
          <PrintButton label="Print invite card" />
        </div>
      )}

      {/* issued invites */}
      {invites.length > 0 && (
        <div className="no-print space-y-2">
          <h2 className="font-display text-xl">Issued QR codes</h2>
          {invites.map((inv) => (
            <div
              key={inv.token}
              className={cn(
                "card-lux flex items-center gap-3 p-3.5",
                !inv.active && "opacity-60"
              )}
            >
              <button
                className="min-w-0 flex-1 text-left"
                onClick={() => inv.active && setSelected(inv)}
              >
                <p className="truncate text-sm font-medium">
                  {inv.label ?? "Wedding invite"}
                  {selected?.token === inv.token && (
                    <span className="ml-2 text-xs text-primary">· showing</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {inv.active ? "Active" : "Revoked"} · scanned {inv.uses}×
                  {" · "}…{inv.token.slice(-6)}
                </p>
              </button>
              {inv.active && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  onClick={() => revoke(inv)}
                >
                  <Trash2 className="size-4" /> Revoke
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
