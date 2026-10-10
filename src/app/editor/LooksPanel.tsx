"use client";
import type { Dispatch } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { PRESETS } from "@/lib/pipeline/themes";
import type { Accent, CardOptions, Chrome, Phosphor, PortraitOptions } from "@/lib/pipeline/types";
import type { Action, EditorState } from "./state";

const CHROMES: Record<Chrome, string> = { crt: "CRT monitor", macos: "macOS terminal", win95: "Windows 95" };
const PHOSPHORS: Record<Phosphor, string> = { green: "Green", amber: "Amber", white: "White" };
const ACCENT_NAMES: Record<Accent, string> = { amber: "Amber", cyan: "Cyan", green: "Green", white: "White" };

function SliderRow({ label, value, min, max, step, digits = 2, onChange }: {
  label: string; value: number; min: number; max: number; step: number; digits?: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}: {value.toFixed(digits)}</Label>
      <Slider aria-label={label} min={min} max={max} step={step} value={[value]} onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : (v as number))} />
    </div>
  );
}

function Choice<T extends string>({ id, label, items, value, onChange }: {
  id: string; label: string; items: Record<T, string>; value: T; onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select items={items} value={value} onValueChange={(v) => { if (v) onChange(v as T); }}>
        <SelectTrigger id={id} className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>
          {(Object.keys(items) as T[]).map((k) => <SelectItem key={k} value={k}>{items[k]}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

export function LooksPanel({ state, dispatch }: { state: EditorState; dispatch: Dispatch<Action> }) {
  const card = state.card, p = state.portrait;
  const setCard = (patch: Partial<CardOptions>) => dispatch({ type: "CARD", patch });
  const setPortrait = (patch: Partial<PortraitOptions>) => dispatch({ type: "PORTRAIT", patch });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Looks</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((t) => {
            const on = t.chrome === card.chrome && t.phosphor === card.phosphor && t.accent === card.accent;
            return (
              <Button key={t.id} type="button" size="sm" variant={on ? "default" : "outline"} aria-pressed={on} onClick={() => dispatch({ type: "PRESET", id: t.id })}>
                {t.name}
              </Button>
            );
          })}
        </div>
        <Choice id="chrome" label="Frame" items={CHROMES} value={card.chrome} onChange={(chrome) => setCard({ chrome })} />
        <Choice id="phosphor" label="Phosphor" items={PHOSPHORS} value={card.phosphor} onChange={(phosphor) => setCard({ phosphor })} />
        <Choice id="accent" label="Accent" items={ACCENT_NAMES} value={card.accent} onChange={(accent) => setCard({ accent })} />
        <SliderRow label="Columns" value={p.cols} min={70} max={120} step={10} digits={0} onChange={(cols) => setPortrait({ cols })} />
        {card.chrome === "crt" && (
          <>
            <SliderRow label="CRT bulge" value={card.bulge} min={0} max={16} step={1} digits={0} onChange={(bulge) => setCard({ bulge })} />
            <SliderRow label="CRT curve" value={card.curve} min={0} max={0.05} step={0.002} digits={3} onChange={(curve) => setCard({ curve })} />
          </>
        )}
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="animate">Animation</Label>
          <Switch id="animate" checked={card.animate} onCheckedChange={(animate) => setCard({ animate })} />
        </div>
        <details className="flex flex-col gap-4 [&[open]>summary]:mb-4">
          <summary className="cursor-pointer text-sm font-medium">Advanced</summary>
          <div className="flex flex-col gap-4">
            <SliderRow label="Dark detail" value={p.dark} min={0} max={1} step={0.05} onChange={(dark) => setPortrait({ dark })} />
            <SliderRow label="Highlight knee" value={p.knee} min={0.5} max={1} step={0.05} onChange={(knee) => setPortrait({ knee })} />
            <SliderRow label="Contrast" value={p.contrast} min={1} max={2} step={0.05} onChange={(contrast) => setPortrait({ contrast })} />
            <SliderRow label="Hair floor" value={p.floor} min={0} max={0.4} step={0.02} onChange={(floor) => setPortrait({ floor })} />
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
