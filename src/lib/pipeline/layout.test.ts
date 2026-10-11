import { describe, expect, it } from "vitest";
import { layout } from "./layout";
import { DEFAULT_CARD } from "./svg";

const portrait = (n: number) => Array.from({ length: n }, () => Array.from({ length: 100 }, () => ({ ch: "#", op: 1 })));
const rows12 = Array.from({ length: 12 }, (_, i) => ({ key: `Key${i}`, value: "a fairly long value to widen the card" }));

describe("layout", () => {
  it("never lets the closing prompt overlap the palette strip, even with 12 rows and a tall portrait", () => {
    for (const chrome of ["crt", "macos", "win95", "macplus"] as const) {
      const l = layout(portrait(47), { ...DEFAULT_CARD, chrome, rows: rows12 });
      const stripBottom = l.yTop + l.infoLines * l.lineInfo;
      const artBottom = l.yTop + 47 * DEFAULT_CARD.artSize;
      expect(l.yEnd - l.baseOff).toBeGreaterThanOrEqual(Math.max(stripBottom, artBottom));
      expect(l.H).toBeGreaterThan(l.yEnd);
      expect(l.W).toBeGreaterThanOrEqual(DEFAULT_CARD.width);
    }
  });
  it("grows the width for long rows", () => {
    const short = layout(portrait(10), DEFAULT_CARD);
    const long = layout(portrait(10), { ...DEFAULT_CARD, rows: [{ key: "K", value: "x".repeat(120) }] });
    expect(long.W).toBeGreaterThan(short.W);
  });
  it("macplus keeps a front panel under the screen", () => {
    const l = layout(portrait(10), { ...DEFAULT_CARD, chrome: "macplus" });
    expect(l.screen).toEqual({ x: 70, y: 80, w: l.W - 140, h: l.H - 80 - 228 });
    expect(l.W).toBe(900);
  });
});
