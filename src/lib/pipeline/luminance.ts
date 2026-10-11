import { boxBlur, cropPlane, cropRaster, luminancePlane, minPool, resizeArea, type Box } from "./image";
import { autoCrop, cleanMask, shoulderRow, torsoFade } from "./mask";
import { clahe, gateGamma, knee, percentileStretch, sCurve } from "./contrast";
import type { Grid, PortraitOptions, Raster } from "./types";

/** Character cell aspect for VT323: advance 0.4 em at a 1.0 em line height. */
export const CELL_RATIO = 0.4;

export const DEFAULT_PORTRAIT: PortraitOptions = { cols: 100, dark: 0.6, knee: 0.75, contrast: 1.3, floor: 0.18, floorUntil: 0.3, clahe: 1.5, gate: 0.12 };

export interface Prepped { plane: Float32Array; weights: Float32Array; w: number; h: number }

/** Steps 1-3 of the prototype's prep(): mask weights, denoise, local contrast, stretch, gate. */
export function prep(img: Raster, mask: Uint8Array | null, opts: PortraitOptions): Prepped {
  const { width: w, height: h } = img;
  const m = mask ?? new Uint8Array(w * h).fill(1);
  const sh = shoulderRow(m, w, h);
  const weights = torsoFade(m, w, h, Math.round(sh + 0.2 * (h - sh)), h);
  const soft = boxBlur(Float32Array.from(weights), w, h, 1);
  let plane = boxBlur(luminancePlane(img), w, h, 1);
  if (opts.clahe > 0) plane = clahe(plane, w, h, 8, opts.clahe);
  for (let i = 0; i < plane.length; i++) plane[i] *= soft[i];
  plane = gateGamma(percentileStretch(plane, soft, 1, 99.5), opts.gate, 0.9);
  return { plane, weights: soft, w, h };
}

/** Steps 4-5: per-cell mean/min blend, knee, S-curve, hair floor. */
export function toGrid(p: Prepped, opts: PortraitOptions): Grid {
  const cols = opts.cols, rows = Math.round(cols * (p.h / p.w) * CELL_RATIO);
  const mean = resizeArea(p.plane, p.w, p.h, cols, rows);
  const mn = opts.dark > 0 ? minPool(p.plane, p.w, p.h, cols, rows) : mean;
  const mg = resizeArea(p.weights, p.w, p.h, cols, rows);
  const data = new Float32Array(cols * rows), cover = new Float32Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    const rf = rows > 1 ? r / (rows - 1) : 0;
    const floorW = Math.min(1, Math.max(0, (opts.floorUntil - rf) / 0.08));
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      let v = (1 - opts.dark) * mean[i] + opts.dark * mn[i];
      v = sCurve(knee(v, opts.knee), opts.contrast);
      const inside = Math.min(1, Math.max(0, (mg[i] - 0.35) / 0.3));
      data[i] = Math.max(v, opts.floor * floorW * inside);
      cover[i] = mg[i];
    }
  }
  return { cols, rows, data, cover };
}

/**
 * Full pipeline. `prob` is the segmenter output (null = keep everything); `crop` overrides auto-crop;
 * `cleaned` is `cleanMask(prob)` when the caller already has it (it is the expensive step).
 */
export function portraitGrid(img: Raster, prob: Float32Array | null, opts: PortraitOptions, crop?: Box, cleaned?: Uint8Array): Grid {
  const { width: w, height: h } = img;
  const mask = prob ? (cleaned ?? cleanMask(prob, w, h)) : null;
  const box = crop ?? (mask ? autoCrop(mask, w, h) : { x: 0, y: 0, w, h });
  const cimg = cropRaster(img, box);
  const cmask = mask ? Uint8Array.from(cropPlane(Float32Array.from(mask), w, h, box)) : null;
  if (cmask && !cmask.some((v) => v)) return { cols: opts.cols, rows: Math.round(opts.cols * (box.h / box.w) * CELL_RATIO), data: new Float32Array(opts.cols * Math.round(opts.cols * (box.h / box.w) * CELL_RATIO)) };
  return toGrid(prep(cimg, cmask, opts), opts);
}
