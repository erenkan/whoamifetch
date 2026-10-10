import { describe, expect, it } from "vitest";
import { isIdenticon } from "./identicon";

function raster(w: number, h: number, px: (x: number, y: number) => [number, number, number]) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const [r, g, b] = px(x, y), i = (y * w + x) * 4; data.set([r, g, b, 255], i); }
  return { width: w, height: h, data };
}

describe("isIdenticon", () => {
  it("detects a two-colour 5x5 grid pattern", () => {
    const img = raster(50, 50, (x, y) => ((Math.floor(x / 10) + Math.floor(y / 10)) % 2 ? [240, 240, 240] : [80, 120, 200]));
    expect(isIdenticon(img)).toBe(true);
  });
  it("rejects a photo-like gradient", () => {
    const img = raster(50, 50, (x, y) => [x * 5, y * 5, 128]);
    expect(isIdenticon(img)).toBe(false);
  });
});
