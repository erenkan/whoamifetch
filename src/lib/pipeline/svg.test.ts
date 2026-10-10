import { describe, expect, it } from "vitest";
import { layout } from "./layout";
import { buildCard, DEFAULT_CARD, escapeXml } from "./svg";
import { CGA } from "./themes";

const portrait = Array.from({ length: 5 }, () => Array.from({ length: 10 }, () => ({ ch: "#", op: 1 })));
const assets = { fontBase64: "AAAA" };

describe("buildCard", () => {
  it("escapes XML in rows and counts code points for textLength", () => {
    const svg = buildCard(portrait, { ...DEFAULT_CARD, rows: [{ key: "Bio", value: 'a < b & "c" 😀' }] }, assets);
    expect(svg).toContain("a &lt; b &amp; &quot;c&quot; 😀");
    const m = svg.match(/<tspan class="k">Bio:<\/tspan>[^<]*(?:<set [^>]*\/>)?<\/text>/); // the reveal <set> closes the line
    expect(m).not.toBeNull();
    const line = svg.slice(svg.lastIndexOf("<text", svg.indexOf("Bio:")), svg.indexOf("Bio:"));
    const len = Number(line.match(/textLength="([\d.]+)"/)![1]);
    expect(len).toBeCloseTo([..."Bio: a < b & \"c\" 😀"].length * DEFAULT_CARD.infoSize * 0.4, 1);
  });
  it("drops characters XML cannot carry and folds line breaks into spaces", () => {
    const svg = buildCard(portrait, { ...DEFAULT_CARD, command: "who\u0000ami", rows: [{ key: "Bio", value: "line1\u000bline2\r\nline3\ttab\ud800" }] }, assets);
    expect(svg).not.toMatch(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]|\r|\t/);
    expect(svg).toContain("</tspan> line1line2 line3 tab<");
    const line = svg.slice(svg.lastIndexOf("<text", svg.indexOf(">Bio:<")), svg.indexOf(">Bio:<"));
    expect(Number(line.match(/textLength="([\d.]+)"/)![1])).toBeCloseTo([..."Bio: line1line2 line3 tab"].length * DEFAULT_CARD.infoSize * 0.4, 1);
    expect(svg).toContain(`textLength="${([..."you@github:~$ whoami"].length * DEFAULT_CARD.infoSize * 0.4).toFixed(1)}"`); // NUL dropped from the command
  });
  it("emits no animation when animate is false", () => {
    const svg = buildCard(portrait, { ...DEFAULT_CARD, animate: false }, assets);
    expect(svg).not.toContain("<set"); expect(svg).not.toMatch(/\sopacity="0"/); expect(svg).not.toContain("<animate"); // stop-opacity="0" in gradients is fine
  });
  it("embeds the font and uses no external resources", () => {
    const svg = buildCard(portrait, DEFAULT_CARD, assets);
    expect(svg).toContain("data:font/woff2;base64,AAAA");
    expect(svg.replace(/\sxmlns(?::\w+)?="[^"]*"/g, "")).not.toMatch(/https?:\/\//); // namespace URIs are not fetched
    expect(svg).not.toContain("<script");
  });
  for (const chrome of ["crt", "macos", "win95"] as const) {
    it(`renders the ${chrome} chrome as well-formed XML`, () => {
      const svg = buildCard(portrait, { ...DEFAULT_CARD, chrome }, { ...assets, displacementPng: "BBBB" });
      expect(svg.startsWith('<?xml version="1.0"')).toBe(true);
      expect(svg.trim().endsWith("</svg>")).toBe(true);
      const open = (svg.match(/<g[\s>]/g) ?? []).length, close = (svg.match(/<\/g>/g) ?? []).length;
      expect(open).toBe(close);
      if (chrome === "crt") expect(svg).toContain("feDisplacementMap"); else expect(svg).not.toContain("feDisplacementMap");
    });
  }
  it("draws the CGA strip as 16 rects (no block glyphs, no font fallback)", () => {
    const svg = buildCard(portrait, DEFAULT_CARD, assets);
    const rects = [...svg.matchAll(/<rect x="[\d.]+" y="[\d.]+" width="([\d.]+)" height="([\d.]+)" fill="(#[0-9a-f]{6})"\/>/g)];
    expect(rects.map((m) => m[3])).toEqual(expect.arrayContaining(CGA));
    const strip = rects.filter((m) => CGA.includes(m[3]) && Number(m[1]) === 3 * DEFAULT_CARD.infoSize * 0.4);
    expect(strip).toHaveLength(32);                         // 16 swatches, in the halo and in the crisp layer
    for (const m of strip) expect(Number(m[2])).toBeCloseTo(DEFAULT_CARD.infoSize * DEFAULT_CARD.lineHeight, 1);
    expect(svg).not.toContain("███");
  });
  it("draws the text crisp over a separately blurred copy (WebKit rasterises filtered groups at 1x)", () => {
    const svg = buildCard(portrait, { ...DEFAULT_CARD, rows: [{ key: "Bio", value: "glow" }] }, assets);
    const glow = svg.slice(svg.indexOf('<filter id="glow"'), svg.indexOf("</filter>", svg.indexOf('<filter id="glow"')));
    expect(glow).toContain("feGaussianBlur"); expect(glow).not.toContain("SourceGraphic");
    expect(svg.split('<tspan class="k">Bio:</tspan>').length - 1).toBe(2);
    const halo = svg.indexOf('<g filter="url(#glow)" aria-hidden="true">'), crisp = svg.indexOf("<g>", halo);
    expect(halo).toBeGreaterThan(-1);
    expect(svg.indexOf('<tspan class="k">Bio:</tspan>', crisp)).toBeGreaterThan(crisp);   // second copy sits in the unfiltered group
  });
  it("reduced-motion rule is present when animated", () => {
    expect(buildCard(portrait, DEFAULT_CARD, assets)).toContain("prefers-reduced-motion");
  });
});

describe("escapeXml", () => {
  it("escapes the five XML characters", () => { expect(escapeXml(`<&>"'`)).toBe("&lt;&amp;&gt;&quot;&#39;"); });
});

/** Tag balance of the generated markup (the builder emits no comments or CDATA). */
function wellFormed(svg: string): boolean {
  const stack: string[] = [];
  for (const [, close, name, self] of svg.replace(/^<\?xml[^>]*\?>/, "").matchAll(/<(\/?)([a-zA-Z][\w:-]*)[^>]*?(\/?)>/g)) {
    if (self) continue;
    if (close) { if (stack.pop() !== name) return false; } else stack.push(name);
  }
  return stack.length === 0;
}

describe("content edge cases", () => {
  const cases: [string, Partial<typeof DEFAULT_CARD>][] = [
    ["no rows", { rows: [] }],
    ["1-character user@host", { userHost: "a" }],
    ["60-character value", { rows: [{ key: "Bio", value: "x".repeat(60) }] }],
    ["emoji keys", { rows: [{ key: "🚀", value: "rocket" }, { key: "Ünï✨", value: "sparkles" }] }],
  ];
  for (const [name, patch] of cases) for (const chrome of ["crt", "macos", "win95"] as const) for (const animate of [true, false]) {
    it(`${name}: ${chrome}${animate ? "" : ", static"} stays well-formed and keeps the prompt below the content`, () => {
      const o = { ...DEFAULT_CARD, ...patch, chrome, animate };
      const tall = Array.from({ length: 47 }, () => Array.from({ length: 100 }, () => ({ ch: "#", op: 1 })));
      const svg = buildCard(tall, o, { ...assets, displacementPng: "BBBB" });
      expect(wellFormed(svg)).toBe(true);
      const l = layout(tall, o);
      expect(l.yEnd - l.baseOff).toBeGreaterThanOrEqual(Math.max(l.yTop + l.infoLines * l.lineInfo, l.yTop + 47 * o.artSize));
      expect(l.W).toBeGreaterThanOrEqual(o.width);
      for (const row of o.rows) {
        const at = svg.indexOf(`>${escapeXml(row.key)}:</tspan>`), line = svg.slice(svg.lastIndexOf("<text", at), at);
        expect(Number(line.match(/textLength="([\d.]+)"/)![1])).toBeCloseTo(
          [...`${row.key}:`.padEnd(Math.max(...o.rows.map((r) => [...r.key].length)) + 2) + row.value].length * o.infoSize * 0.4, 1);
      }
    });
  }
  it("the well-formedness check catches an unclosed element", () => {
    expect(wellFormed("<svg><g><text>a</text></svg>")).toBe(false);
  });
});
