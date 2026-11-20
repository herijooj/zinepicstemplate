# roots e amigos — a one-sheet mini zine

One A4 landscape sheet (297 × 210 mm), printed single-sided in full color,
folds into 8 A7 portrait panels (74.25 × 105 mm) with the classic center-slit
fold. Polaroids, hand-drawn stickers, Permanent Marker title. No captions.

## Quick start

```sh
nix-shell          # or: direnv allow
./build.sh         # check layout -> main.tex -> zine_pages.pdf + sheet + guide
make preview       # PNG renders of the 8 pages, for a visual check
```

Print `zine_print_sheet.pdf` single-sided, cut the center slit (see
`fold_guide.pdf`), fold into 8 panels. Bottom row L-R: pages 6,7,8,1
(1 = cover). Top row L-R: pages 5,4,3,2, rotated 180°.

## Picking what picture goes where

Placement lives in **`layout.tsv`** (the single source of truth):

```
page <TAB> slot <TAB> photo <TAB> rotate
1    anchor  photos/cover-pick.jpg   0.0
2    pola1   photos/some-memory.jpg  11.5
```

- `slot`: `anchor` (full-bleed, one per page) or `pola1`…`pola7`
  (fixed polaroid grid, inner pages 2–7 only).
- 8 anchors + 42 polaroids = 50 photos, each exactly once.
- `rotate` is free for anchors too, but keep anchors at `0.0`
  (full-bleed stays aligned).

Commands (`./layout.sh …`):

| command    | what it does |
|------------|--------------|
| `sync`     | scan `photos/` → `pool.tsv` (the photo lock file). Run after adding/removing photos. Videos and non-jpg files are ignored (reported, never touched). |
| `init [--force]` | deterministic auto-spread of the pool → `layout.tsv` (the classic layout). Refuses to overwrite your edits without `--force`. |
| `check`    | validate `layout.tsv`: slots complete, no duplicates, files exist, photos known to `pool.tsv`. Runs automatically in `build.sh`. |
| `contact`  | build `contact.pdf` + `contact.html`: every pool photo as a thumbnail with its index, filename (**click to copy** in the HTML) and current slot in blue. The visual picking aid — browse, copy filenames, paste into `layout.tsv`. |
| `dupes`    | report byte-identical duplicate photos (read-only, deletes nothing). |

Typical session: `./layout.sh sync` → `./layout.sh contact` → open
`contact.html`, pick photos, edit `layout.tsv` → `./layout.sh check` →
`./build.sh` → `make preview` → look, adjust, repeat.

### Web picker (recommended)

```sh
./layout.sh picker [port]   # or: make picker [PORT=8077]
```

Opens a local page (default http://127.0.0.1:8077): pool on the left
(search, unused/in-zine filters, click-to-copy filenames), the 8 zine
pages on the right with every slot in place.

- **Click a photo, then a slot** to place it (replaces; the old photo
  becomes unused). **Drag & drop** works too, photo→slot or slot→slot
  to **swap**.
- **− / +** on a slot tilts it; anchors keep rotation 0 (full-bleed).
- Covers (p1, p8) take only anchors; inner pages take exactly 7 polaroids.
- **Save** validates everything (same rules as `check`) and writes
  `layout.tsv`, keeping the previous version as `layout.tsv.bak`.
  Photos on disk are never touched.
- After saving: `./build.sh` → `make preview` → look.

## Reproducibility

- `photos/` (469 MB, 417 jpgs) is **not in git** (see `.gitignore`).
  What *is* committed: `pool.tsv` (filename + dimensions lock file),
  `layout.tsv` (placement), and all generators/styles.
- `tex` generation is fully deterministic — no randomness:
  rotations are written out explicitly in `layout.tsv`.
- Proof: `layout.sh init` from the pool regenerates the shipped
  `layout.tsv`, and `gen_main.sh` from that regenerates `main.tex`
  byte-identically (verified with `diff`).
- Changing the photo set changes the pool: re-run `sync`, then `init`
  (or hand-edit `layout.tsv`), and `check` will tell you what moved.

## Files

| file | role |
|------|------|
| `layout.tsv` | **edit me**: photo placement (committed) |
| `pool.tsv` | photo lock file from `sync` (committed) |
| `layout.sh` | picker toolkit (`sync/init/check/contact/dupes/picker`) |
| `picker/` | local WebUI: photo board + slots, writes `layout.tsv` |
| `gen_main.awk` | `layout.tsv`+`pool.tsv` → `main.tex` (modes `init`/`tex`) |
| `gen_main.sh` | wrapper regenerating `main.tex` |
| `gen_parse.awk` | exiftool output → TSV rows |
| `zine.sty` | A7 page geometry, polaroid/anchor/cover-title macros, palette |
| `stickers.tex` | reusable hand-drawn sticker macros (generic + nostalgia) |
| `make_sheet.tex` | A4 landscape imposition (no fold lines in the print file) |
| `make_guide.tex` | fold lines + center slit, separate guide PDF |
| `build.sh` | full build: check → pages → sheet → guide → verify |
| `verify.sh` | structural verification (geometry, imposition, photo usage) |
| `shell.nix` | nix tools (xelatex, poppler, exiftool) |
| `photos/` | your photos (not in git, never modified by scripts) |

Generated (rebuilt anytime, not in git): `main.tex`, `zine_pages.pdf`,
`zine_print_sheet.pdf`, `fold_guide.pdf`, `contact.pdf`, `contact.html`,
`preview/`, `*.aux`, `*.log`.

## Design constraints (kept by the tooling)

- Palette only: paper `#FFF8E7`, red `#E63027`, cobalt `#2547D0`,
  yellow `#FFD21F`, green `#1FA35B`, ink `#151515`, plus white frames.
- Content ≥ 5 mm from sheet edges; faces off fold lines (±3 mm).
- Max 2 of the same sticker per page (layouts use at most 1).
- TikZ wobble via `decorations.pathmorphing` (`random steps`): straight
  segments only — decorated circles/arcs/short curves overflow PGF's
  `random steps` automaton on some rotations, so circles/ellipses and
  sub-10 mm curves are plain ink with offset fills instead (same look).
  All `dim*scalar` coordinates are written `scalar*dim` (pgfmath only
  supports the latter order); node geometry is precomputed into
  registers (two maths in one node overflow pgfmath).
