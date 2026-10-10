"use client";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function Preview({ url }: { url: string | null }) {
  const [nonce, setNonce] = useState(0);   // changing the key reloads the <img>, replaying the SMIL animation
  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-md bg-[#0d1117] p-4">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- a blob: SVG in <img> renders exactly as GitHub renders the README
          <img key={nonce} src={url} alt="Card preview" className="block w-full" />
        ) : <p className="text-sm text-neutral-400">Rendering…</p>}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => setNonce((n) => n + 1)} disabled={!url}>Replay animation</Button>
    </div>
  );
}
