import type { CardOptions, Cell } from "./types";

/**
 * Rows + options → the complete SVG document (string). Port of `build()` from the prototype:
 * embedded VT323 subset (base64 woff2), CRT or window chrome, typed prompt, row-by-row
 * SMIL reveal, CGA palette strip, blinking cursor, barrel-shaped screen with curved scanlines.
 * Must stay renderable inside <img> on GitHub: no scripts, no external resources.
 */
export function buildCard(rows: Cell[][], opts: CardOptions, fontBase64: string): string {
  void rows; void opts; void fontBase64;
  throw new Error("not implemented: see docs/superpowers/specs/2026-10-10-whoamifetch-design.md");
}

export const DEFAULT_ROWS = [
  { key: "OS", value: "macOS 26 (Darwin 25.5)" },
  { key: "Host", value: "Keymate.io" },
  { key: "Kernel", value: "Software Engineer" },
  { key: "Uptime", value: "6 years" },
  { key: "Packages", value: "Keycloak, OAuth 2.0, OIDC" },
  { key: "DE", value: "React, Next.js, TypeScript" },
  { key: "Shell", value: "zsh" },
  { key: "Languages", value: "Java, TypeScript" },
  { key: "Location", value: "Istanbul, TR" },
  { key: "Contact", value: "you@example.com" },
];
