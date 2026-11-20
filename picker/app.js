/* zine picker: click a photo, then a slot (or drag & drop). Saves to layout.tsv. */
const S = { pool: [], byName: {}, layout: [], grid: {}, sel: null,
            filter: "all", q: "", dirty: false };

const $ = (s) => document.querySelector(s);
const enc = encodeURIComponent;
const key = (p, s) => p + "\t" + s;

async function load() {
  if (window.__STATE__) applyState(window.__STATE__);
  try {
    const r = await fetch("/api/state");
    applyState(await r.json());
  } catch (e) {
    if (!S.pool.length) setStatus("could not load state: " + e, "err");
  }
}

function applyState(st) {
  S.pool = st.pool;
  S.grid = st.grid;
  S.layout = st.layout;
  for (const p of S.pool) S.byName["photos/" + p.f] = p;
  renderAll();
  setStatus("loaded " + S.pool.length + " pool photos, " +
            S.layout.length + " placed. pick photos into slots, then save.");
}

function usedMap() {
  const m = {};
  for (const r of S.layout) m[r.photo] = "p" + r.page + "·" + r.slot;
  return m;
}

function renderAll() { renderPool(); renderPages(); coverage(); }

/* ---------- pool ---------- */
function renderPool() {
  const used = usedMap();
  const g = $("#grid");
  g.innerHTML = "";
  let shown = 0;
  const q = S.q.toLowerCase();
  for (const p of S.pool) {
    const full = "photos/" + p.f;
    const isUsed = full in used;
    if (S.filter === "used" && !isUsed) continue;
    if (S.filter === "unused" && isUsed) continue;
    if (q && !p.f.toLowerCase().includes(q)) continue;
    shown++;
    const d = document.createElement("div");
    d.className = "ph" + (S.sel === full ? " sel" : "") + (isUsed ? " used" : "");
    d.draggable = true;
    d.dataset.photo = full;
    d.innerHTML = '<img loading="lazy" src="/img/' + enc(p.f) + '" draggable="false">' +
      '<div class="n">' + p.f + '</div><div class="u">' + (used[full] || "") + "</div>";
    d.title = full;
    d.addEventListener("click", () => {
      S.sel = (S.sel === full) ? null : full;
      renderPool();
    });
    d.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/photo", full);
      e.dataTransfer.effectAllowed = "copy";
    });
    g.appendChild(d);
  }
  $("#poolcount").textContent = "(" + shown + "/" + S.pool.length + ")";
}

/* ---------- pages ---------- */
function slotRow(page, slot) {
  return S.layout.find((r) => r.page === page && r.slot === slot);
}

function renderPages() {
  const b = $("#board");
  b.innerHTML = "";
  for (let p = 1; p <= 8; p++) {
    const sec = document.createElement("div");
    sec.className = "page";
    const label = p === 1 ? 'page 1 <span class="cover">cover</span>'
                : p === 8 ? 'page 8 <span class="cover">back</span>'
                : "page " + p;
    sec.innerHTML = "<h3>" + label + "</h3>";
    const mini = document.createElement("div");
    mini.className = "mini";
    mini.dataset.page = p;
    if (p === 1 || p === 8) {
      // cover/back: two half-bleed photos, no anchor
      for (const s of ["half1", "half2"]) {
        const r = slotRow(p, s);
        const el = document.createElement("div");
        el.className = "half " + (s === "half1" ? "top" : "bot") + (r ? "" : " empty");
        el.dataset.page = p;
        el.dataset.slot = s;
        if (r) {
          const base = r.photo.replace(/^photos\//, "");
          el.innerHTML = '<img loading="lazy" src="/img/' + enc(base) + '" draggable="false">';
          el.draggable = true;
          el.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/slotsrc", p + "\t" + s);
            e.dataTransfer.effectAllowed = "move";
          });
        } else {
          el.textContent = s;
        }
        wireSlot(el, p, s);
        mini.appendChild(el);
      }
    } else {
      // anchor background (click / drop target too)
      const a = slotRow(p, "anchor");
      if (a) {
        const base = a.photo.replace(/^photos\//, "");
        const im = document.createElement("img");
        im.className = "anchor";
        im.loading = "lazy";
        im.src = "/img/" + enc(base);
        im.draggable = false;
        mini.appendChild(im);
      }
      mini.dataset.slot = "anchor";
      wireSlot(mini, p, "anchor");
    }
    // polaroid slots only exist on inner pages 2..7 (covers: anchor only)
    if (p >= 2 && p <= 7) for (const s of Object.keys(S.grid)) {
      const [x, y] = S.grid[s];
      const r = slotRow(p, s);
      const el = document.createElement("div");
      el.className = "slot" + (r ? "" : " empty");
      el.style.left = (x / 74.25 * 100) + "%";
      el.style.top = ((105 - (y + 35)) / 105 * 100) + "%";
      el.style.width = (28 / 74.25 * 100) + "%";
      el.style.height = (35 / 105 * 100) + "%";
      el.dataset.page = p;
      el.dataset.slot = s;
      if (r) {
        const base = r.photo.replace(/^photos\//, "");
        el.style.transform = "rotate(" + r.rotate + "deg)";
        el.innerHTML = '<img loading="lazy" src="/img/' + enc(base) + '" draggable="false">' +
          '<div class="rot"><button data-d="-1">−</button><span>' + (+r.rotate).toFixed(1) + '°</span><button data-d="1">+</button></div>' +
          '<button class="clr" title="clear">×</button>';
        el.querySelectorAll(".rot button").forEach((bt) =>
          bt.addEventListener("click", (e) => {
            e.stopPropagation();
            bumpRot(p, s, +bt.dataset.d);
          }));
        el.querySelector(".clr").addEventListener("click", (e) => {
          e.stopPropagation();
          clearSlot(p, s);
        });
        el.draggable = true;
        el.addEventListener("dragstart", (e) => {
          e.dataTransfer.setData("text/slotsrc", p + "\t" + s);
          e.dataTransfer.effectAllowed = "move";
        });
      } else {
        el.textContent = s;
      }
      wireSlot(el, p, s);
      mini.appendChild(el);
    }
    sec.appendChild(mini);
    // page 1/8: two half rows (fixed rotation 0); inner pages: anchor row
    if (p === 1 || p === 8) {
      for (const s of ["half1", "half2"]) {
        const hr = document.createElement("div");
        hr.className = "anchorslot";
        const row = slotRow(p, s);
        hr.innerHTML = "<span>" + s + ":</span>";
        if (row) {
          const b2 = row.photo.replace(/^photos\//, "");
          hr.innerHTML += '<img loading="lazy" src="/img/' + enc(b2) + '"><span class="an">' + b2 + "</span>";
        } else {
          hr.innerHTML += "<span>(empty — click a photo, then click here)</span>";
        }
        hr.dataset.page = p;
        hr.dataset.slot = s;
        wireSlot(hr, p, s);
        sec.appendChild(hr);
      }
    } else {
    // anchor editor row
    const a = slotRow(p, "anchor");
    const ar = document.createElement("div");
    ar.className = "anchorslot";
    const an = a ? a.photo : "(empty)";
    ar.innerHTML = "<span>anchor:</span>";
    if (a) {
      const base = a.photo.replace(/^photos\//, "");
      ar.innerHTML += '<img loading="lazy" src="/img/' + enc(base) + '"><span class="an">' + base + "</span>";
    } else {
      ar.innerHTML += "<span>(empty — click a photo, then click here)</span>";
    }
    const ri = document.createElement("input");
    ri.type = "number"; ri.step = "0.5"; ri.value = a ? a.rotate : 0;
    ri.title = "anchor rotation (deg)";
    ri.addEventListener("change", () => {
      const row = slotRow(p, "anchor");
      if (row) { row.rotate = +ri.value || 0; markDirty(); renderPages(); coverage(); }
    });
    ar.appendChild(ri);
    ar.dataset.page = p;
    ar.dataset.slot = "anchor";
    wireSlot(ar, p, "anchor");
    sec.appendChild(ar);
    }
    b.appendChild(sec);
  }
}

function wireSlot(el, page, slot) {
  el.addEventListener("click", () => {
    if (S.sel) assign(page, slot, S.sel);
  });
  el.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    el.classList.add("target");
  });
  el.addEventListener("dragleave", () => el.classList.remove("target"));
  el.addEventListener("drop", (e) => {
    e.preventDefault();
    el.classList.remove("target");
    const photo = e.dataTransfer.getData("text/photo");
    if (photo) { assign(page, slot, photo); return; }
    const src = e.dataTransfer.getData("text/slotsrc");
    if (src) {
      const [sp, ss] = src.split("\t");
      swapSlots(+sp, ss, page, slot);
    }
  });
}

function assign(page, slot, photo) {
  if (slot === "anchor" && (page < 2 || page > 7)) return;
  if ((slot === "half1" || slot === "half2") && page !== 1 && page !== 8) return;
  if (slot.charAt(0) === "p" && (page < 2 || page > 7)) return;
  const dup = S.layout.find((r) => r.photo === photo &&
    !(r.page === page && r.slot === slot));
  if (dup) {
    S.layout = S.layout.filter((r) => r !== dup);
  }
  const cur = slotRow(page, slot);
  if (cur) { cur.photo = photo; if (slot === "half1" || slot === "half2") cur.rotate = 0; }
  else S.layout.push({ page, slot, photo, rotate: 0 });
  S.sel = null;
  markDirty(); renderAll();
}

function swapSlots(p1, s1, p2, s2) {
  if (p1 === p2 && s1 === s2) return;
  const a = slotRow(p1, s1), b = slotRow(p2, s2);
  if (!a || !b) return;
  const t = a.photo; a.photo = b.photo; b.photo = t;
  if (s1 === "half1" || s1 === "half2") a.rotate = 0;
  if (s2 === "half1" || s2 === "half2") b.rotate = 0;
  markDirty(); renderAll();
}

function clearSlot(page, slot) {
  if (slot === "anchor" || slot === "half1" || slot === "half2") return;
  S.layout = S.layout.filter((r) => !(r.page === page && r.slot === slot));
  markDirty(); renderAll();
}

function bumpRot(page, slot, d) {
  const r = slotRow(page, slot);
  if (r) {
    r.rotate = Math.round(((+r.rotate || 0) + d) * 10) / 10;
    markDirty(); renderPages();
  }
}

/* ---------- save / status ---------- */
function markDirty() {
  S.dirty = true;
  $("#save").disabled = false;
  $("#save").classList.add("dirty");
}

function coverage() {
  const used = new Set(S.layout.map((r) => r.photo));
  $("#coverage").textContent =
    S.layout.length + " placed · " + (S.pool.length - used.size) + " pool photos unused";
}

function setStatus(msg, cls) {
  const el = $("#status");
  el.textContent = msg;
  el.className = cls || "";
}

async function save() {
  setStatus("saving…");
  try {
    const r = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: S.layout }),
    });
    const res = await r.json();
    if (res.ok) {
      S.dirty = false;
      $("#save").disabled = true;
      $("#save").classList.remove("dirty");
      setStatus("saved layout.tsv (backup: layout.tsv.bak). run ./build.sh to rebuild.", "ok");
    } else {
      setStatus("not saved:\n" + (res.errors || []).join("\n"), "err");
    }
  } catch (e) {
    setStatus("save failed: " + e, "err");
  }
}

/* ---------- wiring ---------- */
$("#save").addEventListener("click", save);
$("#search").addEventListener("input", (e) => { S.q = e.target.value; renderPool(); });
document.querySelectorAll(".filters button").forEach((b) =>
  b.addEventListener("click", () => {
    document.querySelectorAll(".filters button").forEach((x) => x.classList.remove("on"));
    b.classList.add("on");
    S.filter = b.dataset.f;
    renderPool();
  }));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { S.sel = null; renderPool(); }
});
window.addEventListener("beforeunload", (e) => {
  if (S.dirty) e.preventDefault();
});

load();
