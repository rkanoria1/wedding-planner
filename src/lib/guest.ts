const DISPLAY_NAME_KEY = "guestDisplayName";

export function getGuestDisplayName(): string | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(DISPLAY_NAME_KEY)?.trim();
  return v || null;
}

export function setGuestDisplayName(name: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DISPLAY_NAME_KEY, name.trim());
}

export const GUEST_EMAIL = "guests@rahul-somya.app";

export const GUEST_PATHS = [
  "/welcome",
  "/timeline",
  "/lookbook",
  "/blessings",
  "/moments",
] as const;

export function isGuestPath(pathname: string): boolean {
  return GUEST_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
