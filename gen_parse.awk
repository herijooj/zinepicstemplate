# gen_parse.awk -- parses exiftool default output into a TSV:
#   file \t width \t height \t orientation (all "1" when no tag)
# Reads: exiftool -Orientation -ImageWidth -ImageHeight [photos]
/^========/ {
  if (file != "") print file "\t" w "\t" h "\t" o
  file = substr($2, 1); w = ""; h = ""; o = "1"
  next
}
/^Orientation/ {
  o = substr($0, index($0, ":") + 2)
  gsub(/^ +| +$/, "", o)
  if (o == "" || o ~ /Unknown/ || o ~ /Horizontal \(normal\)/) o = "1"
  next
}
/^Image Width/  { w = $4; next }
/^Image Height/ { h = $4; next }
END { if (file != "") print file "\t" w "\t" h "\t" o }
