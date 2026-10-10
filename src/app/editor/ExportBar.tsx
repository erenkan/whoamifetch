"use client";
import { Button } from "@/components/ui/button";
import { escapeXml } from "@/lib/pipeline/xml";

export const readmeSnippet = (alt: string) => `<img src="whoami.svg" alt="${escapeXml(alt)}" width="100%">`;

/** `render` builds the exported card on demand (animated when the Animation switch is on). */
export function ExportBar({ render, ready, alt }: { render: () => Promise<string>; ready: boolean; alt: string }) {
  const download = async () => {
    const svg = await render();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })); a.download = "whoami.svg"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const copy = () => navigator.clipboard.writeText(readmeSnippet(alt));
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" onClick={() => void download()} disabled={!ready}>Download whoami.svg</Button>
      <Button type="button" variant="outline" onClick={copy} disabled={!ready}>Copy README snippet</Button>
      <p className="basis-full text-xs text-muted-foreground">
        Preview is static; the downloaded card animates when Animation is on. Commit <code>whoami.svg</code> to
        your <code>&lt;username&gt;/&lt;username&gt;</code> repository and paste the snippet into its README.
      </p>
    </div>
  );
}
