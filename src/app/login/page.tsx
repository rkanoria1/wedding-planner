"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Gem, Heart, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Two family workspaces, each with its own access code. The single code field
 * is tried against both family accounts — whichever matches signs that family
 * in to their own private workspace. Create the accounts once via
 * supabase/setup-family-login.sql.
 */
const FAMILY_EMAILS = [
  "rahul-family@rahul-somya.app",
  "somya-family@rahul-somya.app",
];

export default function LoginPage() {
  const router = useRouter();
  const db = createClient();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleAccess(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    // the code is a password shared by one family — try each family account
    let ok = false;
    for (const email of FAMILY_EMAILS) {
      const { error } = await db.auth.signInWithPassword({ email, password: code });
      if (!error) { ok = true; break; }
    }
    setBusy(false);
    if (!ok) {
      toast.error("That code doesn't match. Please try again.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* left: brand panel */}
      <div className="relative hidden overflow-hidden bg-event-emerald lg:flex lg:flex-col lg:justify-between p-12 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,.35) 1px, transparent 1px), radial-gradient(circle at 80% 60%, rgba(255,255,255,.25) 1px, transparent 1px)",
            backgroundSize: "48px 48px, 72px 72px",
          }}
        />
        <div className="relative flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-white/80">
          <Gem className="size-4" /> Rahul &amp; Somya · Wedding Planner
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative"
        >
          <h1 className="font-display text-6xl leading-tight">
            Every celebration,
            <br />
            beautifully <em className="text-amber-200">planned</em>.
          </h1>
          <p className="mt-6 max-w-md text-white/75">
            Myrah to Phera — tasks, guests, shopping and vendors for the whole
            family, in one elegant place.
          </p>
        </motion.div>
        <div className="relative flex items-center gap-2 text-sm text-white/60">
          <Heart className="size-4 fill-current" /> Rahul &amp; Somya · 29 January 2027
        </div>
      </div>

      {/* right: access code */}
      <div className="flex items-center justify-center bg-celebration p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <KeyRound className="size-7" />
            </div>
            <h2 className="font-display text-3xl">Welcome, family</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter the family access code to open the planner.
            </p>
          </div>

          <form onSubmit={handleAccess} className="space-y-4">
            <Input
              autoFocus
              type="password"
              required
              placeholder="Family access code"
              aria-label="Family access code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-12 text-center text-lg tracking-widest"
            />
            <Button type="submit" className="h-12 w-full text-base" disabled={busy || !code}>
              {busy && <Loader2 className="size-4 animate-spin" />} Enter
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Ask Rahul or Somya for the code. One code, shared by the whole family.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
