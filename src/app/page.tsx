"use client";

import Link from "next/link";
import { useMemo, useReducer, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { previewCard } from "./editor/cardVariant";
import { ExportBar } from "./editor/ExportBar";
import { IdentityPanel } from "./editor/IdentityPanel";
import { LooksPanel } from "./editor/LooksPanel";
import { Preview } from "./editor/Preview";
import { RowsEditor } from "./editor/RowsEditor";
import { SourcePanel } from "./editor/SourcePanel";
import { initialState, reducer } from "./editor/state";
import { renderCard, useCardSvg } from "./editor/useCardSvg";
import { usePortrait } from "./editor/usePortrait";

/**
 * Editor. Left: source (GitHub login, local photo or initials), identity, rows, looks.
 * Right: the card as an <img> of the generated SVG (rendered the way GitHub renders it) and the export.
 */
export default function Home() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const portrait = usePortrait(state);
  // "Play animation" holds for exactly the card and portrait it was pressed on; the next edit returns to the static preview.
  const [played, setPlayed] = useState<{ card: typeof state.card; portrait: typeof portrait } | null>(null);
  const playing = played?.card === state.card && played.portrait === portrait;
  const shown = useMemo(() => previewCard(state.card, playing), [state.card, playing]);
  const url = useCardSvg(portrait, shown);

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

        <Card className="h-fit lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Preview url={url} canPlay={state.card.animate} onPlay={() => setPlayed({ card: state.card, portrait })} />
            <ExportBar render={() => renderCard(portrait, state.card)} ready={!!url} alt={state.card.alt} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
