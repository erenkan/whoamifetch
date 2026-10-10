# whoamifetch

Turn your photo and a few lines about yourself into a retro terminal card for your GitHub
profile README: an ASCII portrait printed by `whoami`, neofetch-style, on a curved CRT
monitor (or a macOS terminal window). Output is a single animated SVG you commit to your
`<username>/<username>` repository.

**Privacy.** Everything runs in your browser. The only network requests the page can make are
to `api.github.com` (optional profile prefill) and `avatars.githubusercontent.com` (your public
avatar); this is enforced by the site's Content-Security-Policy, not just promised. An uploaded
photo is drawn on a canvas and never leaves your device. No accounts, no analytics, no storage.

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
(`ascii.ts`), and `svg.ts` lays out the portrait next to the info rows inside one of three
frames (`chromes.ts`). The pipeline never touches the DOM, so it is unit-tested in Node against
reference output from the Python prototype. Browser-only glue (canvas decoding, the MediaPipe
segmenter, the embedded font) lives in [`src/lib/browser`](src/lib/browser).

## Deploy

Cloudflare Pages, as a plain static site (no Functions):

1. Workers & Pages → Create → Pages → connect this Git repository; production branch `main`.
2. Build settings: framework preset *None*, build command `pnpm build`, build output directory
   `out`.
3. Environment variables (production and preview): `NODE_VERSION=22` and `PNPM_VERSION=10.15.1`
   (the version in `package.json`'s `packageManager`).
4. Save and deploy. `pnpm build` first runs `scripts/fetch-models.mjs`, which puts the MediaPipe
   runtime and the segmentation model into `public/`, so they are served from the site's own
   origin. `public/_headers` is copied to `out/_headers`, and Pages applies it to every response.
   Pushes to other branches get preview deployments.

Verify the privacy guarantee on the deployed site:

```sh
curl -sI https://<project>.pages.dev/ | grep -i '^content-security-policy'
# connect-src must list only 'self' https://api.github.com https://avatars.githubusercontent.com
curl -sI https://<project>.pages.dev/models/selfie_segmenter.tflite | head -1   # HTTP/2 200
```

Then open the site with the browser's developer tools on the network tab and upload a photo:
no request appears.

## Credits

- Font: [VT323](https://github.com/google/fonts/tree/main/ofl/vt323) by Peter Hull, SIL OFL 1.1
  (`public/fonts/OFL.txt`), embedded into the SVG as a subset.
- Background removal: [MediaPipe](https://developers.google.com/mediapipe) selfie segmenter,
  Apache 2.0, running locally via WebAssembly.
- The original card and the Python prototype live in
  [erenkan/erenkan](https://github.com/erenkan/erenkan).
