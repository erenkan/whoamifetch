import type { Cell, Grid } from "./types";

/** Density ramp, darkest to brightest. */
export const RAMP = " .:-=+*#%@";

/** Grid → rows of cells (glyph by luminance, opacity in four phosphor steps), trailing blanks trimmed. */
export function artRows(grid: Grid): Cell[][] {
  const out: Cell[][] = [];
  for (let r = 0; r < grid.rows; r++) {
    const cells: Cell[] = [];
    for (let c = 0; c < grid.cols; c++) {
      const v = grid.data[r * grid.cols + c];
      const ch = RAMP[Math.round(v * (RAMP.length - 1))];
      const op = v > 0.75 ? 1 : v > 0.5 ? 0.85 : v > 0.25 ? 0.7 : 0.55;
      cells.push({ ch, op });
    }
    while (cells.length && cells[cells.length - 1].ch === " ") cells.pop();
    out.push(cells);
  }
  return out;
}
