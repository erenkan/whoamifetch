import { describe, expect, it } from "vitest";
import { artRows, initialsRows, RAMP } from "./ascii";

describe("artRows", () => {
  it("maps luminance to the ramp and trims trailing blanks", () => {
    const grid = { cols: 4, rows: 1, data: Float32Array.from([0, 0.5, 1, 0]) };
    const rows = artRows(grid);
    expect(rows[0].map((c) => c.ch).join("")).toBe(" " + RAMP[Math.round(0.5 * 9)] + "@");
    expect(rows[0][2].op).toBe(1);
    expect(rows[0][0].op).toBe(0.55);
  });
  it("prints ink on paper: dark pixels get dense glyphs, cells outside the subject stay blank", () => {
    const grid = { cols: 3, rows: 1, data: Float32Array.from([0.1, 0.9, 0.1]), cover: Float32Array.from([1, 1, 0]) };
    expect(artRows(grid)[0].map((c) => c.ch).join("")).toBe(".%.");
    const ink = artRows(grid, true);
    expect(ink[0].map((c) => c.ch)).toEqual(["%"]);         // 0.9^1.4 = 0.863; the bright cell and the uncovered one are blank
    expect(ink[0][0].op).toBe(1);
  });
  it("ink without a cover treats every cell as subject", () => {
    const grid = { cols: 2, rows: 1, data: Float32Array.from([0.9, 0.1]) };
    expect(artRows(grid, true)[0].map((c) => c.ch).join("")).toBe(" %");
  });
});

describe("initialsRows", () => {
  it("renders E as a 5x7 glyph scaled into the columns", () => {
    const rows = initialsRows("E", 20);
    expect(rows.length).toBeGreaterThanOrEqual(7);
    const text = rows.map((r) => r.map((c) => c.ch).join("").trimEnd());
    expect(text.some((l) => l.includes("#####"))).toBe(true); // top bar of the E
    expect(text.every((l) => l.length <= 20)).toBe(true);
  });
  it("keeps each font pixel square on screen (a cell is 0.4 as wide as it is tall)", () => {
    const rows = initialsRows("E", 100);
    const ink = rows.filter((r) => r.some((c) => c.ch === "#"));
    const width = Math.max(...ink.map((r) => r.length - r.findIndex((c) => c.ch === "#")));
    const pxW = width / 5, pxH = ink.length / 7;            // cells per font pixel, across and down
    expect(Math.abs(pxH / (pxW * 0.4) - 1)).toBeLessThan(0.25);
    expect(width).toBeGreaterThanOrEqual(80);              // the block fills ~90% of the columns
  });
  it("folds accents and Turkish letters to their base letters", () => {
    const text = (s: string) => initialsRows(s, 40).map((r) => r.map((c) => c.ch).join("")).join("\n");
    expect(text("şö")).toBe(text("SO")); expect(text("ÇK")).toBe(text("CK")); expect(text("İı")).toBe(text("II"));
  });
  it("accepts up to three letters and ignores case", () => {
    expect(initialsRows("ek", 40).length).toBe(initialsRows("EK", 40).length);
    expect(initialsRows("abcd", 40)[0].length).toBeLessThanOrEqual(40);
  });
});
