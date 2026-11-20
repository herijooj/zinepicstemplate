# gen_main.awk -- generates main.tex: the 8-page A7 fold-out zine.
#
# Two modes (layout.tsv is the single source of truth for placement):
#   init:  awk -v mode=init -f gen_main.awk pool.tsv > layout.tsv
#          deterministic auto-spread (LCG seed 20260120) -> placement table.
#   tex:   awk -v mode=tex  -f gen_main.awk pool.tsv layout.tsv > main.tex
#          layout table -> main.tex (no randomness here at all).
#
# pool.tsv input: sorted photo table: file \t width \t height
#   (from `layout.sh sync`: exiftool scan of photos/, LC_ALL=C sorted).
# layout.tsv input: page \t slot \t photo \t rotate
#   slot = anchor (full-bleed, pages 1..8) or pola1..pola7 (inner pages 2..7).
#
# Geometry (polaroid frames 28 x 35 mm, photo 24 x 26):
#   pola1..pola7 lower-left coords, two columns (x = 5 / 41) x three rows
#   (y ~ 64/39/14, staggered 2 mm) + 1 centre bridge (23,48).
#   Row spacing 25 mm on a 35 mm tall frame = ~29% overlap; columns leave
#   an 8 mm gutter so only corners touch after +-12 deg rotation.
#   - Cover-fit: awk knows EXIF w/h, so it picks width= (portrait: fill
#     width, crop top/bottom) or height= (landscape: fill height, crop
#     sides). No distortion, no measuring in TeX.
#   - Stickers: 5 per page, varied per page, hand-placed (see emitStickers).

BEGIN {
  seed = 20260120
  n = 0
  if (mode == "") mode = "tex"
  # fixed polaroid grid: slot -> lower-left corner (mm)
  gx["pola1"] = 5;  gy["pola1"] = 64
  gx["pola2"] = 41; gy["pola2"] = 62
  gx["pola3"] = 5;  gy["pola3"] = 39
  gx["pola4"] = 41; gy["pola4"] = 37
  gx["pola5"] = 5;  gy["pola5"] = 14
  gx["pola6"] = 41; gy["pola6"] = 12
  gx["pola7"] = 23; gy["pola7"] = 48
}

# ---- first input file is always the pool
FNR == NR {
  photo[++n] = "photos/" $1; pw[n] = $2 + 0; ph[n] = $3 + 0
  wby[photo[n]] = pw[n]; hby[photo[n]] = ph[n]
  next
}

# ---- second input file (tex mode only) is the layout table
mode == "tex" && $1 ~ /^[0-9]+$/ {
  L++
  lpage[L] = $1 + 0; lslot[L] = $2; lphoto[L] = $3; lrot[L] = $4 + 0
}

function rnd() {
  seed = (seed * 1103515245 + 12345) % 2147483648
  return int(seed / 65536) / 32768.0
}

function coverfit_anchor(f,   r) {  # full-bleed on 74.25 x 105 panel
  r = wby[f] / hby[f]
  return (r > 0.7071) ? "height=105mm" : "width=74.25mm"
}

function coverfit_pola(f,   r) {  # photo rect 24 x 26 (~4:5)
  r = wby[f] / hby[f]
  return (r > 0.9231) ? "height=26mm" : "width=24mm"
}

# ---- stickers (clamped into each page's safe zone)
function emitSticker(kind, x, y, a, b, rot, page,   rx, ry, sx, sy, hiY) {
  if (kind == "washi" || kind == "washiR" || kind == "washiB" || kind == "washiG" || kind == "ticket") { rx = a/2; ry = b/2; sx = x - rx; sy = y - ry }
  else                                     { rx = a;   ry = a;   sx = x;     sy = y     }
  if (page >= 2 && page <= 5) hiY = 105 - ry - 5   # top-row pages: faces >= 3mm from midline
  else                        hiY = 102 - ry - 5   # other pages: faces >= 3mm from midline
  if (sx < rx + 5) sx = rx + 5
  if (sx > 74.25 - rx - 5) sx = 74.25 - rx - 5
  if (sy < ry + 5) sy = ry + 5
  if (sy > hiY) sy = hiY
  printf "  \\begin{scope}[shift={(%dmm,%dmm)}, rotate=%d]\n", int(sx), int(sy), int(rot)
  if (kind == "star")         printf "    \\zstar[%dmm]\n", int(rx)
  else if (kind == "heart")   printf "    \\zheart[%dmm]\n", int(rx)
  else if (kind == "flower")  printf "    \\zflower[%dmm]\n", int(rx)
  else if (kind == "sparkle") printf "    \\zsparkle[%dmm]\n", int(rx)
  else if (kind == "arrow")   printf "    \\zarrow[%dmm]\n", int(rx)
  else if (kind == "washi")   printf "    \\zwashi{%dmm}{%dmm}\n", int(a), int(b)
  else if (kind == "washiR")  printf "    \\zwashiC{zred}{%dmm}{%dmm}\n", int(a), int(b)
  else if (kind == "washiB")  printf "    \\zwashiC{zcobalt}{%dmm}{%dmm}\n", int(a), int(b)
  else if (kind == "washiG")  printf "    \\zwashiC{zgreen}{%dmm}{%dmm}\n", int(a), int(b)
  else if (kind == "ticket")  printf "    \\zticket{%dmm}{%dmm}\n", int(a), int(b)
  else if (kind == "camera")  printf "    \\zcamera[%dmm]\n", int(rx)
  else if (kind == "campolar") printf "    \\zcampolar[%dmm]\n", int(rx)
  else if (kind == "cassette") printf "    \\zcassette[%dmm]\n", int(rx)
  else if (kind == "films")   printf "    \\zfilms[%dmm]\n", int(rx)
  else if (kind == "moon")    printf "    \\zmoon[%dmm]\n", int(rx)
  else if (kind == "sun")     printf "    \\zsun[%dmm]\n", int(rx)
  else if (kind == "bolt")    printf "    \\zbolt[%dmm]\n", int(rx)
  else if (kind == "bow")     printf "    \\zbow[%dmm]\n", int(rx)
  else if (kind == "cherry")  printf "    \\zcherry[%dmm]\n", int(rx)
  else if (kind == "smiley")  printf "    \\zsmiley[%dmm]\n", int(rx)
  else if (kind == "scribble") printf "    \\zscribble[%dmm]\n", int(rx)
  printf "  \\end{scope}\n"
}

function emitStickers(page) {
  # NOTE: photo layout comes from layout.tsv; only stickers vary per page.
  # Each page gets 5 distinct stickers (max 1 of each kind per page),
  # mixed generic + nostalgic + washi colours, some on photo corners.
  if (page == 1) {  # cover: keep title zone (y~65-100) clear, decorate below
    emitSticker("star",    12, 18, 5, 0, 15, page)
    emitSticker("washi",   54,  9, 22, 6, -30, page)
    emitSticker("sparkle", 62, 30, 3, 0, 8, page)
    emitSticker("heart",    8, 32, 5, 0, -10, page)
    emitSticker("moon",    60, 46, 5, 0, -12, page)
  }
  else if (page == 2) {
    emitSticker("heart",   10, 96, 5, 0, 12, page)
    emitSticker("washiR",  48,  9, 20, 6, 25, page)
    emitSticker("cassette", 34, 32, 6, 0, -8, page)
    emitSticker("sparkle", 64, 96, 3, 0, 10, page)
    emitSticker("arrow",   30,  5, 4, 0, 5, page)
  }
  else if (page == 3) {
    emitSticker("flower",  10, 96, 6, 0, -12, page)
    emitSticker("washiB",  48,  9, 20, 6, -18, page)
    emitSticker("bolt",    36, 30, 6, 0, 8, page)
    emitSticker("films",   64, 94, 10, 0, 12, page)
    emitSticker("star",    30,  5, 5, 0, -6, page)
  }
  else if (page == 4) {
    emitSticker("smiley",  10, 96, 5, 0, 10, page)
    emitSticker("washiG",  48,  9, 20, 6, 15, page)
    emitSticker("moon",    36, 30, 5, 0, -10, page)
    emitSticker("camera",  64, 94, 4, 0, -14, page)
    emitSticker("scribble", 28,  6, 12, 0, 4, page)
  }
  else if (page == 5) {
    emitSticker("cherry",  10, 96, 5, 0, -10, page)
    emitSticker("washi",   48,  9, 20, 6, 20, page)
    emitSticker("sun",     36, 30, 5, 0, 6, page)
    emitSticker("ticket",  60, 94, 18, 7, 10, page)
    emitSticker("sparkle", 28,  5, 3, 0, -8, page)
  }
  else if (page == 6) {
    emitSticker("bow",     10, 93, 6, 0, 12, page)
    emitSticker("washiR",  48,  9, 20, 6, -22, page)
    emitSticker("star",    36, 30, 5, 0, -8, page)
    emitSticker("campolar", 64, 90, 6, 0, 10, page)
    emitSticker("arrow",   28,  5, 4, 0, -5, page)
  }
  else if (page == 7) {
    emitSticker("flower",  10, 93, 6, 0, 14, page)
    emitSticker("washiB",  48,  9, 20, 6, 18, page)
    emitSticker("bolt",    36, 30, 6, 0, -6, page)
    emitSticker("heart",   64, 90, 5, 0, -10, page)
    emitSticker("cassette", 28,  5, 6, 0, 6, page)
  }
  if (page == 8) {  # back cover: stickers live on the EDGES, photo breathes
    emitSticker("smiley",   8, 94, 5, 0, -8, page)
    emitSticker("washiG",  27, 97, 20, 6, 5, page)
    emitSticker("sun",      6, 50, 5, 0, 8, page)
    emitSticker("ticket",  48,  8, 18, 7, -8, page)
    emitSticker("cherry",  66, 90, 5, 0, -12, page)
  }
}

END {
  if (mode == "init") {
    # ---- anchors: 8 spread picks (pages 1..8), no rotation
    # page 8 (back cover) is pinned to the big group portrait, like the front
    for (k = 0; k < 8; k++) {
      if (k == 7) {
        for (ai = 1; ai <= n; ai++) if (photo[ai] == "photos/PICT0271.jpg") break
        if (ai > n) ai = n
      } else ai = int(k * (n - 1) / 7) + 1
      anchor[k] = photo[ai]
    }
    # ---- polaroids: 42 spread picks from non-anchor photos
    nA = 0
    for (i = 1; i <= n; i++) {
      ok = 1
      for (k = 0; k < 8; k++)
        if (photo[i] == anchor[k]) ok = 0
      if (ok) nonanchor[++nA] = photo[i]
    }
    for (j = 0; j < 42; j++) {
      pi = int(j * nA / 42) + 1
      pol[j] = nonanchor[pi]
      polpage[j] = 2 + (j % 6)            # 7 polaroids per inner page
      i = j % 7
      if (i == 0) slot[j] = "pola1"
      else if (i == 1) slot[j] = "pola2"
      else if (i == 2) slot[j] = "pola3"
      else if (i == 3) slot[j] = "pola4"
      else if (i == 4) slot[j] = "pola5"
      else if (i == 5) slot[j] = "pola6"
      else             slot[j] = "pola7"
      pangle[j] = rnd() * 24 - 12         # random rotation within +-12 degrees
    }
    # ---- emit layout.tsv (explicit placement; rotate written out)
    print "# layout.tsv -- zine photo placement. Columns: page <TAB> slot <TAB> photo <TAB> rotate(deg)."
    print "# Edit freely (swap photos, tweak rotates), then run ./build.sh."
    print "# Slots: anchor (full-bleed, one per page) or pola1..pola7 (inner pages 2..7 only)."
    print "# Validate with ./layout.sh check. Regenerate with ./layout.sh init --force."
    for (k = 0; k < 8; k++)
      printf "%d\tanchor\t%s\t0.0\n", k + 1, anchor[k]
    for (j = 0; j < 42; j++)
      printf "%d\t%s\t%s\t%.1f\n", polpage[j], slot[j], pol[j], pangle[j]
    exit
  }

  # ---- tex mode: placement comes verbatim from layout.tsv
  npol = 0
  for (r = 1; r <= L; r++) {
    if (lslot[r] == "anchor") {
      anchor[lpage[r]-1] = lphoto[r]
      anchorRot[lpage[r]-1] = lrot[r]
      anchorOpt[lpage[r]-1] = coverfit_anchor(lphoto[r])
    } else {
      npol++
      pol[npol] = lphoto[r]
      polpage[npol] = lpage[r]
      cx[npol] = gx[lslot[r]]; cy[npol] = gy[lslot[r]]
      pangle[npol] = lrot[r]
      polOpt[npol] = coverfit_pola(lphoto[r])
    }
  }

  # ---- emit main.tex
  print "%% generated by gen_main.awk -- deterministic (seed 20260120)"
  print "%% A7 fold-out zine: 8 pages, reading order 1..8 (1 = cover, 8 = back cover)."
  print ""
  print "\\documentclass[12pt]{article}"
  print "\\usepackage{zine}"
  print "\\input stickers"
  print ""
  print "\\begin{document}"
  print "\\pagestyle{empty}"
  print ""
  print "%% ---------- page 1: cover ----------"
  print "\\clearpage"
  print "\\begin{tikzpicture}[remember picture, overlay, shift={(current page.south west)}]"
  print "  \\zinedoodle"
  printf "  \\zineanchor{%s}{%.1f}{%s}\n", anchor[0], anchorRot[0], anchorOpt[0]
  print "  \\zinecover{Root's}{e Amigos}"
  emitStickers(1)
  print "\\end{tikzpicture}"
  print ""
  for (p = 2; p <= 7; p++) {
    print sprintf("%% ---------- page %d: inner ----------", p)
    print "\\clearpage"
    print "\\begin{tikzpicture}[remember picture, overlay, shift={(current page.south west)}]"
    print "  \\zinedoodle"
    printf "  \\zineanchor{%s}{%.1f}{%s}\n", anchor[p-1], anchorRot[p-1], anchorOpt[p-1]
    for (j = 1; j <= npol; j++)
      if (polpage[j] == p)
        printf "  \\zinepolaroid{%s}{%d}{%d}{%.1f}{%s}\n", pol[j], cx[j], cy[j], pangle[j], polOpt[j]
    emitStickers(p)
    print "\\end{tikzpicture}"
    print ""
  }
  print "%% ---------- page 8: back cover ----------"
  print "\\clearpage"
  print "\\begin{tikzpicture}[remember picture, overlay, shift={(current page.south west)}]"
  print "  \\zinedoodle"
  printf "  \\zineanchor{%s}{%.1f}{%s}\n", anchor[7], anchorRot[7], anchorOpt[7]
  emitStickers(8)
  print "\\end{tikzpicture}"
  print ""
  print "\\end{document}"
}
