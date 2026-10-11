"use client";
import { useEffect, useRef, useState } from "react";
import { displacementPng, loadFontBase64 } from "@/lib/browser/assets";
import { layout } from "@/lib/pipeline/layout";
import { buildCard } from "@/lib/pipeline/svg";
import type { CardOptions, Cell } from "@/lib/pipeline/types";

/** The complete SVG for a card: embedded font, and the CRT displacement map when the chrome curves. */
export async function renderCard(portrait: Cell[][], card: CardOptions): Promise<string> {
  const fontBase64 = await loadFontBase64();
  let dmap: string | undefined;
  if (card.chrome === "crt" && card.curve > 0) {
    const s = layout(portrait, card).screen; const scale = 24;
    dmap = await displacementPng(s.w + 2 * scale, s.h + 2 * scale, card.curve, scale);
  }
  return buildCard(portrait, card, { fontBase64, displacementPng: dmap });
}

const utf8Length = (s: string) => new TextEncoder().encode(s).length;

/**
 * A Blob URL of the preview card for the <img>, and the size of the file a download produces (the
 * exported card can differ from the preview: it animates when the Animation switch is on).
 * Card edits are applied at most every 150 ms.
 */
export function useCardSvg(portrait: Cell[][], previewNow: CardOptions, exportNow: CardOptions = previewNow) {
  const [out, setOut] = useState<{ url: string | null; bytes: number }>({ url: null, bytes: 0 });
  const [cards, setCards] = useState({ preview: previewNow, exported: exportNow });
  useEffect(() => { const t = setTimeout(() => setCards({ preview: previewNow, exported: exportNow }), 150); return () => clearTimeout(t); }, [previewNow, exportNow]);
  const last = useRef<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const svg = await renderCard(portrait, cards.preview);
      const bytes = cards.exported === cards.preview ? utf8Length(svg) : utf8Length(await renderCard(portrait, cards.exported));
      if (cancelled) return;
      const next = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      if (last.current) URL.revokeObjectURL(last.current);
      last.current = next; setOut({ url: next, bytes });
    })();
    return () => { cancelled = true; };
  }, [portrait, cards]);
  return out;
}
