#!/usr/bin/env bash
# gen_main.sh -- regenerate main.tex from pool.tsv + layout.tsv.
# (No randomness here: placement lives in layout.tsv. See ./layout.sh.)
set -euo pipefail
cd "$(dirname "$0")"

[ -f pool.tsv ]   || { echo "gen_main: missing pool.tsv -- run ./layout.sh sync"; exit 1; }
[ -f layout.tsv ] || { echo "gen_main: missing layout.tsv -- run ./layout.sh init"; exit 1; }

awk -v mode=tex -f gen_main.awk pool.tsv layout.tsv > main.tex
echo "gen_main: main.tex written ($(grep -c '^\\clearpage' main.tex) pages)"
