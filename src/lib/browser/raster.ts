import type { Raster } from "@/lib/pipeline/types";

export class AvatarCorsError extends Error {}

export async function rasterFromBlob(blob: Blob, maxSide = 1024): Promise<Raster> {
  const bmp = await createImageBitmap(blob);
  const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * k)), h = Math.max(1, Math.round(bmp.height * k));
  const canvas = new OffscreenCanvas(w, h), ctx = canvas.getContext("2d")!;
  ctx.drawImage(bmp, 0, 0, w, h); bmp.close();
  return ctx.getImageData(0, 0, w, h);
}

export async function fetchAvatarRaster(url: string): Promise<Raster> {
  let res: Response;
  try { res = await fetch(url, { mode: "cors" }); } catch (e) { throw new AvatarCorsError(String(e)); }
  if (!res.ok) throw new AvatarCorsError(`HTTP ${res.status}`);
  return rasterFromBlob(await res.blob());
}

/** A small square, centre-cropped PNG of the photo as a data: URL (for the "loaded" chip; no request). */
export function rasterThumbnail(r: Raster, side = 56): string {
  const src = document.createElement("canvas"); src.width = r.width; src.height = r.height;
  src.getContext("2d")!.putImageData(new ImageData(r.data, r.width, r.height), 0, 0);
  const out = document.createElement("canvas"); out.width = out.height = side;
  const s = Math.min(r.width, r.height);
  out.getContext("2d")!.drawImage(src, (r.width - s) / 2, (r.height - s) / 2, s, s, 0, 0, side, side);
  return out.toDataURL("image/png");
}
