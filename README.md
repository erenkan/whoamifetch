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
```

Deploys as a static site on Cloudflare Pages (build command `pnpm build`, output `out`).

## Credits

- Font: [VT323](https://github.com/google/fonts/tree/main/ofl/vt323) by Peter Hull, SIL OFL 1.1
  (`public/fonts/OFL.txt`), embedded into the SVG as a subset.
- Background removal: [MediaPipe](https://developers.google.com/mediapipe) selfie segmenter,
  Apache 2.0, running locally via WebAssembly.
- The original card and the Python prototype live in
  [erenkan/erenkan](https://github.com/erenkan/erenkan).
