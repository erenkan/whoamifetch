import { describe, expect, it } from "vitest";
import { loadGrid, loadMaskProb, loadPng, loadRows } from "../../../tests/helpers/fixtures";
import { artRows, RAMP } from "./ascii";
import { DEFAULT_PORTRAIT, portraitGrid } from "./luminance";

describe("portraitGrid against the Python prototype", () => {
  const img = loadPng("portrait.png");
  const prob = loadMaskProb();
  const golden = loadGrid();
  const [l, t, r, b] = golden.crop;
  const crop = { x: Math.floor(l * img.width), y: Math.floor(t * img.height), w: Math.floor(r * img.width) - Math.floor(l * img.width), h: Math.floor(b * img.height) - Math.floor(t * img.height) };
  const grid = portraitGrid(img, prob, DEFAULT_PORTRAIT, crop);

  it("has the golden shape", () => {
    expect(grid.cols).toBe(golden.cols); expect(grid.rows).toBe(golden.rows);
  });
  it("is close to the golden luminance (MAE < 0.08)", () => {
    let mae = 0; for (let i = 0; i < grid.data.length; i++) mae += Math.abs(grid.data[i] - golden.data[i]);
    expect(mae / grid.data.length).toBeLessThan(0.08);
  });
  it("reproduces the golden glyphs (exact > 75%, within one ramp level > 95%)", () => {
    const rows = artRows(grid).map((r) => r.map((c) => c.ch).join(""));
    const want = loadRows(); let exact = 0, adjacent = 0, total = 0;
    for (let i = 0; i < want.length; i++) for (let j = 0; j < golden.cols; j++) {
      const got = rows[i]?.[j] ?? " ", exp = want[i][j] ?? " "; total++;
      if (got === exp) exact++;
      if (Math.abs(RAMP.indexOf(got) - RAMP.indexOf(exp)) <= 1) adjacent++; // neighbouring levels are quantisation flips
    }
    expect(exact / total).toBeGreaterThan(0.75);
    expect(adjacent / total).toBeGreaterThan(0.95);
  });
  it("blank mask yields a blank grid", () => {
    const g = portraitGrid(img, new Float32Array(prob.length), DEFAULT_PORTRAIT, crop);
    expect(Math.max(...g.data)).toBe(0);
  });
});
