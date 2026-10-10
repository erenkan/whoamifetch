import type { Grid, PortraitOptions } from "./types";

/**
 * Photo → luminance grid, one value per character cell. Port of `prep()` + `to_grid()` from the
 * Python prototype (erenkan/erenkan, scripts/whoami.py):
 *  1. subject mask from the segmenter (or all-ones when background removal is off)
 *  2. local contrast (CLAHE-like) on the luminance, bilateral-style denoise
 *  3. percentile stretch over the subject, noise gate, mild gamma
 *  4. per cell: blend of mean and minimum (erode) so glasses frames and pupils survive
 *  5. highlight knee, S-curve contrast, hair floor inside the mask (top rows only)
 *
 * @param image  RGBA pixels of the (cropped) photo
 * @param mask   subject probability per pixel (same size), or null for no masking
 */
export function toGrid(image: ImageData, mask: Float32Array | null, opts: PortraitOptions): Grid {
  void image; void mask; void opts;
  throw new Error("not implemented yet");
}

/** Character cell aspect for VT323: advance 0.4 em at a 1.0 em line height. */
export const CELL_RATIO = 0.4;
