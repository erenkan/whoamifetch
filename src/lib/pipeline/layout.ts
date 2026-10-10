import type { CardOptions, Cell } from "./types";

export const ADV = 0.4, ASC = 0.8;   // VT323: advance 0.4 em, ascent 0.8 em, line height 1.0 em
const INSETS = { crt: { l: 30, t: 26, b: 46 }, macos: { l: 6, t: 38, b: 6 }, win95: { l: 10, t: 34, b: 10 } } as const;

export interface Layout {
  W: number; H: number; screen: { x: number; y: number; w: number; h: number }; pad: number;
  xArt: number; yTop: number; xInfo: number; lineInfo: number; baseOff: number;
  yPrompt: number; yEnd: number; advArt: number; advInfo: number; infoLines: number;
  timeline: { typingDt: number; tOut: number; rowDt: number; tEnd: number };
}

export const promptLength = (o: CardOptions) => [...`${o.userHost}:~$ ${o.command}`].length;
export const rowText = (r: { key: string; value: string }, keyWidth: number) => `${r.key}:`.padEnd(keyWidth + 2) + r.value;
export const keyWidth = (o: CardOptions) => Math.max(0, ...o.rows.map((r) => [...r.key].length));

export function layout(portrait: Cell[][], o: CardOptions): Layout {
  const ins = INSETS[o.chrome], pad = 24, gap = 30;
  const advArt = o.artSize * ADV, advInfo = o.infoSize * ADV, lineInfo = o.infoSize * o.lineHeight;
  const artW = Math.max(o.rows.length ? 1 : 0, ...portrait.map((r) => r.length)) * advArt;
  const artH = portrait.length * o.artSize;
  const kw = keyWidth(o);
  const longest = Math.max(promptLength(o), [...o.userHost].length, 24, ...o.rows.map((r) => [...rowText(r, kw)].length));
  const infoW = longest * advInfo;
  const infoLines = 2 + o.rows.length + 1 + 2;
  const line = lineInfo + 6;
  const W = Math.round(Math.max(ins.l + pad + artW + gap + infoW + pad + ins.l, o.width));
  const baseOff = (lineInfo - o.infoSize) / 2 + o.infoSize * ASC;
  const yTop = ins.t + pad + line;
  const contentBottom = Math.max(yTop + artH, yTop + infoLines * lineInfo);
  const yEnd = contentBottom + baseOff + 4;
  const H = Math.round(yEnd + (lineInfo - baseOff) + pad + ins.b);
  const typingDt = 0.055, tOut = 0.4 + typingDt * promptLength(o) + 0.35, rowDt = 0.045;
  return {
    W, H, screen: { x: ins.l, y: ins.t, w: W - 2 * ins.l, h: H - ins.t - ins.b }, pad,
    xArt: ins.l + pad, yTop, xInfo: ins.l + pad + artW + gap, lineInfo, baseOff,
    yPrompt: ins.t + pad + baseOff, yEnd, advArt, advInfo, infoLines,
    timeline: { typingDt, tOut, rowDt, tEnd: tOut + rowDt * Math.max(portrait.length, infoLines) + 0.2 },
  };
}
