// PDF export: rasterise each A7 page, then impose onto A4 landscape.
// pdf-lib is vendored locally (window.PDFLib), so this works offline.
import { PAGE_W, PAGE_H, IMPOSE } from './data.js';
import { renderPage } from './draw.js';

const MM = 72 / 25.4;                 // mm -> PDF points
const A4_W = 297 * MM, A4_H = 210 * MM;

function bytesFromDataURL(url) {
  const b64 = url.split(',')[1];
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function pageJpeg(pageNo, images, title, rotate180, scale) {
  const c = document.createElement('canvas');
  renderPage(c, pageNo, images, title, scale);
  if (!rotate180) return c.toDataURL('image/jpeg', 0.92);
  // pre-rotate so pdf-lib never has to guess the rotation origin
  const r = document.createElement('canvas');
  r.width = c.width; r.height = c.height;
  const x = r.getContext('2d');
  x.translate(r.width, r.height); x.rotate(Math.PI);
  x.drawImage(c, 0, 0);
  return r.toDataURL('image/jpeg', 0.92);
}

export async function downloadPrintSheet(images, title) {
  const { PDFDocument } = window.PDFLib;
  const pdf = await PDFDocument.create();
  const sheet = pdf.addPage([A4_W, A4_H]);
  const pw = PAGE_W * MM, ph = PAGE_H * MM;
  for (const { page, x, y, turn } of IMPOSE) {
    const jpg = pageJpeg(page, images, title, turn === 180, 11.811);
    const img = await pdf.embedJpg(bytesFromDataURL(jpg));
    sheet.drawImage(img, {
      x: x * MM - pw / 2, y: y * MM - ph / 2, width: pw, height: ph,
    });
  }
  saveBlob(await pdf.save(), 'zine_print_sheet.pdf');
}

export async function downloadPages(images, title) {
  const { PDFDocument } = window.PDFLib;
  const pdf = await PDFDocument.create();
  for (let p = 1; p <= 8; p++) {
    const jpg = pageJpeg(p, images, title, false, 11.811);
    const img = await pdf.embedJpg(bytesFromDataURL(jpg));
    const page = pdf.addPage([PAGE_W * MM, PAGE_H * MM]);
    page.drawImage(img, { x: 0, y: 0, width: PAGE_W * MM, height: PAGE_H * MM });
  }
  saveBlob(await pdf.save(), 'zine_pages.pdf');
}

export async function downloadFoldGuide() {
  const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([A4_W, A4_H]);
  const ink = rgb(0.082, 0.082, 0.082);
  const paper = rgb(1, 0.973, 0.906);
  page.drawRectangle({ x: 0, y: 0, width: A4_W, height: A4_H, color: paper });
  const faint = { color: ink, opacity: 0.5, thickness: 0.5 };
  page.drawLine({ start: { x: 0, y: 105 * MM }, end: { x: A4_W, y: 105 * MM }, ...faint });
  page.drawLine({ start: { x: 148.5 * MM, y: 0 }, end: { x: 148.5 * MM, y: A4_H }, ...faint });
  const font = await pdf.embedFont(StandardFonts.HelveticaOblique);
  page.drawText('fold line (horizontal midline)', { x: 210 * MM, y: 106 * MM, size: 8, font, color: ink, opacity: 0.8 });
  page.drawText('centre slit -- between columns 2 and 3', { x: 149.5 * MM, y: 22 * MM, size: 8, font, color: ink, opacity: 0.8 });
  [37.125, 111.375, 185.625, 259.875].forEach((x, i) => {
    page.drawText(`c${i + 1}`, { x: x * MM - 5, y: 202 * MM, size: 8, font, color: ink, opacity: 0.5 });
  });
  saveBlob(await pdf.save(), 'fold_guide.pdf');
}

function saveBlob(bytes, name) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 30000);
}
