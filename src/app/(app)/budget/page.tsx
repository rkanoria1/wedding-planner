"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Wallet } from "lucide-react";
import { BudgetSection } from "@/components/budget/budget-section";

function BudgetPageInner() {
  const params = useSearchParams();
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div>
        <h1 className="font-display text-3xl">Budget</h1>
        <p className="text-sm text-muted-foreground">
          Allocations, spending, advances and pending vendor payments.
        </p>
      </div>
      <BudgetSection openNew={Boolean(params.get("new"))} />
    </div>
  );
}

export default function BudgetPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Wallet className="size-6 animate-pulse text-muted-foreground" /></div>}>
      <BudgetPageInner />
    </Suspense>
  );
}
