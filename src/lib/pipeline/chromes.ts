import { barrelPath } from "./displacement";
import type { Layout } from "./layout";
import type { Palette } from "./themes";
import type { CardOptions, Chrome } from "./types";
import { escapeXml } from "./xml";

export interface ChromeParts { defs: string; before: string; after: string; clip: string }

const f = (n: number) => n.toFixed(1);

function crt(l: Layout, pal: Palette, o: CardOptions): ChromeParts {
  const { x, y, w, h } = l.screen, { W, H } = l;
  const screen = barrelPath(x, y, w, h, o.bulge, 22);
  const defs = `<linearGradient id="body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6cebc"/><stop offset="1" stop-color="#b6ad99"/></linearGradient>
<linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
<radialGradient id="halo"><stop offset="0" stop-color="${pal.fg}" stop-opacity=".45"/><stop offset="1" stop-color="${pal.fg}" stop-opacity="0"/></radialGradient>
<radialGradient id="glass" cx="22%" cy="12%" r="55%"><stop offset="0" stop-color="#fff" stop-opacity=".11"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></radialGradient>
<clipPath id="scr-clip"><path d="${screen}"/></clipPath>`;
  const before = `<rect width="${W}" height="${H}" rx="24" fill="url(#body)"/>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="23.5" fill="none" stroke="#8d8574"/>
<rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="22.5" fill="none" stroke="#f1ece0" stroke-opacity=".8"/>
<path d="${barrelPath(x - 5, y - 5, w + 10, h + 10, o.bulge, 26)}" fill="#a59d8c"/>
<path d="${barrelPath(x - 2, y - 2, w + 4, h + 4, o.bulge, 24)}" fill="#6f6859"/>
<text class="l" x="${x + 22}" y="${H - 14}">VT·323</text>
<text class="l" x="${W - 52}" y="${H - 15}" text-anchor="end" font-size="11">POWER</text>
<circle cx="${W - 32}" cy="${H - 18}" r="7" fill="#5a5447"/><circle cx="${W - 32}" cy="${H - 18}" r="11" fill="url(#halo)"/><circle cx="${W - 32}" cy="${H - 18}" r="4" fill="${pal.fg}"/>
<path d="${screen}" fill="url(#scr)"/>`;
  const after = `<path d="${screen}" fill="url(#vig)"/>
<path d="${screen}" fill="url(#glass)"/>
<rect x="${x}" y="${y}" width="${w}" height="30" fill="url(#shade)"/>`;
  return { defs, before, after, clip: "scr-clip" };
}

function macos(l: Layout, _pal: Palette, o: CardOptions): ChromeParts {
  const { x, y, w, h } = l.screen, { W, H } = l, T = y;
  const title = escapeXml(`${o.userHost}: ~ — ${o.command}`);
  const lights = [["#ff5f57", "#e0443e"], ["#febc2e", "#dea123"], ["#28c840", "#1aab29"]]
    .map(([c1, c2], i) => `<circle cx="${20 + i * 20}" cy="${f(T / 2)}" r="6" fill="${c1}" stroke="${c2}" stroke-width="0.8"/>`).join("");
  const defs = `<linearGradient id="tb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d3d3d"/><stop offset="1" stop-color="#2a2a2a"/></linearGradient>
<clipPath id="win"><rect width="${W}" height="${H}" rx="12"/></clipPath>`;
  const before = `<g clip-path="url(#win)"><rect width="${W}" height="${H}" fill="#1f1f1f"/>
<rect width="${W}" height="${T}" fill="url(#tb)"/><rect y="${T - 1}" width="${W}" height="1" fill="#141414"/>${lights}
<text class="t" x="${f(W / 2)}" y="${f(T / 2 + 5)}">${title}</text>
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="url(#scr)"/></g>`;
  const after = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="url(#vig)"/>`;
  return { defs, before, after, clip: "win" };
}

function win95(l: Layout, pal: Palette, o: CardOptions): ChromeParts {
  const { x, y, w, h } = l.screen, { W, H } = l;
  const title = escapeXml(`${o.userHost}: ~ — ${o.command}`);
  const btn = (bx: number, glyph: string) =>
    `<rect x="${bx}" y="9" width="16" height="16" fill="#c0c0c0"/><path d="M${bx} 25V9H${bx + 16}" fill="none" stroke="#fff"/><path d="M${bx + 15} 9V25H${bx}" fill="none" stroke="#000"/>${glyph}`;
  const defs = `<linearGradient id="tb95" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000080"/><stop offset="1" stop-color="#1084d0"/></linearGradient>
<clipPath id="scr-clip"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2"/></clipPath>`;
  const before = `<rect width="${W}" height="${H}" fill="#c0c0c0"/>
<path d="M0 ${H}V0H${W}" fill="none" stroke="#dfdfdf" stroke-width="2"/><path d="M${W} 0V${H}H0" fill="none" stroke="#000" stroke-width="2"/>
<path d="M2 ${H - 2}V2H${W - 2}" fill="none" stroke="#fff" stroke-width="2"/><path d="M${W - 2} 2V${H - 2}H2" fill="none" stroke="#808080" stroke-width="2"/>
<rect x="6" y="6" width="${W - 12}" height="24" fill="url(#tb95)"/>
<rect x="11" y="11" width="16" height="14" fill="#000"/><rect x="13" y="13" width="12" height="10" fill="#1f1f1f"/><rect x="15" y="20" width="5" height="2" fill="${pal.fg}"/><rect x="15" y="15" width="2" height="2" fill="${pal.fg}"/>
<text class="t95" x="33" y="23.5">${title}</text>
${btn(W - 64, `<rect x="${W - 60}" y="20" width="6" height="2" fill="#000"/>`)}
${btn(W - 46, `<rect x="${W - 43}" y="12.5" width="9" height="9" fill="none" stroke="#000"/><rect x="${W - 43}" y="12" width="10" height="2" fill="#000"/>`)}
${btn(W - 26, `<path d="M${W - 22} 12l8 8M${W - 14} 12l-8 8" stroke="#000" stroke-width="2"/>`)}
<path d="M${x - 1} ${y + h + 1}V${y - 1}H${x + w + 1}" fill="none" stroke="#808080" stroke-width="2"/><path d="M${x + w + 1} ${y - 1}V${y + h + 1}H${x - 1}" fill="none" stroke="#fff" stroke-width="2"/>
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="url(#scr)"/>`;
  const after = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#vig)"/>`;
  return { defs, before, after, clip: "scr-clip" };
}

/**
 * One-piece beige all-in-one: chamfered recess around a rounded, slightly bowed glass, a front
 * panel under it with a small label (the command) and a floppy slot, and a stepped base.
 * No manufacturer marks: the label is the user's command, nothing else.
 */
function macplus(l: Layout, pal: Palette, o: CardOptions): ChromeParts {
  const { x, y, w, h } = l.screen, { W, H } = l;
  const r = 22, step = 28, Hb = H - step, bz = 28;
  const bx = x - bz, by = y - bz, bw = w + 2 * bz, bh = h + 2 * bz, py = by + bh, mid = (py + Hb) / 2;
  const glass = barrelPath(x, y, w, h, 6, 18);
  const body = `M${r},0H${W - r}A${r},${r} 0 0 1 ${W},${r}V${Hb - 4}A4,4 0 0 1 ${W - 4},${Hb}H${W - 10}V${H - 10}A10,10 0 0 1 ${W - 20},${H}H20A10,10 0 0 1 10,${H - 10}V${Hb}H4A4,4 0 0 1 0,${Hb - 4}V${r}A${r},${r} 0 0 1 ${r},0Z`;
  const cmd = escapeXml(o.command);
  const sx = x + w - 230, sy = f(mid - 17);
  const defs = `<linearGradient id="body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6ddc6"/><stop offset="1" stop-color="#c9bea2"/></linearGradient>
<linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="${pal.paper ? ".22" : ".5"}"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
<radialGradient id="glass" cx="22%" cy="12%" r="55%"><stop offset="0" stop-color="#fff" stop-opacity=".11"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></radialGradient>
<clipPath id="scr-clip"><path d="${glass}"/></clipPath>
<clipPath id="bezel"><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="16"/></clipPath>
<clipPath id="body-clip"><path d="${body}"/></clipPath>`;
  const before = `<path d="${body}" fill="url(#body)"/>
<rect x="10" y="${Hb}" width="${W - 20}" height="${step}" fill="#bdb294" clip-path="url(#body-clip)"/><rect x="10" y="${Hb}" width="${W - 20}" height="3" fill="#000" opacity=".22"/>
<path d="${body}" fill="none" stroke="#8d8574"/><path d="M${r},1.5H${W - r}M1.5,${r}V${Hb - 6}" fill="none" stroke="#f3eedf" stroke-opacity=".8"/>
<g clip-path="url(#bezel)"><path d="M${bx},${by}H${bx + bw}L${x + w},${y}H${x}Z" fill="#a79c82"/><path d="M${bx + bw},${by}V${py}L${x + w},${y + h}V${y}Z" fill="#c6bb9f"/><path d="M${bx + bw},${py}H${bx}L${x},${y + h}H${x + w}Z" fill="#e9e2cd"/><path d="M${bx},${py}V${by}L${x},${y}V${y + h}Z" fill="#b8ad92"/></g>
<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="16" fill="none" stroke="#a89d82"/>
<path d="${glass}" fill="none" stroke="#6f6859" stroke-width="4"/>
<text x="${x + 4}" y="${f(mid + 7)}" font-size="18" letter-spacing="1" style="fill:#f3eedf">${cmd}</text><text x="${x + 3}" y="${f(mid + 6)}" font-size="18" letter-spacing="1" style="fill:#6e6552">${cmd}</text>
<rect x="${sx}" y="${sy}" width="230" height="34" rx="7" fill="#c3b89c"/><rect x="${sx}" y="${sy}" width="230" height="34" rx="7" fill="none" stroke="#a89d82"/>
<rect x="${sx + 16}" y="${f(mid - 5)}" width="186" height="9" rx="2.5" fill="#2a2820"/><rect x="${sx + 16}" y="${f(mid + 2)}" width="186" height="2.5" rx="1" fill="#8e8c85"/><circle cx="${sx + 214}" cy="${f(mid)}" r="2" fill="#3a362c"/>
<path d="${glass}" fill="url(#scr)"/>`;
  const after = `<path d="${glass}" fill="url(#vig)"/>
<path d="${glass}" fill="url(#glass)"/>
<rect x="${x}" y="${y}" width="${w}" height="30" fill="url(#shade)"/>`;
  return { defs, before, after, clip: "scr-clip" };
}

export function drawChrome(kind: Chrome, l: Layout, pal: Palette, o: CardOptions): ChromeParts {
  return kind === "crt" ? crt(l, pal, o) : kind === "win95" ? win95(l, pal, o) : kind === "macplus" ? macplus(l, pal, o) : macos(l, pal, o);
}
