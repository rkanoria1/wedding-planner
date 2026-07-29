"use client";

import { useState } from "react";
import { Menu, Loader2 } from "lucide-react";
import { useWedding } from "@/lib/data-context";
import { Sidebar } from "./sidebar";
import { GlobalSearch } from "./global-search";
import { NotificationCenter } from "./notification-center";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { loading } = useWedding();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-dvh w-full">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <Sidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        {/* topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu" />}
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-0 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="flex-1" />
          <GlobalSearch />
          <NotificationCenter />
          <ThemeToggle />
        </header>

        <main className="bg-celebration flex-1 p-4 sm:p-6 lg:p-8">
          {loading ? (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-gold" />
              <p className="font-display text-lg">Setting the stage…</p>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
