"use client";
import { Copy, Download, Monitor, Play, Smartphone } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { fileMeta } from "./shipping";

export type Device = "desktop" | "mobile";

/**
 * The card as GitHub shows it: an <img> of the generated SVG, static while editing ("Play animation"
 * plays the reveal once), at the README column width or at phone width. Below it the download and
 * the README snippet.
 */
export function Stage({ url, bytes, animate, onPlay, device, onDevice, download, onCopy }: {
  url: string | null; bytes: number; animate: boolean; onPlay: () => void;
  device: Device; onDevice: (d: Device) => void; download: () => Promise<string>; onCopy: () => void;
}) {
  const [nonce, setNonce] = useState(0);   // a new key reloads the <img>, restarting the SMIL timeline
  const mobile = device === "mobile";      // phones always show the full-width preview; the toggle is hidden there
  const save = async () => {
    const svg = await download();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })); a.download = "whoami.svg"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[15px] font-semibold">Preview</h2>
          <Badge variant="outline"><span className="size-1.5 rounded-full bg-phosphor shadow-[0_0_6px_var(--phosphor)]" aria-hidden="true" /> live</Badge>
        </div>
        <p className="text-[13px] text-muted-foreground">
          {animate ? "Static here. The downloaded SVG types, prints and blinks once on load." : "Static. Turn on Animation in Look for the typing card."}
        </p>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <ToggleGroup
            aria-label="Preview width" variant="outline" spacing={0} className="hidden wide:flex"
            value={[device]} onValueChange={(v) => { if (v[0]) onDevice(v[0] as Device); }}
          >
            <ToggleGroupItem value="desktop" className="gap-1.5 text-[13px] text-muted-foreground aria-pressed:bg-accent aria-pressed:text-accent-foreground"><Monitor className="size-3.5" aria-hidden="true" /> Desktop · 832</ToggleGroupItem>
            <ToggleGroupItem value="mobile" className="gap-1.5 text-[13px] text-muted-foreground aria-pressed:bg-accent aria-pressed:text-accent-foreground"><Smartphone className="size-3.5" aria-hidden="true" /> Mobile · 350</ToggleGroupItem>
          </ToggleGroup>
          <Button type="button" variant="outline" size="sm" disabled={!url || !animate} onClick={() => { onPlay(); setNonce((n) => n + 1); }}>
            <Play className="fill-current" aria-hidden="true" /> Play animation
          </Button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-background bg-[radial-gradient(var(--border)_1px,transparent_1px)] bg-size-[16px_16px] p-4 wide:p-8">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- a blob: SVG in <img> renders exactly as GitHub renders the README
          <img
            key={nonce} src={url} alt="Live preview of your whoami card"
            className={cn("block h-auto w-full max-w-[900px] rounded-xl shadow-[0_24px_60px_-20px_rgba(0,0,0,.6)]", mobile && "wide:w-[350px]")}
          />
        ) : (
          <Skeleton className="w-full max-w-[900px] rounded-xl" style={{ aspectRatio: "900 / 556" }} />
        )}
        <span className={cn("text-xs text-muted-foreground", mobile && "wide:hidden")}>Scales with the README column: 832 px on a desktop profile page, about 350 px on phones.</span>
        {mobile && <span className="hidden text-xs text-muted-foreground wide:inline">Shown at 350 px, roughly what a phone renders.</span>}
      </div>

      <div className="flex flex-wrap items-center gap-2.5 [&>button]:flex-1 wide:[&>button]:flex-none">
        <Button type="button" disabled={!url} onClick={() => void save()}><Download aria-hidden="true" /> Download whoami.svg</Button>
        <Button type="button" variant="secondary" onClick={onCopy}><Copy aria-hidden="true" /> Copy README snippet</Button>
        {url && <span className="ml-auto font-mono text-xs text-muted-foreground">{fileMeta(bytes, animate)}</span>}
      </div>
    </>
  );
}
