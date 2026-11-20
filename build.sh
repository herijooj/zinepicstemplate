#!/usr/bin/env bash
# build.sh -- build the A7 fold-out zine:
#   zine_pages.pdf        8 A7 pages in reading order (main.tex)
#   zine_print_sheet.pdf  A4 landscape imposition
#   fold_guide.pdf        fold lines + the centre slit
# plus a structural verification of the result.
set -euo pipefail
cd "$(dirname "$0")"

# Use the nix-shell toolchain when the tools are missing (project shell.nix).
if ! command -v xelatex >/dev/null 2>&1; then
  exec nix-shell --run "./build.sh"
fi

LATEX="xelatex -interaction=nonstopmode -halt-on-error"

echo "== zine: generating main.tex"
./gen_main.sh

echo "== zine: pages -> zine_pages.pdf"
rm -f main.aux main.log
$LATEX main.tex >/dev/null
$LATEX main.tex >/dev/null
mv -f main.pdf zine_pages.pdf

echo "== zine: imposition -> zine_print_sheet.pdf"
$LATEX make_sheet.tex >/dev/null
mv -f make_sheet.pdf zine_print_sheet.pdf

echo "== zine: fold guide -> fold_guide.pdf"
$LATEX make_guide.tex >/dev/null
mv -f make_guide.pdf fold_guide.pdf

echo "== zine: verification"
./verify.sh
