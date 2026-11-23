import { renderPage } from './draw.js';
import { downloadPrintSheet, downloadPages, downloadFoldGuide } from './pdf.js';

const $ = (id) => document.getElementById(id);
const state = { photos: [], title: [$('title1').value, $('title2').value], canvases: [] };
const TOTAL = 42;

function buildCanvases() {
  const grid = $('previewGrid');
  grid.innerHTML = '';
  state.canvases = [];
  for (let p = 1; p <= 8; p++) {
    const fig = document.createElement('figure');
    const c = document.createElement('canvas');
    const cap = document.createElement('figcaption');
    cap.textContent = `page ${p}`;
    fig.append(c, cap); grid.append(fig);
    state.canvases.push(c);
  }
}

function slotImages() {
  if (!state.photos.length) return Array.from({ length: TOTAL }, () => null);
  return Array.from({ length: TOTAL }, (_, i) => state.photos[i % state.photos.length]);
}

function redraw() {
  const imgs = slotImages();
  for (let p = 1; p <= 8; p++) renderPage(state.canvases[p - 1], p, imgs, state.title, 4.2);
}

function setStatus(msg) { $('status').textContent = msg; }

async function loadFiles(files) {
  const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
  for (const f of list) {
    const url = URL.createObjectURL(f);
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve; img.onerror = reject; img.src = url;
    });
    // downscale large photos: 42 slots, keep memory and PDF size sane
    const max = 1600;
    let src = img;
    if (Math.max(img.naturalWidth, img.naturalHeight) > max) {
      const s = max / Math.max(img.naturalWidth, img.naturalHeight);
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * s);
      c.height = Math.round(img.naturalHeight * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      src = c;

    }
    state.photos.push({ img: src, name: f.name });
  }
  $('counter').textContent = `${state.photos.length} photo${state.photos.length === 1 ? '' : 's'} loaded — filling ${TOTAL} polaroid slots.`;
  redraw();
}

async function withBusy(fn, label) {
  const buttons = document.querySelectorAll('button');
  buttons.forEach((b) => (b.disabled = true));
  setStatus(`${label}… this can take a few seconds.`);
  try {
    await fn();
    setStatus('Done. Check your downloads folder.');
  } catch (e) {
    console.error(e);
    setStatus(`Something went wrong: ${e.message}`);
  } finally {
    buttons.forEach((b) => (b.disabled = false));
  }
}

async function init() {
  buildCanvases();
  try { await document.fonts.load('10px "Permanent Marker"'); }
  catch (e) { console.warn('title font unavailable, using fallback', e); }
  redraw();

  $('title1').addEventListener('input', (e) => { state.title[0] = e.target.value; redraw(); });
  $('title2').addEventListener('input', (e) => { state.title[1] = e.target.value; redraw(); });
  $('files').addEventListener('change', (e) => loadFiles(e.target.files));

  $('print').addEventListener('click', () =>
    withBusy(() => downloadPrintSheet(slotImages(), state.title), 'Building print sheet'));
  $('pages').addEventListener('click', () =>
    withBusy(() => downloadPages(slotImages(), state.title), 'Building pages PDF'));
  $('guide').addEventListener('click', () =>
    withBusy(downloadFoldGuide, 'Building fold guide'));
}

init();
