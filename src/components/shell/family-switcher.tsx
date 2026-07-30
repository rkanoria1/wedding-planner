"use client";

import { Eye } from "lucide-react";
import { useWedding } from "@/lib/data-context";
import { cn } from "@/lib/utils";

const OPTIONS: { id: "rahul" | "somya" | "all"; label: string }[] = [
  { id: "rahul", label: "Rahul's" },
  { id: "somya", label: "Somya's" },
  { id: "all", label: "Both" },
];

/** Super-admin-only control to view one family's data or both. */
export function FamilySwitcher() {
  const { isSuperadmin, viewHousehold, setViewHousehold } = useWedding();
  if (!isSuperadmin) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
        <Eye className="size-3.5" /> Viewing
      </span>
      <div className="flex rounded-full border bg-card p-0.5">
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setViewHousehold(o.id)}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              viewHousehold === o.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
