import { describe, expect, it } from "vitest";
import { readmeSnippet } from "./ExportBar";

describe("readmeSnippet", () => {
  it("is a full-width img tag for whoami.svg with the alt text escaped", () => {
    expect(readmeSnippet('Tom & "Jerry" <3')).toBe('<img src="whoami.svg" alt="Tom &amp; &quot;Jerry&quot; &lt;3" width="100%">');
  });
});
