"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays, ListChecks, Search, ShoppingBag, Store, Users,
} from "lucide-react";
import { useWedding } from "@/lib/data-context";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function GlobalSearch() {
  const router = useRouter();
  const { t: tr } = useLang();
  const { tasks, guests, vendors, shoppingItems, events } = useWedding();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (needle.length < 2) return [];
    const match = (s: string | null | undefined) =>
      s?.toLowerCase().includes(needle) ?? false;

    const out: { icon: React.ReactNode; label: string; sub: string; href: string }[] = [];
    for (const e of events.filter((e) => match(e.name) || match(e.venue))) {
      out.push({
        icon: <CalendarDays className="size-4 text-gold" />,
        label: e.name, sub: tr("search.type.event", "Event"), href: `/events/${e.id}`,
      });
    }
    for (const t of tasks.filter((t) => match(t.name) || match(t.category))) {
      out.push({
        icon: <ListChecks className="size-4 text-primary" />,
        label: t.name,
        sub: `${tr("search.type.task", "Task")} · ${t.category}`,
        href: `/tasks?task=${t.id}`,
      });
    }
    for (const g of guests.filter((g) => match(g.name))) {
      out.push({
        icon: <Users className="size-4 text-chart-5" />,
        label: g.name, sub: tr("search.type.guest", "Guest"), href: "/guests",
      });
    }
    for (const v of vendors.filter((v) => match(v.name) || match(v.category))) {
      out.push({
        icon: <Store className="size-4 text-chart-4" />,
        label: v.name,
        sub: `${tr("search.type.vendor", "Vendor")} · ${v.category}`,
        href: "/vendors",
      });
    }
    for (const s of shoppingItems.filter((s) => match(s.name) || match(s.store))) {
      out.push({
        icon: <ShoppingBag className="size-4 text-chart-3" />,
        label: s.name,
        sub: `${tr("search.type.shopping", "Shopping")} · ${s.category}`,
        href: "/shopping",
      });
    }
    return out.slice(0, 12);
  }, [q, tasks, guests, vendors, shoppingItems, events, tr]);

  function go(href: string) {
    setOpen(false);
    setQ("");
    router.push(href);
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="hidden w-64 justify-start gap-2 text-muted-foreground sm:flex"
      >
        <Search className="size-4" />
        {tr("search.trigger", "Search everything…")}
        <kbd className="ml-auto rounded border bg-muted px-1.5 text-[10px]">⌘K</kbd>
      </Button>
      <Button
        variant="ghost" size="icon" aria-label={tr("search.aria", "Search")}
        className="sm:hidden" onClick={() => setOpen(true)}
      >
        <Search className="size-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-24 translate-y-0 gap-0 p-0 sm:max-w-lg">
          <DialogTitle className="sr-only">{tr("search.title", "Global search")}</DialogTitle>
          <div className="flex items-center gap-2 border-b px-4">
            <Search className="size-4 text-muted-foreground" />
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={tr("search.ph", "Search tasks, guests, vendors, shopping, events…")}
              className="border-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {q.trim().length >= 2 && results.length === 0 && (
              <p className="p-4 text-center text-sm text-muted-foreground">
                {tr("search.empty", "Nothing found for “{q}”.", { q })}
              </p>
            )}
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => go(r.href)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-accent"
              >
                {r.icon}
                <span className="min-w-0 flex-1 truncate text-sm">{r.label}</span>
                <span className="text-xs text-muted-foreground">{r.sub}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
