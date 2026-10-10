# Test fixtures

- `portrait.png`: "Man with a white beard and glasses" by Angelina Litvin (Unsplash, 2015), via
  Wikimedia Commons, licensed CC0 1.0 (public domain dedication). Resized to 460 px wide.
  https://commons.wikimedia.org/wiki/File:Man_with_a_white_beard_and_glasses,_by_Angelina_Litvin,_2015-10-05_(Unsplash).jpg
- `mask.png`: subject mask for `portrait.png` (255 = person), produced by the MediaPipe selfie segmenter (confidence, 0-255).
- `grid.json` / `rows.txt`: the reference luminance grid (100 columns) and ASCII rows produced by the
  Python prototype for the crop and parameters recorded in `grid.json`. The TypeScript pipeline is
  tested against them with a tolerance.
