"use client";

import { Printer } from "lucide-react";
import { whatsappShare } from "@/lib/wedding";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

/** WhatsApp brand glyph (lucide has no official one). */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.47 14.38c-.29-.15-1.7-.84-1.96-.93-.26-.1-.45-.15-.64.14-.19.29-.74.93-.9 1.12-.17.19-.33.21-.62.07-.29-.15-1.22-.45-2.32-1.43-.86-.77-1.44-1.72-1.6-2.01-.17-.29-.02-.44.13-.59.13-.13.29-.33.43-.5.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.15-.64-1.55-.88-2.12-.23-.56-.47-.48-.64-.49l-.55-.01c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.38s1.02 2.76 1.17 2.95c.15.19 2.01 3.06 4.87 4.29.68.29 1.21.47 1.62.6.68.22 1.3.19 1.79.11.55-.08 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.34zM12.04 2.5A9.5 9.5 0 0 0 3.9 16.86L2.5 21.5l4.76-1.25a9.5 9.5 0 1 0 4.78-17.75zm0 17.35c-1.5 0-2.96-.4-4.24-1.16l-.3-.18-2.82.74.75-2.75-.2-.32a7.85 7.85 0 1 1 7.01 3.87z" />
    </svg>
  );
}

/** Opens WhatsApp with a pre-filled summary; the user picks the chat/group. */
export function ShareWhatsApp({
  text,
  label,
  size = "sm",
}: {
  text: string;
  label?: string;
  size?: "sm" | "default";
}) {
  const { t: tr } = useLang();
  const displayLabel = label ?? tr("action.shareWhatsApp", "Share on WhatsApp");
  return (
    <Button
      variant="outline"
      size={size}
      className="no-print gap-1.5 border-emerald-600/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400"
      onClick={() => window.open(whatsappShare(text), "_blank", "noopener")}
    >
      <WhatsAppIcon className="size-4" /> {displayLabel}
    </Button>
  );
}

/** Triggers the browser print dialog (print CSS strips the app chrome). */
export function PrintButton({ label }: { label?: string }) {
  const { t: tr } = useLang();
  const displayLabel = label ?? tr("action.print", "Print");
  return (
    <Button
      variant="outline"
      size="sm"
      className="no-print gap-1.5"
      onClick={() => window.print()}
    >
      <Printer className="size-4" /> {displayLabel}
    </Button>
  );
}
