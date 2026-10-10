import type { Raster } from "./types";

/** GitHub identicons are square, two-colour 5x5 grids; a photo has hundreds of quantised colours. */
export function isIdenticon(img: Raster): boolean {
  if (img.width !== img.height) return false;
  const colours = new Set<number>(); const d = img.data;
  for (let i = 0; i < d.length; i += 16) {                  // every 4th pixel is plenty
    colours.add(((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4));
    if (colours.size > 3) return false;
  }
  return true;
}
