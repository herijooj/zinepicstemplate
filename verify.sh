#!/usr/bin/env bash
# verify.sh -- structural checks of the built zine.
# (This model cannot view images; the checks are geometric and structural:
#  page order, page sizes, imposition placement, photo usage, duplicates.)
set -euo pipefail
cd "$(dirname "$0")"

pdfinfo() { nix-shell --run "pdfinfo $1 2>/dev/null"; }

echo "-- pdfinfo zine_pages.pdf (want 8 pages, A7: 74.25 x 105 mm)"
pdfinfo zine_pages.pdf | grep -E '^(Pages|Page size)'
echo "-- pdfinfo zine_print_sheet.pdf (want 1 page, A4 landscape)"
pdfinfo zine_print_sheet.pdf | grep -E '^(Pages|Page size)'
echo "-- pdfinfo fold_guide.pdf (want 1 page, A4 landscape)"
pdfinfo fold_guide.pdf | grep -E '^(Pages|Page size)'

npanel=$(grep -cE 'node at \([0-9.]+mm, [0-9.]+mm\)[^;]*page=[0-9]+' make_sheet.tex || true)
echo "-- print sheet panels ($npanel want 8)"
bad=0
while read -r x y p; do
  [ -n "$x" ] || continue
  if grep -E "node at \(${x}mm, ${y}mm\)[^;]*page=${p}" make_sheet.tex | grep -q 'angle=180'; then rot=ROT; else rot=-; fi
  case "$y:$p" in
    157.5:5|157.5:4|157.5:3|157.5:2) want=ROT;;
    *) want=-;;
  esac
  if [ "$rot" != "$want" ]; then echo "   ✗ ($x,$y) page $p: rotation $rot, want $want"; bad=1; fi
done < <(grep -oE 'node at \([0-9.]+mm, [0-9.]+mm\)[^;]*page=[0-9]+' make_sheet.tex | sed -nE 's/^.*node at \(([0-9.]+)mm, ([0-9.]+)mm\).*page=([0-9]+).*$/\1 \2 \3/p')
[ "$bad" = 0 ] && echo "   ok: 8 panels at imposed positions; top row (pages 5,4,3,2) rotated 180"
echo "   print file draw commands (want 0): $(grep -cE '\\draw' make_sheet.tex)"
echo "   guides drawn in make_guide.tex (want >0): $(grep -cE '\\draw' make_guide.tex)"

echo "-- photos used (8 anchors + 42 polaroids = 50; each exactly once)"
echo "   zineanchor calls (want 8): $(grep -cE 'zineanchor[{]photos/' main.tex)"
echo "   zinepolaroid calls (want 42): $(grep -cE 'zinepolaroid[{]photos/' main.tex)"
echo "   distinct photos used (want 50): $(grep -oE 'photos/[^}]+' main.tex | sort -u | wc -l)"
echo "   duplicate placements (want 0): $(grep -oE 'photos/[^}]+' main.tex | sort | uniq -d | wc -l)"
echo "   missing files (want 0): $(grep -oE 'photos/[^}]+' main.tex | sort -u | while read -r f; do [ -f "$f" ] || echo "$f"; done | wc -l)"

echo "-- polaroids per inner page (want 6-8):"
awk '/zinepolaroid/ && index($0,"photos/") { if (pg >= 2 && pg <= 7) cnt[pg]++ }
     /page [0-9]+/ { pg=$0; sub(/.*page /,"",pg); sub(/:.*/,"",pg) }
     END { for (p=2;p<=7;p++) printf "   page %d: %d\n", p, cnt[p]+0 }' main.tex

echo "-- page 1 (cover) contains the title 'Root' (want 1 occurrence): $(nix-shell --run 'pdftotext -f 1 -l 1 zine_pages.pdf - 2>/dev/null' 2>/dev/null | grep -v 'xelatex + tikz ready' | grep -c Root)"

echo "-- rasterize the imposition (pdftoppm -png -r 72 -> /tmp/opencode/sheet_raster)"
mkdir -p /tmp/opencode/sheet_raster
rm -f /tmp/opencode/sheet_raster/*.png
nix-shell --run 'pdftoppm -png -r 72 zine_print_sheet.pdf /tmp/opencode/sheet_raster/sheet'
ls -la /tmp/opencode/sheet_raster/ | head -4

echo "-- log warnings/errors (want none):"
for f in main.log make_sheet.log make_guide.log; do
  if [ -f "$f" ]; then echo "   $f: $(grep -icE '^! |error|undefined control' "$f" || true)"; fi
done
echo "-- done"
