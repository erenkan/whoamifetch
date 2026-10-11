"use client";
import { Check, Loader2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, type Dispatch } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AvatarCorsError, fetchAvatarRaster, rasterFromBlob, rasterThumbnail } from "@/lib/browser/raster";
import { sharedSegmenter } from "@/lib/browser/segment";
import { fetchProfile, normalizeLogin } from "@/lib/github";
import { RAMP } from "@/lib/pipeline/ascii";
import { isIdenticon } from "@/lib/pipeline/identicon";
import { subjectMask } from "@/lib/pipeline/mask";
import type { Raster } from "@/lib/pipeline/types";
import type { Action, EditorState, SourceKind } from "./state";

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));
/** Lets the loading state paint before the (synchronous) segmentation blocks the main thread. */
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => setTimeout(r, 0)));
const SOURCES: [SourceKind, string][] = [["github", "GitHub avatar"], ["upload", "Upload"], ["none", "No photo"]];

/** Photo tab: where the portrait comes from, background removal and the resulting character grid. */
export function PhotoTab({ state, dispatch, portraitRows }: { state: EditorState; dispatch: Dispatch<Action>; portraitRows: number }) {
  const { kind, login, status, error } = state.source;
  const busy = status === "loading";
  const fileInput = useRef<HTMLInputElement>(null);
  const thumb = useMemo(() => (state.photo ? rasterThumbnail(state.photo) : null), [state.photo]);

  // Load the segmentation model in the background once the page is up, so the first photo needs
  // no network at all (the privacy page tells people they can go offline and check).
  useEffect(() => {
    const warm = () => { sharedSegmenter().catch(() => {}); };
    if (typeof requestIdleCallback === "function") { const id = requestIdleCallback(warm); return () => cancelIdleCallback(id); }
    const t = setTimeout(warm, 1000); return () => clearTimeout(t);
  }, []);

  async function segmentAndUse(photo: Raster, label: string) {
    await nextFrame();
    const prob = await (await sharedSegmenter()).segment(photo);
    const thr = state.maskThreshold, mask = subjectMask(prob, photo.width, photo.height, thr);
    if (!mask) throw new Error("No person detected; showing initials instead.");
    dispatch({ type: "SOURCE_READY", photo, prob, mask: { thr, data: mask }, label });
  }

  async function fromGitHub() {
    const name = normalizeLogin(login);
    if (!name) return;
    dispatch({ type: "LOGIN", login: name });                 // a pasted profile URL becomes the plain login
    dispatch({ type: "SOURCE_LOADING" });
    try {
      const profile = await fetchProfile(name);
      dispatch({ type: "PREFILL", profile });
      const photo = await fetchAvatarRaster(profile.avatarUrl).catch((e) => {
        throw e instanceof AvatarCorsError ? new Error("Could not load the avatar here; download it and use Upload instead.") : e;
      });
      if (isIdenticon(photo)) throw new Error("This account uses a generated identicon; showing initials instead.");
      await segmentAndUse(photo, profile.login);
    } catch (e) {
      dispatch({ type: "SOURCE_FAILED", error: message(e) });
    }
  }

  async function fromFile(file: File | undefined) {
    if (!file) return;
    dispatch({ type: "SOURCE_LOADING" });
    try {
      await segmentAndUse(await rasterFromBlob(file), file.name);
    } catch (e) {
      dispatch({ type: "SOURCE_FAILED", error: message(e) });
    }
  }

  const loaded = status === "ready" && state.photo && kind !== "none";
  // One live region for the whole source step, present from the start so screen readers announce changes.
  const announce = busy ? "Loading photo and finding the person." : status === "failed" && error ? error
    : loaded ? (kind === "github" ? "Avatar loaded." : "Photo loaded.") : "";
  return (
    <>
      <p className="sr-only" role="status">{announce}</p>
      <div className="flex flex-col gap-2">
        <Label>Photo source</Label>
        <ToggleGroup
          aria-label="Photo source" variant="outline" spacing={0} className="w-full"
          value={[kind]} onValueChange={(v) => { if (v[0]) dispatch({ type: "SOURCE_KIND", kind: v[0] as SourceKind }); }}
        >
          {SOURCES.map(([k, name]) => (
            <ToggleGroupItem key={k} value={k} className="flex-1 text-[13px] text-muted-foreground aria-pressed:bg-accent aria-pressed:text-accent-foreground">{name}</ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex flex-col gap-2">
        {kind === "github" && (
          <>
            <Label htmlFor="username">GitHub username</Label>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void fromGitHub(); }}>
              <div className="relative min-w-0 flex-1">
                <span className="pointer-events-none absolute top-2 left-3 font-mono text-sm text-muted-foreground" aria-hidden="true">@</span>
                <Input id="username" className="pl-7 font-mono" value={login} onChange={(e) => dispatch({ type: "LOGIN", login: e.target.value })} placeholder="octocat" autoComplete="off" spellCheck={false} />
              </div>
              <Button type="submit" variant="secondary" disabled={!login.trim() || busy}>
                {busy && <Loader2 className="animate-spin" aria-hidden="true" />}Fetch
              </Button>
            </form>
            <p className="text-[13px] text-muted-foreground">Uses your public avatar and profile fields; nothing is stored.</p>
          </>
        )}
        {kind === "upload" && (
          <>
            <button
              type="button" disabled={busy}
              className="flex min-h-24 w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-input bg-background px-4 py-6 text-sm hover:bg-accent disabled:opacity-60"
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); void fromFile(e.dataTransfer.files[0]); }}
            >
              {busy ? <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" /> : <Upload className="size-4 text-muted-foreground" aria-hidden="true" />}
              <span>{busy ? "Finding the person in your photo." : "Drop a photo or click to browse."}</span>
              <span className="text-xs text-muted-foreground">Stays on this device.</span>
            </button>
            <input
              ref={fileInput} type="file" accept="image/*" aria-label="Photo" className="hidden"
              onChange={(e) => { void fromFile(e.target.files?.[0]); e.target.value = ""; }}
            />
          </>
        )}
        {kind === "none" && (
          <>
            <Label htmlFor="initials">Initials</Label>
            <Input id="initials" className="font-mono" value={state.source.initials} maxLength={3} onChange={(e) => dispatch({ type: "INITIALS", initials: e.target.value })} />
            <p className="text-[13px] text-muted-foreground">Prints a monogram of up to three letters instead of a portrait.</p>
          </>
        )}
        {status === "failed" && error && <p className="text-[13px] text-destructive">{error}</p>}
        {loaded && (
          <div className="flex items-center gap-2.5 rounded-md border border-border bg-background px-2.5 py-2">
            <Avatar className="size-7">
              {thumb && <AvatarImage src={thumb} alt="" />}
              <AvatarFallback className="text-[11px]">{state.source.initials.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col gap-px">
              <span className="text-[13px] font-medium">{kind === "github" ? "Avatar loaded" : "Photo loaded"}</span>
              <span className="truncate text-xs text-muted-foreground">
                {state.sourceMeta?.label ?? login} · {state.photo!.width} × {state.photo!.height} · {kind === "github" ? "public" : "local"}
              </span>
            </div>
            <Badge variant="outline" className="ml-auto text-phosphor"><Check aria-hidden="true" /> ready</Badge>
          </div>
        )}
      </div>

      {kind !== "none" && (
        <>
          <Separator />
          <div className="flex flex-col gap-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="remove-bg">Remove background</Label>
                <span className="text-[13px] text-muted-foreground">Masks the backdrop so only the portrait prints.</span>
              </div>
              <Switch id="remove-bg" checked={state.removeBackground} onCheckedChange={(v) => dispatch({ type: "MASK", removeBackground: v })} />
            </div>
            {state.removeBackground && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <Label>Mask threshold</Label>
                  <Badge variant="secondary" className="font-mono">{state.maskThreshold.toFixed(2)}</Badge>
                </div>
                <Slider
                  aria-label="Mask threshold" min={0} max={1} step={0.01} value={[state.maskThreshold]}
                  onValueChange={(v) => dispatch({ type: "MASK", threshold: Array.isArray(v) ? v[0] : (v as number) })}
                />
                <div className="flex justify-between text-xs text-muted-foreground"><span>keeps more</span><span>cuts more</span></div>
              </div>
            )}
          </div>
        </>
      )}

      <Separator />
      <div className="flex flex-col gap-2">
        <Label>Portrait grid</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border border-border bg-background px-3 py-2.5">
            <div className="font-mono text-lg font-medium">{state.portrait.cols} × {portraitRows}</div>
            <div className="text-xs text-muted-foreground">columns × rows</div>
          </div>
          <div className="rounded-md border border-border bg-background px-3 py-2.5">
            <div className="font-mono text-lg font-medium whitespace-pre">{RAMP}</div>
            <div className="text-xs text-muted-foreground">glyph ramp, sparse to dense</div>
          </div>
        </div>
      </div>
    </>
  );
}
