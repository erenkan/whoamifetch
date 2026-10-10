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

/** A Blob URL of the card for the preview <img>; card edits are applied at most every 150 ms. */
export function useCardSvg(portrait: Cell[][], cardNow: CardOptions) {
  const [url, setUrl] = useState<string | null>(null);
  const [card, setCard] = useState(cardNow);
  useEffect(() => { const t = setTimeout(() => setCard(cardNow), 150); return () => clearTimeout(t); }, [cardNow]);
  const last = useRef<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const svg = await renderCard(portrait, card);
      if (cancelled) return;
      const next = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      if (last.current) URL.revokeObjectURL(last.current);
      last.current = next; setUrl(next);
    })();
    return () => { cancelled = true; };
  }, [portrait, card]);
  return url;
}
