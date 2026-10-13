# whoamifetch

[![ci](https://github.com/erenkan/whoamifetch/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/erenkan/whoamifetch/actions/workflows/ci.yml)
[![deploy](https://img.shields.io/github/check-runs/erenkan/whoamifetch/main?nameFilter=Cloudflare%20Pages&label=deploy)](https://github.com/erenkan/whoamifetch/commits/main)
[![site](https://img.shields.io/website?url=https%3A%2F%2Fwhoamifetch.pages.dev&label=site)](https://whoamifetch.pages.dev)
[![license](https://img.shields.io/github/license/erenkan/whoamifetch)](LICENSE)

Turn your photo and a few lines about yourself into a retro terminal card for your GitHub
profile README: an ASCII portrait printed by `whoami`, neofetch-style, on a curved CRT
monitor, a terminal window, a Windows 95 window or a Mac Plus with a 1-bit paper screen. Output
is a single animated SVG you commit to your `<username>/<username>` repository.

**Make yours at [whoamifetch.pages.dev](https://whoamifetch.pages.dev).**

## Using it

The editor has three tabs. **Photo** takes your GitHub avatar, an uploaded photo or just your
initials, and removes the background. **Identity** sets the prompt and the info rows; drag a row's
handle (or focus it and use Space and the arrow keys) to reorder. **Look** picks a preset, the
frame, the phosphor and key colours, the portrait size and the animation. The preview shows the
card as GitHub renders it, at desktop or phone width; download `whoami.svg`, copy the README
snippet and follow the three steps under it. The header toggles between the dark and the light
theme.

**Privacy.** Everything runs in your browser. The only network requests the page can make are
to `api.github.com` (optional profile prefill) and `avatars.githubusercontent.com` (your public
avatar); this is enforced by the site's Content-Security-Policy, not just promised. An uploaded
photo is drawn on a canvas and never leaves your device. No accounts, no analytics, no storage.
The MediaPipe runtime attempts anonymous usage pings to `odml.pa.googleapis.com` (task type, OS
family, latency; never image data); the Content-Security-Policy blocks them, so none leave the
browser.

## Development

```sh
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # static export to out/ (prebuild fetches the segmentation model)
pnpm test         # unit tests for the pipeline and the editor state
```

## How it works

The card is produced by framework-free TypeScript in [`src/lib/pipeline`](src/lib/pipeline):
the segmenter's subject mask is cleaned up and used to crop head and shoulders (`mask.ts`),
the photo's luminance gets local contrast, a percentile stretch and a noise gate
(`contrast.ts`, `luminance.ts`), each character cell becomes a glyph from a density ramp
(`ascii.ts`), and `svg.ts` lays out the portrait next to the info rows inside one of four
frames (`chromes.ts`): a CRT monitor, a terminal window, Windows 95, or a Mac Plus with a 1-bit
paper screen. The pipeline never touches the DOM, so it is unit-tested in Node against
reference output from the Python prototype. Browser-only glue (canvas decoding, the MediaPipe
segmenter, the embedded font) lives in [`src/lib/browser`](src/lib/browser).

## Credits

- Font: [VT323](https://github.com/google/fonts/tree/main/ofl/vt323) by Peter Hull, SIL OFL 1.1
  (`public/fonts/OFL.txt`), embedded into the SVG as a subset.
- Background removal: [MediaPipe](https://developers.google.com/mediapipe) selfie segmenter,
  Apache 2.0, running locally via WebAssembly.
- The original card and the Python prototype live in
  [erenkan/erenkan](https://github.com/erenkan/erenkan).
