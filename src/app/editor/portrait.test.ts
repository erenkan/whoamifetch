import { describe, expect, it } from "vitest";
import { RAMP } from "@/lib/pipeline/ascii";
import { cleanMask } from "@/lib/pipeline/mask";
import { portraitCells } from "./portrait";
import { initialState, type EditorState } from "./state";

/** A 400x100 panorama: textured backdrop with a person-shaped blob in the middle. */
function panorama(conf: number) {
  const w = 400, h = 100, data = new Uint8ClampedArray(w * h * 4), prob = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, inside = x >= 150 && x < 250 && y >= 10;
    const v = inside ? 90 + ((x * 13 + y * 7) % 140) : 40 + ((x + y) % 30);
    data.set([v, v, v, 255], i * 4); prob[i] = inside ? conf : 0.02;
  }
  return { photo: { width: w, height: h, data }, prob, w, h };
}
const inked = (rows: { ch: string }[][]) => rows.filter((r) => r.some((c) => c.ch !== " ")).length;

describe("portraitCells", () => {
  it("shows initials without a photo", () => {
    const rows = portraitCells({ ...initialState, source: { ...initialState.source, kind: "none" } });
    expect(rows.some((r) => r.some((c) => c.ch === "#"))).toBe(true);
  });
  it("keeps the head-and-shoulders crop when the background is kept", () => {
    const { photo, prob, w, h } = panorama(0.9);
    const s: EditorState = { ...initialState, source: { ...initialState.source, kind: "upload", status: "ready" }, photo, prob, mask: { thr: 0.5, data: cleanMask(prob, w, h) } };
    const removed = portraitCells(s), kept = portraitCells({ ...s, removeBackground: false });
    expect(kept.length).toBe(removed.length);               // same 6:7 box, not the 4:1 strip
    expect(kept.length).toBeGreaterThan(30);
  });
  it("prints ink on a paper screen: a cell lit densely on green is blank on paper", () => {
    const { photo, prob, w, h } = panorama(0.9);
    const s: EditorState = { ...initialState, source: { ...initialState.source, kind: "upload", status: "ready" }, photo, prob, mask: { thr: 0.5, data: cleanMask(prob, w, h) } };
    const green = portraitCells(s), paper = portraitCells({ ...s, card: { ...s.card, phosphor: "paper" } });
    let lit = 0;
    green.forEach((row, r) => row.forEach((c, k) => {
      if (RAMP.indexOf(c.ch) < 8) return;                   // "%" and "@": the brightest cells
      lit++; expect(RAMP.indexOf(paper[r]?.[k]?.ch ?? " ")).toBeLessThanOrEqual(1);
    }));
    expect(lit).toBeGreaterThan(0);
  });
  it("keeps the last good mask when the threshold slider would lose the person", () => {
    const { photo, prob, w, h } = panorama(0.7);
    const s: EditorState = { ...initialState, source: { ...initialState.source, kind: "upload", status: "ready" }, photo, prob, mask: { thr: 0.5, data: cleanMask(prob, w, h) }, maskThreshold: 0.8 };
    expect(inked(portraitCells(s))).toBeGreaterThan(10);
  });
});
