import { describe, expect, it } from "vitest";
import { boxBlur, cropRaster, luminancePlane, minPool, resizeArea } from "./image";

function raster(w: number, h: number, fill: (x: number, y: number) => [number, number, number]) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [r, g, b] = fill(x, y); const i = (y * w + x) * 4;
    data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
  }
  return { width: w, height: h, data };
}

describe("image helpers", () => {
  it("luminancePlane uses Rec.601 weights", () => {
    const img = raster(1, 1, () => [255, 0, 0]);
    expect(luminancePlane(img)[0]).toBeCloseTo(0.299, 3);
  });
  it("cropRaster copies the box", () => {
    const img = raster(4, 4, (x, y) => [x * 10, y * 10, 0]);
    const c = cropRaster(img, { x: 1, y: 2, w: 2, h: 1 });
    expect([c.width, c.height]).toEqual([2, 1]);
    expect(Array.from(c.data.slice(0, 3))).toEqual([10, 20, 0]);
  });
  it("boxBlur keeps a constant plane constant and averages a step", () => {
    const flat = new Float32Array(9).fill(0.3);
    expect(Array.from(boxBlur(flat, 3, 3, 1))).toEqual(Array.from(flat));
    const step = Float32Array.from([0, 0, 1, 1]);
    const b = boxBlur(step, 4, 1, 1);
    expect(b[1]).toBeCloseTo(1 / 3, 5); expect(b[2]).toBeCloseTo(2 / 3, 5);
  });
  it("resizeArea averages each cell, minPool takes the minimum", () => {
    const plane = Float32Array.from([0, 1, 0, 1, 0.5, 0.5, 0.5, 0.5]); // 4x2
    expect(Array.from(resizeArea(plane, 4, 2, 2, 1))).toEqual([0.5, 0.5]);
    expect(Array.from(minPool(plane, 4, 2, 2, 1))).toEqual([0, 0]);
  });
});
