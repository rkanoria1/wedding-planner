"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Hidden oversight login — not linked from the family login screen.
 * Signs into the single super-admin account (household = null), which can
 * see both families. The passcode is that account's password.
 */
const ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@rahul-somya.app";

export default function AdminLoginPage() {
  const router = useRouter();
  const db = createClient();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleAccess(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await db.auth.signInWithPassword({ email: ADMIN_EMAIL, password: code });
    if (error) {
      setBusy(false);
      toast.error("Incorrect admin passcode.");
      return;
    }
    // keep the spinner through the redirect + data load
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#1a0710] p-6">
      {/* deep oversight backdrop */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(700px 340px at 50% -10%, color-mix(in oklch, var(--gold) 14%, transparent), transparent 70%), radial-gradient(600px 300px at 50% 120%, color-mix(in oklch, var(--primary) 30%, transparent), transparent 70%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-sm text-center"
      >
        <div className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-gold/15 text-gold ring-1 ring-gold/30">
          <ShieldCheck className="size-7" />
        </div>
        <h1 className="font-display text-3xl text-white">Oversight</h1>
        <p className="mt-1 text-sm text-white/60">
          Admin access to both families&apos; planning.
        </p>

        <form onSubmit={handleAccess} className="mt-8 space-y-4">
          <Input
            autoFocus
            type="password"
            required
            placeholder="Admin passcode"
            aria-label="Admin passcode"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="h-12 border-white/15 bg-white/5 text-center text-lg tracking-widest text-white placeholder:text-white/40"
          />
          <Button
            type="submit"
            disabled={busy || !code}
            className="h-12 w-full bg-gold text-gold-foreground text-base hover:bg-gold/90"
          >
            {busy && <Loader2 className="size-4 animate-spin" />} Enter
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-white/35">
          Restricted. Family members use the main sign-in.
        </p>
      </motion.div>
    </div>
  );
}
