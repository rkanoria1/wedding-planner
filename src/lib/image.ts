/**
 * Compress an image in the browser before upload — no dependencies, uses
 * canvas. Resizes so the longest edge is <= maxEdge and re-encodes as JPEG
 * at the given quality. A 6 MB phone photo typically drops to ~0.5–1 MB with
 * no visible loss, so far more photos fit in storage and uploads are faster.
 *
 * Safe by design: returns the ORIGINAL file if it's not a compressible raster
 * image (gif/svg), if the result wouldn't be smaller, or if anything fails.
 */
export async function compressImage(
  file: File,
  opts: { maxEdge?: number; quality?: number } = {}
): Promise<File> {
  const maxEdge = opts.maxEdge ?? 2000;
  const quality = opts.quality ?? 0.85;

  if (
    typeof document === "undefined" ||
    !file.type.startsWith("image/") ||
    file.type === "image/gif" ||
    file.type === "image/svg+xml"
  ) {
    return file;
  }

  try {
    // `from-image` honours EXIF orientation so portrait photos stay upright
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    // don't bother if compression didn't actually help
    if (!blob || blob.size >= file.size) return file;

    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}
