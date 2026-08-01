"use client";

import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** English / Hindi switch — many family members read Hindi far more easily. */
export function LanguageToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex rounded-full border bg-card p-0.5" role="group" aria-label="Language">
      {(["en", "hi"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
            lang === l
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {l === "en" ? "EN" : "हिं"}
        </button>
      ))}
    </div>
  );
}
