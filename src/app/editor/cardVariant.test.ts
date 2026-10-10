import { describe, expect, it } from "vitest";
import { DEFAULT_CARD } from "@/lib/pipeline/svg";
import { previewCard } from "./cardVariant";

describe("previewCard", () => {
  it("is static while editing, whatever the Animation switch says", () => {
    expect(previewCard({ ...DEFAULT_CARD, animate: true }, false).animate).toBe(false);
  });
  it("shows the user's own card while playing", () => {
    const card = { ...DEFAULT_CARD, animate: true };
    expect(previewCard(card, true)).toBe(card);
  });
});
