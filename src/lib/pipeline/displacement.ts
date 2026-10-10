/** Rounded rectangle whose four sides bow outward by bulge/2: the face of a CRT tube. */
export function barrelPath(x: number, y: number, w: number, h: number, bulge: number, r: number): string {
  const f = (n: number) => n.toFixed(1), cx = x + w / 2, cy = y + h / 2;
  return `M${f(x + r)},${f(y)} Q${f(cx)},${f(y - bulge)} ${f(x + w - r)},${f(y)} ` +
    `C${f(x + w - r / 2)},${f(y)} ${f(x + w)},${f(y + r / 2)} ${f(x + w)},${f(y + r)} ` +
    `Q${f(x + w + bulge)},${f(cy)} ${f(x + w)},${f(y + h - r)} ` +
    `C${f(x + w)},${f(y + h - r / 2)} ${f(x + w - r / 2)},${f(y + h)} ${f(x + w - r)},${f(y + h)} ` +
    `Q${f(cx)},${f(y + h + bulge)} ${f(x + r)},${f(y + h)} ` +
    `C${f(x + r / 2)},${f(y + h)} ${f(x)},${f(y + h - r / 2)} ${f(x)},${f(y + h - r)} ` +
    `Q${f(x - bulge)},${f(cy)} ${f(x)},${f(y + r)} ` +
    `C${f(x)},${f(y + r / 2)} ${f(x + r / 2)},${f(y)} ${f(x + r)},${f(y)} Z`;
}

/**
 * RGBA field for feDisplacementMap: the filter samples the source at (x + scale*(R/255-0.5),
 * y + scale*(G/255-0.5)). Rows bow up at the top and down at the bottom, columns bow out at the
 * sides, the centre stays put. `step` = px per field pixel (the SVG stretches it to the screen).
 */
export function displacementField(w: number, h: number, strength: number, scale: number, step = 8) {
  const cols = Math.max(2, Math.floor(w / step)), rows = Math.max(2, Math.floor(h / step));
  const data = new Uint8ClampedArray(cols * rows * 4);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const u = ((c + 0.5) / cols) * 2 - 1, v = ((r + 0.5) / rows) * 2 - 1;
    const dx = -strength * u * (1 - v * v) * (w / 2), dy = -strength * v * (1 - u * u) * (h / 2);
    const i = (r * cols + c) * 4;
    data[i] = 128 + (dx / scale) * 255; data[i + 1] = 128 + (dy / scale) * 255; data[i + 2] = 0; data[i + 3] = 255;
  }
  return { width: cols, height: rows, data };
}
