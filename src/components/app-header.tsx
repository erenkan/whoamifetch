import { ExternalLink, Lock } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const ghostLink = cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground");

/** Wordmark, the privacy promise, links and the theme toggle. */
export function AppHeader() {
  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-5">
      <Link href="/" className="inline-flex items-center font-mono text-[15px] font-semibold tracking-tight">
        whoamifetch<span className="ml-[5px] inline-block h-[17px] w-2 rounded-[1px] bg-phosphor" aria-hidden="true" />
      </Link>
      <div className="hidden h-5 items-center gap-2 border-l border-border pl-3 text-[13px] text-muted-foreground wide:flex">
        <Lock className="size-3.5" aria-hidden="true" />
        <span>Runs entirely in your browser. Your photo never leaves this device.</span>
      </div>
      <div className="ml-auto flex items-center gap-0.5">
        <Link href="/privacy/" className={ghostLink}>Privacy</Link>
        <a href="https://github.com/erenkan/whoamifetch" target="_blank" rel="noreferrer" className={ghostLink}>
          Source<ExternalLink className="size-[13px]" aria-hidden="true" />
        </a>
        <Separator orientation="vertical" className="mx-2 h-5 self-center" />
        <ThemeToggle />
      </div>
    </header>
  );
}
