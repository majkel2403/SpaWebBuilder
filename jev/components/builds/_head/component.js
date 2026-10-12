/* builds — "ten builds, one decision layer": one particle canvas behind a DOM hub + six live tiles (prefix bld-) */
JEV.mod('builds', () => {
  const J = JEV, $ = J.$, $$ = J.$$, C = J.C, S = J.S, B = J.BUILDS, TAU = J.TAU, clamp = J.clamp, fmt = J.fmt;
  const root = $('#builds'), stage = $('#bld-stage'), cv = $('#bld-cv');
  if (!root || !stage || !cv) return;
  const reduce = J.reduce, mq = window.matchMedia('(max-width: 759px)');
  const setT = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  const short = (s) => s.split('-')[0];
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };

  /* ---------- palette (index = tint id used by ribbons) ---------- */
  const TINT = ['#ff6fa6', '#c9c2d6', '#35e0a8', '#5a8cff', '#ffc53d'];
  const TIDX = { pink: 0, gray: 1, green: 2, blue: 3, yellow: 4 };
  const TRGB = TINT.map(hex), RED = [255, 77, 94], WHITE = [255, 255, 255];
  const PRIMS = ['choice', 'score', 'flag'];
  const PCOL = { choice: C.pink, score: C.amber, flag: C.green };
  const bIdx = {}; B.forEach((b, i) => (bIdx[b.key] = i));
  const mix = (a, b, k) => 'rgba(' + ((a[0] + (b[0] - a[0]) * k) | 0) + ',' + ((a[1] + (b[1] - a[1]) * k) | 0) + ',' + ((a[2] + (b[2] - a[2]) * k) | 0);

  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const TICK = [{ offset: 0, color: '#fff' }];

