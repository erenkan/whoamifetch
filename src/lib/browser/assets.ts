import { displacementField } from "@/lib/pipeline/displacement";

let fontCache: Promise<string> | null = null;

function toBase64(buf: ArrayBuffer): string {
  let s = ""; const b = new Uint8Array(buf);
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}

export function loadFontBase64(): Promise<string> {
  fontCache ??= fetch("/fonts/VT323-subset.woff2").then((r) => r.arrayBuffer()).then(toBase64);
  return fontCache;
}

export async function displacementPng(w: number, h: number, strength: number, scale = 24): Promise<string> {
  const f = displacementField(w, h, strength, scale);
  const canvas = new OffscreenCanvas(f.width, f.height), ctx = canvas.getContext("2d")!;
  ctx.putImageData(new ImageData(f.data, f.width, f.height), 0, 0);
  return toBase64(await (await canvas.convertToBlob({ type: "image/png" })).arrayBuffer());
}
