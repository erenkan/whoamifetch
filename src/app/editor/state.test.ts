import { describe, expect, it } from "vitest";
import { initialState, reducer } from "./state";

describe("editor reducer", () => {
  it("SOURCE_FAILED falls back to the no-photo mode and keeps the error", () => {
    const s = reducer({ ...initialState, source: { ...initialState.source, kind: "github", login: "test-user", status: "loading" } }, { type: "SOURCE_FAILED", error: "no person found" });
    expect(s.source.kind).toBe("none"); expect(s.source.status).toBe("failed"); expect(s.source.error).toBe("no person found");
    expect(s.photo).toBeNull(); expect(s.prob).toBeNull(); expect(s.mask).toBeNull();
  });
  it("SOURCE_READY keeps the cleaned mask together with the threshold it was made with", () => {
    const photo = { width: 2, height: 1, data: new Uint8ClampedArray(8) };
    const mask = { thr: 0.5, data: Uint8Array.from([1, 0]) };
    const s = reducer(initialState, { type: "SOURCE_READY", photo, prob: Float32Array.from([0.9, 0.1]), mask });
    expect(s.mask).toBe(mask); expect(s.source.status).toBe("ready");
  });
  it("SOURCE_READY records where the photo came from; a new source kind or a failure clears it", () => {
    const photo = { width: 2, height: 1, data: new Uint8ClampedArray(8) };
    const s = reducer(initialState, { type: "SOURCE_READY", photo, prob: null, mask: null, label: "photo.jpg" });
    expect(s.sourceMeta).toEqual({ label: "photo.jpg" });
    expect(reducer(s, { type: "SOURCE_KIND", kind: "github" }).sourceMeta).toBeNull();
    expect(reducer(s, { type: "SOURCE_FAILED", error: "x" }).sourceMeta).toBeNull();
    expect(initialState.sourceMeta).toBeNull();
  });
  it("PREFILL fills userHost, Host, Location, Kernel and initials without touching other rows", () => {
    const s = reducer(initialState, { type: "PREFILL", profile: { login: "test-user", name: "Test User", bio: "Test bio", company: "@test-org", location: "Test City", avatarUrl: "", hasCustomAvatar: true } });
    expect(s.card.userHost).toBe("test-user@github");
    expect(s.card.rows.find((r) => r.key === "Host")?.value).toBe("test-org");
    expect(s.card.rows.find((r) => r.key === "Location")?.value).toBe("Test City");
    expect(s.card.rows.find((r) => r.key === "Kernel")?.value).toBe("Test bio");
    expect(s.source.initials).toBe("TU");
    expect(s.card.rows.length).toBe(initialState.card.rows.length);
  });
  it("INITIALS sets the no-photo initials", () => {
    expect(reducer(initialState, { type: "INITIALS", initials: "ek" }).source.initials).toBe("ek");
  });
  it("ships neutral default rows, no personal data", () => {
    expect(initialState.card.rows.map((r) => [r.key, r.value])).toEqual([
      ["OS", "Operating system"], ["Host", "Company"], ["Kernel", "Role"], ["Uptime", "N years"], ["Packages", "Tools, protocols"],
      ["DE", "Frontend stack"], ["Shell", "zsh"], ["Languages", "Languages"], ["Location", "City, Country"], ["Contact", "you@example.com"],
    ]);
  });
  it("row operations", () => {
    let s = reducer(initialState, { type: "ROW_ADD" });
    expect(s.card.rows.length).toBe(initialState.card.rows.length + 1);
    s = reducer(s, { type: "ROW_MOVE", from: 0, to: 2 });
    expect(s.card.rows[2].key).toBe(initialState.card.rows[0].key);
    s = reducer(s, { type: "ROW_REMOVE", index: 2 });
    expect(s.card.rows.length).toBe(initialState.card.rows.length);
  });
  it("keeps rowIds parallel to rows through add, move and remove", () => {
    let s = initialState;
    expect(s.rowIds).toHaveLength(s.card.rows.length);
    expect(new Set(s.rowIds).size).toBe(s.rowIds.length);
    s = reducer(s, { type: "ROW_ADD" });
    expect(s.rowIds).toHaveLength(s.card.rows.length);
    expect(new Set(s.rowIds).size).toBe(s.rowIds.length);
    const [first, second] = s.rowIds;
    s = reducer(s, { type: "ROW_MOVE", from: 0, to: 1 });
    expect(s.rowIds[0]).toBe(second); expect(s.rowIds[1]).toBe(first);
    expect(s.card.rows[1].key).toBe(initialState.card.rows[0].key);
    s = reducer(s, { type: "ROW_REMOVE", index: 1 });
    expect(s.rowIds).not.toContain(first);
    expect(s.rowIds).toHaveLength(s.card.rows.length);
  });
  it("prefill never changes the number of rows or their ids", () => {
    const s = reducer(initialState, { type: "PREFILL", profile: { login: "test-user", name: "Test User", bio: "Test bio", company: "@test-org", location: "Test City", avatarUrl: "", hasCustomAvatar: true } });
    expect(s.rowIds).toEqual(initialState.rowIds);
    expect(s.card.rows).toHaveLength(initialState.card.rows.length);
  });
  it("a phosphor change keeps the keys readable: paper gets graphite keys, leaving paper drops graphite for amber", () => {
    const paper = reducer(initialState, { type: "CARD", patch: { phosphor: "paper" } });
    expect(paper.card.accent).toBe("graphite");
    const back = reducer(paper, { type: "CARD", patch: { phosphor: "green" } });
    expect(back.card.accent).toBe("amber");
    const cyan = reducer({ ...initialState, card: { ...initialState.card, accent: "cyan" } }, { type: "CARD", patch: { phosphor: "amber" } });
    expect(cyan.card.accent).toBe("cyan");
  });
  it("picking the phosphor that is already set keeps the user's accent", () => {
    const paperAmber = reducer(reducer(initialState, { type: "PRESET", id: "macplus-paper" }), { type: "CARD", patch: { accent: "amber" } });
    expect(reducer(paperAmber, { type: "CARD", patch: { phosphor: "paper" } }).card.accent).toBe("amber");
    const greenGraphite = reducer(initialState, { type: "CARD", patch: { accent: "graphite" } });
    expect(reducer(greenGraphite, { type: "CARD", patch: { phosphor: "green" } }).card.accent).toBe("graphite");
  });
  it("an accent the user sets explicitly is never overridden by the phosphor rule", () => {
    expect(reducer(initialState, { type: "CARD", patch: { phosphor: "paper", accent: "cyan" } }).card.accent).toBe("cyan");
    const paper = reducer(initialState, { type: "PRESET", id: "macplus-paper" });
    expect(reducer(paper, { type: "CARD", patch: { phosphor: "green", accent: "graphite" } }).card.accent).toBe("graphite");
    expect(reducer(paper, { type: "CARD", patch: { accent: "amber" } }).card.accent).toBe("amber");
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
