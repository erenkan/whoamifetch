"use client";

import { AtSign, Image as ImageIcon, SlidersHorizontal } from "lucide-react";
import { useMemo, useReducer, useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { normalizeLogin } from "@/lib/github";
import { previewCard } from "./editor/cardVariant";
import { IdentityTab } from "./editor/IdentityTab";
import { LookTab } from "./editor/LookTab";
import { PhotoTab } from "./editor/PhotoTab";
import { ShipIt } from "./editor/ShipIt";
import { readmeSnippet } from "./editor/shipping";
import { Stage, type Device } from "./editor/Stage";
import { initialState, reducer } from "./editor/state";
import { renderCard, useCardSvg } from "./editor/useCardSvg";
import { usePortrait } from "./editor/usePortrait";

/**
 * Studio. Sidebar tabs: Photo (GitHub login, local photo or initials), Identity (prompt and rows),
 * Look (presets, frame, colours, portrait tuning). Main column: the card as an <img> of the generated
 * SVG (rendered the way GitHub renders it) and the export. On phones the preview comes first.
 */
export default function Home() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const portrait = usePortrait(state);
  // "Play animation" holds for exactly the card and portrait it was pressed on; the next edit returns to the static preview.
  const [played, setPlayed] = useState<{ card: typeof state.card; portrait: typeof portrait } | null>(null);
  const playing = played?.card === state.card && played.portrait === portrait;
  const shown = useMemo(() => previewCard(state.card, playing), [state.card, playing]);
  const { url, bytes } = useCardSvg(portrait, shown, state.card);
  const [device, setDevice] = useState<Device>("desktop");
  const snippet = readmeSnippet(state.card.alt);
  const copy = () => navigator.clipboard.writeText(snippet).then(
    () => { toast("README snippet copied", { description: "Paste it into your profile README." }); },
    () => { toast.error("Could not copy", { description: "Select the snippet and copy it by hand." }); },
  );

  return (
    <>
      <AppHeader />
      <div className="flex flex-1 flex-wrap items-stretch">
        <aside className="order-2 flex w-full flex-col gap-5 border-t border-border bg-card p-5 wide:order-1 wide:w-[380px] wide:max-w-[380px] wide:flex-none wide:border-t-0 wide:border-r">
          <Tabs defaultValue="photo">
            <TabsList className="w-full">
              <TabsTrigger value="photo"><ImageIcon className="size-[15px]" aria-hidden="true" /> Photo</TabsTrigger>
              <TabsTrigger value="identity"><AtSign className="size-[15px]" aria-hidden="true" /> Identity</TabsTrigger>
              <TabsTrigger value="look"><SlidersHorizontal className="size-[15px]" aria-hidden="true" /> Look</TabsTrigger>
            </TabsList>
            <TabsContent value="photo" className="flex flex-col gap-5 pt-5">
              <PhotoTab state={state} dispatch={dispatch} portraitRows={portrait.length} />
            </TabsContent>
            <TabsContent value="identity" className="flex flex-col gap-5 pt-5">
              <IdentityTab state={state} dispatch={dispatch} />
            </TabsContent>
            <TabsContent value="look" className="flex flex-col gap-5 pt-5">
              <LookTab state={state} dispatch={dispatch} />
            </TabsContent>
          </Tabs>
        </aside>
        <main className="order-1 flex min-w-0 flex-1 basis-[560px] flex-col gap-5 p-4 wide:order-2 wide:px-8 wide:pt-6 wide:pb-8">
          <Stage
            url={url} bytes={bytes} animate={state.card.animate} onPlay={() => setPlayed({ card: state.card, portrait })}
            device={device} onDevice={setDevice} download={() => renderCard(portrait, state.card)} onCopy={copy}
          />
          <ShipIt login={state.source.kind === "github" ? normalizeLogin(state.source.login) : ""} snippet={snippet} onCopy={copy} />
        </main>
      </div>
    </>
  );
}
