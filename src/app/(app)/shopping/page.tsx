"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { ShoppingSection } from "@/components/shopping/shopping-section";

function ShoppingPageInner() {
  const { t: tr } = useLang();
  const params = useSearchParams();
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div>
        <h1 className="font-display text-3xl">{tr("page.shopping", "Shopping Checklist")}</h1>
        <p className="text-sm text-muted-foreground">
          {tr("page.shopping.sub", "Tick off what still needs to be bought — from lehengas to fairy lights.")}
        </p>
      </div>
      <ShoppingSection openNew={Boolean(params.get("new"))} />
    </div>
  );
}

export default function ShoppingPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><ShoppingBag className="size-6 animate-pulse text-muted-foreground" /></div>}>
      <ShoppingPageInner />
    </Suspense>
  );
}
