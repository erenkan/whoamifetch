import { describe, expect, it } from "vitest";
import { fileMeta, readmeSnippet } from "./shipping";

describe("readmeSnippet", () => {
  it("is a full-width img tag for whoami.svg with the alt text escaped", () => {
    expect(readmeSnippet('Tom & "Jerry" <3')).toBe('<img src="whoami.svg" alt="Tom &amp; &quot;Jerry&quot; &lt;3" width="100%">');
  });
});

describe("fileMeta", () => {
  it("names the file, rounds the size to whole KB and says whether it animates", () => {
    expect(fileMeta(36_700, true)).toBe("whoami.svg · 36 KB · fonts embedded · SMIL");
    expect(fileMeta(1_500, false)).toBe("whoami.svg · 1 KB · fonts embedded · static");
  });
  it("never shows 0 KB for a small but non-empty file", () => {
    expect(fileMeta(300, false)).toBe("whoami.svg · 1 KB · fonts embedded · static");
  });
});
