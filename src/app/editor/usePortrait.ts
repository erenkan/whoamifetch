"use client";
import { useEffect, useMemo, useState } from "react";
import { artRows, initialsRows } from "@/lib/pipeline/ascii";
import { portraitGrid } from "@/lib/pipeline/luminance";
import type { Cell } from "@/lib/pipeline/types";
import type { EditorState } from "./state";

/** Portrait cells for the current state; recomputed at most every 150 ms. */
export function usePortrait(s: EditorState): Cell[][] {
  const deps = JSON.stringify([s.portrait, s.removeBackground, s.maskThreshold, s.source.kind, s.source.initials]);
  const [debounced, setDebounced] = useState(deps);
  useEffect(() => { const t = setTimeout(() => setDebounced(deps), 150); return () => clearTimeout(t); }, [deps]);
  return useMemo(() => {
    if (s.source.kind === "none" || !s.photo) return initialsRows(s.source.initials, s.portrait.cols);
    const prob = s.removeBackground ? s.prob : null;
    const p = prob && s.maskThreshold !== 0.5 ? prob.map((v) => (v >= s.maskThreshold ? 1 : 0)) : prob;
    return artRows(portraitGrid(s.photo, p, s.portrait));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, s.photo, s.prob]);
}
