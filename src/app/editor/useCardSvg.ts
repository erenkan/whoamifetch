"use client";
import { useEffect, useRef, useState } from "react";
import { displacementPng, loadFontBase64 } from "@/lib/browser/assets";
import { layout } from "@/lib/pipeline/layout";
import { buildCard } from "@/lib/pipeline/svg";
import type { CardOptions, Cell } from "@/lib/pipeline/types";

export function useCardSvg(portrait: Cell[][], card: CardOptions) {
  const [out, setOut] = useState<{ svg: string | null; url: string | null }>({ svg: null, url: null });
  const last = useRef<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fontBase64 = await loadFontBase64();
      let dmap: string | undefined;
      if (card.chrome === "crt" && card.curve > 0) {
        const s = layout(portrait, card).screen; const scale = 24;
        dmap = await displacementPng(s.w + 2 * scale, s.h + 2 * scale, card.curve, scale);
      }
      const svg = buildCard(portrait, card, { fontBase64, displacementPng: dmap });
      if (cancelled) return;
      const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      if (last.current) URL.revokeObjectURL(last.current);
      last.current = url; setOut({ svg, url });
    })();
    return () => { cancelled = true; };
  }, [portrait, card]);
  return out;
}
