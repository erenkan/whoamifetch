/** Shared types for the whoamifetch pipeline (photo → luminance grid → ASCII rows → SVG). */

export type Phosphor = "green" | "amber" | "white";
export type Accent = "amber" | "cyan" | "green" | "white";
export type Chrome = "crt" | "macos" | "win95";

export interface InfoRow {
  key: string;   // "OS", "Host", ... (rendered as "Key:" in the accent colour)
  value: string; // free text
}

export interface PortraitOptions {
  cols: number;        // characters per row (default 100)
  dark: number;        // mean/min blend so thin dark features survive (0..1, default 0.6)
  knee: number;        // highlight soft-knee (default 0.75)
  contrast: number;    // S-curve strength around mid grey (1 = off, default 1.3)
  floor: number;       // minimum luminance inside the subject mask (default 0.18)
  floorUntil: number;  // apply the floor to rows above this fraction of the height (default 0.3)
  clahe: number;       // local contrast clip (0 = off, default 1.5)
  gate: number;        // noise gate for dark fabric (default 0.12)
}

export interface CardOptions {
  userHost: string;    // "erenkan@github"
  command: string;     // "whoami"
  rows: InfoRow[];
  phosphor: Phosphor;
  accent: Accent;
  chrome: Chrome;
  width: number;       // minimum card width in px (default 900)
  artSize: number;     // portrait font size (default 8.5)
  infoSize: number;    // info font size (default 20)
  lineHeight: number;  // info line height factor (default 1.15)
  animate: boolean;
  bulge: number;       // crt: outward bow of the screen edges (default 10)
  curve: number;       // crt: barrel distortion of the scanlines (default 0.028)
  alt: string;
}

/** One portrait cell: glyph plus phosphor intensity (opacity). */
export interface Cell {
  ch: string;
  op: number;
}

/** Luminance grid in row-major order, values 0..1. */
export interface Grid {
  cols: number;
  rows: number;
  data: Float32Array;
}

/** RGBA pixels. Structurally identical to the DOM's ImageData so browser code can pass one in. */
export interface Raster {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}
