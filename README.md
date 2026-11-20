# a photo zine

A small LaTeX template for a zine of friends: one photo per page, a name, a
few lines about the moment. Everything is drawn to feel slightly hand-made —
taped-in prints at a crooked angle, wobbly pencil rules, handwriting, a page
number in a circle.

The design is deliberately plain. It is meant to be edited.

## Build

```sh
direnv allow      # or: nix-shell
make              # main.pdf
make preview      # main.pdf -> preview/page-01.png ... to look at it
make booklet      # booklet.pdf, imposed 2-up on A4, ready to fold
```

Only `xelatex` is needed (the `shell.nix` provides it). Compiling twice is
required because the index uses page references; `make` already does that.

## Put your photos in `photos/`

The frame is portrait, aspect 1 : 1.28. Photos are scaled to *cover* the frame
and cropped, so keep the face near the middle. Anything the printer can read
works: jpg, png, heic-converted, whatever.

If a file is missing the page still compiles and shows a grey box with the
filename, so you can build the whole zine and fill in photos later.

## Add a page

```latex
\moment[date=august, label=m:ana]
  {photos/ana.jpg}
  {Ana}
  {We missed the last bus and walked home along the river.}
```

- `date=` a little rubber stamp in the corner (omit it and nothing is drawn)
- `angle=` degrees of tilt for the print, default `-1.2`
- `width=` how wide the print is, as a fraction of the text width, default `0.75`
- `label=` so the index can point at it with `\pageref{m:ana}`

One `\moment` is one page; it starts its own page, so no `\newpage` needed.

Keep captions to two or three lines. If a page spills onto a second page, the
photo was too big for the caption: lower `width` (e.g. `0.68`).

## Page count

The zine is A5, made by folding A4 sheets in half, so the page count must be a
multiple of four: 12 pages here (cover + note + 8 moments + index + back
cover). Add or remove moments in pairs of four to keep it that way.

## Printing

`make booklet` arranges the pages so the fold works out. Print `booklet.pdf`
double-sided, **flip on the short edge**, then fold the stack in half and
staple twice along the fold. If your printer has a "booklet" mode you can skip
`booklet.pdf` and print `main.pdf` with that instead.

## What lives where

| file | what it does |
| --- | --- |
| `main.tex` | the content: cover, note, moments, index, back cover |
| `zine.sty` | the look: page size, fonts, tape, wobbly lines, `\moment` |
| `booklet.tex` | imposition for printing |
| `fonts/` | Kalam and Patrick Hand (SIL Open Font License) |
| `shell.nix`, `.envrc` | the toolchain |

Useful pieces if you want to build a page by hand instead of with `\moment`:
`\tapedphoto[angle]{file}{width}`, `\handline[length][thickness]`,
`\zinestamp{text}`, `\zinename{name}`, `\zinestar[size]`, `\zineentry{name}{page}`.

## Things worth trying next

- two photos on a page, or a full-bleed page with no frame at all
- a halftone/dithered version of every photo, so it looks photocopied
- coloured paper for the cover sheet only
- a real scribble instead of `\zinestar` (a scanned pen drawing, as a pdf/png)
