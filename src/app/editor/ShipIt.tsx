import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const STEPS = [
  { n: 1, title: () => <>Download whoami.svg</>, text: "One file, fonts embedded, no external requests." },
  { n: 2, title: (repo: string) => <>Commit it to <span className="font-mono">{repo}</span></>, text: "The repository that renders your profile README." },
  { n: 3, title: () => <>Paste the snippet into README.md</>, text: "Scales to the column width; animates on every visit." },
];

/** How the card gets onto a profile: three steps and the snippet with a copy button. */
export function ShipIt({ login, snippet, onCopy }: { login: string; snippet: string; onCopy: () => void }) {
  const repo = login ? `${login}/${login}` : "<you>/<you>";
  return (
    <Card className="gap-4 px-6 py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-semibold">Ship it</h2>
        <span className="text-[13px] text-muted-foreground">Three steps, no build tools.</span>
      </div>
      <ol className="grid gap-4 wide:grid-cols-3">
        {STEPS.map((s) => (
          <li key={s.n} className="flex items-start gap-2.5">
            <span className="inline-flex size-6 flex-none items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground" aria-hidden="true">{s.n}</span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="font-medium break-words">{s.title(repo)}</span>
              <span className="text-[13px] text-muted-foreground">{s.text}</span>
            </div>
          </li>
        ))}
      </ol>
      <div className="relative">
        <pre className="overflow-x-auto rounded-md border border-border bg-muted py-3 pr-11 pl-3.5 font-mono text-[13px] leading-relaxed">{snippet}</pre>
        <Button type="button" variant="ghost" size="icon-sm" className="absolute top-2 right-2 bg-muted text-muted-foreground" aria-label="Copy snippet" onClick={onCopy}><Copy /></Button>
      </div>
    </Card>
  );
}
