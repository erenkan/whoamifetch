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
});

describe("initialsRows", () => {
  it("renders E as a 5x7 glyph scaled into the columns", () => {
    const rows = initialsRows("E", 20);
    expect(rows.length).toBeGreaterThanOrEqual(7);
    const text = rows.map((r) => r.map((c) => c.ch).join("").trimEnd());
    expect(text.some((l) => l.includes("#####"))).toBe(true); // top bar of the E
    expect(text.every((l) => l.length <= 20)).toBe(true);
  });
  it("accepts up to three letters and ignores case", () => {
    expect(initialsRows("ek", 40).length).toBe(initialsRows("EK", 40).length);
    expect(initialsRows("abcd", 40)[0].length).toBeLessThanOrEqual(40);
  });
});
