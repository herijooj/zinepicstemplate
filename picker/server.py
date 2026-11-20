#!/usr/bin/env python3
"""zine picker -- local WebUI for choosing what picture goes where.

Serves photo thumbnails + a drag-and-drop board of the 8 zine pages.
Saves back to layout.tsv (with a layout.tsv.bak backup).

Stdlib only. Run: ./layout.sh picker [port]   (default port 8077)
"""
import http.server
import json
import os
import posixpath
import shutil
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHOTOS = os.path.join(ROOT, "photos")
POOL = os.path.join(ROOT, "pool.tsv")
LAYOUT = os.path.join(ROOT, "layout.tsv")
BACKUP = os.path.join(ROOT, "layout.tsv.bak")
HERE = os.path.dirname(os.path.abspath(__file__))

# fixed polaroid grid (mm, lower-left corner) -- must match gen_main.awk
GRID = {
    "pola1": (5, 64), "pola2": (41, 62), "pola3": (5, 39),
    "pola4": (41, 37), "pola5": (5, 14), "pola6": (41, 12),
    "pola7": (23, 48),
}
SLOTS = ["anchor", "pola1", "pola2", "pola3", "pola4", "pola5", "pola6", "pola7"]

HEADER = [
    "# layout.tsv -- zine photo placement. Columns: page <TAB> slot <TAB> photo <TAB> rotate(deg).",
    "# Edit freely (swap photos, tweak rotates), then run ./build.sh.",
    "# Slots: anchor (full-bleed, one per page) or pola1..pola7 (inner pages 2..7 only).",
    "# Validate with ./layout.sh check. Regenerate with ./layout.sh init --force.",
]


def load_pool():
    pool = []
    with open(POOL, encoding="utf-8") as fh:
        for line in fh:
            line = line.rstrip("\n")
            if not line:
                continue
            parts = line.split("\t")
            pool.append({"f": parts[0], "w": int(parts[1]), "h": int(parts[2])})
    return pool


def load_layout():
    rows = []
    if not os.path.exists(LAYOUT):
        return rows
    with open(LAYOUT, encoding="utf-8") as fh:
        for line in fh:
            line = line.rstrip("\n")
            if not line or line.startswith("#"):
                continue
            p = line.split("\t")
            if len(p) < 4:
                continue
            rows.append({"page": int(p[0]), "slot": p[1],
                         "photo": p[2], "rotate": float(p[3])})
    return rows


def validate(rows, pool_names):
    """Mirror of `layout.sh check`. Returns list of error strings."""
    errs = []
    seen_slot, seen_photo = {}, {}
    nanchor = npola = 0
    for i, r in enumerate(rows):
        where = "row %d" % (i + 1)
        if r["page"] not in range(1, 9):
            errs.append("%s: bad page %r" % (where, r["page"]))
        if r["slot"] not in SLOTS:
            errs.append("%s: bad slot %r" % (where, r["slot"]))
        if (r["page"], r["slot"]) in seen_slot:
            errs.append("page %d: slot %s twice" % (r["page"], r["slot"]))
        seen_slot[(r["page"], r["slot"])] = True
        if r["slot"] == "anchor":
            nanchor += 1
        else:
            npola += 1
            if r["page"] < 2 or r["page"] > 7:
                errs.append("%s: polaroids only on pages 2..7" % where)
        if r["photo"] in seen_photo:
            errs.append("duplicate photo: %s" % r["photo"])
        seen_photo[r["photo"]] = True
        base = r["photo"][7:] if r["photo"].startswith("photos/") else r["photo"]
        if base not in pool_names:
            errs.append("not in pool.tsv: %s" % r["photo"])
        elif not os.path.isfile(os.path.join(PHOTOS, base)):
            errs.append("missing file: %s" % r["photo"])
        try:
            float(r["rotate"])
        except (TypeError, ValueError):
            errs.append("%s: bad rotate %r" % (where, r["rotate"]))
    if nanchor != 8:
        errs.append("want 8 anchors, have %d" % nanchor)
    for p in range(2, 8):
        n = sum(1 for r in rows if r["page"] == p and r["slot"] != "anchor")
        if n != 7:
            errs.append("page %d: want 7 polaroids, have %d" % (p, n))
    return errs


def write_layout(rows):
    def key(r):
        slot_order = SLOTS.index(r["slot"]) if r["slot"] in SLOTS else 99
        return (r["page"], slot_order)
    if os.path.exists(LAYOUT):
        shutil.copyfile(LAYOUT, BACKUP)
    with open(LAYOUT, "w", encoding="utf-8") as fh:
        fh.write("\n".join(HEADER) + "\n")
        for r in sorted(rows, key=key):
            fh.write("%d\t%s\t%s\t%.1f\n"
                     % (r["page"], r["slot"], r["photo"], float(r["rotate"])))


class Handler(http.server.BaseHTTPRequestHandler):
    server_version = "zine-picker/1"

    def log_message(self, fmt, *a):
        sys.stderr.write("%s %s\n" % (self.command, self.path))
        sys.stderr.flush()

    def _json(self, obj, code=200):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        url = urllib.parse.urlparse(self.path)
        if url.path == "/api/state":
            pool = load_pool()
            self._json({"pool": pool, "layout": load_layout(), "grid": GRID,
                        "pages": 8})
            return
        if url.path.startswith("/img/"):
            name = posixpath.basename(urllib.parse.unquote(url.path[5:]))
            if "/" in url.path[5:] or name not in {p["f"] for p in load_pool()}:
                self.send_error(404)
                return
            path = os.path.join(PHOTOS, name)
            if not os.path.isfile(path):
                self.send_error(404)
                return
            ctype = "image/jpeg" if name.lower().endswith(
                (".jpg", ".jpeg")) else "image/png"
            try:
                with open(path, "rb") as fh:
                    body = fh.read()
            except OSError:
                self.send_error(404)
                return
            self.send_response(200)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "max-age=86400")
            self.end_headers()
            self.wfile.write(body)
            return
        rel = url.path.lstrip("/") or "index.html"
        if "/" in rel or rel.startswith("."):
            self.send_error(404)
            return
        path = os.path.join(HERE, rel)
        if not os.path.isfile(path):
            self.send_error(404)
            return
        ctype = {"html": "text/html", "js": "text/javascript",
                 "css": "text/css"}.get(rel.rsplit(".", 1)[-1],
                                        "application/octet-stream")
        with open(path, "rb") as fh:
            body = fh.read()
        if rel == "index.html":
            # inline the initial state: instant first paint, no fetch race.
            # app.js still re-fetches /api/state for freshness after load.
            st = json.dumps({"pool": load_pool(),
                              "layout": load_layout(), "grid": GRID},
                             ensure_ascii=True).replace("<", "\\u003c")
            body = body.replace(b"<!--STATE-->",
                                ("<script>window.__STATE__=" + st +
                                 ";</script>").encode("utf-8"))
        self.send_response(200)
        self.send_header("Content-Type", ctype + "; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        url = urllib.parse.urlparse(self.path)
        if url.path != "/api/save":
            self.send_error(404)
            return
        try:
            n = int(self.headers.get("Content-Length", 0))
            rows = json.loads(self.rfile.read(n).decode("utf-8"))["rows"]
        except (ValueError, KeyError):
            self._json({"ok": False, "errors": ["bad request"]}, 400)
            return
        pool_names = {p["f"] for p in load_pool()}
        errs = validate(rows, pool_names)
        if errs:
            self._json({"ok": False, "errors": errs}, 400)
            return
        write_layout(rows)
        self._json({"ok": True, "backup": "layout.tsv.bak",
                    "hint": "saved -- run ./build.sh (runs layout check + rebuild)"})


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8077
    if not os.path.isfile(POOL):
        sys.exit("missing pool.tsv -- run ./layout.sh sync first")
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print("zine picker on http://127.0.0.1:%d  (Ctrl-C to stop)" % port)
    print("edits layout.tsv (backup: layout.tsv.bak). photos/ are never modified.")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
