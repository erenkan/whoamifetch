"use client";
import type { Dispatch } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvatarCorsError, fetchAvatarRaster, rasterFromBlob } from "@/lib/browser/raster";
import { sharedSegmenter } from "@/lib/browser/segment";
import { fetchProfile } from "@/lib/github";
import { isIdenticon } from "@/lib/pipeline/identicon";
import { personFound } from "@/lib/pipeline/mask";
import type { Raster } from "@/lib/pipeline/types";
import type { Action, EditorState, SourceKind } from "./state";

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));
/** Lets the loading state paint before the (synchronous) segmentation blocks the main thread. */
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => setTimeout(r, 0)));

export function SourcePanel({ state, dispatch }: { state: EditorState; dispatch: Dispatch<Action> }) {
  const { kind, login, status, error } = state.source;
  const busy = status === "loading";

  async function segmentAndUse(photo: Raster) {
    await nextFrame();
    const prob = await (await sharedSegmenter()).segment(photo);
    if (!personFound(prob, photo.width, photo.height, state.maskThreshold)) throw new Error("No person detected; showing initials instead.");
    dispatch({ type: "SOURCE_READY", photo, prob });
  }

  async function fromGitHub() {
    const name = login.trim();
    if (!name) return;
    dispatch({ type: "SOURCE_LOADING" });
    try {
      const profile = await fetchProfile(name);
      dispatch({ type: "PREFILL", profile });
      const photo = await fetchAvatarRaster(profile.avatarUrl).catch((e) => {
        throw e instanceof AvatarCorsError ? new Error("Could not load the avatar here; download it and use Upload instead.") : e;
      });
      if (isIdenticon(photo)) throw new Error("This account uses a generated identicon; showing initials instead.");
      await segmentAndUse(photo);
    } catch (e) {
      dispatch({ type: "SOURCE_FAILED", error: message(e) });
    }
  }

  async function fromFile(file: File | undefined) {
    if (!file) return;
    dispatch({ type: "SOURCE_LOADING" });
    try {
      await segmentAndUse(await rasterFromBlob(file));
    } catch (e) {
      dispatch({ type: "SOURCE_FAILED", error: message(e) });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Source</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Tabs value={kind} onValueChange={(v) => dispatch({ type: "SOURCE_KIND", kind: v as SourceKind })}>
          <TabsList className="w-full">
            <TabsTrigger value="github" className="flex-1">GitHub avatar</TabsTrigger>
            <TabsTrigger value="upload" className="flex-1">Upload</TabsTrigger>
            <TabsTrigger value="none" className="flex-1">No photo</TabsTrigger>
          </TabsList>
          <TabsContent value="github" className="flex flex-col gap-3 pt-3">
            <Label htmlFor="login">GitHub username</Label>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void fromGitHub(); }}>
              <Input id="login" value={login} onChange={(e) => dispatch({ type: "LOGIN", login: e.target.value })} placeholder="octocat" />
              <Button type="submit" disabled={!login.trim() || busy}>Fetch</Button>
            </form>
            <p className="text-xs text-muted-foreground">Uses your public avatar and profile fields; nothing is stored.</p>
          </TabsContent>
          <TabsContent value="upload" className="flex flex-col gap-3 pt-3">
            <Input type="file" accept="image/*" aria-label="Photo" disabled={busy} onChange={(e) => void fromFile(e.target.files?.[0])} />
            <p className="text-xs text-muted-foreground">Processed on a canvas in this tab. The page cannot send it anywhere (CSP).</p>
          </TabsContent>
          <TabsContent value="none" className="pt-3 text-sm text-muted-foreground">
            The left column shows your initials in big ASCII letters instead of a portrait.
          </TabsContent>
        </Tabs>
        {busy && <p className="text-sm text-muted-foreground" role="status">Loading photo and finding the person…</p>}
        {status === "failed" && error && <p className="text-sm text-muted-foreground" role="status">{error}</p>}
        {kind !== "none" && (
          <div className="flex flex-col gap-3 border-t pt-3">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="remove-bg">Remove background</Label>
              <Switch id="remove-bg" checked={state.removeBackground} onCheckedChange={(v) => dispatch({ type: "MASK", removeBackground: v })} />
            </div>
            <Label>Mask threshold: {state.maskThreshold.toFixed(2)}</Label>
            <Slider
              aria-label="Mask threshold"
              min={0.2} max={0.8} step={0.05}
              value={[state.maskThreshold]}
              disabled={!state.removeBackground}
              onValueChange={(v) => dispatch({ type: "MASK", threshold: Array.isArray(v) ? v[0] : (v as number) })}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
