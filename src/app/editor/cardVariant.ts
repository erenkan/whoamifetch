import type { CardOptions } from "@/lib/pipeline/types";

/** The card the preview shows: the final frame while editing; the user's own card (animated if switched on) while playing. */
export function previewCard(card: CardOptions, playing: boolean): CardOptions {
  return playing ? card : { ...card, animate: false };
}
