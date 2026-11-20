# gen_main.awk -- generates main.tex: the 8-page A7 fold-out zine.
#
# Input: sorted photo table TSV: file \t width \t height \t orientation
#   (all photos in the pool are stored upright: orientation 1 or "Unknown (0)")
#
# Selection (deterministic, LCG seed 20260120):
#   - 8 anchors, spread through the pool: anchor[0] = page 1 (cover),
#     anchor[1..6] = pages 2..7, anchor[7] = page 8 (back cover).
#   - 42 polaroid candidates, spread through the pool minus the anchors:
#     7 per inner page (pages 2..7) -- "6-8 polaroids per inner page".
#   - Polaroid frames: 28 x 35 mm (photo 24 x 26, ~4:5-ish), lower-left
#     coords, two columns (x = 5 / 41) x three rows (y ~ 64/39/14,
#     staggered 2 mm) + 1 centre bridge (23,48). Row spacing 25 mm on a
#     35 mm tall frame = ~29% overlap; columns leave an 8 mm gutter so
#     only corners touch after +-12 deg rotation.
#   - Cover-fit: awk knows EXIF w/h, so it picks width= (portrait: fill
#     width, crop top/bottom) or height= (landscape: fill height, crop
#     sides). No distortion, no measuring in TeX.
#   - Stickers: 3-6 per page, varied, seeded.

BEGIN {
  seed = 20260120
  n = 0
}
{ photo[++n] = "photos/" $1; pw[n] = $2 + 0; ph[n] = $3 + 0; }

function rnd() {
  seed = (seed * 1103515245 + 12345) % 2147483648
  return int(seed / 65536) / 32768.0
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
  # NOTE: photo layout above is untouched; only stickers vary per page.
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
  # ---- anchors: 8 spread picks (pages 1..8), no rotation (full-bleed stays aligned)
  # page 8 (back cover) is pinned to the big group portrait, like the front
  for (k = 0; k < 8; k++) {
    if (k == 7) {
      for (ai = 1; ai <= n; ai++) if (photo[ai] == "photos/PICT0271.jpg") break
      if (ai > n) ai = n
    } else ai = int(k * (n - 1) / 7) + 1
    anchor[k] = photo[ai]
    anchorOpt[k] = (pw[ai] / ph[ai] > 0.7071) ? "height=105mm" : "width=74.25mm"
    anchorRot[k] = 0
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
    # map back to pool index for w/h: find photo[] == nonanchor pick
    pol[j] = nonanchor[pi]
    for (ii = 1; ii <= n; ii++) if (photo[ii] == pol[j]) { pwi = pw[ii]; phi = ph[ii] }
    polOpt[j] = (pwi / phi > 0.9231) ? "height=26mm" : "width=24mm"
    polpage[j] = 2 + (j % 6)            # 7 polaroids per inner page
    i = j % 7
    if (i == 0) { cx[j] = 5;  cy[j] = 64 }
    else if (i == 1) { cx[j] = 41; cy[j] = 62 }
    else if (i == 2) { cx[j] = 5;  cy[j] = 39 }
    else if (i == 3) { cx[j] = 41; cy[j] = 37 }
    else if (i == 4) { cx[j] = 5;  cy[j] = 14 }
    else if (i == 5) { cx[j] = 41; cy[j] = 12 }
    else             { cx[j] = 23; cy[j] = 48 }
    pangle[j] = rnd() * 24 - 12         # random rotation within +-12 degrees
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
    for (j = 0; j < 42; j++)
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
