"use client";
import { Button } from "@/components/ui/button";
import { useState } from "react";

/** The card as GitHub shows it. Static while editing; "Play animation" plays the reveal once. */
export function Preview({ url, canPlay, onPlay }: { url: string | null; canPlay: boolean; onPlay: () => void }) {
  const [nonce, setNonce] = useState(0);   // a new key reloads the <img>, restarting the SMIL timeline
  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-md bg-[#0d1117] p-4">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- a blob: SVG in <img> renders exactly as GitHub renders the README
          <img key={nonce} src={url} alt="Card preview" className="block w-full" />
        ) : <p className="text-sm text-neutral-400">Rendering…</p>}
      </div>
      <Button type="button" variant="outline" size="sm" disabled={!url || !canPlay} onClick={() => { onPlay(); setNonce((n) => n + 1); }}>
        Play animation
      </Button>
    </div>
  );
}
