/**
 * Build a Supabase Storage object key that is always valid.
 *
 * Storage rejects keys containing spaces, unicode and many symbols
 * (e.g. macOS screenshots like "Screenshot 2026-07-29 at 12.28.38 PM.png"
 * contain a narrow no-break space → 400 InvalidKey). We keep only a safe
 * extension and generate a unique, ASCII-only name. Display names are kept
 * separately (as a caption / DB `name` column), never in the key.
 */
export function storageKey(prefix: string, fileName: string): string {
  const ext =
    (fileName.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix.replace(/\/+$/, "")}/${unique}.${ext}`;
}
