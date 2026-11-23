// Fixed template data, ported from zine.sty / gen_main.awk / stickers.tex.
// Coordinates are millimetres, origin at the bottom-left of each A7 page.

export const PAGE_W = 74.25;
export const PAGE_H = 105;

export const COLOR = {
  paper: '#FFF8E7', red: '#E63027', cobalt: '#2547D0',
  yellow: '#FFD21F', green: '#1FA35B', ink: '#151515', white: '#FFFFFF',
};

// polaroid slot: lower-left corner (x, y) of the 28 x 35 frame, tilt in degrees
export const SLOTS = {
  pola1: [42, 41, -30.0], pola2: [2, 39, 1.8], pola3: [2, 2, -27.8],
  pola4: [42, 2, -30.0], pola5: [2, 68, 15.2], pola6: [24, 21, -30.0],
  pola7: [30, 68, 25.6],
};
export const SLOT_ORDER = ['pola1', 'pola2', 'pola3', 'pola4', 'pola5', 'pola6', 'pola7'];

// Sticker placements extracted from the generated main.tex (post-clamp).
// Shape stickers (t with `a`) are centred on (x, y).
// washi / ticket are drawn from (x, y) as their lower-left corner, size w x h.
export const STICKERS = {
  1: [
    { t: 'star', x: 12, y: 82, rot: 15, a: 5 },
    { t: 'washi', x: 42, y: 85, rot: -25, w: 20, h: 6 },
    { t: 'sparkle', x: 62, y: 74, rot: 8, a: 3 },
    { t: 'heart', x: 10, y: 16, rot: -10, a: 5 },
    { t: 'moon', x: 58, y: 24, rot: 12, a: 5 },
  ],
  2: [
    { t: 'heart', x: 25, y: 74, rot: 12, a: 5 },
    { t: 'washiC', col: 'zred', x: 30, y: 8, rot: 25, w: 20, h: 6 },
    { t: 'cassette', x: 17, y: 42, rot: -8, a: 6 },
    { t: 'sparkle', x: 64, y: 96, rot: 10, a: 3 },
    { t: 'arrow', x: 9, y: 9, rot: 5, a: 4 },
  ],
  3: [
    { t: 'flower', x: 35, y: 67, rot: -12, a: 6 },
    { t: 'washiC', col: 'zcobalt', x: 30, y: 8, rot: -18, w: 20, h: 6 },
    { t: 'bolt', x: 17, y: 42, rot: 8, a: 6 },
    { t: 'films', x: 63, y: 94, rot: 12, a: 6 },
    { t: 'star', x: 34, y: 10, rot: -6, a: 5 },
  ],
  4: [
    { t: 'smiley', x: 25, y: 74, rot: 10, a: 5 },
    { t: 'washiC', col: 'zgreen', x: 30, y: 8, rot: 15, w: 20, h: 6 },
    { t: 'moon', x: 18, y: 38, rot: -10, a: 5 },
    { t: 'camera', x: 64, y: 94, rot: -14, a: 4 },
    { t: 'scribble', x: 63, y: 40, rot: 4, a: 6 },
  ],
  5: [
    { t: 'cherry', x: 25, y: 74, rot: -10, a: 5 },
    { t: 'washi', x: 57, y: 38, rot: 20, w: 20, h: 6 },
    { t: 'sun', x: 36, y: 15, rot: 6, a: 5 },
    { t: 'ticket', x: 55, y: 93, rot: 10, w: 18, h: 7 },
    { t: 'sparkle', x: 14, y: 8, rot: -8, a: 3 },
  ],
  6: [
    { t: 'bow', x: 25, y: 76, rot: 12, a: 6 },
    { t: 'washiC', col: 'zred', x: 57, y: 38, rot: -22, w: 20, h: 6 },
    { t: 'star', x: 36, y: 15, rot: -8, a: 5 },
    { t: 'campolar', x: 36, y: 67, rot: 10, a: 6 },
    { t: 'arrow', x: 9, y: 9, rot: -5, a: 4 },
  ],
  7: [
    { t: 'flower', x: 35, y: 67, rot: 14, a: 6 },
    { t: 'washiC', col: 'zcobalt', x: 30, y: 8, rot: 18, w: 20, h: 6 },
    { t: 'bolt', x: 18, y: 42, rot: -6, a: 6 },
    { t: 'heart', x: 64, y: 90, rot: -10, a: 5 },
    { t: 'cassette', x: 36, y: 11, rot: 6, a: 6 },
  ],
  8: [
    { t: 'smiley', x: 10, y: 92, rot: -8, a: 5 },
    { t: 'washiC', col: 'zgreen', x: 17, y: 94, rot: 5, w: 20, h: 6 },
    { t: 'sun', x: 10, y: 50, rot: 8, a: 5 },
    { t: 'ticket', x: 39, y: 8, rot: -8, w: 18, h: 7 },
    { t: 'cherry', x: 64, y: 90, rot: -12, a: 5 },
  ],
};

// Imposition: bottom row L-R 6,7,8,1; top row L-R 5,4,3,2 rotated 180.
export const IMPOSE = [
  { page: 6, x: 37.125, y: 52.5, turn: 0 },
  { page: 7, x: 111.375, y: 52.5, turn: 0 },
  { page: 8, x: 185.625, y: 52.5, turn: 0 },
  { page: 1, x: 259.875, y: 52.5, turn: 0 },
  { page: 5, x: 37.125, y: 157.5, turn: 180 },
  { page: 4, x: 111.375, y: 157.5, turn: 180 },
  { page: 3, x: 185.625, y: 157.5, turn: 180 },
  { page: 2, x: 259.875, y: 157.5, turn: 180 },
];
