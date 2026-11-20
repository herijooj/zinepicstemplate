#!/usr/bin/env bash
# layout.sh -- pick what picture goes where in the A7 fold-out zine.
#
#   ./layout.sh sync      scan photos/ -> pool.tsv (photo lock file, committed)
#   ./layout.sh init      auto-place pool photos -> layout.tsv (refuses to
#                         overwrite; use --force). Reproduces the classic spread.
#   ./layout.sh check     validate layout.tsv (slots, files, duplicates)
#   ./layout.sh contact   build contact.pdf + contact.html (visual picking aid:
#                         thumbnails, filenames, click-to-copy, current slots)
#   ./layout.sh dupes     report byte-identical duplicate photos (read-only)
#
# Workflow: sync (once per photo drop) -> contact (browse, pick filenames)
#   -> edit layout.tsv (page <TAB> slot <TAB> photo <TAB> rotate)
#   -> check -> ./build.sh -> make preview (look) -> print.
set -euo pipefail
cd "$(dirname "$0")"

POOL=pool.tsv
LAYOUT=layout.tsv

need_nix() {
  if ! command -v xelatex >/dev/null 2>&1; then
    exec nix-shell --run "./layout.sh $*"
  fi
}

cmd_sync() {  # scan photos/ -> pool.tsv (sorted lock file)
  need_nix
  echo "== layout: scanning photos/ -> $POOL"
  rm -rf .pool_raw.txt
  # shellcheck disable=SC2012
  if ! ls photos/*.jpg photos/*.jpeg 2>/dev/null >/dev/null; then
    echo "no jpg/jpeg photos in photos/"; exit 1
  fi
  nix-shell -p exiftool --run \
    'cd photos && exiftool -Orientation -ImageWidth -ImageHeight *.jpg *.jpeg 2>/dev/null' \
    > .pool_raw.txt || true
  awk -f gen_parse.awk .pool_raw.txt | LC_ALL=C sort > "$POOL"
  rm -f .pool_raw.txt
  echo "   pool: $(wc -l < "$POOL") photos"
}

cmd_init() {  # deterministic auto-spread pool -> layout.tsv
  if [ -f "$LAYOUT" ] && [ "${1:-}" != "--force" ]; then
    echo "layout.tsv exists -- edit it, or re-run with --force"; exit 1
  fi
  [ -f "$POOL" ] || { echo "missing $POOL -- run ./layout.sh sync first"; exit 1; }
  awk -v mode=init -f gen_main.awk "$POOL" > "$LAYOUT"
  echo "== layout: wrote $LAYOUT ($(grep -cv '^#' "$LAYOUT") placements)"
}

cmd_check() {  # validate layout.tsv against pool.tsv + disk
  local fail=0
  [ -f "$POOL" ] || { echo "missing $POOL -- run ./layout.sh sync"; exit 1; }
  [ -f "$LAYOUT" ] || { echo "missing $LAYOUT -- run ./layout.sh init"; exit 1; }
  echo "== layout: checking $LAYOUT"
  awk -v pool="$POOL" '
  BEGIN {
    while ((getline line < pool) > 0) {
      split(line, f, "\t"); havedim[f[1]] = f[2] "x" f[3]
    }
    nanchor = 0; npola = 0
  }
  /^#/ || NF == 0 { next }
  NF < 4 || $1 !~ /^[1-8]$/                          { bad("line " NR ": bad page: " $0); next }
  $2 != "anchor" && $2 !~ /^pola[1-7]$/              { bad("line " NR ": bad slot: " $0); next }
  ($2 == "anchor") && (seen[$1,"anchor"]++)          { bad("page " $1 ": two anchors") }
  ($2 != "anchor") && (seen[$1,$2]++)               { bad("page " $1 ": slot " $2 " twice") }
  ($2 != "anchor") && ($1 < 2 || $1 > 7)            { bad("line " NR ": polaroids only on pages 2..7") }
  ($2 == "anchor")                                  { nanchor++; anchor[$1] = $3 }
  ($2 != "anchor")                                  { npola++; slotof[$1]++ }
  $4 !~ /^-?[0-9]+(\.[0-9]+)?$/                     { bad("line " NR ": bad rotate: " $0) }
  {
    key = $3; sub(/^photos\//, "", key)  # pool.tsv stores bare filenames
    if ((key in seenphoto)) bad("duplicate photo: " $3)
    seenphoto[key] = $1 ":" $2
    cmd = "[ -f \"" $3 "\" ]"; 
    if (system(cmd) != 0) bad("missing file: " $3)
    if (!(key in havedim) && !warned[key]++) warn("not in pool.tsv (run sync): " $3)
  }
  END {
    if (nanchor != 8) bad("want 8 anchors, have " nanchor)
    for (p = 2; p <= 7; p++)
      if ((slotof[p] + 0) != 7) bad("page " p ": want 7 polaroids, have " (slotof[p] + 0))
    if (fails == 0) print "   ok: 8 anchors + 42 polaroids, no duplicates, all files present"
    exit (fails > 0)
  }
  function bad(m) { print "   FAIL: " m; fails++ }
  function warn(m) { print "   note: " m }
  ' "$LAYOUT" || fail=1
  # pool coverage report (informational: most pool photos stay unused)
  used=$(grep -v '^#' "$LAYOUT" | awk '{print $3}' | sort -u | wc -l)
  total=$(wc -l < "$POOL")
  echo "   pool coverage: $used of $total pool photos placed ($((total - used)) unused)"
  [ "$fail" = 0 ] || { echo "   layout check FAILED"; exit 1; }
}

cmd_contact() {  # visual picking aid: contact.pdf + contact.html
  need_nix
  [ -f "$POOL" ] || { echo "missing $POOL -- run ./layout.sh sync first"; exit 1; }
  echo "== layout: contact sheet -> contact.pdf + contact.html"
  # usage map: photo -> "p3:pola2, ..." (from layout.tsv if present)
  : > .usage.tsv
  if [ -f "$LAYOUT" ]; then
    awk -F'\t' '/^#/ || NF < 4 { next } { u[$3] = (u[$3]==""?"":u[$3] ",") "p" $1 ":" $2 }
      END { for (f in u) printf "%s\t%s\n", f, u[f] }' "$LAYOUT" \
      | LC_ALL=C sort > .usage.tsv
  fi
  # --- contact.tex: 15 thumbs per page (3 cols x 5 rows), wrapped names
  {
    echo '\documentclass[10pt]{article}'
    echo '\usepackage[a4paper, landscape, margin=8mm]{geometry}'
    echo '\usepackage{graphicx}'
    echo '\usepackage{xcolor}'
    echo '\begin{document}\pagestyle{empty}\tiny\ttfamily\sloppy'
    echo '\noindent\small pool: photos/ ('"$(wc -l < "$POOL")"'), used slots in blue. Pick filenames into layout.tsv.\\[2mm]'
    awk -F'\t' '
    NR == FNR { use[$1] = $2; next }
    {
      f = "photos/" $1
      disp = $1; gsub(/_/, "\\_", disp)
      gsub(/&/, "\\&", disp)
      gsub(/%/, "\\%", disp)
      u = (f in use) ? sprintf(" \\textcolor{blue}{%s}", use[f]) : ""
      printf "\\fbox{\\parbox[c][40mm][c]{58mm}{\\centering\\includegraphics[width=54mm,height=26mm,keepaspectratio]{%s}\\\\ (%d) %s%s}}\n", f, ++c, disp, u
      if (c % 3 == 0) printf "\\\\[2mm]\n"
    }' .usage.tsv "$POOL"
    echo '\end{document}'
  } > contact.tex
  xelatex -interaction=nonstopmode -halt-on-error contact.tex >/dev/null
  rm -f contact.aux contact.log contact.out
  # --- contact.html: lazy thumbs, click-to-copy filename, current slot
  {
    echo '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">'
    echo '<meta name="viewport" content="width=device-width, initial-scale=1">'
    echo '<title>zine picker -- click a filename to copy it</title>'
    echo '<style>body{font-family:monospace;background:#FFF8E7;color:#151515;margin:16px}'
    echo '.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}'
    echo '.c{background:#fff;border:2px solid #151515;border-radius:6px;padding:6px;text-align:center}'
    echo '.c img{width:100%;height:130px;object-fit:cover;display:block;background:#eee}'
    echo '.f{font-size:11px;word-break:break-all;cursor:pointer;background:#FFD21F;margin-top:4px;padding:2px}'
    echo '.u{font-size:11px;color:#1FA35B;min-height:14px}</style></head><body>'
    echo '<h2>zine picker ('"$(wc -l < "$POOL")"' photos) -- click a filename to copy, paste into layout.tsv</h2>'
    echo '<div class="g">'
    awk -F'\t' '
    NR == FNR { use[$1] = $2; next }
    { f = "photos/" $1
      u = (f in use) ? use[f] : ""
      printf "<div class=c><img loading=lazy src=\"%s\"><div class=f onclick=\"navigator.clipboard.writeText(this.innerText);this.style.background=&quot;#1FA35B&quot;\">(%d) %s</div><div class=u>%s</div></div>\n", f, ++c, f, u
    }' .usage.tsv "$POOL"
    echo '</div><script>function x(){};</script></body></html>'
  } > contact.html
  rm -f .usage.tsv contact.tex
  echo "   wrote contact.pdf + contact.html"
}

cmd_picker() {  # local WebUI: drag photos onto page slots, writes layout.tsv
  port="${1:-8077}"
  if command -v python3 >/dev/null 2>&1; then
    exec python3 picker/server.py "$port"
  else
    exec nix-shell --run "python3 picker/server.py $port"
  fi
}
cmd_dupes() {  # read-only report of byte-identical photos
  echo "== layout: scanning photos/ for exact duplicates (md5, read-only)"
  (cd photos && md5sum -- *.jpg *.jpeg 2>/dev/null) | LC_ALL=C sort \
    | awk '{ if ($1 == prev) { print "   dupe: " prevf " == " $2; n++ } prev = $1; prevf = $2 } END { print "   " (n+0) " duplicate pairs (nothing deleted)" }'
}

case "${1:-}" in
  sync)    shift; cmd_sync "$@" ;;
  init)    shift; cmd_init "$@" ;;
  check)   shift; cmd_check "$@" ;;
  contact) shift; cmd_contact "$@" ;;
  dupes)   shift; cmd_dupes "$@" ;;
  picker)  shift; cmd_picker "$@" ;;
  *) echo "usage: ./layout.sh {sync|init [--force]|check|contact|dupes|picker [port]}"; exit 1 ;;
esac
