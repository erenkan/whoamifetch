import { drawChrome } from "./chromes";
import { layout, keyWidth, promptLength, rowText } from "./layout";
import { ACCENTS, CGA, PALETTES } from "./themes";
import type { CardOptions, Cell } from "./types";
import { cleanText, escapeXml } from "./xml";

export { escapeXml };

export interface CardAssets { fontBase64: string; displacementPng?: string }

const len = (s: string) => [...s].length;

/** Group consecutive cells with equal opacity into tspans. */
function tspans(cells: Cell[]): string {
  let out = "", run = "", cur: number | null = null;
  const flush = () => { if (!run) return; const t = escapeXml(run); out += cur === 1 ? t : `<tspan opacity="${cur}">${t}</tspan>`; run = ""; };
  for (const c of cells) { if (cur !== null && c.op !== cur) flush(); cur = c.op; run += c.ch; }
  flush();
  return out;
}

/**
 * Rows + options → the complete SVG document (string). Port of `build()` from the prototype:
 * embedded VT323 subset (base64 woff2), CRT or window chrome, typed prompt, row-by-row
 * SMIL reveal, CGA palette strip, blinking cursor, barrel-shaped screen with curved scanlines.
 * Must stay renderable inside <img> on GitHub: no scripts, no external resources.
 */
export function buildCard(portrait: Cell[][], opts: CardOptions, assets: CardAssets): string {
  const o: CardOptions = {
    ...opts, userHost: cleanText(opts.userHost), command: cleanText(opts.command), alt: cleanText(opts.alt),
    rows: opts.rows.map((r) => ({ key: cleanText(r.key), value: cleanText(r.value) })),
  };
  const l = layout(portrait, o), pal = PALETTES[o.phosphor], key = ACCENTS[o.accent];
  const { W, H } = l, FA = o.artSize, FI = o.infoSize, anim = o.animate;
  const appear = (t: number) => (anim ? `<set attributeName="opacity" to="1" begin="${t.toFixed(2)}s" fill="freeze"/>` : "");
  const op0 = anim ? ' opacity="0"' : "";
  const { typingDt, tOut, rowDt, tEnd } = l.timeline;
  const chrome = drawChrome(o.chrome, l, pal, o);
  const useMap = o.chrome === "crt" && !!assets.displacementPng && o.curve > 0;
  const scale = 24, s = l.screen;
  const P: string[] = [];
  P.push(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeXml(o.alt)}">
<title>${escapeXml(o.alt)}</title>
<defs>
<style>
@font-face{font-family:"VT323";src:url(data:font/woff2;base64,${assets.fontBase64}) format("woff2");}
text{font-family:"VT323",ui-monospace,Menlo,Consolas,"DejaVu Sans Mono",monospace;white-space:pre;fill:${pal.fg}}
.a{font-size:${FA}px} .i{font-size:${FI}px} .k{fill:${key}} .u{fill:${key}} .c{fill:${pal.cmd}} .d{opacity:.5}
.t{font-size:15px;fill:#9b9b9b;text-anchor:middle} .t95{font-size:15px;fill:#fff} .l{font-size:14px;fill:#7b7363;letter-spacing:2px}
${anim ? "@media (prefers-reduced-motion:reduce){[opacity=\"0\"]{opacity:1 !important}}" : ""}
</style>
<radialGradient id="scr" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="${pal.screen0}"/><stop offset="1" stop-color="${pal.screen1}"/></radialGradient>
<radialGradient id="vig" cx="50%" cy="50%" r="72%"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${pal.paper ? 0.18 : 0.5}"/></radialGradient>
<pattern id="scan" width="2" height="3" patternUnits="userSpaceOnUse"><rect width="2" height="1" fill="#000" opacity="${pal.paper ? 0.1 : 0.32}"/></pattern>
<filter id="glow" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.1"/></filter>
${useMap ? `<filter id="crt" x="0" y="0" width="${W}" height="${H}" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feImage href="data:image/png;base64,${assets.displacementPng}" xlink:href="data:image/png;base64,${assets.displacementPng}" x="${s.x - scale}" y="${s.y - scale}" width="${s.w + 2 * scale}" height="${s.h + 2 * scale}" preserveAspectRatio="none" result="map"/><feDisplacementMap in="SourceGraphic" in2="map" scale="${scale}" xChannelSelector="R" yChannelSelector="G"/></filter>` : ""}
${chrome.defs}
</defs>`);
  P.push(chrome.before);
  P.push(`<g clip-path="url(#${chrome.clip})">`);
  const T: string[] = [];                                              // everything on the screen glass
  // prompt, typed character by character
  const segs: [string, string][] = [[o.userHost, "u"], [":~$ ", ""], [o.command, "c"]];
  let i = 0, chars = "";
  for (const [txt, cls] of segs) for (const ch of txt) {
    chars += `<tspan${cls ? ` class="${cls}"` : ""}${op0}>${escapeXml(ch)}${appear(0.4 + typingDt * i)}</tspan>`; i++;
  }
  T.push(`<text class="i" x="${l.xArt}" y="${l.yPrompt.toFixed(1)}" textLength="${(promptLength(o) * l.advInfo).toFixed(1)}" lengthAdjust="spacingAndGlyphs">${chars}</text>`);
  // portrait rows
  portrait.forEach((cells, r) => {
    if (!cells.length) return;
    const y = l.yTop + r * FA + FA * 0.8;
    T.push(`<text class="a" x="${l.xArt}" y="${y.toFixed(1)}"${op0} textLength="${(cells.length * l.advArt).toFixed(1)}" lengthAdjust="spacingAndGlyphs">${tspans(cells)}${appear(tOut + rowDt * r)}</text>`);
  });
  // info block
  const info = (r: number, inner: string, n: number) =>
    `<text class="i" x="${l.xInfo}" y="${(l.yTop + r * l.lineInfo + l.baseOff).toFixed(1)}"${op0} textLength="${(n * l.advInfo).toFixed(1)}" lengthAdjust="spacingAndGlyphs">${inner}${appear(tOut + rowDt * r)}</text>`;
  T.push(info(0, `<tspan class="u">${escapeXml(o.userHost)}</tspan>`, len(o.userHost)));
  T.push(info(1, `<tspan class="d">${"-".repeat(len(o.userHost))}</tspan>`, len(o.userHost)));
  const kw = keyWidth(o);
  o.rows.forEach((row, j) => {
    const text = rowText(row, kw), k = `${row.key}:`.padEnd(kw + 2);
    T.push(info(2 + j, `<tspan class="k">${escapeXml(k.trimEnd())}</tspan>${escapeXml(text.slice(k.trimEnd().length))}`, len(text)));
  });
  const base = 2 + o.rows.length + 1;
  // CGA strip: two rows of eight swatches, three cells wide each. Rects, so no glyph or font fallback is involved.
  for (let r = 0; r < 2; r++) {
    const y = (l.yTop + (base + r) * l.lineInfo).toFixed(1), sw = 3 * l.advInfo;
    const rects = CGA.slice(r * 8, r * 8 + 8).map((c, i) =>
      `<rect x="${(l.xInfo + i * sw).toFixed(1)}" y="${y}" width="${sw.toFixed(1)}" height="${l.lineInfo.toFixed(1)}" fill="${c}"/>`).join("");
    T.push(`<g${op0}>${rects}${appear(tOut + rowDt * (base + r))}</g>`);
  }
  const cursor = anim ? `<tspan>█<animate attributeName="opacity" values="1;1;0;0" dur="1.1s" repeatCount="indefinite"/></tspan>` : "█";
  T.push(`<text class="i" x="${l.xArt}" y="${l.yEnd.toFixed(1)}"${op0}><tspan class="u">${escapeXml(o.userHost)}</tspan>:~$ ${cursor}${appear(tEnd)}</text>`);
  // The glow is a blurred copy under the text rather than a filter on it: WebKit rasterises filtered
  // groups at 1x and scales them up, which would blur the letters themselves on Retina screens.
  // A paper screen gets no glow: dark text on a light ground would only smudge.
  const screenText = T.join("\n");
  if (!pal.paper) P.push(`<g filter="url(#glow)" aria-hidden="true">\n${screenText}\n</g>`);
  P.push(`<g>\n${screenText}\n</g>`);
  P.push(useMap ? `<g filter="url(#crt)">` : "<g>");
  P.push(`<rect x="${s.x - 4}" y="${s.y - 4}" width="${s.w + 8}" height="${s.h + 8}" fill="url(#scan)"/></g>`);
  P.push(chrome.after);
  P.push("</g>");                                                       // clip
  P.push("</svg>\n");
  return P.join("\n");
}

/** Descriptive placeholders only: the user replaces them (GitHub prefill fills Host, Location and Kernel). */
export const DEFAULT_ROWS = [
  { key: "OS", value: "Operating system" },
  { key: "Host", value: "Company" },
  { key: "Kernel", value: "Role" },
  { key: "Uptime", value: "N years" },
  { key: "Packages", value: "Tools, protocols" },
  { key: "DE", value: "Frontend stack" },
  { key: "Shell", value: "zsh" },
  { key: "Languages", value: "Languages" },
  { key: "Location", value: "City, Country" },
  { key: "Contact", value: "you@example.com" },
];

export const DEFAULT_CARD: CardOptions = {
  userHost: "you@github", command: "whoami", rows: DEFAULT_ROWS, phosphor: "green", accent: "amber", chrome: "crt",
  width: 900, artSize: 8.5, infoSize: 20, lineHeight: 1.15, animate: true, bulge: 10, curve: 0.028,
  alt: "Retro terminal card: ASCII portrait with a whoami-style profile summary",
};
