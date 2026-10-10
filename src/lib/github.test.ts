import { describe, expect, it } from "vitest";
import { normalizeLogin } from "./github";

describe("normalizeLogin", () => {
  it("reduces a pasted profile URL or handle to the login", () => {
    for (const input of ["https://github.com/test-user", "github.com/test-user/", "@test-user", "  test-user  ", "https://github.com/test-user?tab=repositories", "http://www.github.com/test-user/repos"]) {
      expect(normalizeLogin(input)).toBe("test-user");
    }
  });
  it("leaves a plain login untouched and returns an empty string when nothing remains", () => {
    expect(normalizeLogin("test-user")).toBe("test-user");
    expect(normalizeLogin("")).toBe("");
    expect(normalizeLogin("https://github.com/")).toBe("");
  });
});
