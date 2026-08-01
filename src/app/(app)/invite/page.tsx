"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Loader2, Plus, QrCode as QrIcon, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useWedding } from "@/lib/data-context";
import { useLang } from "@/lib/i18n";
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
  variant?: "general" | "room" | "venue";
  heading?: string | null;
  message?: string | null;
}

const VARIANTS = [
  {
    id: "general" as const,
    name: "Invitation card",
    blurb: "For printed invites — a warm welcome and the four portal sections.",
  },
  {
    id: "room" as const,
    name: "Hotel room card",
    blurb: "For guest rooms — adds the full run of functions, dates and venues.",
  },
  {
    id: "venue" as const,
    name: "Venue signage",
    blurb: "For signs at the venue — quick access on the day.",
  },
];

/** URL-safe random token — not a password, just an opaque handle. */
function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export default function InvitePage() {
  const { t: tr } = useLang();
  const { db, settings, branding } = useWedding();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [selected, setSelected] = useState<Invite | null>(null);
  const [label, setLabel] = useState("");
  const [variant, setVariant] = useState<"general" | "room" | "venue">("general");
  const [heading, setHeading] = useState("");
  const [message, setMessage] = useState("");
  const [origin, setOrigin] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await db
      .from("guest_invites")
      .select("token,label,active,uses,created_at,variant,heading,message")
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
    const defaults = {
      general: { heading: tr("invite.default.general", "You're invited"), message: "" },
      room: { heading: tr("invite.default.room", "Welcome to your stay"), message: "" },
      venue: { heading: tr("invite.default.venue", "Welcome"), message: "" },
    }[variant];
    const row = {
      token,
      label: label.trim() || tr(`invite.variant.${variant}`, VARIANTS.find((v) => v.id === variant)!.name),
      variant,
      heading: heading.trim() || defaults.heading,
      message: message.trim() || null,
    };
    const { error } = await db.from("guest_invites").insert(row);
    setBusy(false);
    if (error) return toast.error(error.message);
    setLabel("");
    setHeading("");
    setMessage("");
    await load();
    setSelected({ ...row, active: true, uses: 0, created_at: new Date().toISOString() });
    toast.success(tr("invite.toast.created", "New invite QR created"));
  }

  async function revoke(inv: Invite) {
    const { error } = await db
      .from("guest_invites")
      .update({ active: false })
      .eq("token", inv.token);
    if (error) return toast.error(error.message);
    if (selected?.token === inv.token) setSelected(null);
    await load();
    toast.success(tr("invite.toast.revoked", "Invite revoked — that QR no longer works"));
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
          <QrIcon className="size-4 text-gold" /> {tr("invite.eyebrow", "Guest Invite")}
        </div>
        <h1 className="relative mt-1 font-display text-3xl">
          {tr("page.invite", "Scan to enter")}
        </h1>
        <p className="relative mt-1 max-w-lg text-sm text-muted-foreground">
          {tr(
            "invite.sub",
            "Print this on your invitations or a sign at the venue. Guests scan and land straight in the celebration portal — nothing to type."
          )}
        </p>

        <p className="relative mt-3 inline-flex items-start gap-2 rounded-lg bg-primary/8 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            {tr(
              "invite.security",
              "The QR holds a random one-way token, not your guest code — so the code never appears in a link, screenshot or browser history. Revoke a token any time to kill a printed QR without changing the code everyone else uses."
            )}
          </span>
        </p>

        {/* where will this QR live? */}
        <div className="relative mt-6 space-y-2">
          <Label>{tr("invite.where", "Where will this QR be placed?")}</Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {VARIANTS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariant(v.id)}
                className={cn(
                  "rounded-xl border p-3 text-left transition-colors",
                  variant === v.id
                    ? "border-primary/50 bg-primary/8"
                    : "hover:bg-accent"
                )}
              >
                <p className="text-sm font-medium">
                  {tr(`invite.variant.${v.id}`, v.name)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {tr(`invite.variant.${v.id}.blurb`, v.blurb)}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="relative mt-4 grid max-w-2xl gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="heading">{tr("invite.field.greeting", "Greeting")}</Label>
            <Input
              id="heading"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              placeholder={tr("invite.ph.greeting", "You're invited / Welcome to your stay")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">{tr("invite.field.subline", "Sub-line (optional)")}</Label>
            <Input
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={tr("invite.ph.subline", "Scan for details…")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="label">{tr("invite.field.label", "Internal label")}</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={tr("invite.ph.label", "e.g. Hotel room cards")}
            />
          </div>
          <Button className="mt-auto" onClick={create} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {tr("invite.create", "Create QR")}
          </Button>
        </div>
      </div>

      {/* printable invite card */}
      {selected && (
        <div className="card-lux mx-auto max-w-md p-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {selected.heading ?? tr("invite.default.general", "You're invited")}
          </p>
          {selected.message && (
            <p className="mt-1 text-sm text-muted-foreground">{selected.message}</p>
          )}
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
                alt={tr("invite.qr.alt", "Scan to open the wedding guest portal")}
                className="size-56 rounded-2xl border bg-white p-2"
              />
            ) : (
              <div className="flex size-56 items-center justify-center rounded-2xl border">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          <p className="font-display text-lg">
            {selected.variant === "room"
              ? tr("invite.card.scanRoom", "Scan for your full schedule & venues")
              : tr("invite.card.scanGeneral", "Scan for timeline, lookbook & photos")}
          </p>
        </div>
      )}

      {selected && (
        <div className="no-print flex flex-wrap justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(link);
              toast.success(tr("invite.toast.copied", "Invite link copied"));
            }}
          >
            <Copy className="size-4" /> {tr("invite.copyLink", "Copy link")}
          </Button>
          <ShareWhatsApp
            label={tr("invite.share", "Share invite")}
            text={`💍 ${branding.coupleNames} — ${formatDate(settings.wedding_date, "d MMM yyyy")}\n\n${tr("invite.share.body", "Open the celebration portal (timeline, lookbook, photos):")}\n${link}`}
          />
          <PrintButton label={tr("invite.print", "Print invite card")} />
        </div>
      )}

      {/* issued invites */}
      {invites.length > 0 && (
        <div className="no-print space-y-2">
          <h2 className="font-display text-xl">{tr("invite.issued", "Issued QR codes")}</h2>
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
                  {inv.label ?? tr("invite.defaultLabel", "Wedding invite")}
                  {selected?.token === inv.token && (
                    <span className="ml-2 text-xs text-primary">{tr("invite.showing", "· showing")}</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {inv.active ? tr("invite.active", "Active") : tr("invite.revoked", "Revoked")}
                  {" · "}
                  {tr("invite.scanned", "{n}× scanned", { n: inv.uses })}
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
                  <Trash2 className="size-4" /> {tr("action.revoke", "Revoke")}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
