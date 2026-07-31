import type { SupabaseClient } from "@supabase/supabase-js";

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

/**
 * Delete every Storage object belonging to an event before the event row is
 * removed. DB rows cascade on delete, but the underlying files would otherwise
 * linger and keep consuming the storage quota.
 */
export async function sweepEventStorage(client: SupabaseClient, eventId: string): Promise<number> {
  // untyped view: these are dynamic table/column reads, and the generic
  // client's deep types otherwise blow up inference at the call site
  const db = client as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (col: string, v: string) => Promise<{ data: Record<string, unknown>[] | null }>;
      };
    };
    storage: SupabaseClient["storage"];
  };
  const paths = new Set<string>();
  const addUrl = (u: unknown) => {
    if (typeof u !== "string" || !u) return;
    const p = storagePathFromUrl(u);
    if (p) paths.add(p);
  };

  try {
    // event files store the object key directly
    const { data: files } = await db.from("event_files").select("path").eq("event_id", eventId);
    for (const f of files ?? []) if (typeof f.path === "string") paths.add(f.path);

    const { data: photos } = await db.from("photos").select("url").eq("event_id", eventId);
    for (const p of photos ?? []) addUrl(p.url);

    const { data: bookings } = await db.from("bookings").select("contract_url").eq("event_id", eventId);
    for (const b of bookings ?? []) addUrl(b.contract_url);

    const { data: books } = await db.from("lookbooks").select("id, cover_url").eq("event_id", eventId);
    for (const lb of books ?? []) {
      addUrl(lb.cover_url);
      if (typeof lb.id === "string") {
        const { data: lbPhotos } = await db
          .from("lookbook_photos")
          .select("url")
          .eq("lookbook_id", lb.id);
        for (const p of lbPhotos ?? []) addUrl(p.url);
      }
    }

    if (paths.size > 0) {
      await db.storage.from("wedding-files").remove([...paths]);
    }
  } catch {
    // never block the delete on a cleanup failure
  }
  return paths.size;
}
