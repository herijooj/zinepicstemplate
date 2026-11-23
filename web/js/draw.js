// Canvas port of zine.sty + stickers.tex. Every coordinate is millimetres
// in a y-up system with the origin at the page's bottom-left corner.
import { PAGE_W, PAGE_H, COLOR, SLOTS, SLOT_ORDER, STICKERS } from './data.js';

const D = Math.PI / 180;
const COL = {
  zpaper: COLOR.paper, zred: COLOR.red, zcobalt: COLOR.cobalt,
  zyellow: COLOR.yellow, zgreen: COLOR.green, zink: COLOR.ink,
  zwhite: COLOR.white,
};

// deterministic jitter so a redraw never reshuffles the hand-drawn lines
let _seed = 1;
function noise(seed) {
  let x = Math.sin(seed * 127.1 + _seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
}
function setNoiseSeed(s) { _seed = s; }

function poly(ctx, pts, fill, stroke, w = 0.4, close = true) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  if (close) ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.stroke(); }
}
function circle(ctx, x, y, r, fill, stroke, w = 0.4) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = w; ctx.stroke(); }
}
function rect(ctx, x0, y0, x1, y1, fill, stroke, w = 0.4) {
  poly(ctx, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], fill, stroke, w);
}
function roundRect(ctx, x0, y0, x1, y1, r, fill, stroke, w = 0.4) {
  ctx.beginPath(); ctx.roundRect(x0, y0, x1 - x0, y1 - y0, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = w; ctx.stroke(); }
}
function line(ctx, x1, y1, x2, y2, color, w = 0.35, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha;
  poly(ctx, [[x1, y1], [x2, y2]], null, color, w, false);
  ctx.restore();
}
// approximation of TikZ's `random steps` decoration: a jittered polyline
function wobble(ctx, x1, y1, x2, y2, color, w = 0.5, amp = 0.35, seg = 2.1, alpha = 1, tag = 1) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const n = Math.max(2, Math.ceil(L / seg));
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color;
  ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1);
  for (let i = 1; i < n; i++) {
    const t = i / n, o = (noise(tag + i) - 0.5) * 2 * amp;
    ctx.lineTo(x1 + dx * t + nx * o, y1 + dy * t + ny * o);
  }
  ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
}
function curve(ctx, pts, color, w = 0.5, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color;
  ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(...pts[0]);
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].length === 4) ctx.bezierCurveTo(...pts[i]);
    else ctx.lineTo(...pts[i]);
  }
  ctx.stroke(); ctx.restore();
}
function starPoints(x, y, r, n = 5, inner = 0.42, rot = -Math.PI / 2) {
  const p = [];
  for (let i = 0; i < n * 2; i++) {
    const a = rot + i * Math.PI / n, rr = i % 2 ? r * inner : r;
    p.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  return p;
}
function text(ctx, str, x, y, sizeMM, color, align = 'center', alpha = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(1, -1); ctx.globalAlpha = alpha;
  ctx.font = `${sizeMM}px "Permanent Marker", "Comic Sans MS", cursive`;
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, 0, 0); ctx.restore();
}
function place(ctx, x, y, rot, fn) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot * D); fn(); ctx.restore();
}

// ---------------------------------------------------------------- doodles
export function drawDoodles(ctx) {
  const dots = [[4,6],[36,8],[66,4],[10,30],[42,32],[68,28],[6,56],[38,58],[60,74],[24,4],[58,8]];
  dots.forEach(([x, y]) => circle(ctx, x, y, 0.75, COLOR.yellow, null, 0, 0.35));
  [[14,14], [52,16], [20,64], [62,66]].forEach(([x, y], i) => {
    wobble(ctx, x - 3, y, x + 3, y, COLOR.cobalt, 0.22, 0.7, 2.8, 0.45, 100 + i);
  });
  [[18,2],[56,12],[30,52],[8,72]].forEach(([x, y], i) => {
    poly(ctx, starPoints(x, y, 2.6, 5, 0.45), COLOR.red, null, 0, true);
    ctx.save(); ctx.globalAlpha = 0.4;
    poly(ctx, starPoints(x, y, 2.6, 5, 0.45), COLOR.red, null, 0, true);
    ctx.restore();
  });
}

// ---------------------------------------------------------------- stickers
const S = {}; // sticker drawing functions, local coords, sizes in mm

S.star = (ctx, a) => {
  poly(ctx, starPoints(0.5, -0.6, a * 1.05, 5, 0.45, -Math.PI/2), COLOR.yellow);
  wobble(ctx, 0, -a, a * 0.95, -a * 0.31, COLOR.ink, 0.53, 0.35, 2.1);
  wobble(ctx, a * 0.95, -a * 0.31, a * 0.59, a * 0.81, COLOR.ink, 0.53, 0.35, 2.1, 2);
  wobble(ctx, a * 0.59, a * 0.81, -a * 0.59, a * 0.81, COLOR.ink, 0.53, 0.35, 2.1, 3);
  wobble(ctx, -a * 0.59, a * 0.81, -a * 0.95, -a * 0.31, COLOR.ink, 0.53, 0.35, 2.1, 4);
  wobble(ctx, -a * 0.95, -a * 0.31, 0, -a, COLOR.ink, 0.53, 0.35, 2.1, 5);
  circle(ctx, 0, 0, a * 0.12, COLOR.yellow);
};

S.heart = (ctx, a) => {
  const o = 0.5;
  ctx.save(); ctx.globalAlpha = 0.9;
  circle(ctx, -0.3*a + o, 0.22*a - o, 0.24*a, COLOR.red);
  circle(ctx, 0.3*a + o, 0.22*a - o, 0.24*a, COLOR.red);
  poly(ctx, [[o, 0.35*a-o], [-0.42*a+o, 0.12*a-o], [0.42*a+o, 0.12*a-o]], COLOR.red);
  ctx.restore();
  circle(ctx, -0.3*a, 0.22*a, 0.24*a, null, COLOR.ink, 0.49);
  circle(ctx, 0.3*a, 0.22*a, 0.24*a, null, COLOR.ink, 0.49);
  wobble(ctx, 0, 0.35*a, -0.42*a, 0.12*a, COLOR.ink, 0.49, 0.3);
  wobble(ctx, -0.42*a, 0.12*a, 0.42*a, 0.12*a, COLOR.ink, 0.49, 0.3, 2.1, 2);
  wobble(ctx, 0.42*a, 0.12*a, 0, 0.35*a, COLOR.ink, 0.49, 0.3, 2.1, 3);
};

S.flower = (ctx, a) => {
  for (let i = 0; i < 5; i++) {
    const t = i * 72 * D, px = 0.65 * Math.cos(t), py = 0.65 * Math.sin(t);
    ctx.save(); ctx.globalAlpha = 0.9;
    circle(ctx, px*a + 0.5, py*a - 0.6, 0.24*a, COLOR.cobalt); ctx.restore();
    circle(ctx, px*a, py*a, 0.22*a, null, COLOR.ink, 0.42);
  }
  circle(ctx, 0.5, -0.5, 0.2*a, COLOR.yellow);
  circle(ctx, 0, 0, 0.18*a, null, COLOR.ink, 0.46);
};

S.sparkle = (ctx, a) => {
  poly(ctx, [[0.5,-0.4],[0.9,0.2],[1.6,0.3],[0.9,0.8],[0.5,1.8],[0.1,0.8],[-0.8,0.4],[0.1,-0.1]], COLOR.yellow);
  const p = [[0,a],[0.35*a,0.35*a],[a,0],[0.35*a,-0.35*a],[0,-a],[-0.35*a,-0.35*a],[-a,0],[-0.35*a,0.35*a]];
  p.forEach((q, i) => wobble(ctx, ...q, ...p[(i+1)%p.length], COLOR.ink, 0.49, 0.3, 2.1, 1, i+1));
};

S.arrow = (ctx, a) => {
  curve(ctx, [[0.5,-0.5],[0.4*a,1.2,0.7*a,1,a,0.5]], COLOR.red, 0.78);
  curve(ctx, [[0,0],[0.4*a,1,0.7*a,0.8,a,0.4]], COLOR.ink, 0.49);
  // arrowheads
  poly(ctx, [[a,0.5],[a-1.2,0.7],[a-0.6,-0.2]], COLOR.red);
  poly(ctx, [[a,0.4],[a-1.2,0.6],[a-0.6,-0.3]], COLOR.ink);
};

function washi(ctx, w, h, color) {
  ctx.save();
  ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(w,0.4); ctx.lineTo(w,h); ctx.lineTo(0,h-0.4); ctx.closePath(); ctx.clip();
  ctx.globalAlpha = 0.55; rect(ctx, 0,0,w,h, COL[color] || COLOR.yellow);
  ctx.globalAlpha = 0.35; rect(ctx, 0,h*0.3,w,h*0.25, COLOR.white);
  ctx.globalAlpha = 0.25;
  for (let x = 2; x <= 40; x += 4) rect(ctx, x,0,Math.min(x+1.2,w),h, COLOR.white);
  ctx.restore();
  wobble(ctx, 0.3,h-0.3,w-0.3,h+0.2, COLOR.ink, 0.25, 0.3, 2.8, 1);
  wobble(ctx, 0.3,0.3,w-0.3,-0.2, COLOR.ink, 0.25, 0.3, 2.8, 1, 2);
  wobble(ctx, 0,0,1,h*0.5,COLOR.ink,0.25,0.3,2.8,1,3);
  wobble(ctx, 1,h*0.5,0,h,COLOR.ink,0.25,0.3,2.8,1,4);
  wobble(ctx, w,0,w-1,h*0.5,COLOR.ink,0.25,0.3,2.8,1,5);
  wobble(ctx, w-1,h*0.5,w,h,COLOR.ink,0.25,0.3,2.8,1,6);
}
S.washi = (ctx, w, h) => washi(ctx, w, h, 'zyellow');
S.washiC = (ctx, w, h, col) => washi(ctx, w, h, col);

S.scribble = (ctx, a) => {
  curve(ctx, [[0.5,-0.7],[0.25*a,0,0.6*a,0.6,a+0.4,-0.2]], COLOR.red, 0.85);
  curve(ctx, [[0,0],[0.25*a,0.6,0.6*a,1.2,a,0]], COLOR.ink, 0.56);
};

S.moon = (ctx, a) => {
  circle(ctx, 0.5,-0.5,0.5*a, COLOR.yellow);
  circle(ctx, -0.4,0.6,0.42*a, COLOR.paper);
  ctx.save(); ctx.beginPath(); ctx.arc(-0.47*a,-0.17*a,0.5*a,200*D,340*D); ctx.strokeStyle=COLOR.ink; ctx.lineWidth=0.49; ctx.stroke(); ctx.restore();
  ctx.save(); ctx.globalAlpha=0.9; ctx.beginPath(); ctx.arc(-0.47*a+0.4,-0.17*a-0.4,0.5*a,200*D,340*D); ctx.strokeStyle=COLOR.red; ctx.lineWidth=0.35; ctx.stroke(); ctx.restore();
};

S.sun = (ctx, a) => {
  circle(ctx, 0.5,-0.5,0.35*a, COLOR.yellow);
  circle(ctx, 0,0,0.33*a, null, COLOR.ink, 0.49);
  for (let i = 0; i < 8; i++) {
    const t = i * 45 * D;
    wobble(ctx, 0.48*a*Math.cos(t),0.48*a*Math.sin(t),0.72*a*Math.cos(t),0.72*a*Math.sin(t), COLOR.ink, 0.39, 0.3, 2.8, 1, i+1);
  }
};

S.bolt = (ctx, a) => {
  poly(ctx, [[0.18*a,-0.18*a],[0.08*a,0.28*a],[0.18*a,0.28*a],[0.05*a,0.63*a],[0.28*a,0.13*a],[0.15*a,0.13*a]], COLOR.yellow);
  const p = [[-0.3*a,0.5*a],[0.1*a,0.45*a],[-0.15*a,-0.05*a],[0.3*a,-0.1*a],[-0.05*a,-0.55*a],[-0.2*a,0.05*a],[0.05*a,0.1*a]];
  p.forEach((q,i)=>wobble(ctx,...q,...p[(i+1)%p.length],COLOR.ink,0.49,0.3,2.1,1,i+1));
};

S.bow = (ctx, a) => {
  ctx.save(); ctx.globalAlpha=0.9;
  poly(ctx, [[0.5,-0.5],[-0.5*a,0.2],[-0.35*a,0.3*a]], COLOR.red);
  poly(ctx, [[0.5,-0.5],[0.5*a,0.2],[0.35*a,0.3*a]], COLOR.red);
  ctx.restore();
  wobble(ctx,0,0,-0.5*a,0,COLOR.ink,0.42); wobble(ctx,-0.5*a,0,-0.35*a,0.32*a,COLOR.ink,0.42);
  wobble(ctx,-0.35*a,0.32*a,0,0,COLOR.ink,0.42);
  wobble(ctx,0,0,0.5*a,0,COLOR.ink,0.42); wobble(ctx,0.5*a,0,0.35*a,0.32*a,COLOR.ink,0.42);
  wobble(ctx,0.35*a,0.32*a,0,0,COLOR.ink,0.42);
  circle(ctx,0.4,-0.4,0.1*a,COLOR.cobalt); circle(ctx,0,0,0.1*a,null,COLOR.ink,0.42);
};

S.cherry = (ctx, a) => {
  curve(ctx, [[-0.2*a,-0.1*a],[0,0.5*a,0.2*a,0.4*a,0.3*a,0.5*a]], COLOR.green, 0.49);
  circle(ctx,-0.28*a,-0.28*a,0.24*a,COLOR.red);
  circle(ctx,0.24*a,-0.34*a,0.24*a,COLOR.red);
  circle(ctx,-0.2*a,-0.1*a,0.22*a,null,COLOR.ink,0.42);
  circle(ctx,0.3*a,-0.2*a,0.22*a,null,COLOR.ink,0.42);
  circle(ctx,-0.28*a,-0.2*a,0.05*a,COLOR.white);
};

S.smiley = (ctx, a) => {
  circle(ctx,0.5,-0.5,0.45*a,COLOR.yellow);
  circle(ctx,0,0,0.45*a,null,COLOR.ink,0.49);
  circle(ctx,-0.15*a,0.1*a,0.05*a,COLOR.ink);
  circle(ctx,0.15*a,0.1*a,0.05*a,COLOR.ink);
  curve(ctx, [[-0.2*a,-0.12*a],[0,-0.3*a,0.1*a,-0.25*a,0.2*a,-0.12*a]], COLOR.ink, 0.39);
};

S.camera = (ctx, a) => {
  ctx.save(); ctx.globalAlpha=0.9; rect(ctx,-0.5*a+0.5,-0.5,0.5*a+0.5,a-0.5,COLOR.red); ctx.restore();
  roundRect(ctx,-0.5*a,0,0.5*a,a,0.3,COLOR.white,COLOR.ink,0.39);
  rect(ctx,-0.38*a,0.62*a,-0.14*a,0.86*a,COLOR.yellow);
  wobble(ctx,-0.38*a,0.62*a,-0.14*a,0.62*a,COLOR.ink,0.28);
  circle(ctx,0,0.45*a,0.08*a+0.3,COLOR.white,COLOR.ink,0.32);
  circle(ctx,0,0.45*a,0.05*a,COLOR.cobalt);
};

S.cassette = (ctx, a) => {
  ctx.save(); ctx.globalAlpha=0.85;
  rect(ctx,-0.5*a+0.5,0.15*a-0.5,0.5*a+0.5,0.8*a-0.5,COLOR.cobalt); ctx.restore();
  roundRect(ctx,-0.5*a,0.15*a,0.5*a,0.8*a,0.3,COLOR.white,COLOR.ink,0.39);
  ctx.save(); ctx.globalAlpha=0.8; rect(ctx,-0.4*a,0.58*a,0.4*a,0.72*a,COLOR.yellow); ctx.restore();
  [-1,1].forEach(s=>circle(ctx,0.28*s*a,0.42*a,0.06*a+0.25,COLOR.white,COLOR.ink,0.32));
  wobble(ctx,-0.5*a,0.85*a,0.5*a,0.9*a,COLOR.ink,0.32);
};

S.films = (ctx, a) => {
  ctx.save(); ctx.globalAlpha=0.85;
  rect(ctx,-a/2+0.5,0.2*a-0.5,a/2+0.5,0.7*a-0.5,COLOR.ink); ctx.restore();
  roundRect(ctx,-a/2,0.2*a,a/2,0.7*a,0.2,COLOR.white,COLOR.ink,0.39);
  for(let i=0;i<4;i++){
    const x=a*(-0.18+0.12*i)+0.4;
    circle(ctx,x,0.42*a-0.4,0.39,COLOR.cobalt);
    wobble(ctx,x-0.49,0.38*a,x+0.49,0.38*a,COLOR.ink,0.21);
    wobble(ctx,x-0.49,0.52*a,x+0.49,0.52*a,COLOR.ink,0.21);
  }
};

S.ticket = (ctx, w, h) => {
  ctx.save(); ctx.globalAlpha=0.8; rect(ctx,0.5,-0.5,w+0.5,h-0.5,COLOR.red); ctx.restore();
  ctx.save(); ctx.globalAlpha=0.75; rect(ctx,0,0,w,h,COLOR.yellow); ctx.restore();
  wobble(ctx,0,0,w,0,COLOR.ink,0.35); wobble(ctx,w,0,w,h,COLOR.ink,0.35);
  wobble(ctx,w,h,0,h,COLOR.ink,0.35); wobble(ctx,0,h,0,0,COLOR.ink,0.35);
  ctx.save(); ctx.setLineDash([1.2,1.2]); line(ctx,0.7*w,0,0.7*w,h,COLOR.ink,0.28); ctx.restore();
  circle(ctx,0.14*w,0.4*h,0.56,COLOR.white,COLOR.ink,0.25);
  circle(ctx,0.85*w,0.55*h,0.56,COLOR.white,COLOR.ink,0.25);
};

S.campolar = (ctx, a) => {
  ctx.save(); ctx.globalAlpha=0.85;
  rect(ctx,-0.6*a+0.5,-0.5,0.6*a+0.5,a-0.5,COLOR.cobalt); ctx.restore();
  roundRect(ctx,-0.6*a,0,0.6*a,a,0.4,COLOR.white,COLOR.ink,0.39);
  circle(ctx,-0.42*a,0.72*a,0.07*a,COLOR.red,COLOR.ink,0.28);
  circle(ctx,0,0.42*a,0.1*a+0.25,COLOR.white,COLOR.ink,0.32);
  circle(ctx,0,0.42*a,0.05*a,COLOR.cobalt);
};

export function drawSticker(ctx, s) {
  const fn = S[s.t];
  if (!fn) return;
  if (s.t === 'washi' || s.t === 'washiC' || s.t === 'ticket') {
    place(ctx, s.x, s.y, s.rot, () => fn(ctx, s.w, s.h, s.col));
  } else {
    place(ctx, s.x, s.y, s.rot, () => fn(ctx, s.a));
  }
}

// ---------------------------------------------------------------- polaroid
export function drawPolaroid(ctx, slot, image) {
  const [x, y, rot] = SLOTS[slot];
  ctx.save();
  ctx.translate(x + 14, y + 17.5);
  ctx.rotate(rot * D);
  // drop shadow
  roundRect(ctx, -13, -18.5, 15, 16.5, 0.8, 'rgba(0,0,0,0.25)');
  // white frame
  roundRect(ctx, -14, -17.5, 14, 17.5, 0.8, COLOR.white, COLOR.ink, 0.21);
  // photo area: local (2,7)-(26,33) -> relative to frame centre
  ctx.save();
  ctx.beginPath(); ctx.rect(-12, -10.5, 24, 26); ctx.clip();
  if (image && image.img) {
    const ratio = (image.img.naturalWidth || image.img.width) /
                  (image.img.naturalHeight || image.img.height);
    let w, h;
    if (ratio > 24 / 26) { h = 26; w = 26 * ratio; }
    else { w = 24; h = 24 / ratio; }
    ctx.save();
    ctx.translate(0, 2.5);          // photo centre is 2.5 mm above frame centre
    ctx.scale(1, -1);               // image pixels are y-down
    ctx.drawImage(image.img, -w / 2, -h / 2, w, h);
    ctx.restore();
  } else {
    rect(ctx, -12, -10.5, 12, 15.5, COLOR.paper);
    text(ctx, '?', 0, 2.5, 9, COLOR.red);
  }
  ctx.restore();
  ctx.restore();
}

// ---------------------------------------------------------------- cover
export function drawTitle(ctx, line1, line2) {
  ctx.save(); ctx.globalAlpha = 0.55;
  roundRect(ctx, 6.125, 36, 68.125, 62, 1, COLOR.yellow);
  ctx.restore();
  text(ctx, line1, 37.125, 54, 9.85, COLOR.ink);
  text(ctx, line2, 37.125, 44, 9.85, COLOR.ink);
  wobble(ctx, 7.125, 38, 67.125, 38, COLOR.ink, 0.49, 0.3, 2.1, 1);
  wobble(ctx, 6.125, 36.8, 66.125, 36.8, COLOR.red, 0.35, 0.78, 2.8, 1, 2);
}

// ---------------------------------------------------------------- page
// images: array of 42 {img, naturalWidth, naturalHeight} or null, in slot order
export function renderPage(canvas, pageNo, images, title, pxPerMM = 11.811) {
  const W = Math.round(PAGE_W * pxPerMM), H = Math.round(PAGE_H * pxPerMM);
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(pxPerMM, 0, 0, -pxPerMM, 0, H);
  setNoiseSeed(pageNo * 17 + 3);
  ctx.fillStyle = COLOR.paper; ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  drawDoodles(ctx);
  if (pageNo === 1) {
    drawTitle(ctx, title[0], title[1]);
  } else if (pageNo >= 2 && pageNo <= 7) {
    SLOT_ORDER.forEach((slot, i) => drawPolaroid(ctx, slot, images[(pageNo - 2) * 7 + i]));
  }
  (STICKERS[pageNo] || []).forEach(s => drawSticker(ctx, s));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return canvas;
}
