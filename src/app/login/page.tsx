"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Gem, Heart, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { GUEST_EMAIL } from "@/lib/guest";
import { useLang } from "@/lib/i18n";
import { LanguageToggle } from "@/components/shell/language-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const FAMILY_EMAILS = [
  "rahul-family@rahul-somya.app",
  "somya-family@rahul-somya.app",
];

export default function LoginPage() {
  const router = useRouter();
  const { t: tr } = useLang();
  const db = createClient();
  const [mode, setMode] = useState<"family" | "guest">("family");
  const [code, setCode] = useState("");
  // idle → checking (verifying code) → redirecting (signed in, loading app)
  const [phase, setPhase] = useState<"idle" | "checking" | "redirecting">("idle");
  const busy = phase !== "idle";

  async function handleAccess(e: React.FormEvent) {
    e.preventDefault();
    setPhase("checking");

    if (mode === "guest") {
      const { error } = await db.auth.signInWithPassword({
        email: GUEST_EMAIL,
        password: code,
      });
      if (error) {
        setPhase("idle");
        toast.error(tr("login.toast.guest", "That guest code doesn't match. Please try again."));
        return;
      }
      setPhase("redirecting");
      router.push("/welcome");
      router.refresh();
      return;
    }

    let ok = false;
    for (const email of FAMILY_EMAILS) {
      const { error } = await db.auth.signInWithPassword({ email, password: code });
      if (!error) { ok = true; break; }
    }
    if (!ok) {
      setPhase("idle");
      toast.error(tr("login.toast.family", "That code doesn't match. Please try again."));
      return;
    }
    setPhase("redirecting");
    router.push("/");
    router.refresh();
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
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
          <Gem className="size-4" /> {tr("login.brand", "Rahul & Somya")}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative"
        >
          <h1 className="font-display text-6xl leading-tight whitespace-pre-line">
            {tr("login.hero.title", "Every celebration,\nbeautifully shared.")}
          </h1>
          <p className="mt-6 max-w-md text-white/75">
            {tr(
              "login.hero.sub",
              "Family plans the wedding. Guests enjoy the timeline, lookbook, blessings and moments — without the planning clutter."
            )}
          </p>
        </motion.div>
        <div className="relative flex items-center gap-2 text-sm text-white/60">
          <Heart className="size-4 fill-current" />{" "}
          {tr("login.footer", "Rahul & Somya · 29 January 2027")}
        </div>
      </div>

      <div className="relative flex items-center justify-center bg-celebration p-6">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <LanguageToggle />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="mb-6 text-center">
            <div className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <KeyRound className="size-7" />
            </div>
            <h2 className="font-display text-3xl">
              {mode === "family"
                ? tr("login.welcome.family", "Welcome, family")
                : tr("login.welcome.guest", "Welcome, guest")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "family"
                ? tr("login.sub.family", "Enter the family access code to open the planner.")
                : tr("login.sub.guest", "Enter the wedding guest code for the celebration portal.")}
            </p>
          </div>

          <div className="mb-5 grid grid-cols-2 rounded-xl border bg-muted/40 p-1">
            {(["family", "guest"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setCode(""); }}
                className={cn(
                  "rounded-lg py-2 text-sm font-medium transition-colors",
                  mode === m ? "bg-background shadow-sm" : "text-muted-foreground"
                )}
              >
                {m === "family"
                  ? tr("login.mode.family", "Family")
                  : tr("login.mode.guest", "Guest")}
              </button>
            ))}
          </div>

          <form onSubmit={handleAccess} className="space-y-4">
            <Input
              autoFocus
              type="password"
              required
              placeholder={
                mode === "family"
                  ? tr("login.ph.family", "Family access code")
                  : tr("login.ph.guest", "Guest access code")
              }
              aria-label={
                mode === "family"
                  ? tr("login.ph.family", "Family access code")
                  : tr("login.ph.guest", "Guest access code")
              }
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-12 text-center text-lg tracking-widest"
            />
            <Button type="submit" className="h-12 w-full text-base" disabled={busy || !code}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              {phase === "idle"
                ? tr("login.enter", "Enter")
                : phase === "checking"
                  ? tr("login.checking", "Checking…")
                  : tr("login.opening", "Opening…")}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {mode === "family"
              ? tr("login.hint.family", "Ask Rahul or Somya for the family code.")
              : tr("login.hint.guest", "Ask the couple for the shared guest code.")}
          </p>
        </motion.div>
      </div>

      {/* full-screen loader after a successful code — covers the 2–3s redirect + data load */}
      {phase === "redirecting" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-event-emerald fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 text-white"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,.35) 1px, transparent 1px), radial-gradient(circle at 80% 60%, rgba(255,255,255,.25) 1px, transparent 1px)",
              backgroundSize: "48px 48px, 72px 72px",
            }}
          />
          <div className="relative flex size-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
            <Loader2 className="size-8 animate-spin text-amber-200" />
          </div>
          <div className="relative text-center">
            <p className="font-display text-2xl">
              {mode === "family"
                ? tr("login.redirect.family", "Opening your planner…")
                : tr("login.redirect.guest", "Opening the celebration…")}
            </p>
            <p className="mt-1 text-sm text-white/70">
              {tr("login.redirect.wait", "Just a moment ✨")}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
