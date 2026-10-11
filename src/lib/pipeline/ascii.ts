import type { Cell, Grid } from "./types";

/** Density ramp, darkest to brightest. */
export const RAMP = " .:-=+*#%@";

/**
 * Grid → rows of cells (glyph by luminance, opacity in four steps), trailing blanks trimmed.
 * Phosphor (default): bright pixels get dense, bright glyphs, as a screen lights up. Ink: dark
 * pixels get dense, dark glyphs, as a print on paper; cells outside the subject stay blank.
 */
export function artRows(grid: Grid, ink = false, gamma = 1.4): Cell[][] {
  const out: Cell[][] = [];
  for (let r = 0; r < grid.rows; r++) {
    const cells: Cell[] = [];
    for (let c = 0; c < grid.cols; c++) {
      const i = r * grid.cols + c;
      let v = grid.data[i];
      if (ink) {
        // Cells on the silhouette edge average subject and blanked background pixels, which would
        // print as a dark rim: undo the coverage before inverting, then fade the edge cells out.
        const cov = grid.cover ? grid.cover[i] : 1;
        const inside = Math.min(1, Math.max(0, (cov - 0.35) / 0.3));
        v = Math.pow(1 - Math.min(1, v / Math.max(cov, 0.15)), gamma) * inside;
      }
      const ch = RAMP[Math.round(v * (RAMP.length - 1))];
      const op = v > 0.75 ? 1 : v > 0.5 ? 0.85 : v > 0.25 ? 0.7 : 0.55;
      cells.push({ ch, op });
    }
    while (cells.length && cells[cells.length - 1].ch === " ") cells.pop();
    out.push(cells);
  }
  return out;
}

/** 5x7 block font, rows top to bottom, '#' = ink. */
const FONT: Record<string, string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".####"],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  "0": [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  "?": ["#####", "#...#", "#...#", "#...#", "#...#", "#...#", "#####"],
};

/** Big block initials for the no-photo mode. Each font pixel becomes an sx×sy block of '#'. */
export function initialsRows(initials: string, cols: number): Cell[][] {
  // Fold accents (Ş, Ö, Ç, İ → S, O, C, I) so names outside ASCII keep their letters.
  const letters = initials.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3) || "?";
  const glyphs = [...letters].map((ch) => FONT[ch] ?? FONT["?"]);
  const gap = 1, unitsW = glyphs.length * 5 + (glyphs.length - 1) * gap;
  const sx = Math.max(1, Math.floor((cols * 0.9) / unitsW));
  const sy = Math.max(1, Math.round(sx * 0.4));        // a cell is 0.4 as wide as it is tall: square font pixels
  const width = unitsW * sx, left = Math.max(0, Math.floor((cols - width) / 2));
  const rows: Cell[][] = [];
  const pad = Math.max(1, Math.round(sy));
  const blank = (): Cell[] => [];
  for (let i = 0; i < pad; i++) rows.push(blank());
  for (let fr = 0; fr < 7; fr++) {
    for (let ry = 0; ry < sy; ry++) {
      const line: Cell[] = Array.from({ length: left }, () => ({ ch: " ", op: 1 }));
      glyphs.forEach((g, gi) => {
        for (const px of g[fr]) for (let rx = 0; rx < sx; rx++) line.push({ ch: px === "#" ? "#" : " ", op: 1 });
        if (gi < glyphs.length - 1) for (let rx = 0; rx < gap * sx; rx++) line.push({ ch: " ", op: 1 });
      });
      while (line.length && line[line.length - 1].ch === " ") line.pop();
      rows.push(line);
    }
  }
  for (let i = 0; i < pad; i++) rows.push(blank());
  return rows;
}
