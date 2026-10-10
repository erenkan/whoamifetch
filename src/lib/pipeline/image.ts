import type { Raster } from "./types";

export interface Box { x: number; y: number; w: number; h: number }

export function luminancePlane(img: Raster): Float32Array {
  const n = img.width * img.height, out = new Float32Array(n), d = img.data;
  for (let i = 0; i < n; i++) out[i] = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255;
  return out;
}

export function cropRaster(img: Raster, b: Box): Raster {
  const data = new Uint8ClampedArray(b.w * b.h * 4);
  for (let y = 0; y < b.h; y++) {
    const src = ((b.y + y) * img.width + b.x) * 4;
    data.set(img.data.subarray(src, src + b.w * 4), y * b.w * 4);
  }
  return { width: b.w, height: b.h, data };
}

export function cropPlane(plane: Float32Array, w: number, _h: number, b: Box): Float32Array {
  const out = new Float32Array(b.w * b.h);
  for (let y = 0; y < b.h; y++) out.set(plane.subarray((b.y + y) * w + b.x, (b.y + y) * w + b.x + b.w), y * b.w);
  return out;
}

/** Separable box blur with edge clamping; r = 0 returns a copy. */
export function boxBlur(plane: Float32Array, w: number, h: number, r: number): Float32Array {
  const pass = (src: Float32Array, len: number, stride: number, lines: number, lineStride: number) => {
    const out = new Float32Array(src.length);
    for (let l = 0; l < lines; l++) {
      const base = l * lineStride;
      for (let i = 0; i < len; i++) {
        let s = 0, n = 0;
        for (let k = -r; k <= r; k++) { const j = i + k; if (j >= 0 && j < len) { s += src[base + j * stride]; n++; } }
        out[base + i * stride] = s / n;
      }
    }
    return out;
  };
  const horizontal = pass(plane, w, 1, h, w);
  return pass(horizontal, h, w, w, 1);
}

function cellBounds(size: number, cells: number, i: number): [number, number] {
  return [Math.floor((i * size) / cells), Math.max(Math.floor((i * size) / cells) + 1, Math.floor(((i + 1) * size) / cells))];
}

export function resizeArea(plane: Float32Array, w: number, h: number, cols: number, rows: number): Float32Array {
  const out = new Float32Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    const [y0, y1] = cellBounds(h, rows, r);
    for (let c = 0; c < cols; c++) {
      const [x0, x1] = cellBounds(w, cols, c);
      let s = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) s += plane[y * w + x];
      out[r * cols + c] = s / ((y1 - y0) * (x1 - x0));
    }
  }
  return out;
}

export function minPool(plane: Float32Array, w: number, h: number, cols: number, rows: number): Float32Array {
  const out = new Float32Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    const [y0, y1] = cellBounds(h, rows, r);
    for (let c = 0; c < cols; c++) {
      const [x0, x1] = cellBounds(w, cols, c);
      let m = Infinity;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) m = Math.min(m, plane[y * w + x]);
      out[r * cols + c] = m;
    }
  }
  return out;
}
