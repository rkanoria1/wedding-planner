"use client";

import { useEffect, useState } from "react";
import { useWedding } from "@/lib/data-context";

export interface InviteContext {
  variant: "general" | "room" | "venue";
  heading: string | null;
  message: string | null;
  focus_event_id: string | null;
}

function cookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Which QR did this guest scan? A code taped inside a hotel room can greet
 * them differently — and show the whole run of functions — versus one on an
 * invitation card. Returns null when they arrived without a QR.
 */
export function useInviteContext(): InviteContext | null {
  const { db } = useWedding();
  const [ctx, setCtx] = useState<InviteContext | null>(null);

  useEffect(() => {
    const token = cookie("gi");
    if (!token) return;
    let alive = true;
    db.rpc("guest_invite_context", { t: token }).then(({ data }) => {
      const row = Array.isArray(data) ? data[0] : data;
      if (alive && row) setCtx(row as InviteContext);
    });
    return () => {
      alive = false;
    };
  }, [db]);

  return ctx;
}
