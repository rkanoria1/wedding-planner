"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Loader2, QrCode as QrIcon } from "lucide-react";
import { toast } from "sonner";
import { useWedding } from "@/lib/data-context";
import { formatDate } from "@/lib/wedding";
import { PrintButton, ShareWhatsApp } from "@/components/shared/share-print";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CODE_KEY = "guestInviteCode";

/**
 * Generates the "scan to enter" QR for guests. The QR points at /g/<code>,
 * which signs the scanner into the shared guest portal automatically.
 */
export default function InvitePage() {
  const { settings, branding } = useWedding();
  const [code, setCode] = useState("");
  const [origin, setOrigin] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
    const saved = window.localStorage.getItem(CODE_KEY);
    if (saved) setCode(saved);
  }, []);

  const link = code ? `${origin}/g/${encodeURIComponent(code.trim())}` : "";

  useEffect(() => {
    if (!link) { setQr(null); return; }
    let alive = true;
    setBusy(true);
    QRCode.toDataURL(link, {
      width: 900,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#5c1029", light: "#ffffff" },
    })
      .then((url) => { if (alive) setQr(url); })
      .catch(() => { if (alive) setQr(null); })
      .finally(() => { if (alive) setBusy(false); });
    return () => { alive = false; };
  }, [link]);

  function save() {
    window.localStorage.setItem(CODE_KEY, code.trim());
    toast.success("Guest code saved on this device");
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
          Print this on your invitations or put it on a sign at the venue.
          Guests scan it and land straight in the celebration portal — no code
          to type, no account to make.
        </p>

        <div className="relative mt-5 max-w-sm space-y-2">
          <Label htmlFor="code">Guest access code</Label>
          <div className="flex gap-2">
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. welcome2027"
            />
            <Button variant="outline" onClick={save} disabled={!code.trim()}>
              Save
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            The same code you set in <code>setup-guest-login.sql</code>. Stored only on this device.
          </p>
        </div>
      </div>

      {/* printable invite card */}
      {code.trim() && (
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
            {busy ? (
              <div className="flex size-56 items-center justify-center rounded-2xl border">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qr}
                alt="Scan to open the wedding guest portal"
                className="size-56 rounded-2xl border bg-white p-2"
              />
            ) : null}
          </div>

          <p className="font-display text-lg">Scan for timeline, lookbook &amp; photos</p>
          <p className="mt-1 break-all text-[11px] text-muted-foreground">{link}</p>
        </div>
      )}

      {code.trim() && (
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
    </div>
  );
}
