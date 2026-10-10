import { describe, expect, it } from "vitest";
import { autoCrop, cleanMask, dilate, erode, fillHoles, hasSubject, largestComponent, shoulderRow, subjectMask, thresholdMask, torsoFade } from "./mask";

function rect(w: number, h: number, boxes: [number, number, number, number][]) {
  const m = new Uint8Array(w * h);
  for (const [x0, y0, x1, y1] of boxes) for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) m[y * w + x] = 1;
  return m;
}

describe("mask", () => {
  it("thresholdMask", () => {
    expect(Array.from(thresholdMask(Float32Array.from([0.2, 0.5, 0.9]), 0.5))).toEqual([0, 1, 1]);
  });
  it("largestComponent keeps only the biggest blob", () => {
    const m = rect(10, 10, [[0, 0, 6, 6], [8, 8, 10, 10]]);
    const l = largestComponent(m, 10, 10);
    expect(l[9 * 10 + 9]).toBe(0); expect(l[0]).toBe(1);
  });
  it("fillHoles fills enclosed background", () => {
    const m = rect(7, 7, [[1, 1, 6, 6]]); m[3 * 7 + 3] = 0;
    expect(fillHoles(m, 7, 7)[3 * 7 + 3]).toBe(1); expect(fillHoles(m, 7, 7)[0]).toBe(0);
  });
  it("cleanMask removes specks and returns one filled blob", () => {
    const prob = new Float32Array(40 * 40);
    for (let y = 5; y < 35; y++) for (let x = 10; x < 30; x++) prob[y * 40 + x] = 0.9;
    prob[2 * 40 + 2] = 0.9; prob[20 * 40 + 20] = 0;
    const m = cleanMask(prob, 40, 40);
    expect(m[2 * 40 + 2]).toBe(0); expect(m[20 * 40 + 20]).toBe(1);
  });
  it("shoulderRow and torsoFade", () => {
    const m = rect(20, 20, [[8, 0, 12, 10], [0, 10, 20, 20]]); // head 4 wide, shoulders full width from row 10
    expect(shoulderRow(m, 20, 20)).toBe(10);
    const headOnly = rect(20, 20, [[6, 2, 14, 18]]);             // no shoulders: no fade
    expect(shoulderRow(headOnly, 20, 20)).toBe(20);
    const wideHead = rect(30, 40, [[5, 0, 25, 20], [10, 20, 20, 26], [2, 26, 28, 40]]); // head wider than 70% of the bbox
    expect(shoulderRow(wideHead, 30, 40)).toBe(26);
    const f = torsoFade(m, 20, 20, 10, 20);
    expect(f[5 * 20 + 9]).toBe(1); expect(f[19 * 20 + 1]).toBeLessThan(0.2);
  });
  it("autoCrop clamps to the image and keeps the aspect", () => {
    const m = rect(400, 100, [[150, 10, 250, 100]]);
    const b = autoCrop(m, 400, 100);
    expect(b.x).toBeGreaterThanOrEqual(0); expect(b.y).toBeGreaterThanOrEqual(0);
    expect(b.x + b.w).toBeLessThanOrEqual(400); expect(b.y + b.h).toBeLessThanOrEqual(100);
    expect(Math.abs(b.w / b.h - 6 / 7)).toBeLessThan(0.35); // clamped by the short image height
  });
  it("hasSubject is false when the mean subject probability is under 2%", () => {
    expect(hasSubject(new Float32Array(1000).fill(0.01))).toBe(false);   // landscape, logo: segmenter miss
    const speck = new Float32Array(1000); speck.fill(1, 0, 15);           // 1.5% of the frame
    expect(hasSubject(speck)).toBe(false);
    expect(hasSubject(new Float32Array(1000).fill(0.3))).toBe(true);
    expect(hasSubject(new Float32Array(0))).toBe(false);
  });
  it("subjectMask returns the cleaned mask only when a person covers 2% of the frame", () => {
    const diffuse = new Float32Array(60 * 60).fill(0.3);               // mean 0.3, but nothing reaches the 0.5 threshold
    expect(hasSubject(diffuse)).toBe(true);
    expect(subjectMask(diffuse, 60, 60)).toBeNull();
    const speck = new Float32Array(60 * 60).fill(0.1);                 // diffuse haze plus one 6x6 confident blob (1%)
    for (let y = 10; y < 16; y++) for (let x = 30; x < 36; x++) speck[y * 60 + x] = 0.9;
    expect(subjectMask(speck, 60, 60)).toBeNull();
    const person = new Float32Array(60 * 60);                          // head-and-shoulders blob, ~40% of the frame
    for (let y = 15; y < 60; y++) for (let x = 15; x < 45; x++) person[y * 60 + x] = 0.9;
    expect(Array.from(subjectMask(person, 60, 60)!)).toEqual(Array.from(cleanMask(person, 60, 60)));
    expect(subjectMask(person, 60, 60, 0.95)).toBeNull();              // the user's threshold applies
  });
  it("erode and dilate match the brute-force square window (out-of-image pixels count as 0)", () => {
    const brute = (m: Uint8Array, w: number, h: number, r: number, all: boolean) => {
      const out = new Uint8Array(m.length);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let a = 1, any = 0;
        for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
          const v = y + dy >= 0 && y + dy < h && x + dx >= 0 && x + dx < w ? m[(y + dy) * w + x + dx] : 0;
          a &= v; any |= v;
        }
        out[y * w + x] = all ? a : any;
      }
      return out;
    };
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (const [w, h, r, density] of [[23, 17, 1, 0.5], [40, 31, 2, 0.8], [31, 40, 5, 0.9], [12, 9, 5, 0.3]] as const) {
      const m = Uint8Array.from({ length: w * h }, () => (rnd() < density ? 1 : 0));
      expect(Array.from(erode(m, w, h, r))).toEqual(Array.from(brute(m, w, h, r, true)));
      expect(Array.from(dilate(m, w, h, r))).toEqual(Array.from(brute(m, w, h, r, false)));
    }
  });
});
