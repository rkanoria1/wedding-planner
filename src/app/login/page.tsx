"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Gem, Heart, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  const router = useRouter();
  const db = createClient();
  const [busy, setBusy] = useState(false);
  const [login, setLogin] = useState({ email: "", password: "" });
  const [signup, setSignup] = useState({
    name: "", email: "", phone: "", password: "", role: "family",
  });

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await db.auth.signInWithPassword(login);
    setBusy(false);
    if (error) return toast.error(error.message);
    router.push("/");
    router.refresh();
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await db.auth.signUp({
      email: signup.email,
      password: signup.password,
      options: {
        data: { full_name: signup.name, role: signup.role, phone: signup.phone },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome to the celebration!");
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
          <Gem className="size-4" /> Rahul&apos;s Wedding Planner
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
            Myrah to Phera — tasks, budgets, guests and vendors for the whole
            family, in one elegant place.
          </p>
        </motion.div>
        <div className="relative flex items-center gap-2 text-sm text-white/60">
          <Heart className="size-4 fill-current" /> Rahul &amp; Somya · 29 January 2027
        </div>
      </div>

      {/* right: form */}
      <div className="flex items-center justify-center bg-celebration p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center lg:text-left">
            <div className="mb-3 inline-flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground lg:hidden">
              <Sparkles className="size-6" />
            </div>
            <h2 className="font-display text-3xl">Welcome back</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to keep the celebration on track.
            </p>
          </div>

          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Join the Family</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email" type="email" required placeholder="you@example.com"
                    value={login.email}
                    onChange={(e) => setLogin({ ...login, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password" type="password" required
                    value={login.password}
                    onChange={(e) => setLogin({ ...login, password: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="size-4 animate-spin" />} Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="s-name">Full name</Label>
                  <Input
                    id="s-name" required placeholder="Priya Sharma"
                    value={signup.name}
                    onChange={(e) => setSignup({ ...signup, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="s-email">Email</Label>
                    <Input
                      id="s-email" type="email" required
                      value={signup.email}
                      onChange={(e) => setSignup({ ...signup, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="s-phone">Phone (WhatsApp)</Label>
                    <Input
                      id="s-phone" placeholder="+91…"
                      value={signup.phone}
                      onChange={(e) => setSignup({ ...signup, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>I&apos;m joining as</Label>
                  <Select
                    value={signup.role}
                    onValueChange={(role) => setSignup({ ...signup, role })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="family">Family Member</SelectItem>
                      <SelectItem value="volunteer">Volunteer</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    The very first account becomes the Admin automatically.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s-password">Password</Label>
                  <Input
                    id="s-password" type="password" required minLength={6}
                    value={signup.password}
                    onChange={(e) => setSignup({ ...signup, password: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="size-4 animate-spin" />} Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
