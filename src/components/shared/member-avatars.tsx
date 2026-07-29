"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { initials } from "@/lib/wedding";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

const PALETTE = [
  "bg-primary", "bg-amber-600", "bg-rose-600", "bg-sky-600",
  "bg-violet-600", "bg-primary", "bg-orange-600",
];

export function colorFor(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % PALETTE.length;
  return PALETTE[h];
}

export function MemberAvatar({ profile, size = "size-7" }: { profile: Profile; size?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Avatar className={cn(size, "border-2 border-background")} />}
      >
        <AvatarFallback className={cn(colorFor(profile.id), "text-[10px] font-semibold text-white")}>
          {initials(profile.full_name)}
        </AvatarFallback>
      </TooltipTrigger>
      <TooltipContent>{profile.full_name}</TooltipContent>
    </Tooltip>
  );
}

export function MemberAvatars({ profiles, max = 4 }: { profiles: Profile[]; max?: number }) {
  const shown = profiles.slice(0, max);
  const extra = profiles.length - shown.length;
  return (
    <div className="flex -space-x-2">
      {shown.map((p) => (
        <MemberAvatar key={p.id} profile={p} />
      ))}
      {extra > 0 && (
        <span className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium">
          +{extra}
        </span>
      )}
    </div>
  );
}
