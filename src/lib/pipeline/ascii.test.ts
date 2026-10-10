import { describe, expect, it } from "vitest";
import { artRows, RAMP } from "./ascii";

describe("artRows", () => {
  it("maps luminance to the ramp and trims trailing blanks", () => {
    const grid = { cols: 4, rows: 1, data: Float32Array.from([0, 0.5, 1, 0]) };
    const rows = artRows(grid);
    expect(rows[0].map((c) => c.ch).join("")).toBe(" " + RAMP[Math.round(0.5 * 9)] + "@");
    expect(rows[0][2].op).toBe(1);
    expect(rows[0][0].op).toBe(0.55);
  });
});
