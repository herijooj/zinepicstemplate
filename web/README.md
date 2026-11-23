# Zine maker (static site)

A browser-only version of the A7 fold-out zine. Nothing is uploaded anywhere:
photos stay on the visitor's computer and all rendering happens in the browser.

## What it does

- Edit the two title lines.
- Upload any number of photos (JPEG/PNG/etc.). The 42 polaroid slots on pages
  2–7 are filled in order, cycling if fewer than 42 photos are supplied. If no
  photos are given, placeholders are shown.
- Preview all eight A7 pages live.
- Download:
  - **print sheet** — one A4 landscape PDF, 8 imposed panels (bottom row
    6,7,8,1; top row 5,4,3,2 rotated 180°), no fold lines
  - **pages** — the 8 A7 pages in reading order
  - **fold guide** — fold lines and centre slit (print separately / don't print
    with the sheet)

## How it works

`js/draw.js` is a canvas port of `zine.sty` + `stickers.tex`: same A7 geometry,
palette, doodles, 28 × 35 polaroids, whole-photo fit (no cropped faces), and
all 20 hand-drawn stickers. `js/data.js` holds the slot grid, sticker
placements and imposition extracted from the LaTeX template. `js/pdf.js`
rasterises each page at 300 dpi and embeds them in a PDF with the vendored
`pdf-lib` (`vendor/pdf-lib.min.js` — no CDN, works offline).

## Deploying

`.github/workflows/pages.yml` deploys this folder to GitHub Pages on every push
to `main`. To test locally, serve the folder over HTTP (ES modules don't work
from `file://`):

```sh
cd web && python3 -m http.server 8000
```
