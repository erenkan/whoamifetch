import { readFileSync } from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";
import type { Raster } from "@/lib/pipeline/types";

const dir = path.resolve(__dirname, "../fixtures");

export function loadPng(name: string): Raster {
  const png = PNG.sync.read(readFileSync(path.join(dir, name)));
  return { width: png.width, height: png.height, data: new Uint8ClampedArray(png.data) };
}

export interface GoldenGrid {
  cols: number;
  rows: number;
  crop: [number, number, number, number];
  params: { dark: number; knee: number; contrast: number; floor: number; floorUntil: number; clahe: number; gate: number };
  data: Float32Array;
}

export function loadGrid(): GoldenGrid {
  const j = JSON.parse(readFileSync(path.join(dir, "grid.json"), "utf8"));
  return { ...j, data: Float32Array.from(j.data as number[]) };
}

/** Subject probability per pixel (0..1) from the fixture mask PNG. */
export function loadMaskProb(): Float32Array {
  const m = loadPng("mask.png"); const out = new Float32Array(m.width * m.height);
  for (let i = 0; i < out.length; i++) out[i] = m.data[i * 4] / 255;
  return out;
}

export function loadRows(): string[] {
  return readFileSync(path.join(dir, "rows.txt"), "utf8").replace(/\n$/, "").split("\n");
}
