import { artRows, initialsRows } from "@/lib/pipeline/ascii";
import { portraitGrid } from "@/lib/pipeline/luminance";
import { autoCrop, cleanMask, hasSubject } from "@/lib/pipeline/mask";
import { PALETTES } from "@/lib/pipeline/themes";
import type { Cell } from "@/lib/pipeline/types";
import type { EditorState } from "./state";

/**
 * Portrait cells for an editor state: initials without a photo, otherwise the photo framed on the
 * subject. A paper screen prints the photo in ink (dark pixels dense), a phosphor screen lights it.
 */
export function portraitCells(s: EditorState): Cell[][] {
  if (s.source.kind === "none" || !s.photo) return initialsRows(s.source.initials, s.portrait.cols);
  const { photo, prob } = s, w = photo.width, h = photo.height;
  const ink = PALETTES[s.card.phosphor].paper === true;
  if (!prob) return artRows(portraitGrid(photo, null, s.portrait), ink);
  // The source step cleaned the mask at its threshold. Re-clean only after the slider moved, and keep
  // the last good mask when the new threshold would lose the person (never a blank portrait).
  let mask = s.mask?.data ?? cleanMask(prob, w, h, s.maskThreshold);
  if (s.mask && s.mask.thr !== s.maskThreshold) {
    const m = cleanMask(prob, w, h, s.maskThreshold);
    if (hasSubject(m)) mask = m;
  }
  // "Keep background" still frames head and shoulders; it only stops blanking the backdrop.
  if (!s.removeBackground) return artRows(portraitGrid(photo, null, s.portrait, autoCrop(mask, w, h)), ink);
  return artRows(portraitGrid(photo, prob, s.portrait, undefined, mask), ink);
}
