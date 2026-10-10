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
