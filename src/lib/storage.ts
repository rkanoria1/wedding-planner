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

/**
 * Recover the object key from a stored public URL, so we can delete the actual
 * file from Storage when its row is removed (otherwise deleted photos keep
 * eating the storage quota forever).
 */
export function storagePathFromUrl(url: string, bucket = "wedding-files"): string | null {
  const marker = `/object/public/${bucket}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
}
