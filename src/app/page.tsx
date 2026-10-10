"use client";

import Link from "next/link";
import { useReducer } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IdentityPanel } from "./editor/IdentityPanel";
import { LooksPanel } from "./editor/LooksPanel";
import { RowsEditor } from "./editor/RowsEditor";
import { SourcePanel } from "./editor/SourcePanel";
import { initialState, reducer } from "./editor/state";
import { usePortrait } from "./editor/usePortrait";

/**
 * Editor. Left: source (GitHub login, local photo or initials), identity, rows, looks.
 * Right: preview of the portrait rows (the SVG preview and export arrive with the card renderer).
 */
export default function Home() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const portrait = usePortrait(state);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">whoamifetch</h1>
        <p className="text-sm text-muted-foreground">
          A retro terminal card for your GitHub profile README. Everything runs in your browser;
          your photo never leaves this device. <Link href="/privacy/" className="underline underline-offset-2">Privacy</Link>
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="flex flex-col gap-6">
          <SourcePanel state={state} dispatch={dispatch} />
          <IdentityPanel state={state} dispatch={dispatch} />
          <RowsEditor state={state} dispatch={dispatch} />
          <LooksPanel state={state} dispatch={dispatch} />
        </div>

        <Card className="min-h-[480px]">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent className="overflow-auto rounded-md bg-[#0d1117] p-4">
            <pre aria-label="Portrait rows" data-rows={portrait.length} className="font-mono text-[6px] leading-[6px] text-[#3dff6e]">
              {portrait.map((r) => r.map((c) => c.ch).join("")).join("\n")}
            </pre>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
