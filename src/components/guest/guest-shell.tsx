"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen, Camera, Gem, HeartHandshake, Home, Loader2, LogOut, ScrollText,
} from "lucide-react";
import { useWedding } from "@/lib/data-context";
import { getGuestDisplayName, setGuestDisplayName } from "@/lib/guest";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/welcome", label: "Home", icon: Home },
  { href: "/timeline", label: "Timeline", icon: ScrollText },
  { href: "/lookbook", label: "Lookbook", icon: BookOpen },
  { href: "/blessings", label: "Blessings", icon: HeartHandshake },
  { href: "/moments", label: "Moments", icon: Camera },
];

export function GuestShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { db, loading, settings } = useWedding();
  const [nameOpen, setNameOpen] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!getGuestDisplayName()) setNameOpen(true);
  }, [loading]);

  async function signOut() {
    await db.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function saveName() {
    if (!name.trim()) return;
    setGuestDisplayName(name);
    setNameOpen(false);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-celebration">
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur-md">
        <Link href="/welcome" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gold-soft text-gold-foreground">
            <Gem className="size-4" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-lg">{settings.couple_names}</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Guest</p>
          </div>
        </Link>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" aria-label="Sign out" onClick={signOut}>
          <LogOut className="size-4" />
        </Button>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 p-4 pb-28 sm:p-6">
        {loading ? (
          <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="size-8 animate-spin text-gold" />
            <p className="font-display text-lg">Opening the celebration…</p>
          </div>
        ) : (
          children
        )}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/90 backdrop-blur-md"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-14 items-center justify-center rounded-full",
                    active && "bg-primary/12"
                  )}
                >
                  <Icon className="size-[20px]" />
                </span>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      <Dialog open={nameOpen} onOpenChange={() => { /* must set name */ }}>
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display font-normal text-2xl">
              What should we call you?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Your name appears on blessings and photos you share.
          </p>
          <Input
            autoFocus
            placeholder="e.g. Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveName()}
            className="h-12"
          />
          <Button className="h-11 w-full" disabled={!name.trim()} onClick={saveName}>
            Continue
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
