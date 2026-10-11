import { escapeXml } from "@/lib/pipeline/xml";

/** The line to paste into the profile README. */
export const readmeSnippet = (alt: string) => `<img src="whoami.svg" alt="${escapeXml(alt)}" width="100%">`;

/** "whoami.svg · 36 KB · fonts embedded · SMIL": what the download will be. */
export const fileMeta = (bytes: number, animated: boolean) =>
  `whoami.svg · ${Math.max(1, Math.round(bytes / 1024))} KB · fonts embedded · ${animated ? "SMIL" : "static"}`;
