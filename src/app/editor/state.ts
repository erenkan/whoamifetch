import type { GitHubProfile } from "@/lib/github";
import { DEFAULT_PORTRAIT } from "@/lib/pipeline/luminance";
import { DEFAULT_CARD } from "@/lib/pipeline/svg";
import { PRESETS } from "@/lib/pipeline/themes";
import type { CardOptions, InfoRow, PortraitOptions, Raster } from "@/lib/pipeline/types";

export type SourceKind = "github" | "upload" | "none";
export interface EditorState {
  source: { kind: SourceKind; login: string; status: "idle" | "loading" | "ready" | "failed"; error?: string; initials: string };
  photo: Raster | null; prob: Float32Array | null;
  mask: SubjectMask | null;                                // cleanMask(prob) at the threshold it was made with
  removeBackground: boolean; maskThreshold: number;
  card: CardOptions; portrait: PortraitOptions;
}
export interface SubjectMask { thr: number; data: Uint8Array }
export type Action =
  | { type: "SOURCE_KIND"; kind: SourceKind } | { type: "LOGIN"; login: string }
  | { type: "SOURCE_LOADING" } | { type: "SOURCE_READY"; photo: Raster; prob: Float32Array | null; mask: SubjectMask | null }
  | { type: "SOURCE_FAILED"; error: string } | { type: "PREFILL"; profile: GitHubProfile }
  | { type: "CARD"; patch: Partial<CardOptions> } | { type: "PORTRAIT"; patch: Partial<PortraitOptions> }
  | { type: "ROW_SET"; index: number; row: InfoRow } | { type: "ROW_ADD" } | { type: "ROW_REMOVE"; index: number } | { type: "ROW_MOVE"; from: number; to: number }
  | { type: "PRESET"; id: string } | { type: "MASK"; removeBackground?: boolean; threshold?: number };

export const MAX_ROWS = 12;
export const initialState: EditorState = {
  source: { kind: "github", login: "", status: "idle", initials: "ME" },
  photo: null, prob: null, mask: null, removeBackground: true, maskThreshold: 0.5,
  card: DEFAULT_CARD, portrait: DEFAULT_PORTRAIT,
};

const setRow = (rows: InfoRow[], key: string, value: string | null) =>
  value == null ? rows : rows.map((r) => (r.key === key ? { ...r, value } : r));
const initialsOf = (name: string | null, login: string) =>
  (name?.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 3) || login.slice(0, 2)).toUpperCase();

export function reducer(s: EditorState, a: Action): EditorState {
  switch (a.type) {
    case "SOURCE_KIND": return { ...s, source: { ...s.source, kind: a.kind, status: "idle", error: undefined } };
    case "LOGIN": return { ...s, source: { ...s.source, login: a.login } };
    case "SOURCE_LOADING": return { ...s, source: { ...s.source, status: "loading", error: undefined } };
    case "SOURCE_READY": return { ...s, photo: a.photo, prob: a.prob, mask: a.mask, source: { ...s.source, status: "ready", error: undefined } };
    case "SOURCE_FAILED": return { ...s, photo: null, prob: null, mask: null, source: { ...s.source, kind: "none", status: "failed", error: a.error } };
    case "PREFILL": {
      const p = a.profile;
      let rows = setRow(s.card.rows, "Host", p.company?.replace(/^@/, "") ?? null);
      rows = setRow(rows, "Location", p.location);
      rows = setRow(rows, "Kernel", p.bio);
      return { ...s, card: { ...s.card, userHost: `${p.login}@github`, rows }, source: { ...s.source, initials: initialsOf(p.name, p.login) } };
    }
    case "CARD": return { ...s, card: { ...s.card, ...a.patch } };
    case "PORTRAIT": return { ...s, portrait: { ...s.portrait, ...a.patch } };
    case "ROW_SET": return { ...s, card: { ...s.card, rows: s.card.rows.map((r, i) => (i === a.index ? a.row : r)) } };
    case "ROW_ADD": return s.card.rows.length >= MAX_ROWS ? s : { ...s, card: { ...s.card, rows: [...s.card.rows, { key: "Key", value: "" }] } };
    case "ROW_REMOVE": return { ...s, card: { ...s.card, rows: s.card.rows.filter((_, i) => i !== a.index) } };
    case "ROW_MOVE": {
      const rows = [...s.card.rows]; const [m] = rows.splice(a.from, 1); rows.splice(a.to, 0, m);
      return { ...s, card: { ...s.card, rows } };
    }
    case "PRESET": {
      const p = PRESETS.find((x) => x.id === a.id); if (!p) return s;
      return { ...s, card: { ...s.card, chrome: p.chrome, phosphor: p.phosphor, accent: p.accent } };
    }
    case "MASK": return { ...s, removeBackground: a.removeBackground ?? s.removeBackground, maskThreshold: a.threshold ?? s.maskThreshold };
  }
}
