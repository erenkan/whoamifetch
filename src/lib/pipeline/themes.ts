import type { Accent, Chrome, Phosphor } from "./types";

/** Screen palette: phosphor colour plus the tints derived from it. */
export interface Palette {
  fg: string;      // values, portrait, prompt symbols
  key: string;     // default key / user@host colour (overridable by Accent)
  cmd: string;     // typed command
  screen0: string; // screen gradient centre
  screen1: string; // screen gradient edge
  paper?: boolean; // 1-bit look: dark text on a light screen, no glow, faint scanlines, soft vignette
}

export const PALETTES: Record<Phosphor, Palette> = {
  green: { fg: "#3dff6e", key: "#ffb000", cmd: "#9dffb8", screen0: "#0b140c", screen1: "#030603" },
  amber: { fg: "#ffb000", key: "#ffe3a3", cmd: "#ffd36b", screen0: "#1a1100", screen1: "#0a0600" },
  white: { fg: "#e8e8e8", key: "#ffb000", cmd: "#ffffff", screen0: "#111111", screen1: "#050505" },
  paper: { fg: "#1c1c1c", key: "#4d4d4d", cmd: "#1c1c1c", screen0: "#f1f0e6", screen1: "#d3d2c4", paper: true },
};

export const ACCENTS: Record<Accent, string> = {
  amber: "#ffb000",
  cyan: "#5ff1ff",
  green: "#9dffb8",
  white: "#e8e8e8",
  graphite: "#4d4d4d",
};

/** Labels the editor shows for the three choices. */
export const CHROME_NAMES: Record<Chrome, string> = { crt: "CRT monitor", macos: "Terminal", win95: "Windows 95", macplus: "Mac Plus" };
export const PHOSPHOR_NAMES: Record<Phosphor, string> = { green: "Green", amber: "Amber", white: "White", paper: "Paper" };
export const ACCENT_NAMES: Record<Accent, string> = { amber: "Amber", cyan: "Cyan", green: "Green", white: "White", graphite: "Graphite" };

/** CGA / ANSI 16 colours for the neofetch palette strip (same in every theme). */
export const CGA = [
  "#0f0f0f", "#aa0000", "#00aa00", "#aa5500", "#0000aa", "#aa00aa", "#00aaaa", "#aaaaaa",
  "#555555", "#ff5555", "#55ff55", "#ffff55", "#5555ff", "#ff55ff", "#55ffff", "#ffffff",
];

export interface ThemePreset {
  id: string;
  name: string;
  chrome: Chrome;
  phosphor: Phosphor;
  accent: Accent;
}

/** Presets the theme picker offers; every field stays editable after picking one. */
export const PRESETS: ThemePreset[] = [
  { id: "crt-green", name: "CRT · green", chrome: "crt", phosphor: "green", accent: "amber" },
  { id: "crt-amber", name: "CRT · amber", chrome: "crt", phosphor: "amber", accent: "amber" },
  { id: "macos-green", name: "Terminal · green", chrome: "macos", phosphor: "green", accent: "amber" },
  { id: "macos-cyan", name: "Terminal · cyan keys", chrome: "macos", phosphor: "green", accent: "cyan" },
  { id: "macos-amber", name: "Terminal · amber", chrome: "macos", phosphor: "amber", accent: "amber" },
  { id: "win95-green", name: "Windows 95 · green", chrome: "win95", phosphor: "green", accent: "amber" },
  { id: "macplus-paper", name: "Mac Plus · paper", chrome: "macplus", phosphor: "paper", accent: "graphite" },
];
