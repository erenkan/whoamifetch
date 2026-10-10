import { describe, expect, it } from "vitest";
import { clahe, gateGamma, knee, percentileStretch, sCurve } from "./contrast";

describe("contrast", () => {
  it("clahe leaves a flat plane flat and spreads a low-contrast gradient", () => {
    const flat = new Float32Array(64 * 64).fill(0.4);
    const f = clahe(flat, 64, 64, 2, 1.5);
    expect(Math.max(...f) - Math.min(...f)).toBeLessThan(0.02);
    const g = new Float32Array(64 * 64); for (let i = 0; i < g.length; i++) g[i] = 0.4 + 0.1 * ((i % 64) / 63);
    const e = clahe(g, 64, 64, 2, 4);
    expect(Math.max(...e) - Math.min(...e)).toBeGreaterThan(0.25); // OpenCV gives 0.28 here: every occupied bin hits the clip limit
  });
  it("percentileStretch maps lo/hi percentiles to 0/1 over the weighted pixels", () => {
    const p = Float32Array.from({ length: 200 }, (_, i) => i / 199);
    const wgt = new Float32Array(200).fill(1);
    const s = percentileStretch(p, wgt, 10, 90);
    expect(s[0]).toBe(0); expect(s[199]).toBe(1); expect(s[100]).toBeCloseTo(0.5, 1);
  });
  it("gateGamma zeroes values under the gate", () => {
    const r = gateGamma(Float32Array.from([0.05, 0.12, 1]), 0.12, 1);
    expect(r[0]).toBe(0); expect(r[1]).toBe(0); expect(r[2]).toBe(1);
  });
  it("knee compresses highlights, sCurve keeps 0, 0.5 and 1 fixed", () => {
    expect(knee(0.5, 0.75)).toBe(0.5); expect(knee(1, 0.75)).toBeCloseTo(0.875, 5);
    expect(sCurve(0.5, 1.3)).toBeCloseTo(0.5, 5); expect(sCurve(1, 1.3)).toBeCloseTo(1, 5); expect(sCurve(0, 1.3)).toBeCloseTo(0, 5);
    expect(sCurve(0.25, 1.3)).toBeLessThan(0.25);
  });
});
