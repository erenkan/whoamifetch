import type { Box } from "./image";

export function thresholdMask(prob: Float32Array, thr: number): Uint8Array {
  const m = new Uint8Array(prob.length);
  for (let i = 0; i < prob.length; i++) m[i] = prob[i] >= thr ? 1 : 0;
  return m;
}

/** False when the segmenter found no person: mean subject probability below `minMean` (2% of the frame). */
export function hasSubject(prob: ArrayLike<number>, minMean = 0.02): boolean {
  let s = 0; for (let i = 0; i < prob.length; i++) s += prob[i];
  return prob.length > 0 && s / prob.length >= minMean;
}

/**
 * Square-window erode (`all`: every pixel in the window is 1) or dilate (any pixel is 1), as a
 * horizontal then a vertical pass with a running count; out-of-image pixels count as 0.
 */
function morph(m: Uint8Array, w: number, h: number, r: number, all: boolean): Uint8Array {
  const full = 2 * r + 1;
  const pass = (src: Uint8Array, len: number, stride: number, lines: number, lineStride: number) => {
    const out = new Uint8Array(src.length);
    for (let l = 0; l < lines; l++) {
      const base = l * lineStride;
      let n = 0;
      for (let j = 0; j < Math.min(r, len); j++) n += src[base + j * stride];
      for (let i = 0; i < len; i++) {
        if (i + r < len) n += src[base + (i + r) * stride];
        if (i - r - 1 >= 0) n -= src[base + (i - r - 1) * stride];
        out[base + i * stride] = all ? (n === full ? 1 : 0) : (n > 0 ? 1 : 0);
      }
    }
    return out;
  };
  return pass(pass(m, w, 1, h, w), h, w, w, 1);
}
export const erode = (m: Uint8Array, w: number, h: number, r: number) => morph(m, w, h, r, true);
export const dilate = (m: Uint8Array, w: number, h: number, r: number) => morph(m, w, h, r, false);

function label(m: Uint8Array, w: number, h: number): { labels: Int32Array; sizes: number[] } {
  const labels = new Int32Array(m.length).fill(-1); const sizes: number[] = []; const stack: number[] = [];
  for (let s = 0; s < m.length; s++) {
    if (!m[s] || labels[s] >= 0) continue;
    const id = sizes.length; sizes.push(0); stack.push(s); labels[s] = id;
    while (stack.length) {
      const i = stack.pop()!; sizes[id]++;
      const x = i % w, y = (i - x) / w;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        const j = yy * w + xx; if (m[j] && labels[j] < 0) { labels[j] = id; stack.push(j); }
      }
    }
  }
  return { labels, sizes };
}

export function largestComponent(m: Uint8Array, w: number, h: number): Uint8Array {
  const { labels, sizes } = label(m, w, h);
  if (!sizes.length) return new Uint8Array(m.length);
  const big = sizes.indexOf(Math.max(...sizes));
  const out = new Uint8Array(m.length);
  for (let i = 0; i < m.length; i++) out[i] = labels[i] === big ? 1 : 0;
  return out;
}

export function fillHoles(m: Uint8Array, w: number, h: number): Uint8Array {
  const bg = new Uint8Array(m.length); for (let i = 0; i < m.length; i++) bg[i] = m[i] ? 0 : 1;
  const { labels } = label(bg, w, h);
  const border = new Set<number>();
  for (let x = 0; x < w; x++) { if (labels[x] >= 0) border.add(labels[x]); if (labels[(h - 1) * w + x] >= 0) border.add(labels[(h - 1) * w + x]); }
  for (let y = 0; y < h; y++) { if (labels[y * w] >= 0) border.add(labels[y * w]); if (labels[y * w + w - 1] >= 0) border.add(labels[y * w + w - 1]); }
  const out = new Uint8Array(m);
  for (let i = 0; i < m.length; i++) if (!m[i] && !border.has(labels[i])) out[i] = 1;
  return out;
}

export function cleanMask(prob: Float32Array, w: number, h: number, thr = 0.5): Uint8Array {
  let m = thresholdMask(prob, thr);
  m = dilate(erode(m, w, h, 2), w, h, 2);   // open: drop specks
  m = erode(dilate(m, w, h, 5), w, h, 5);   // close: bridge gaps
  return fillHoles(largestComponent(m, w, h), w, h);
}

/** The cleaned subject mask (what the portrait renders), or null when it covers under 2% of the frame: no person. */
export function subjectMask(prob: Float32Array, w: number, h: number, thr = 0.5): Uint8Array | null {
  const m = cleanMask(prob, w, h, thr);
  return hasSubject(m) ? m : null;
}

function bbox(m: Uint8Array, w: number, h: number) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (m[y * w + x]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return x1 < 0 ? null : { x0, y0, x1: x1 + 1, y1: y1 + 1 };
}

/**
 * Shoulder line: the widest row of the head (top half of the bbox), the narrowest row below it
 * (neck), then the first row below the neck that is 5% wider than the head. `h` when the image
 * stops at the chin or the shoulders never get wider than the head (no fade in that case).
 */
export function shoulderRow(m: Uint8Array, w: number, h: number): number {
  const b = bbox(m, w, h); if (!b) return h;
  const raw = new Float32Array(h);
  for (let y = b.y0; y < b.y1; y++) { let n = 0; for (let x = b.x0; x < b.x1; x++) n += m[y * w + x]; raw[y] = n; }
  const widths = new Float32Array(h);                      // 5-row running median: drops noise, keeps the shoulder step sharp
  for (let y = 0; y < h; y++) {
    const win: number[] = []; for (let k = -2; k <= 2; k++) if (y + k >= 0 && y + k < h) win.push(raw[y + k]);
    win.sort((a, b) => a - b); widths[y] = win[win.length >> 1];
  }
  const halfway = b.y0 + Math.max(1, Math.floor((b.y1 - b.y0) / 2));
  let yHead = b.y0; for (let y = b.y0; y < halfway; y++) if (widths[y] > widths[yHead]) yHead = y;
  let yNeck = yHead; for (let y = yHead; y < b.y1; y++) if (widths[y] < widths[yNeck]) yNeck = y;
  for (let y = yNeck; y < b.y1; y++) if (widths[y] > widths[yHead] * 1.05) return y;
  return h;
}

/** Mask as weights: 1 above fromRow, fading with (1-t)^1.5 to 0 at toRow. */
export function torsoFade(m: Uint8Array, w: number, h: number, fromRow: number, toRow: number): Float32Array {
  const out = new Float32Array(m.length);
  for (let y = 0; y < h; y++) {
    const t = Math.min(1, Math.max(0, (y - fromRow) / Math.max(1, toRow - fromRow)));
    const wgt = Math.pow(1 - t, 1.5);
    for (let x = 0; x < w; x++) out[y * w + x] = m[y * w + x] * wgt;
  }
  return out;
}

/** Head-and-shoulders crop: mask bbox from the top down to 1.35× the shoulder row, padded, aspect w/h = aspect, clamped. */
export function autoCrop(m: Uint8Array, w: number, h: number, aspect = 6 / 7): Box {
  const b = bbox(m, w, h);
  if (!b) return { x: 0, y: 0, w, h };
  const sh = shoulderRow(m, w, h);
  const top = Math.max(0, b.y0 - 0.08 * h);
  const bottom = Math.min(h, Math.max(b.y1, sh + (sh - b.y0) * 0.35));
  let ch = bottom - top, cw = ch * aspect;
  const cx = (b.x0 + b.x1) / 2;
  if (cw > w) { cw = w; ch = Math.min(h, cw / aspect); }
  if (ch > h) { ch = h; cw = Math.min(w, ch * aspect); }
  let x = Math.round(cx - cw / 2), y = Math.round(top);
  x = Math.min(Math.max(0, x), w - Math.round(cw)); y = Math.min(Math.max(0, y), h - Math.round(ch));
  return { x, y, w: Math.round(cw), h: Math.round(ch) };
}
