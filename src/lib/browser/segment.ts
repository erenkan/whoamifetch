import { FilesetResolver, ImageSegmenter } from "@mediapipe/tasks-vision";
import type { Raster } from "@/lib/pipeline/types";

export interface Segmenter { segment(img: Raster): Promise<Float32Array>; close(): void }

/** Person segmentation in the browser. WASM and model come from our own origin (see scripts/fetch-models.mjs). */
export async function loadSegmenter(): Promise<Segmenter> {
  const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
  const seg = await ImageSegmenter.createFromOptions(vision, {
    baseOptions: { modelAssetPath: "/models/selfie_segmenter.tflite" },
    runningMode: "IMAGE", outputConfidenceMasks: true, outputCategoryMask: false,
  });
  return {
    async segment(img) {
      const res = seg.segment(new ImageData(img.data, img.width, img.height));
      const m = res.confidenceMasks![0]; const out = Float32Array.from(m.getAsFloat32Array()); res.close();
      return out;   // same width/height as the input
    },
    close: () => seg.close(),
  };
}
