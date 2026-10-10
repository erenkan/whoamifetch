// Runs before `next build`: copies the MediaPipe WASM runtime from node_modules and downloads
// the selfie segmentation model into public/, so everything is served from our own origin
// (the CSP forbids third-party hosts at runtime).
import { mkdir, copyFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

// The package's `exports` map hides package.json, so resolve through node_modules directly.
const wasmSrc = path.resolve("node_modules/@mediapipe/tasks-vision/wasm");
const wasmDst = path.resolve("public/mediapipe/wasm");
const modelDst = path.resolve("public/models/selfie_segmenter.tflite");
const modelUrl =
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite";

await mkdir(wasmDst, { recursive: true });
// Only the classic-script runtimes: SIMD (modern browsers) and the no-SIMD fallback. The
// ES-module variants are not used by FilesetResolver.forVisionTasks(), and each .wasm is ~13 MB.
for (const f of await readdir(wasmSrc)) {
  if (!/^vision_wasm_(nosimd_)?internal\.(js|wasm)$/.test(f)) continue;
  await copyFile(path.join(wasmSrc, f), path.join(wasmDst, f));
}

const have = await stat(modelDst).catch(() => null);
if (!have) {
  await mkdir(path.dirname(modelDst), { recursive: true });
  const res = await fetch(modelUrl);
  if (!res.ok) throw new Error(`model download failed: ${res.status}`);
  await writeFile(modelDst, Buffer.from(await res.arrayBuffer()));
}
console.log("models ready:", wasmDst, modelDst);
