"use client";
import { Check, ChevronDown, RotateCcw } from "lucide-react";
import { useState, type Dispatch } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_PORTRAIT } from "@/lib/pipeline/luminance";
import { ACCENT_NAMES, ACCENTS, CHROME_NAMES, PALETTES, PHOSPHOR_NAMES, PRESETS } from "@/lib/pipeline/themes";
import type { CardOptions, PortraitOptions } from "@/lib/pipeline/types";
import { cn } from "@/lib/utils";
import type { Action, EditorState } from "./state";

const sliderValue = (v: number | readonly number[]) => (Array.isArray(v) ? v[0] : (v as number));

const Dot = ({ color }: { color: string }) => (
  <span className="inline-block size-2.5 flex-none rounded-full border border-border" style={{ background: color }} aria-hidden="true" />
);

/** A labelled select; `dot` adds a colour swatch before each label. */
function Choice<T extends string>({ id, label, items, value, onChange, dot }: {
  id: string; label: string; items: Record<T, string>; value: T; onChange: (v: T) => void; dot?: (k: T) => string;
}) {
  const show = (k: T) => (dot ? <span className="inline-flex items-center gap-2"><Dot color={dot(k)} />{items[k]}</span> : items[k]);
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select items={items} value={value} onValueChange={(v) => { if (v) onChange(v as T); }}>
        <SelectTrigger id={id} className="w-full"><SelectValue>{(v: T) => show(v)}</SelectValue></SelectTrigger>
        <SelectContent>
          {(Object.keys(items) as T[]).map((k) => <SelectItem key={k} value={k}>{show(k)}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function SliderRow({ label, value, min, max, step, digits = 2, onChange }: {
  label: string; value: number; min: number; max: number; step: number; digits?: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Badge variant="secondary" className="font-mono">{value.toFixed(digits)}</Badge>
      </div>
      <Slider aria-label={label} min={min} max={max} step={step} value={[value]} onValueChange={(v) => onChange(sliderValue(v))} />
    </div>
  );
}

function TuningRow({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label className="text-[13px]">{label}</Label>
        <span className="font-mono text-xs text-muted-foreground">{value.toFixed(2)}</span>
      </div>
      <Slider aria-label={label} min={min} max={max} step={step} value={[value]} onValueChange={(v) => onChange(sliderValue(v))} />
    </div>
  );
}

/** Look tab: presets, frame and colours, portrait size, CRT shape, animation and portrait tuning. */
export function LookTab({ state, dispatch }: { state: EditorState; dispatch: Dispatch<Action> }) {
  const card = state.card, p = state.portrait;
  const setCard = (patch: Partial<CardOptions>) => dispatch({ type: "CARD", patch });
  const setPortrait = (patch: Partial<PortraitOptions>) => dispatch({ type: "PORTRAIT", patch });
  const [advanced, setAdvanced] = useState(false);
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label>Presets</Label>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((t) => {
            const on = t.chrome === card.chrome && t.phosphor === card.phosphor && t.accent === card.accent;
            return (
              <button
                key={t.id} type="button" aria-pressed={on} onClick={() => dispatch({ type: "PRESET", id: t.id })}
                className={cn("flex w-full flex-col gap-2 rounded-md border border-border p-2 text-left text-[13px] font-medium outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50", on && "border-transparent bg-accent ring-2 ring-ring")}
              >
                <span className="flex h-[22px] w-full items-center gap-1 rounded border border-border px-2" style={{ background: PALETTES[t.phosphor].screen0 }} aria-hidden="true">
                  <span className="h-1 w-[26px] rounded-sm" style={{ background: ACCENTS[t.accent] }} />
                  <span className="h-1 w-11 rounded-sm" style={{ background: PALETTES[t.phosphor].fg }} />
                </span>
                <span className="flex items-center justify-between gap-1.5 leading-tight">
                  <span className="truncate">{t.name}</span>
                  <Check className="size-3.5 flex-none" style={{ opacity: on ? 1 : 0 }} aria-hidden="true" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <Choice id="chrome" label="Frame" items={CHROME_NAMES} value={card.chrome} onChange={(chrome) => setCard({ chrome })} />
      <div className="grid grid-cols-2 gap-3">
        <Choice id="phosphor" label="Phosphor" items={PHOSPHOR_NAMES} value={card.phosphor} onChange={(phosphor) => setCard({ phosphor })} dot={(k) => PALETTES[k].fg} />
        <Choice id="accent" label="Accent" items={ACCENT_NAMES} value={card.accent} onChange={(accent) => setCard({ accent })} dot={(k) => ACCENTS[k]} />
      </div>

      <Separator />
      <SliderRow label="Columns" value={p.cols} min={70} max={120} step={10} digits={0} onChange={(cols) => setPortrait({ cols })} />
      {card.chrome === "crt" && (
        <>
          <SliderRow label="CRT bulge" value={card.bulge} min={0} max={16} step={1} digits={0} onChange={(bulge) => setCard({ bulge })} />
          <SliderRow label="CRT curve" value={card.curve} min={0} max={0.05} step={0.002} digits={3} onChange={(curve) => setCard({ curve })} />
        </>
      )}

      <Separator />
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="animate">Animation</Label>
          <span className="text-[13px] text-muted-foreground">Types, prints, blinks. Once on load. Honors reduced motion.</span>
        </div>
        <Switch id="animate" checked={card.animate} onCheckedChange={(animate) => setCard({ animate })} />
      </div>

      <Collapsible open={advanced} onOpenChange={setAdvanced} className="overflow-hidden rounded-md border border-border">
        <CollapsibleTrigger className={cn(buttonVariants({ variant: "ghost" }), "h-10 w-full justify-between rounded-none px-3")}>
          <span className="inline-flex items-center gap-2">
            Advanced<Badge variant="outline" className="text-muted-foreground">portrait tuning</Badge>
          </span>
          <ChevronDown className={cn("transition-transform", advanced && "rotate-180")} aria-hidden="true" />
        </CollapsibleTrigger>
        <CollapsibleContent className="flex flex-col gap-3.5 border-t border-border px-3 pt-3.5 pb-3">
          <TuningRow label="Dark detail" value={p.dark} min={0} max={1} step={0.05} onChange={(dark) => setPortrait({ dark })} />
          <TuningRow label="Highlight knee" value={p.knee} min={0.5} max={1} step={0.05} onChange={(knee) => setPortrait({ knee })} />
          <TuningRow label="Contrast" value={p.contrast} min={1} max={2} step={0.05} onChange={(contrast) => setPortrait({ contrast })} />
          <TuningRow label="Hair floor" value={p.floor} min={0} max={0.4} step={0.02} onChange={(floor) => setPortrait({ floor })} />
          <Button
            type="button" variant="ghost" size="sm" className="self-start pl-1.5 text-muted-foreground"
            onClick={() => setPortrait({ dark: DEFAULT_PORTRAIT.dark, knee: DEFAULT_PORTRAIT.knee, contrast: DEFAULT_PORTRAIT.contrast, floor: DEFAULT_PORTRAIT.floor })}
          >
            <RotateCcw aria-hidden="true" /> Reset to defaults
          </Button>
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}
