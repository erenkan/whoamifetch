"use client";
import { useEffect, useMemo, useState } from "react";
import type { Cell } from "@/lib/pipeline/types";
import { portraitCells } from "./portrait";
import type { EditorState } from "./state";

/** Portrait cells for the current state; option changes are applied at most every 150 ms. */
export function usePortrait(s: EditorState): Cell[][] {
  const deps = JSON.stringify([s.portrait, s.removeBackground, s.maskThreshold, s.source.kind, s.source.initials, s.card.phosphor]);
  const [debounced, setDebounced] = useState(deps);
  useEffect(() => { const t = setTimeout(() => setDebounced(deps), 150); return () => clearTimeout(t); }, [deps]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => portraitCells(s), [debounced, s.photo, s.prob, s.mask]);
}
