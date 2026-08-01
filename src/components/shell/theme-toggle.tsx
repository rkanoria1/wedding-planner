"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { t: tr } = useLang();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={tr("theme.toggle", "Toggle theme")}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="size-5 dark:hidden" />
      <Moon className="hidden size-5 dark:block" />
    </Button>
  );
}
