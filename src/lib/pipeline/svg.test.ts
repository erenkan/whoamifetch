import { describe, expect, it } from "vitest";
import { buildCard, DEFAULT_CARD, escapeXml } from "./svg";

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
  it("reduced-motion rule is present when animated", () => {
    expect(buildCard(portrait, DEFAULT_CARD, assets)).toContain("prefers-reduced-motion");
  });
});

describe("escapeXml", () => {
  it("escapes the five XML characters", () => { expect(escapeXml(`<&>"'`)).toBe("&lt;&amp;&gt;&quot;&#39;"); });
});
