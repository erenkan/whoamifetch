import { describe, expect, it } from "vitest";
import { initialState, reducer } from "./state";

describe("editor reducer", () => {
  it("SOURCE_FAILED falls back to the no-photo mode and keeps the error", () => {
    const s = reducer({ ...initialState, source: { ...initialState.source, kind: "github", login: "octocat", status: "loading" } }, { type: "SOURCE_FAILED", error: "no person found" });
    expect(s.source.kind).toBe("none"); expect(s.source.status).toBe("failed"); expect(s.source.error).toBe("no person found");
  });
  it("PREFILL fills userHost, Host, Location and initials without touching other rows", () => {
    const s = reducer(initialState, { type: "PREFILL", profile: { login: "octocat", name: "Mona Lisa", bio: "Cat", company: "@github", location: "SF", avatarUrl: "", hasCustomAvatar: true } });
    expect(s.card.userHost).toBe("octocat@github");
    expect(s.card.rows.find((r) => r.key === "Host")?.value).toBe("github");
    expect(s.card.rows.find((r) => r.key === "Location")?.value).toBe("SF");
    expect(s.source.initials).toBe("ML");
    expect(s.card.rows.length).toBe(initialState.card.rows.length);
  });
  it("row operations", () => {
    let s = reducer(initialState, { type: "ROW_ADD" });
    expect(s.card.rows.length).toBe(initialState.card.rows.length + 1);
    s = reducer(s, { type: "ROW_MOVE", from: 0, to: 2 });
    expect(s.card.rows[2].key).toBe(initialState.card.rows[0].key);
    s = reducer(s, { type: "ROW_REMOVE", index: 2 });
    expect(s.card.rows.length).toBe(initialState.card.rows.length);
  });
  it("PRESET sets the three theme axes", () => {
    const s = reducer(initialState, { type: "PRESET", id: "win95-green" });
    expect(s.card.chrome).toBe("win95"); expect(s.card.phosphor).toBe("green"); expect(s.card.accent).toBe("amber");
  });
  it("caps rows at 12", () => {
    let s = initialState; for (let i = 0; i < 20; i++) s = reducer(s, { type: "ROW_ADD" });
    expect(s.card.rows.length).toBe(12);
  });
});
