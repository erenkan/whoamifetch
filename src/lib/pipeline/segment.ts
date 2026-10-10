/**
 * Person segmentation in the browser (MediaPipe ImageSegmenter, selfie model). The WASM runtime
 * and the model are served from our own origin (see scripts/fetch-models.mjs), so the page's
 * CSP stays closed. Returns a per-pixel subject probability (0..1) at the image's size.
 */
export interface Segmenter {
  segment(image: ImageData): Promise<Float32Array>;
  close(): void;
}

export async function loadSegmenter(): Promise<Segmenter> {
  throw new Error("not implemented yet");
}
