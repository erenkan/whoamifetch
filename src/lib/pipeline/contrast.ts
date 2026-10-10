/** CLAHE: per-tile clipped histogram equalisation, bilinearly interpolated between tile centres. */
export function clahe(plane: Float32Array, w: number, h: number, tiles = 8, clip = 1.5): Float32Array {
  const BINS = 256, tw = w / tiles, th = h / tiles;
  const maps: Float32Array[] = [];
  for (let ty = 0; ty < tiles; ty++) for (let tx = 0; tx < tiles; tx++) {
    const x0 = Math.floor(tx * tw), x1 = Math.floor((tx + 1) * tw), y0 = Math.floor(ty * th), y1 = Math.floor((ty + 1) * th);
    const hist = new Float32Array(BINS); let n = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { hist[Math.min(BINS - 1, Math.floor(plane[y * w + x] * BINS))]++; n++; }
    const limit = Math.max(1, (clip * n) / BINS); let excess = 0;
    for (let b = 0; b < BINS; b++) if (hist[b] > limit) { excess += hist[b] - limit; hist[b] = limit; }
    const add = excess / BINS; for (let b = 0; b < BINS; b++) hist[b] += add;
    const cdf = new Float32Array(BINS); let acc = 0;
    for (let b = 0; b < BINS; b++) { acc += hist[b]; cdf[b] = acc / n; }
    maps.push(cdf);
  }
  const out = new Float32Array(plane.length);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const fx = Math.min(Math.max((x + 0.5) / tw - 0.5, 0), tiles - 1), fy = Math.min(Math.max((y + 0.5) / th - 0.5, 0), tiles - 1);
    const tx0 = Math.floor(fx), ty0 = Math.floor(fy), tx1 = Math.min(tx0 + 1, tiles - 1), ty1 = Math.min(ty0 + 1, tiles - 1);
    const ax = fx - tx0, ay = fy - ty0, bin = Math.min(BINS - 1, Math.floor(plane[y * w + x] * BINS));
    const m = (tx: number, ty: number) => maps[ty * tiles + tx][bin];
    out[y * w + x] = (1 - ay) * ((1 - ax) * m(tx0, ty0) + ax * m(tx1, ty0)) + ay * ((1 - ax) * m(tx0, ty1) + ax * m(tx1, ty1));
  }
  return out;
}

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const i = (p / 100) * (sorted.length - 1), lo = Math.floor(i), hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

export function percentileStretch(plane: Float32Array, weights: Float32Array | null, lo = 1, hi = 99.5): Float32Array {
  const vals: number[] = [];
  for (let i = 0; i < plane.length; i++) if (!weights || weights[i] > 0.5) vals.push(plane[i]);
  vals.sort((a, b) => a - b);
  const a = percentile(vals, lo), b = Math.max(percentile(vals, hi), a + 1e-6);
  const out = new Float32Array(plane.length);
  for (let i = 0; i < plane.length; i++) out[i] = Math.min(1, Math.max(0, (plane[i] - a) / (b - a)));
  return out;
}

export function gateGamma(plane: Float32Array, gate = 0.12, gamma = 0.9): Float32Array {
  const out = new Float32Array(plane.length);
  for (let i = 0; i < plane.length; i++) out[i] = Math.pow(Math.min(1, Math.max(0, (plane[i] - gate) / (1 - gate))), gamma);
  return out;
}

/** Soft highlight knee: values above k are compressed by half. */
export const knee = (v: number, k: number) => (v > k ? k + (v - k) * 0.5 : v);

/** S-curve around 0.5; contrast 1 = identity. Same formula as the prototype. */
export function sCurve(v: number, contrast: number): number {
  if (contrast === 1) return v;
  const d = v - 0.5;
  return Math.min(1, Math.max(0, 0.5 + Math.sign(d) * Math.pow(Math.abs(d), 1 / contrast) * Math.pow(0.5, 1 - 1 / contrast)));
}
