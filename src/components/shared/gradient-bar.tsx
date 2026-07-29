"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function GradientBar({
  value,
  className,
  barClassName,
}: {
  value: number;
  className?: string;
  barClassName?: string;
}) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <motion.div
        className={cn("h-full rounded-full progress-gradient", barClassName)}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </div>
  );
}
