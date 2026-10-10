import { describe, expect, it } from "vitest";
import { barrelPath, displacementField } from "./displacement";

describe("displacement", () => {
  it("barrelPath is a closed path starting at the top-left corner radius", () => {
    const d = barrelPath(10, 20, 100, 50, 5, 8);
    expect(d.startsWith("M18.0,20.0 Q60.0,15.0")).toBe(true);
    expect(d.trim().endsWith("Z")).toBe(true);
  });
  it("field is neutral (128) at the centre and bends outward at the edges", () => {
    const f = displacementField(80, 40, 0.03, 24, 8);
    const px = (x: number, y: number) => [f.data[(y * f.width + x) * 4], f.data[(y * f.width + x) * 4 + 1]];
    const [cr, cg] = px(Math.floor(f.width / 2), Math.floor(f.height / 2));
    expect(Math.abs(cr - 128)).toBeLessThanOrEqual(2); expect(Math.abs(cg - 128)).toBeLessThanOrEqual(2);
    expect(px(Math.floor(f.width / 2), 0)[1]).toBeGreaterThan(128);          // top row samples from below
    expect(px(0, Math.floor(f.height / 2))[0]).toBeGreaterThan(128);         // left column samples from the right
  });
});
