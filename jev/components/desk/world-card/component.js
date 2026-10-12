/* desk/world-card — the whole "world" section: dotted 3D globe with venues, arcs and orbiting agent orbs, global feeds, the ticket in flight with six agent rows, and the six-agent tab strip
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* API relied on: $ $$ C TAU clamp lerp rnd ri gauss rng rgba fmt usd sgn · bus (on 'tick' 'decision' 'kill' 'tier', emit 'agentstep') · fit watch task animate · market recent S RULES AGENTS · makeDecision · tier reduce time.
 * Data: JEV.market {price, open, hist[]} (oracle + venue prices), decision records {id symbol venue action size conf net dest riskOk state{spread_bps regime price}}.
 */
JEV.mod('desk-world-card', () => {
  'use strict';
  const J = JEV, C = J.C, TAU = J.TAU, clamp = J.clamp, lerp = J.lerp, D2R = Math.PI / 180;
  const root = J.$('#dkw-world');
  if (!root) return;
  const body = J.$('#dkw-body'), cv = J.$('#dkw-cv'), stage = J.$('#dkw-stage'), grab = J.$('#dkw-grab');
  const tixEl = J.$('#dkw-tix'), port = J.$('#dkw-port'), feedsEl = J.$('#dkw-feeds'), tabsEl = J.$('#dkw-tabs');
  const txt = (el, v) => { if (el && el.textContent !== v) el.textContent = v; };
  const fmt = J.fmt, rnd = J.rnd;
  const MONO = '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace';

  /* ================================================================ data ================================================================ */
  const CITIES = [
    { c: 'NYC', lat: 40.7, lon: -74.0 }, { c: 'LON', lat: 51.5, lon: -0.1 }, { c: 'FRA', lat: 50.1, lon: 8.7 }, { c: 'DXB', lat: 25.2, lon: 55.3 },
    { c: 'SGP', lat: 1.35, lon: 103.8 }, { c: 'TYO', lat: 35.7, lon: 139.7 }, { c: 'SYD', lat: -33.9, lon: 151.2 }, { c: 'SFO', lat: 37.8, lon: -122.4 },
  ];
  const CIDX = {}; CITIES.forEach((c, i) => (CIDX[c.c] = i));
  const llv = (lat, lon) => { const a = lat * D2R, b = lon * D2R; return [Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)]; };
  CITIES.forEach((c) => (c.v = llv(c.lat, c.lon)));
  // venues: key · matching-engine region on the globe · colour · standing bias vs the oracle (bps) · base latency (ms)
  const FEEDS = [
    { k: 'coinbase', city: 'SFO', bias: 0.3, lat0: 24 }, { k: 'kraken', city: 'NYC', bias: -0.2, lat0: 31 }, { k: 'binance', city: 'SGP', bias: 0.1, lat0: 18 },
    { k: 'okx', city: 'SYD', bias: -0.1, lat0: 42 }, { k: 'bybit', city: 'DXB', bias: 0.2, lat0: 36 }, { k: 'bitstamp', city: 'LON', bias: -0.4, lat0: 58 },
    { k: 'upbit', city: 'TYO', bias: 0.8, lat0: 71 }, { k: 'deribit', city: 'FRA', bias: 0, lat0: 27 },
  ];
  // packet / beam colours: 0 gold(quote) 1 white(order) 2 pink(jev) 3 cyan(fill) 4 green 5 violet 6 orange 7 red
  const COLS = ['#ffc13d', '#f4eef6', '#ff7ab3', '#3be0ff', '#2ee6a6', '#a66bff', '#ff8a3d', '#ff4d5e'];
  const SPR = COLS.map((hex) => {
    const c = document.createElement('canvas'); c.width = c.height = 48; const q = c.getContext('2d');
    const gr = q.createRadialGradient(24, 24, 0, 24, 24, 24);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.16, J.rgba(hex, 0.95)); gr.addColorStop(0.42, J.rgba(hex, 0.34)); gr.addColorStop(1, J.rgba(hex, 0));
    q.fillStyle = gr; q.fillRect(0, 0, 48, 48); return c;
  });
  const WARM = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const q = c.getContext('2d'); const gr = q.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,214,150,.9)'); gr.addColorStop(0.35, 'rgba(255,170,90,.35)'); gr.addColorStop(1, 'rgba(255,140,70,0)'); q.fillStyle = gr; q.fillRect(0, 0, 64, 64); return c; })();
  const ARC_PAIRS = [[0, 1, 0], [1, 3, 3], [2, 3, 2], [3, 4, 0], [4, 5, 1], [5, 7, 2], [7, 0, 3], [6, 4, 0], [6, 5, 2], [0, 2, 1], [1, 4, 3], [3, 5, 0], [7, 6, 1]];
  const AG = J.AGENTS, AGK = AG.map((a) => a.key);
  const AGI = {}; AGK.forEach((k, i) => (AGI[k] = i));
  const VERB = ['SCAN', 'RESEARCH', 'PRICE', 'SIZE', 'FILL', 'CLOSE'];
  const CAP = 527000; // simulated desk capital used to turn "% of capital" into a notional

  /* ================================================================ globe geometry ================================================================ */
  function makeNoise(seed) {
    const r = J.rng(seed), perm = new Uint8Array(512), val = new Float32Array(256), p = [];
    for (let i = 0; i < 256; i++) { p.push(i); val[i] = r() * 2 - 1; }
    for (let i = 255; i > 0; i--) { const j = (r() * (i + 1)) | 0, tmp = p[i]; p[i] = p[j]; p[j] = tmp; }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10), l = (a, b, t) => a + (b - a) * t;
    return (x, y, z) => {
      const xf = Math.floor(x), yf = Math.floor(y), zf = Math.floor(z), X = xf & 255, Y = yf & 255, Z = zf & 255;
      x -= xf; y -= yf; z -= zf;
      const u = fade(x), v = fade(y), w = fade(z);
      const A = perm[X] + Y, B = perm[X + 1] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z, BA = perm[B] + Z, BB = perm[B + 1] + Z;
      return l(l(l(val[perm[AA]], val[perm[AA + 1]], w), l(val[perm[AB]], val[perm[AB + 1]], w), v), l(l(val[perm[BA]], val[perm[BA + 1]], w), l(val[perm[BB]], val[perm[BB + 1]], w), v), u);
    };
  }
  const noise = makeNoise(20260);
  const fbm = (x, y, z) => { let s = 0, a = 0.5, f = 1; for (let o = 0; o < 5; o++) { s += a * noise(x * f + o * 17.3, y * f + o * 3.1, z * f - o * 9.7); f *= 2.07; a *= 0.5; } return s; };

  // ~4000 fibonacci-sphere points: continents = fbm threshold (+ land pulled up under each venue), sparse dim ocean, a denser continental shelf
  const NPT_SRC = 7600, GA = Math.PI * (3 - Math.sqrt(5));
  const PX = new Float32Array(NPT_SRC), PY = new Float32Array(NPT_SRC), PZ = new Float32Array(NPT_SRC), PK = new Uint8Array(NPT_SRC);
  let NPT = 0;
  const LITV = new Uint8Array(NPT_SRC), LIX = [new Int32Array(NPT_SRC), new Int32Array(NPT_SRC), new Int32Array(NPT_SRC), new Int32Array(NPT_SRC)], LN4 = new Int32Array(4);
  (function buildPoints() {
    const vals = new Float32Array(NPT_SRC), sx = new Float32Array(NPT_SRC), sy = new Float32Array(NPT_SRC), sz = new Float32Array(NPT_SRC), r = J.rng(7);
    for (let i = 0; i < NPT_SRC; i++) {
      const y = 1 - (2 * (i + 0.5)) / NPT_SRC, rr = Math.sqrt(Math.max(0, 1 - y * y)), ph = i * GA, x = Math.cos(ph) * rr, z = Math.sin(ph) * rr;
      let v = fbm(x * 1.4 + 3.1, y * 1.4 - 1.7, z * 1.4 + 0.6);
      for (let c = 0; c < CITIES.length; c++) { const q = CITIES[c].v, d2 = (x - q[0]) * (x - q[0]) + (y - q[1]) * (y - q[1]) + (z - q[2]) * (z - q[2]); v += 0.5 * Math.exp(-d2 / 0.05); }
      sx[i] = x; sy[i] = y; sz[i] = z; vals[i] = v;
    }
    const sorted = Float32Array.from(vals).sort(), thr = sorted[Math.floor(NPT_SRC * 0.62)], vmax = sorted[NPT_SRC - 1];
    const keep = [];
    for (let i = 0; i < NPT_SRC; i++) {
      const v = vals[i]; let kind = -1;
      if (v >= thr) kind = (v - thr) / (vmax - thr) > 0.42 ? 3 : 2;
      else if (v > thr - 0.075) kind = r() < 0.72 ? 1 : -1;
      else kind = r() < 0.14 ? 0 : -1;
      if (kind >= 0) keep.push(i, kind);
    }
    // shuffle so any prefix is a uniform subset (fewer points on narrow screens)
    const n = keep.length / 2, order = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0, t = order[i]; order[i] = order[j]; order[j] = t; }
    for (let i = 0; i < n; i++) { const s = keep[order[i] * 2]; PX[i] = sx[s]; PY[i] = sy[s]; PZ[i] = sz[s]; PK[i] = keep[order[i] * 2 + 1]; }
    NPT = n;
    // night-side city lights: clumps of land dots (high-frequency noise) -> 1 / 2 (twinkle phase)
    for (let i = 0; i < n; i++) if (PK[i] >= 2 && noise(PX[i] * 9 + 5, PY[i] * 9, PZ[i] * 9) > 0.12 && r() < 0.8) LITV[i] = 1 + (i & 1);
  })();
  const SXa = new Float32Array(NPT_SRC), SYa = new Float32Array(NPT_SRC);
  const NBK = 18, bIdx = Array.from({ length: NBK }, () => new Int32Array(NPT_SRC)), bN = new Int32Array(NBK);
  // palette per kill-mix step (0..10): [deep ocean, shelf, lowland, highland] x 4 depth levels, then back-hemisphere ocean / land
  const KIND = [
    { n: [78, 126, 226], k: [205, 72, 112], a: [0.1, 0.16, 0.22, 0.3], s: [1, 1.05, 1.1, 1.15] },
    { n: [62, 186, 236], k: [255, 92, 110], a: [0.22, 0.32, 0.44, 0.56], s: [1.05, 1.15, 1.25, 1.35] },
    { n: [40, 224, 192], k: [255, 96, 96], a: [0.34, 0.54, 0.76, 0.96], s: [1.3, 1.55, 1.85, 2.1] },
    { n: [175, 246, 255], k: [255, 196, 186], a: [0.5, 0.7, 0.9, 1], s: [1.5, 1.8, 2.15, 2.5] },
  ];
  const BACKK = [{ n: [96, 134, 226], k: [210, 80, 110], a: 0.08 }, { n: [64, 206, 206], k: [255, 100, 100], a: 0.2 }];
  const mixc = (a, b, m) => Math.round(a[0] + (b[0] - a[0]) * m) + ',' + Math.round(a[1] + (b[1] - a[1]) * m) + ',' + Math.round(a[2] + (b[2] - a[2]) * m);
  const PAL = [], HALO = [], BSZ = new Float32Array(NBK);
  for (let s = 0; s <= 10; s++) {
    const m = s / 10, row = [];
    for (let k = 0; k < 4; k++) for (let l = 0; l < 4; l++) row.push('rgba(' + mixc(KIND[k].n, KIND[k].k, m) + ',' + KIND[k].a[l] + ')');
    row.push('rgba(' + mixc(BACKK[0].n, BACKK[0].k, m) + ',' + BACKK[0].a + ')', 'rgba(' + mixc(BACKK[1].n, BACKK[1].k, m) + ',' + BACKK[1].a + ')');
    PAL.push(row); HALO.push('rgba(' + mixc([110, 240, 255], [255, 120, 120], m) + ',.11)');
  }
  for (let k = 0; k < 4; k++) for (let l = 0; l < 4; l++) BSZ[k * 4 + l] = KIND[k].s[l];
  BSZ[16] = 1; BSZ[17] = 1.1;

  // lat/lon grid lines (rotate with the globe)
  const LINES = [];
  (function buildLines() {
    const SEG = 72;
    const mk = (fn, n) => { const v = new Float32Array((n + 1) * 3); for (let i = 0; i <= n; i++) { const p = fn(i / n); v[i * 3] = p[0]; v[i * 3 + 1] = p[1]; v[i * 3 + 2] = p[2]; } return v; };
    [-60, -30, 0, 30, 60].forEach((lat) => LINES.push(mk((u) => llv(lat, u * 360), SEG)));
    for (let m = 0; m < 8; m++) LINES.push(mk((u) => llv(-90 + u * 180, m * 45), SEG));
  })();
  let LN = 0; LINES.forEach((l) => (LN += l.length / 3));
  const LSX = new Float32Array(LN), LSY = new Float32Array(LN), LSZ = new Float32Array(LN);

  // great-circle arcs between venues, lifted above the surface
  const ARC_SEG = 36;
  const ARCS = ARC_PAIRS.map((pr) => {
    const a = CITIES[pr[0]].v, b = CITIES[pr[1]].v, ang = Math.acos(clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1)), sn = Math.sin(ang) || 1, h = 0.07 + 0.22 * (ang / Math.PI);
    const pts = new Float32Array((ARC_SEG + 1) * 3);
    for (let i = 0; i <= ARC_SEG; i++) {
      const t = i / ARC_SEG, w0 = Math.sin((1 - t) * ang) / sn, w1 = Math.sin(t * ang) / sn, r = 1 + h * Math.sin(Math.PI * t);
      pts[i * 3] = (a[0] * w0 + b[0] * w1) * r; pts[i * 3 + 1] = (a[1] * w0 + b[1] * w1) * r; pts[i * 3 + 2] = (a[2] * w0 + b[2] * w1) * r;
    }
    return { a: pr[0], b: pr[1], col: pr[2], pts, lit: 0, sx: new Float32Array(ARC_SEG + 1), sy: new Float32Array(ARC_SEG + 1), sz: new Float32Array(ARC_SEG + 1), vis: new Uint8Array(ARC_SEG + 1) };
  });
  const ARC_BY_CITY = CITIES.map((_, c) => { const o = []; ARCS.forEach((a, i) => { if (a.a === c || a.b === c) o.push(i); }); return o; });

  // aurora ribbons over the northern cap
  const AUR = [
    { lat: 63, amp: 8, lon: -80, span: 150, spd: 3.2, ph: 0, h: 0.2, c: ['140,92,255', '59,224,255', '46,230,166'] },
    { lat: 71, amp: 6, lon: 25, span: 125, spd: -2.6, ph: 2.1, h: 0.25, c: ['255,122,179', '110,150,255', '59,224,255'] },
    { lat: 56, amp: 6, lon: 120, span: 105, spd: 2.1, ph: 4.2, h: 0.15, c: ['59,224,255', '46,230,166', '46,230,166'] },
  ];
  AUR.forEach((a) => { a.fs = a.c.map((c, l) => 'rgba(' + c + ',' + [0.05, 0.06, 0.085][l] + ')'); a.ridge = 'rgba(' + a.c[2] + ',.6)'; });
  const COMET = [0, 1].map((kv) => [0, 1].map((c) => { const col = kv ? '255,140,150' : c ? '190,150,255' : '150,240,255'; return Array.from({ length: 7 }, (_, j) => 'rgba(' + col + ',' + (((1 - j / 7) * 0.7) * (c ? 0.6 : 1)).toFixed(2) + ')'); }));
  const AM = 40, ABX = new Float32Array(AM), ABY = new Float32Array(AM), ATX = new Float32Array(AM), ATY = new Float32Array(AM), AV = new Uint8Array(AM);
  const AFR = [1, 0.62, 0.3];
  const TN = 17, TC = new Float32Array(TN), TS = new Float32Array(TN);
  for (let i = 0; i < TN; i++) { const ph = Math.PI / 2 - (i / (TN - 1)) * Math.PI; TC[i] = Math.cos(ph); TS[i] = Math.sin(ph); }

  // stars
  const STARS = (() => { const r = J.rng(11); return Array.from({ length: 80 }, () => ({ u: r(), v: r(), ph: r() * TAU, sp: 0.4 + r() * 1.4, s: r() < 0.15 ? 2 : 1 })); })();

  const STARS2 = (() => { const r = J.rng(12); return Array.from({ length: 44 }, (_, i) => ({ u: r(), v: r(), ph: r() * TAU, sp: 0.6 + r() * 1.8, d: 0.5 + r() * 1.6, f: i < 7 })); })();
  // orbital rings (tilted ellipses around the globe) + satellites with short trails; [radius x R, minor ratio, rotation, [sat angle speeds]]
  const RINGS = [{ k: 1.3, m: 0.2, rot: 0.5, sp: [0.34, -0.2] }, { k: 1.52, m: 0.3, rot: -0.55, sp: [-0.26, 0.18] }];
  const RP = Array.from({ length: 10 }, () => ({ on: 0, c: 0, t: 0, col: 3 })); // impact ripples on the sphere
  function ripple(c, col) { for (let i = 0; i < RP.length; i++) { const p = RP[i]; if (!p.on) { p.on = 1; p.c = c; p.t = 0; p.col = col; return; } } }
  let _px = 0, _py = 0, _pf = 1;
  function ringPt(rg, a) { const rx = rg.k * R, ry = rx * rg.m, cr = Math.cos(rg.rot), sr = Math.sin(rg.rot), x = rx * Math.cos(a), y = ry * Math.sin(a); _px = cx + x * cr - y * sr; _py = cy + x * sr + y * cr; _pf = Math.sin(a) > 0 || (_px - cx) * (_px - cx) + (_py - cy) * (_py - cy) > R * R ? 1 : 0; }
  let OB_OS = 44;

  /* ================================================================ layout / static layers ================================================================ */
  let g = null, W = 0, H = 0, SX = 0, SY = 0, SW = 0, SH = 0, cx = 0, cy = 0, R = 100, dotK = 1, nPts = NPT, compact = false;
  let lastSig = '', fontStr = '';
  let OB_X = 0, OB_Y = 0, OB_RX = 100, OB_RY = 40;
  const OB_ROT = -0.27, LAY = [null, null]; let layB = 0, cks = 1;
  const BEAMS = [];
  let ocv = null, og = null, OW = 0, OH = 0, ogFill = null;
  let killed = !!J.S.killed, killMix = killed ? 1 : 0, cardIn = true, tabsIn = true;
  // backing-store budget (CSS px x dpr^2) per quality level: the globe is dots + glow, it does not need a full retina ratio
  const PXBUD = [2.2e6, 2.2e6, 2.2e6, 1.2e6], PQ = [1, 1, 0.75, 0.56], LAYMAX = 1.5;
  let kx = 1, ky = 1, layDpr = 1, QL = 0, ptsBase = NPT;
  const LAYOK = [false, false];

  // two pre-rendered layers (atmosphere glow + dark sphere body): [0] normal, [1] kill-switch red. [1] is built on demand and released again
  function paintLayer(kv) {
    const sz = Math.max(2, Math.ceil(layB * layDpr)), m = layB / 2;
    const c = LAY[kv] || (LAY[kv] = document.createElement('canvas')); c.width = c.height = sz;
    const q = c.getContext('2d'); q.setTransform(sz / layB, 0, 0, sz / layB, 0, 0); q.clearRect(0, 0, layB, layB);
    const rim = kv ? '255,74,94' : '59,224,255', out = kv ? '255,60,120' : '140,92,255';
    const r0 = R * 0.9, r1 = R * 1.5, S = (r) => (r * R - r0) / (r1 - r0), gl = q.createRadialGradient(m, m, r0, m, m, r1);
    gl.addColorStop(0, 'rgba(' + rim + ',0)'); gl.addColorStop(S(1.0), 'rgba(' + rim + ',.8)'); gl.addColorStop(S(1.035), 'rgba(' + rim + ',.36)');
    gl.addColorStop(S(1.1), 'rgba(' + out + ',.21)'); gl.addColorStop(S(1.22), 'rgba(' + out + ',.075)'); gl.addColorStop(1, 'rgba(' + out + ',0)');
    q.fillStyle = gl; q.fillRect(0, 0, layB, layB);
    q.save(); q.beginPath(); q.arc(m, m, R, 0, TAU); q.clip();
    const bd = q.createRadialGradient(m - R * 0.34, m - R * 0.4, R * 0.04, m, m, R * 1.04);
    bd.addColorStop(0, kv ? 'rgba(112,22,40,.8)' : 'rgba(34,84,176,.8)'); bd.addColorStop(0.42, kv ? 'rgba(54,10,20,.92)' : 'rgba(10,30,78,.92)'); bd.addColorStop(1, kv ? 'rgba(16,3,8,.98)' : 'rgba(3,8,26,.98)');
    q.fillStyle = bd; q.fillRect(m - R, m - R, R * 2, R * 2);
    const sh = q.createRadialGradient(m + R * 0.55, m + R * 0.5, R * 0.1, m + R * 0.55, m + R * 0.5, R * 1.25);
    sh.addColorStop(0, 'rgba(0,0,10,.52)'); sh.addColorStop(1, 'rgba(0,0,10,0)'); q.fillStyle = sh; q.fillRect(m - R, m - R, R * 2, R * 2);
    const fr = q.createRadialGradient(m, m, R * 0.74, m, m, R);
    fr.addColorStop(0, 'rgba(' + rim + ',0)'); fr.addColorStop(0.7, 'rgba(' + rim + ',.07)'); fr.addColorStop(1, 'rgba(' + rim + ',.5)');
    q.fillStyle = fr; q.fillRect(m - R, m - R, R * 2, R * 2); q.restore();
    if ((J.tier || 2) >= 2) { // layered fresnel: a hairline limb, a tight bloom just outside it and a faint far violet halo
      q.lineWidth = 1.1; q.strokeStyle = 'rgba(' + (kv ? '255,170,180' : '170,240,255') + ',.55)'; q.beginPath(); q.arc(m, m, R * 1.003, 0, TAU); q.stroke();
      q.lineWidth = R * 0.05; q.strokeStyle = 'rgba(' + rim + ',.09)'; q.beginPath(); q.arc(m, m, R * 1.03, 0, TAU); q.stroke();
      q.lineWidth = R * 0.14; q.strokeStyle = 'rgba(' + out + ',.035)'; q.beginPath(); q.arc(m, m, R * 1.2, 0, TAU); q.stroke();
    }
    LAYOK[kv] = true;
  }
  function buildLayers() {
    layB = Math.ceil(R * 3); LAYOK[0] = LAYOK[1] = false;
    paintLayer(0); if (killed || killMix > 0.004) paintLayer(1); else if (LAY[1]) LAY[1].width = LAY[1].height = 1;
  }

  function bezPts(p0, p1, p2, p3, n) {
    const o = new Float32Array((n + 1) * 2);
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
      o[i * 2] = a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0]; o[i * 2 + 1] = a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1];
    }
    return o;
  }
  function mkBeam(p0, p1, p2, p3, col, al, w, spd, off, dir, wide) {
    const path = new Path2D(); path.moveTo(p0[0], p0[1]); path.bezierCurveTo(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]);
    const mkg = (rgb, a) => { const gr = g.createLinearGradient(p0[0], p0[1], p3[0], p3[1]); if (dir === 0) { gr.addColorStop(0, 'rgba(' + rgb + ',0)'); gr.addColorStop(0.15, 'rgba(' + rgb + ',' + a * 0.6 + ')'); gr.addColorStop(0.6, 'rgba(' + rgb + ',' + a * 0.45 + ')'); gr.addColorStop(1, 'rgba(' + rgb + ',0)'); } else if (dir > 0) { gr.addColorStop(0, 'rgba(' + rgb + ',0)'); gr.addColorStop(0.1, 'rgba(' + rgb + ',' + a * 0.55 + ')'); gr.addColorStop(0.55, 'rgba(' + rgb + ',' + a * 0.5 + ')'); gr.addColorStop(1, 'rgba(' + rgb + ',' + a + ')'); } else { gr.addColorStop(0, 'rgba(' + rgb + ',' + a * 0.75 + ')'); gr.addColorStop(0.5, 'rgba(' + rgb + ',' + a * 0.4 + ')'); gr.addColorStop(1, 'rgba(' + rgb + ',0)'); } return gr; };
    const hx = COLS[col], n = parseInt(hx.slice(1), 16), rgb = (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
    BEAMS.push({ path, pts: bezPts(p0, p1, p2, p3, 40), col, al, w, spd, off, dir, gN: mkg(rgb, 1), gK: mkg('255,77,94', 1), wide });
  }

  function layout() {
    const f = J.fit(cv, { maxPx: PXBUD[QL] }); g = f.g; W = f.W; H = f.H; kx = cv.width / W; ky = cv.height / H; layDpr = Math.min(kx, LAYMAX);
    const cr = cv.getBoundingClientRect(); cks = cr.width / (cv.offsetWidth || 1) || 1;
    const rel = (el) => { const r = el.getBoundingClientRect(); return { x: (r.left - cr.left) / cks, y: (r.top - cr.top) / cks, w: r.width / cks, h: r.height / cks }; };
    const s = rel(stage); SX = s.x; SY = s.y; SW = s.w; SH = s.h;
    const pr0 = rel(port), sig = W + 'x' + H + '/' + (SX | 0) + ',' + (SY | 0) + ',' + (SW | 0) + ',' + (SH | 0) + '/' + (pr0.x | 0) + ',' + (pr0.y | 0) + '/' + cv.width + 'x' + cv.height;
    if (sig === lastSig) return; lastSig = sig;
    const single = body.offsetWidth < 640; compact = SW < 480;
    fontStr = '700 ' + (compact ? 8.5 : 9.5) + 'px ' + MONO;
    R = Math.max(70, Math.min(SW * (single ? 0.37 : 0.36), SH * (single ? 0.35 : 0.375)));
    cx = SX + SW / 2; cy = SY + SH * (single ? 0.46 : 0.5) + R * 0.04;
    dotK = clamp(R / 230, 0.8, 1.12); ptsBase = single ? Math.round(NPT * 0.7) : NPT; nPts = ptsFor();
    const os = (stage.querySelector('.dkw-ob') || {}).offsetWidth || 44; OB_OS = os;
    OB_X = cx; OB_Y = cy + R * 0.05; OB_RX = Math.max(R * 1.1, Math.min(SW / 2 - os * 0.8, R * 1.68)); OB_RY = R * (single ? 0.4 : 0.34);
    buildLayers();
    // beams: right set globe -> ticket port, left set feed rows -> globe
    BEAMS.length = 0;
    const tr = rel(tixEl), pr = rel(port), mode = tr.x > SX + SW - 60 ? 'side' : tr.y + 40 < H ? 'below' : 'single';
    const D = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    const rc = [0, 6, 1, 3, 0, 2, 3], rw = [1.1, 0.9, 1, 1.25, 0.9, 1, 0.9];
    for (let j = 0; j < 7; j++) {
      const th = (mode === 'side' ? -52 + j * 17.3 : 18 + j * 15) * D2R, c = Math.cos(th), sn = Math.sin(th);
      const p0 = [cx + c * R * 1.0, cy + sn * R * 1.0];
      let p3, ad;
      if (mode === 'side') { p3 = [pr.x + pr.w / 2 - 2, pr.y + pr.h / 2 + (j - 3) * 6]; ad = [1, 0]; }
      else if (mode === 'below') { p3 = [pr.x + pr.w / 2 - 2, pr.y + pr.h / 2 + (j - 3) * 5]; ad = [1, 0.15]; }
      else { p3 = [cx + (j - 3) * 20, SY + SH - 34]; ad = [0, 1]; }
      const d = D(p0, p3);
      mkBeam(p0, [p0[0] + c * d * 0.36, p0[1] + sn * d * 0.36], [p3[0] - ad[0] * d * 0.38, p3[1] - ad[1] * d * 0.38 + (j - 3) * 9], p3, rc[j], 1, rw[j], 0.22 + (j % 3) * 0.07, j * 0.37, mode === 'single' ? 0 : 1, true);
    }
    if (mode === 'side') {
      const rows = J.$$('.dkw-v', feedsEl), lc = [3, 4, 5, 1], lt = [150, 172, 192, 214];
      for (let j = 0; j < 4; j++) {
        const rr = rel(rows[1 + j * 2] || rows[0]), p0 = [rr.x + rr.w + 3, rr.y + rr.h / 2], th = lt[j] * D2R, p3 = [cx + Math.cos(th) * R, cy + Math.sin(th) * R], d = D(p0, p3);
        mkBeam(p0, [p0[0] + d * 0.38, p0[1]], [p3[0] + Math.cos(th) * d * 0.4, p3[1] + Math.sin(th) * d * 0.4], p3, lc[j], 0.55, 0.8, 0.2 + j * 0.05, j * 0.29, -1, false);
      }
    }
    // oracle spark canvas
    if (ocv) { const o = J.fit(ocv); og = o.g; OW = o.W; OH = o.H; ogFill = og.createLinearGradient(0, 0, 0, OH); ogFill.addColorStop(0, 'rgba(120,170,255,.36)'); ogFill.addColorStop(1, 'rgba(120,170,255,0)'); drawOracle(); }
    // a resize clears the canvas: redraw right away (also keeps reduced-motion, where the task freezes, from going blank)
    draw(J.time || 0, 0); orbits(J.time || 0, 0);
  }

  /* ================================================================ feeds (left column) ================================================================ */
  ocv = J.$('#dkw-ocv');
  const FD = FEEDS.map((f, i) => {
    const el = J.$('.dkw-v[data-k="' + f.k + '"]', feedsEl), spark = J.$('.dkw-vs', el);
    const bars = Array.from({ length: 12 }, () => { const b = document.createElement('i'); spark.appendChild(b); return b; });
    return { k: f.k, i, el, city: CIDX[f.city], bias: f.bias, lat0: f.lat0, off: 0, lat: f.lat0, price: 0, prev: 0, up: true, alt: 0, hist: new Float32Array(12), hq: -1, hs: '', bars, p: J.$('.dkw-vp', el), u: J.$('.dkw-vm u', el), s: J.$('.dkw-vm s', el), n: 0 };
  });
  const E = { op: J.$('#dkw-op'), opd: J.$('#dkw-opd'), oc: J.$('#dkw-oc'), disp: J.$('#dkw-disp') };
  let tickN = 0;
  function drawOracle() {
    if (!og) return;
    const h = J.market.hist, n = Math.min(h.length, 120), s = h.length - n;
    if (n < 4) return;
    let mn = 1e12, mx = -1e12; for (let i = 0; i < n; i++) { const v = h[s + i]; if (v < mn) mn = v; if (v > mx) mx = v; }
    const pad = 6, ih = OH - pad * 2, rg = mx - mn || 1;
    og.clearRect(0, 0, OW, OH); og.beginPath();
    for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * OW, y = pad + (1 - (h[s + i] - mn) / rg) * ih; if (i) og.lineTo(x, y); else og.moveTo(x, y); }
    og.lineJoin = 'round'; og.strokeStyle = 'rgba(140,185,255,.28)'; og.lineWidth = 5; og.stroke(); og.strokeStyle = '#b7d0ff'; og.lineWidth = 1.5; og.stroke();
    og.lineTo(OW, OH); og.lineTo(0, OH); og.closePath(); og.fillStyle = ogFill; og.fill();
    const ly = pad + (1 - (h[h.length - 1] - mn) / rg) * ih; og.fillStyle = '#fff'; og.beginPath(); og.arc(OW - 3, ly, 2.4, 0, TAU); og.fill();
  }
  function paintFeed(f, withLat) {
    f.p.className = 'dkw-vp num ' + (f.up ? 'up ' : 'dn ') + ((f.alt ^= 1) ? 'fa' : 'fb');
    txt(f.p, fmt(f.price, 1));
    txt(f.s, J.sgn((f.price / J.market.price - 1) * 1e4, 1) + 'bp');
    if (withLat) { txt(f.u, Math.round(f.lat) + 'ms'); const c = f.lat < 40 ? '' : f.lat < 70 ? 'm' : 's'; if (f.u.className !== c) f.u.className = c; }
    let mn = 1e12, mx = -1e12; for (let i = 0; i < 12; i++) { const v = f.hist[i]; if (v < mn) mn = v; if (v > mx) mx = v; }
    const rg = mx - mn;
    const dev = (f.price / J.market.price - 1) * 1e4, hv = Math.min(1, Math.abs(dev) / 1.1), hq = Math.round(hv * 10) / 10, hs = dev >= 0 ? 'p' : 'n';
    if (hq !== f.hq) { f.hq = hq; f.el.style.setProperty('--h', hq); } if (hs !== f.hs) { f.hs = hs; f.el.dataset.hs = hs; }
    for (let i = 0; i < 12; i++) f.bars[i].style.transform = 'scaleY(' + (rg < 1e-6 ? 0.35 : 0.16 + 0.84 * ((f.hist[i] - mn) / rg)).toFixed(2) + ')';
  }
  function updateFeeds(price, paint) {
    let mn = 1e12, mx = -1e12;
    for (const f of FD) {
      f.off = f.off * 0.82 + J.gauss() * 0.32; f.prev = f.price || price; f.price = price * (1 + (f.bias + f.off) * 1e-4);
      f.up = f.price >= f.prev; f.lat = clamp(f.lat + J.gauss() * 2.2 + (f.lat0 - f.lat) * 0.08, 6, 140);
      for (let i = 0; i < 11; i++) f.hist[i] = f.hist[i + 1]; f.hist[11] = f.price;
      if (f.price < mn) mn = f.price; if (f.price > mx) mx = f.price;
    }
    if (!paint) return;
    tickN++;
    for (const f of FD) paintFeed(f, (tickN & 1) === 0);
    txt(E.disp, ((mx - mn) / price * 1e4).toFixed(1));
    const M = J.market, chg = (price / M.open - 1) * 100;
    txt(E.op, fmt(Math.floor(price))); txt(E.opd, '.' + Math.floor((price % 1) * 10));
    txt(E.oc, (chg >= 0 ? '▲ ' : '▼ ') + J.sgn(chg, 2) + '%'); const oc = 'dkw-orc ' + (chg >= 0 ? 'up' : 'dn'); if (E.oc.className !== oc) E.oc.className = oc;
    drawOracle();
  }

  /* ================================================================ packets, markers, rendering ================================================================ */
  const POOL = Array.from({ length: 40 }, () => ({ on: 0, kind: 0, idx: 0, t: 0, spd: 0.5, col: 0, rev: 0, sz: 1 }));
  function spawn(kind, idx, col, spd, rev, sz) {
    for (let i = 0; i < POOL.length; i++) { const p = POOL[i]; if (!p.on) { p.on = 1; p.kind = kind; p.idx = idx; p.t = 0; p.spd = spd; p.col = col; p.rev = rev ? 1 : 0; p.sz = sz || 1; return p; } }
    return null;
  }
  const FL = new Float32Array(CITIES.length), MX = new Float32Array(CITIES.length), MY = new Float32Array(CITIES.length), MZ = new Float32Array(CITIES.length);
  let tiltOff = 0, hoverCity = -1, kbi = -1;
  let yaw = 0.2, yawVel = 0, tilt = 0.4, focusYaw = null, focusHold = 0, focusCity = -1, dragging = false, ambient = 0.5;
  const AUTO = 0.1;
  const EMPTY = [], DASH = [2, 7];

  // quality governor: the draw cost (median-ish mean over GOV_N draws, warm-up skipped) steps the globe down one level when it stays above the level's
  // budget (ms): 1 = 30 fps while idle · 2 = 0.75x dots, no back-hemisphere grid · 3 = 0.56x dots, thinner aurora / beams / comets, smaller backing store. Never steps up.
  const GOV_N = 90, GOV_THR = [5, 9, 12], gCost = new Float32Array(GOV_N);
  let gI = 0, gSkip = 30, acc = 0;
  const ptsFor = () => Math.min(ptsBase, Math.max(1200, Math.round(ptsBase * PQ[QL])));
  function govern(ms) {
    if (J.reduce || QL >= 3) return;
    if (gSkip > 0) { gSkip--; return; }
    gCost[gI++] = ms; if (gI < GOV_N) return;
    gI = 0; gCost.sort(); let m = 0; const k = (GOV_N * 0.8) | 0; for (let i = 0; i < k; i++) m += gCost[i]; m /= k;
    if (m > GOV_THR[QL]) {
      QL++; gSkip = 30; root.dataset.dkwQ = QL; nPts = ptsFor();
      if (QL === 3) { lastSig = ''; layout(); } // smaller backing store
    }
  }
  /** frame task: the globe draws every frame (every other one once the governor has stepped in and nothing is being dragged / focused); the DOM agents move every frame */
  function frame(t, dt) {
    if (!g) return;
    acc += dt;
    if (QL < 1 || dragging || focusYaw !== null || Math.abs(yawVel) > 0.08 || acc >= 0.028) { const a = performance.now(); draw(t, acc); acc = 0; govern(performance.now() - a); }
    orbits(t, dt);
    slowAcc += dt; if (slowAcc > 0.25) { slowAcc = 0; slow(); }
  }
  function draw(t, dt) {
    killMix += ((killed ? 1 : 0) - killMix) * Math.min(1, dt * 2.6);
    if (Math.abs(killMix - (killed ? 1 : 0)) < 0.003) killMix = killed ? 1 : 0;
    const km = killMix, ks = Math.round(km * 10), alive = 1 - km, lq = QL, TIER = J.tier || 2;
    // ---- rotation: idle spin · drag inertia · focus-a-venue
    if (!dragging) {
      if (focusYaw !== null) {
        let d = focusYaw - yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); yaw += d * Math.min(1, dt * 3.2);
        if (Math.abs(d) < 0.03) { focusHold -= dt; if (focusHold <= 0) { focusYaw = null; setFocusRow(-1); } }
      } else { yaw += (AUTO * (1 - 0.85 * km) + yawVel) * dt; yawVel *= Math.exp(-dt * 2.2); }
    }
    if (!dragging) tiltOff *= Math.exp(-dt * 2.4);
    tilt = 0.4 + 0.045 * Math.sin(t * 0.21) + tiltOff;
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt);
    g.setTransform(kx, 0, 0, ky, 0, 0);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, W, H);
    // ---- stars
    g.fillStyle = '#cfe3ff';
    for (let i = 0; i < STARS.length; i += lq > 2 ? 2 : 1) { const s = STARS[i], pu = s.u + yaw * 0.008 * s.s; g.globalAlpha = (0.12 + 0.45 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph))) * (1 - 0.5 * km); g.fillRect(SX + (pu - Math.floor(pu)) * SW, SY + s.v * SH, s.s, s.s); }
    if (TIER >= 3) { // depth stars: twinkle + parallax with the spin and tilt; a few get a cross flare
      const cy0 = (tilt - 0.4) * 26;
      for (let i = 0; i < STARS2.length; i += lq > 1 ? 2 : 1) {
        const s = STARS2[i], pu = s.u + yaw * 0.014 * s.d, tw = 0.5 + 0.5 * Math.sin(t * s.sp + s.ph), x = SX + (pu - Math.floor(pu)) * SW, y = SY + s.v * SH + cy0 * s.d;
        g.globalAlpha = (0.2 + 0.6 * tw) * (1 - 0.5 * km); g.fillStyle = s.d > 1.4 ? '#fff' : '#bcd4ff'; g.fillRect(x, y, 1.6, 1.6);
        if (s.f && tw > 0.55) { const L = 3 + 6 * tw; g.globalAlpha = (tw - 0.5) * 1.2 * (1 - 0.5 * km); g.fillRect(x + 0.8 - L, y + 0.5, L * 2, 0.6); g.fillRect(x + 0.5, y + 0.8 - L, 0.6, L * 2); }
      }
    }
    g.globalAlpha = 1;
    if (TIER >= 2) { g.lineWidth = 1; g.strokeStyle = km > 0.5 ? 'rgba(255,150,160,.1)' : 'rgba(170,200,255,.1)'; for (let r = 0; r < RINGS.length; r++) { const rg = RINGS[r]; g.beginPath(); g.ellipse(cx, cy, rg.k * R, rg.k * R * rg.m, rg.rot, Math.PI, TAU); g.stroke(); } }
    // ---- orbit track (back half goes under the globe)
    g.lineWidth = 1; g.setLineDash(DASH); g.strokeStyle = km > 0.5 ? 'rgba(255,150,160,.2)' : 'rgba(170,200,255,.2)';
    g.beginPath(); g.ellipse(OB_X, OB_Y, OB_RX, OB_RY, OB_ROT, Math.PI, TAU); g.stroke(); g.setLineDash(EMPTY);
    // ---- atmosphere + dark sphere body
    g.drawImage(LAY[0], cx - layB / 2, cy - layB / 2, layB, layB);
    if (km > 0.004) { if (!LAYOK[1]) paintLayer(1); g.globalAlpha = km; g.drawImage(LAY[1], cx - layB / 2, cy - layB / 2, layB, layB); g.globalAlpha = 1; }
    else if (LAYOK[1] && !killed) { LAYOK[1] = false; LAY[1].width = LAY[1].height = 1; } // kill switch released: give the red layer's pixels back
    // ---- grid lines
    {
      let o = 0, anyF = false;
      for (let l = 0; l < LINES.length; l++) {
        const v = LINES[l], n = v.length / 3;
        for (let i = 0; i < n; i++) {
          const x = v[i * 3], y = v[i * 3 + 1], z = v[i * 3 + 2], x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw, y2 = y * ct - z1 * st, z2 = y * st + z1 * ct;
          LSX[o + i] = cx + R * x1; LSY[o + i] = cy - R * y2; LSZ[o + i] = z2;
        }
        o += n;
      }
      g.lineWidth = 1;
      for (let pass = lq > 1 ? 1 : 0; pass < 2; pass++) { // (the faint back-hemisphere pass is the first thing to go)
        g.strokeStyle = pass ? (km > 0.5 ? 'rgba(255,120,130,.13)' : 'rgba(120,190,255,.2)') : 'rgba(120,150,230,.06)'; g.beginPath(); o = 0;
        for (let l = 0; l < LINES.length; l++) {
          const n = LINES[l].length / 3; let pen = false;
          for (let i = 0; i < n; i++) { const fr = LSZ[o + i] > 0; if (fr === (pass === 1)) { if (!pen) { g.moveTo(LSX[o + i], LSY[o + i]); pen = true; } else g.lineTo(LSX[o + i], LSY[o + i]); } else pen = false; }
          o += n;
        }
        g.stroke();
      }
    }
    // ---- the point cloud
    const sxv = -0.62 + 0.1 * Math.sin(t * 0.045), syv = 0.4 + 0.05 * Math.sin(t * 0.031 + 1), szv = 0.62, sl = Math.hypot(sxv, syv, szv), kz = szv / sl, lit = TIER >= 3 && lq < 2 && alive > 0.02;
    const sux = sxv / sl, suy = syv / sl, suz = kz;
    bN.fill(0); LN4.fill(0);
    for (let i = 0; i < nPts; i++) {
      const x = PX[i], y = PY[i], z = PZ[i], x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw, y2 = y * ct - z1 * st, z2 = y * st + z1 * ct, kd = PK[i];
      SXa[i] = cx + R * x1; SYa[i] = cy - R * y2;
      const b = z2 > 0.02 ? kd * 4 + (z2 > 0.75 ? 3 : z2 > 0.45 ? 2 : z2 > 0.2 ? 1 : 0) : 16 + (kd > 1 ? 1 : 0);
      bIdx[b][bN[b]++] = i;
      if (lit && LITV[i] && z2 > 0.06) { const lum = x1 * sux + y2 * suy + z2 * suz; if (lum < -0.02) { const q = (lum < -0.22 ? 2 : 0) + LITV[i] - 1; LIX[q][LN4[q]++] = i; } }
    }
    const pal = PAL[ks];
    for (let b = 0; b < NBK; b++) {
      const n = bN[b]; if (!n) continue;
      const sz = BSZ[b] * dotK, h = sz / 2, ix = bIdx[b];
      g.fillStyle = pal[b]; g.beginPath();
      for (let j = 0; j < n; j++) { const i = ix[j]; g.rect(SXa[i] - h, SYa[i] - h, sz, sz); }
      g.fill();
    }
    g.globalCompositeOperation = 'lighter'; g.fillStyle = HALO[ks];
    for (let q = 0; q < 3; q++) {
      const b = q === 0 ? 11 : 13 + q, n = bN[b], ix = bIdx[b], sz = 4.6 * dotK, h = sz / 2; if (!n) continue;
      g.beginPath(); for (let j = 0; j < n; j++) { const i = ix[j]; g.rect(SXa[i] - h, SYa[i] - h, sz, sz); } g.fill();
    }
    if (lit) { // city lights on the night side
      const tw = 0.5 + 0.5 * Math.sin(t * 2.3), sz = 1.7 * dotK, h = sz / 2, base = km > 0.5 ? '255,120,90,' : '255,206,128,';
      for (let q = 0; q < 4; q++) {
        const n = LN4[q]; if (!n) continue;
        const ph = (q & 1) ? tw : 1 - tw; g.fillStyle = 'rgba(' + base + ((q > 1 ? 0.78 : 0.38) * (0.55 + 0.45 * ph) * alive).toFixed(2) + ')'; g.beginPath();
        const ix = LIX[q]; for (let j = 0; j < n; j++) { const i = ix[j]; g.rect(SXa[i] - h, SYa[i] - h, sz, sz); } g.fill();
        if (q > 1) { g.fillStyle = 'rgba(' + base + (0.07 * alive).toFixed(2) + ')'; g.beginPath(); for (let j = 0; j < n; j++) { const i = ix[j]; g.rect(SXa[i] - 2.4, SYa[i] - 2.4, 4.8, 4.8); } g.fill(); }
      }
    }
    // ---- day / night terminator: a soft, nested night crescent (the sun sits upper-left in view space and drifts slowly)
    {
      g.globalCompositeOperation = 'source-over'; g.save(); g.translate(cx, cy); g.rotate(Math.atan2(-syv, sxv));
      const nest = lq > 2 ? 1 : TIER >= 3 && lq < 2 ? 6 : 3, rr = R * 0.996;
      g.fillStyle = km > 0.5 ? 'rgba(20,0,6,' : 'rgba(2,5,24,';
      for (let q = 0; q < nest; q++) {
        const k = nest === 1 ? kz : nest === 6 ? kz + (1 - q * 0.4) * 0.17 : kz + (1 - q) * 0.17;
        g.globalAlpha = nest === 1 ? 0.3 : nest === 6 ? 0.075 : 0.13; g.beginPath(); g.arc(0, 0, rr, -Math.PI / 2, Math.PI / 2, true);
        for (let i = 0; i < TN; i++) g.lineTo(-k * rr * TC[i], rr * TS[i]);
        g.closePath(); g.fillStyle = km > 0.5 ? '#14000a' : '#02051a'; g.fill();
      }
      g.restore(); g.globalAlpha = 1; g.globalCompositeOperation = 'lighter';
      if (TIER >= 2 && alive > 0.02) { // sun side: warm bloom on the limb + a hairline of sunlight
        const ang = Math.atan2(-syv, sxv), gs = R * 1.5, wx = cx + Math.cos(ang) * R * 0.88, wy = cy + Math.sin(ang) * R * 0.88;
        g.globalAlpha = 0.3 * alive; g.drawImage(WARM, wx - gs / 2, wy - gs / 2, gs, gs);
        g.lineWidth = 1.6; g.strokeStyle = 'rgba(255,214,160,' + (0.5 * alive).toFixed(2) + ')'; g.beginPath(); g.arc(cx, cy, R * 1.006, ang - 0.85, ang + 0.85); g.stroke();
        g.lineWidth = 6; g.strokeStyle = 'rgba(255,170,100,' + (0.1 * alive).toFixed(2) + ')'; g.beginPath(); g.arc(cx, cy, R * 1.012, ang - 0.7, ang + 0.7); g.stroke(); g.globalAlpha = 1;
      }
    }
    // ---- aurora ribbons over the upper hemisphere
    if (alive > 0.02) {
      for (let r = 0; r < AUR.length; r++) {
        const A = AUR[r];
        for (let i = 0; i < AM; i++) {
          const s = i / (AM - 1), lat = (A.lat + A.amp * Math.sin(s * 4.3 + t * 0.35 + A.ph)) * D2R, lon = (A.lon + s * A.span + t * A.spd) * D2R, cl = Math.cos(lat);
          const vx = cl * Math.sin(lon), vy = Math.sin(lat), vz = cl * Math.cos(lon);
          const hh = A.h * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(s * 7.1 - t * 0.9 + A.ph))) * Math.pow(Math.sin(Math.PI * s), 0.7), r0 = 1.025, r1 = r0 + hh;
          const bx = vx * r0, by = vy * r0, bz = vz * r0, tx = vx * r1, ty = vy * r1, tz = vz * r1;
          const b1 = bx * cyw + bz * syw, bz1 = -bx * syw + bz * cyw, b2 = by * ct - bz1 * st, bzz = by * st + bz1 * ct;
          const t1 = tx * cyw + tz * syw, tz1 = -tx * syw + tz * cyw, t2 = ty * ct - tz1 * st;
          ABX[i] = cx + R * b1; ABY[i] = cy - R * b2; ATX[i] = cx + R * t1; ATY[i] = cy - R * t2;
          AV[i] = bzz > -0.04 || b1 * b1 + b2 * b2 > 1.02 ? 1 : 0;
        }
        for (let l = 0; l < 3; l++) {
          if (l === 1 && lq > 2) continue;
          g.fillStyle = A.fs[l]; g.globalAlpha = alive; g.beginPath();
          for (let i = 0; i < AM - 1; i++) {
            if (!AV[i] || !AV[i + 1]) continue; const f = AFR[l];
            g.moveTo(ABX[i], ABY[i]); g.lineTo(ABX[i + 1], ABY[i + 1]); g.lineTo(ABX[i + 1] + (ATX[i + 1] - ABX[i + 1]) * f, ABY[i + 1] + (ATY[i + 1] - ABY[i + 1]) * f); g.lineTo(ABX[i] + (ATX[i] - ABX[i]) * f, ABY[i] + (ATY[i] - ABY[i]) * f); g.closePath();
          }
          g.fill();
        }
        g.strokeStyle = A.ridge; g.globalAlpha = alive; g.lineWidth = 1.3; g.beginPath(); let pen = false;
        for (let i = 0; i < AM; i++) { if (AV[i]) { if (!pen) { g.moveTo(ABX[i], ABY[i]); pen = true; } else g.lineTo(ABX[i], ABY[i]); } else pen = false; }
        g.stroke();
      }
      g.globalAlpha = 1;
    }
    // ---- radar sweep: one parallel scans pole to pole every ~9 s
    {
      const sp = (t % 9) / 6;
      if (sp < 1 && alive > 0.05) {
        const lat = (-72 + 144 * sp) * D2R, cl = Math.cos(lat), sl = Math.sin(lat), fade = Math.sin(Math.PI * sp);
        for (let pass = 0; pass < 2; pass++) {
          g.strokeStyle = pass ? 'rgb(190,250,255)' : 'rgb(59,224,255)'; g.globalAlpha = (pass ? 0.7 : 0.16) * fade * alive; g.lineWidth = pass ? 1.2 : 7; g.beginPath(); let pen = false;
          for (let i = 0; i <= 64; i++) {
            const lo = (i / 64) * TAU, x = cl * Math.sin(lo), z = cl * Math.cos(lo), x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw, y2 = sl * ct - z1 * st, z2 = sl * st + z1 * ct;
            if (z2 > 0) { if (!pen) { g.moveTo(cx + R * x1, cy - R * y2); pen = true; } else g.lineTo(cx + R * x1, cy - R * y2); } else pen = false;
          }
          g.stroke();
        }
        g.globalAlpha = 1;
      }
    }
    // ---- rim comets
    for (let c = 0; c < 2; c++) {
      const a0 = t * (c ? -0.33 : 0.5) + c * 2.4, cs = COMET[km > 0.5 ? 1 : 0][c];
      for (let j = 0; j < (lq > 2 ? 4 : 7); j++) {
        g.strokeStyle = cs[j]; g.lineWidth = 2.4 - j * 0.15; g.beginPath();
        if (c) g.arc(cx, cy, R * 1.008, a0 + j * 0.1, a0 + j * 0.1 + 0.11); else g.arc(cx, cy, R * 1.008, a0 - (j + 1) * 0.1, a0 - j * 0.1);
        g.stroke();
      }
    }
    // ---- ambient traffic + arcs
    if (!killed) {
      ambient -= dt;
      if (ambient < 0) { ambient = rnd(0.14, 0.42); const ai = (Math.random() * ARCS.length) | 0, col = AMB_COL[(Math.random() * 6) | 0]; if (spawn(0, ai, col, rnd(0.3, 0.55), Math.random() < 0.5, 1.1)) ARCS[ai].lit = Math.min(1, ARCS[ai].lit + 0.4); }
    }
    for (let a = 0; a < ARCS.length; a++) {
      const A = ARCS[a], pts = A.pts; A.lit = Math.max(0, A.lit - dt * 0.42);
      for (let i = 0; i <= ARC_SEG; i++) {
        const x = pts[i * 3], y = pts[i * 3 + 1], z = pts[i * 3 + 2], x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw, y2 = y * ct - z1 * st, z2 = y * st + z1 * ct;
        A.sx[i] = cx + R * x1; A.sy[i] = cy - R * y2; A.sz[i] = z2; A.vis[i] = z2 > 0.01 || x1 * x1 + y2 * y2 > 1.0 ? 1 : 0;
      }
      g.strokeStyle = km > 0.5 ? COLS[7] : COLS[A.col];
      const np = TIER >= 3 && lq < 2 && A.lit > 0.08 ? 3 : 2;
      for (let pass = 0; pass < np; pass++) {
        if (pass === 2) { g.lineWidth = 16; g.globalAlpha = 0.07 * A.lit * (1 - 0.7 * km); } else {
        g.lineWidth = pass ? 1.3 + A.lit * 0.8 : 6.5; g.globalAlpha = pass ? (0.34 + 0.6 * A.lit) * (1 - 0.7 * km) : (0.07 + 0.2 * A.lit) * (1 - 0.7 * km); }
        g.beginPath(); let pen = false;
        for (let i = 0; i <= ARC_SEG; i++) { if (A.vis[i]) { if (!pen) { g.moveTo(A.sx[i], A.sy[i]); pen = true; } else g.lineTo(A.sx[i], A.sy[i]); } else pen = false; }
        g.stroke();
      }
    }
    g.globalAlpha = 1;
    // ---- packets (arc packets + beam bursts)
    for (let k = 0; k < POOL.length; k++) {
      const p = POOL[k]; if (!p.on) continue;
      if (killed) { p.on = 0; continue; }
      p.t += p.spd * dt; if (p.t >= 1) { p.on = 0; if (p.kind === 0) { ARCS[p.idx].lit = Math.min(1, ARCS[p.idx].lit + 0.3); const c = p.rev ? ARCS[p.idx].a : ARCS[p.idx].b; FL[c] = Math.min(1, FL[c] + 0.8); if (TIER >= 2) ripple(c, p.col); } continue; }
      if (p.kind === 0) {
        const A = ARCS[p.idx], tt = p.rev ? 1 - p.t : p.t, f = tt * ARC_SEG, i0 = Math.min(ARC_SEG - 1, f | 0), fr = f - i0;
        if (!A.vis[i0] || !A.vis[i0 + 1]) continue;
        const x = A.sx[i0] + (A.sx[i0 + 1] - A.sx[i0]) * fr, y = A.sy[i0] + (A.sy[i0 + 1] - A.sy[i0]) * fr;
        const dir = p.rev ? 1 : -1, nT = lq > 2 ? 4 : TIER >= 3 && lq < 2 ? 12 : 8; let ox = x, oy = y; g.strokeStyle = COLS[p.col]; g.lineCap = 'round';
        for (let j = 1; j <= nT; j++) {
          const tf = clamp(tt + dir * j * 0.02, 0, 1) * ARC_SEG, i1 = Math.min(ARC_SEG - 1, tf | 0), f1 = tf - i1; if (!A.vis[i1] || !A.vis[i1 + 1]) break;
          const nx = A.sx[i1] + (A.sx[i1 + 1] - A.sx[i1]) * f1, ny = A.sy[i1] + (A.sy[i1 + 1] - A.sy[i1]) * f1, k = 1 - j / (nT + 1);
          g.globalAlpha = 0.75 * k * k; g.lineWidth = 0.6 + 2.4 * k; g.beginPath(); g.moveTo(ox, oy); g.lineTo(nx, ny); g.stroke(); ox = nx; oy = ny;
        }
        g.lineCap = 'butt';
        g.globalAlpha = 1; const sz = 22 * p.sz; g.drawImage(SPR[p.col], x - sz / 2, y - sz / 2, sz, sz);
        if (TIER >= 3 && lq < 2) { const bz = sz * 2.1; g.globalAlpha = 0.3; g.drawImage(SPR[p.col], x - bz / 2, y - bz / 2, bz, bz); g.globalAlpha = 1; }
      } else {
        const B = BEAMS[p.idx]; if (!B) continue; const f = p.t * 40, i0 = Math.min(39, f | 0), fr = f - i0, q = B.pts;
        const x = q[i0 * 2] + (q[i0 * 2 + 2] - q[i0 * 2]) * fr, y = q[i0 * 2 + 1] + (q[i0 * 2 + 3] - q[i0 * 2 + 1]) * fr, sz = 26 * p.sz;
        beamTail(q, i0, x, y, -1, lq > 2 ? 4 : 8, p.col, 0.7); g.globalAlpha = 1;
        g.drawImage(SPR[p.col], x - sz / 2, y - sz / 2, sz, sz);
      }
    }
    g.globalAlpha = 1;
    // ---- venue markers
    g.font = fontStr; g.textBaseline = 'middle'; if ('letterSpacing' in g) g.letterSpacing = '1.2px';
    const mcol = km > 0.5 ? COLS[7] : COLS[3];
    for (let i = 0; i < CITIES.length; i++) {
      const v = CITIES[i].v, x = v[0], y = v[1], z = v[2], x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw, y2 = y * ct - z1 * st, z2 = y * st + z1 * ct;
      const sx = cx + R * x1, sy = cy - R * y2; MX[i] = sx; MY[i] = sy; MZ[i] = z2; FL[i] = Math.max(0, FL[i] - dt * 1.5);
      if (z2 < 0.02) continue;
      const fa = clamp(z2 * 2.4, 0, 1), fl = FL[i], ang = Math.atan2(sy - cy, sx - cx) + Math.PI / 2;
      g.strokeStyle = mcol; g.lineWidth = 1.2;
      for (let k = 0; k < 2; k++) {
        const ph = (t * 0.5 + i * 0.41 + k * 0.5) % 1, rr = (3 + ph * 15) * (0.8 + 0.2 * dotK) + fl * 4;
        g.globalAlpha = (1 - ph) * 0.75 * fa * (0.5 + fl); g.beginPath(); g.ellipse(sx, sy, rr, rr * (0.3 + 0.7 * z2), ang, 0, TAU); g.stroke();
      }
      g.globalAlpha = fa; const gs = 22 + fl * 22; g.drawImage(SPR[km > 0.5 ? 7 : 3], sx - gs / 2, sy - gs / 2, gs, gs);
      g.globalCompositeOperation = 'source-over'; g.fillStyle = '#fff'; g.fillRect(sx - 1.5, sy - 1.5, 3, 3);
      if (z2 > 0.28 && !(compact && z2 < 0.45)) {
        const dx = sx - cx, dy = sy - cy, dl = Math.hypot(dx, dy) || 1, nx = dx / dl, ny = dy / dl, lx = sx + nx * 15, ly = sy + ny * 12 - 3;
        g.globalAlpha = fa * (0.65 + 0.35 * fl); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(sx + nx * 3, sy + ny * 3); g.lineTo(lx - nx * 2, ly + 3); g.stroke();
        g.textAlign = nx > 0.35 ? 'left' : nx < -0.35 ? 'right' : 'center'; const tx = lx + (nx > 0.35 ? 1 : nx < -0.35 ? -1 : 0);
        g.lineWidth = 3; g.strokeStyle = 'rgba(4,2,10,.9)'; g.strokeText(CITIES[i].c, tx, ly); g.fillStyle = fl > 0.2 ? '#fff' : '#d8e8ff'; g.fillText(CITIES[i].c, tx, ly);
      }
      g.globalCompositeOperation = 'lighter';
    }
    g.globalAlpha = 1;
    // ---- impact ripples: rings expanding over the sphere surface where packets land on a venue
    for (let r = 0; r < RP.length; r++) {
      const p = RP[r]; if (!p.on) continue;
      p.t += dt * 0.85; if (p.t >= 1 || killed) { p.on = 0; continue; }
      const c = p.c, z2 = MZ[c]; if (z2 < 0.06) continue;
      const sx = MX[c], sy = MY[c], ang = Math.atan2(sy - cy, sx - cx) + Math.PI / 2, fa = clamp(z2 * 2.4, 0, 1); g.strokeStyle = COLS[p.col];
      for (let k = 0; k < 2; k++) {
        const ph = clamp(p.t - k * 0.2, 0, 1); if (ph <= 0) continue; const rr = 5 + ph * R * (k ? 0.17 : 0.24), u = 1 - ph;
        g.globalAlpha = u * u * 0.85 * fa; g.lineWidth = 0.6 + 2.2 * u; g.beginPath(); g.ellipse(sx, sy, rr, rr * (0.25 + 0.75 * z2), ang, 0, TAU); g.stroke();
      }
    }
    g.globalAlpha = 1;
    if (TIER >= 2) { // ring system, front half + satellites with trails
      g.globalCompositeOperation = 'source-over'; g.lineWidth = 1; g.strokeStyle = km > 0.5 ? 'rgba(255,150,160,.18)' : 'rgba(170,200,255,.18)';
      for (let r = 0; r < RINGS.length; r++) { const rg = RINGS[r]; g.beginPath(); g.ellipse(cx, cy, rg.k * R, rg.k * R * rg.m, rg.rot, 0, Math.PI); g.stroke(); }
      if (TIER >= 3 && lq < 2) {
        g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
        for (let r = 0; r < RINGS.length; r++) {
          const rg = RINGS[r];
          for (let s = 0; s < 2; s++) {
            const a = t * rg.sp[s] + s * 3.1 + r * 1.3, dr = rg.sp[s] > 0 ? 1 : -1; ringPt(rg, a); let ox = _px, oy = _py; const vis = _pf;
            g.strokeStyle = km > 0.5 ? '#ff9aa4' : '#cfe6ff';
            for (let j = 1; j <= 5; j++) { ringPt(rg, a - dr * j * 0.045); if (_pf && vis) { g.globalAlpha = 0.6 * (1 - j / 6); g.lineWidth = 1.5 - j * 0.2; g.beginPath(); g.moveTo(ox, oy); g.lineTo(_px, _py); g.stroke(); } ox = _px; oy = _py; }
            ringPt(rg, a); if (_pf) { g.globalAlpha = 0.95; g.fillStyle = '#fff'; g.fillRect(_px - 1.2, _py - 1.2, 2.4, 2.4); g.globalAlpha = 0.5; g.drawImage(SPR[km > 0.5 ? 7 : 3], _px - 7, _py - 7, 14, 14); }
          }
        }
        g.lineCap = 'butt'; g.globalAlpha = 1;
      }
    }
    // ---- agent orbs: light halos (+ a soft reflection on the globe for the ones passing in front of it)
    if (TIER >= 2 && alive > 0.02) {
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < OB.length; i++) {
        const o = OB[i], dd = o.d * 0.5 + 0.5, sc = (0.66 + 0.34 * dd) * (1 + 0.26 * o.act), hs = OB_OS * 3.1 * sc, ox = o.x, oy = o.y, al = (0.2 + 0.5 * o.act) * (0.5 + 0.5 * dd) * alive;
        g.globalAlpha = al; g.drawImage(SPR[AGCOL[i]], ox - hs / 2, oy - hs / 2, hs, hs);
        if (o.d > 0.05 && TIER >= 2) {
          const dx = cx - ox, dy = cy - oy, dist = Math.hypot(dx, dy) || 1;
          if (dist < R * 1.5) {
            const k = Math.min(0.5, (dist - R * 0.5) / dist), rxp = ox + dx * Math.max(0.15, k), ryp = oy + dy * Math.max(0.15, k), rs = R * (0.5 + 0.2 * o.act);
            g.globalAlpha = (0.14 + 0.2 * o.act) * alive * clamp(1.4 - dist / (R * 1.3), 0.15, 1); g.drawImage(SPR[AGCOL[i]], rxp - rs / 2, ryp - rs / 2, rs, rs);
          }
        }
      }
      g.globalAlpha = 1;
    }
    // ---- orbit track, front half (over the globe)
    g.globalCompositeOperation = 'source-over'; g.setLineDash(DASH); g.lineWidth = 1; g.strokeStyle = km > 0.5 ? 'rgba(255,150,160,.34)' : 'rgba(190,215,255,.34)';
    g.beginPath(); g.ellipse(OB_X, OB_Y, OB_RX, OB_RY, OB_ROT, 0, Math.PI); g.stroke(); g.setLineDash(EMPTY);
    // ---- beams: globe -> ticket port, feeds -> globe
    g.globalCompositeOperation = 'lighter';
    for (let b = 0; b < BEAMS.length; b++) {
      const B = BEAMS[b], al = B.al * (0.6 + 0.4 * Math.sin(t * 0.9 + B.off * 6));
      if (alive > 0.01) { g.strokeStyle = B.gN; if (lq < 3) { g.lineWidth = B.w * 6; g.globalAlpha = al * 0.15 * alive; g.stroke(B.path); } g.lineWidth = B.w * 1.2; g.globalAlpha = al * 0.9 * alive; g.stroke(B.path); }
      if (km > 0.01) { g.strokeStyle = B.gK; g.lineWidth = B.w; g.globalAlpha = al * 0.32 * km; g.stroke(B.path); }
      if (!killed) {
        const u = (t * B.spd + B.off) % 1, f = u * 40, i0 = Math.min(39, f | 0), fr = f - i0, q = B.pts, x = q[i0 * 2] + (q[i0 * 2 + 2] - q[i0 * 2]) * fr, y = q[i0 * 2 + 1] + (q[i0 * 2 + 3] - q[i0 * 2 + 1]) * fr;
        beamTail(q, i0, x, y, B.dir >= 0 ? -1 : 1, lq > 2 ? 4 : 7, B.col, 0.7 * al * (B.wide ? 1 : 0.8)); g.globalAlpha = 0.9 * (B.wide ? 1 : 0.7); const sz = 20 + (B.wide ? 6 : 0); g.drawImage(SPR[B.col], x - sz / 2, y - sz / 2, sz, sz);
      }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  /** tapered comet tail along a bezier polyline (pts = flat x,y; i0 = segment of the head; sgn -1 trails toward index 0) */
  function beamTail(q, i0, x, y, sgn, n, col, a0) {
    let ox = x, oy = y; g.strokeStyle = COLS[col]; g.lineCap = 'round';
    for (let j = 1; j <= n; j++) {
      const ii = sgn < 0 ? i0 - j + 1 : i0 + j; if (ii < 0 || ii > 40) break;
      const nx = q[ii * 2], ny = q[ii * 2 + 1], k = 1 - j / (n + 1);
      g.globalAlpha = a0 * k * k; g.lineWidth = 0.6 + 2.2 * k; g.beginPath(); g.moveTo(ox, oy); g.lineTo(nx, ny); g.stroke(); ox = nx; oy = ny;
    }
    g.lineCap = 'butt';
  }
  let slowAcc = 0;

  /* ================================================================ orbiting DOM agents ================================================================ */
  const OB = J.$$('.dkw-ob', stage).map((el, i) => ({ el, i, key: el.dataset.k, act: 0, rx: 0, z: 0, d: 0, label: J.$('em', el), orb: J.$('.orb', el), ex: 99, ey: 99, x: 0, y: 0, tx: 1e9, ty: 0, ts: 0, to: -1 }));
  const JV = { el: J.$('#dkw-jv'), x: 0, y: 0, tx: 1e9, ty: 0, ts: 0, to: -1, vis: 0 };
  // transform / opacity are written only when they change at 0.5 px / 0.0025 scale / 0.01 opacity resolution (opacity changes ~once per 10 frames)
  function put(o, x, y, sc, op) {
    const tx = Math.round(x * 2), ty = Math.round(y * 2), ts = Math.round(sc * 400), to = Math.round(op * 100);
    if (tx !== o.tx || ty !== o.ty || ts !== o.ts) { o.tx = tx; o.ty = ty; o.ts = ts; o.el.style.transform = 'translate3d(' + tx / 2 + 'px,' + ty / 2 + 'px,0) scale(' + ts / 400 + ')'; }
    if (to !== o.to) { o.to = to; o.el.style.opacity = to / 100; }
  }
  const OBK = {}; OB.forEach((o) => (OBK[o.key] = o));
  function orbits(t, dt) {
    const a0 = t * 0.27, cr = Math.cos(OB_ROT), sr = Math.sin(OB_ROT), step = Math.min(1, dt * 6), on = activeKey();
    for (let i = 0; i < OB.length; i++) {
      const o = OB[i], a = a0 + i * (TAU / OB.length), ex = OB_RX * Math.cos(a), ey = OB_RY * Math.sin(a), d = Math.sin(a);
      const x = OB_X + ex * cr - ey * sr, y = OB_Y + ex * sr + ey * cr;
      o.act += ((o.key === on ? 1 : 0) - o.act) * step; o.x = x; o.y = y; o.d = d;
      if (o.rx > 0) o.rx = Math.max(0, o.rx - dt * 1.6);
      const pinned = ST.pin === o.key, sc = (0.66 + 0.34 * (d * 0.5 + 0.5)) * (1 + 0.26 * o.act + 0.2 * o.rx * o.rx), op = pinned ? 1 : 0.58 + 0.42 * (d * 0.5 + 0.5);
      put(o, x - SX, y - SY + Math.sin(t * 1.3 + i * 1.7) * 2.6 * (0.5 + 0.5 * o.act + 0.3), sc, op);
      const z = pinned ? 3 : d > 0 ? (o.act > 0.5 ? 3 : 2) : 0; if (z !== o.z) { o.z = z; o.el.style.zIndex = z; }
    }
    tipPlace(dt);
    // jev: every ~16 s a big white orb sweeps across the front of the globe
    const cyc = 16, ph = J.reduce ? 0.8 : (t % cyc) / 7.5, dirn = J.reduce ? 1 : Math.floor(t / cyc) % 2 ? -1 : 1;
    if (ph < 1) {
      const e = ph * ph * (3 - 2 * ph), s = Math.sin(Math.PI * ph), x = OB_X + dirn * lerp(-1.18, 1.08, e) * OB_RX * 0.86, y = OB_Y + R * (0.5 - 0.22 * s) + (dirn > 0 ? 0 : 6);
      put(JV, x - SX, y - SY, 0.5 + 1.0 * Math.pow(s, 0.8), clamp(s * 2.4, 0, 1)); JV.vis = 1;
    } else if (JV.vis) { JV.el.style.opacity = '0'; JV.to = 0; JV.vis = 0; }
  }
  /* venue tooltip: follows the marker of the hovered / faced venue, fades out behind the limb */
  const TIP = { el: J.$('#dkw-tip'), n: J.$('#dkw-tip-n'), c: J.$('#dkw-tip-c'), l: J.$('#dkw-tip-l'), s: J.$('#dkw-tip-s'), city: -1, a: 0, w: 150, h: 60, tx: 1e9, ty: 0, to: -1 };
  const FDC = {}; FD.forEach((f) => (FDC[f.city] = f));
  function tipText() {
    const f = FDC[TIP.city]; if (!f) return;
    txt(TIP.n, f.k); txt(TIP.c, CITIES[f.city].c.toLowerCase()); txt(TIP.l, Math.round(f.lat) + 'ms');
    const lc = f.lat < 40 ? '' : f.lat < 70 ? 'm' : 's'; if (TIP.l.className !== lc) TIP.l.className = lc;
    txt(TIP.s, J.sgn((f.price / J.market.price - 1) * 1e4, 1) + 'bp');
  }
  function tipPlace(dt) {
    const c = hoverCity >= 0 ? hoverCity : focusCity;
    if (c !== TIP.city) { TIP.city = c; if (c >= 0) { tipText(); TIP.w = TIP.el.offsetWidth || 150; TIP.h = TIP.el.offsetHeight || 60; } }
    const tgt = c >= 0 ? clamp((MZ[c] - 0.12) * 5, 0, 1) : 0;
    TIP.a += (tgt - TIP.a) * Math.min(1, dt * 12); if (Math.abs(tgt - TIP.a) < 0.01) TIP.a = tgt;
    const o = Math.round(TIP.a * 100);
    if (o !== TIP.to) { TIP.to = o; TIP.el.style.opacity = o / 100; }
    if (c < 0 || o === 0) return;
    let x = MX[c] - SX + 16, y = MY[c] - SY - TIP.h - 10;
    if (x + TIP.w > SW - 4) x = MX[c] - SX - 16 - TIP.w;
    if (y < 18) y = MY[c] - SY + 16;
    x = Math.max(2, x);
    const tx = Math.round(x * 2), ty = Math.round(y * 2);
    if (tx !== TIP.tx || ty !== TIP.ty) { TIP.tx = tx; TIP.ty = ty; TIP.el.style.transform = 'translate3d(' + tx / 2 + 'px,' + ty / 2 + 'px,0)'; }
  }
  // an agent's step lands: the orbit orb pops (scale via rx, brightness pulse) and the eyes of every copy of that agent widen
  const EYES = {};
  function react(k) {
    const o = OBK[k]; o.rx = 1;
    const ev = EYES[k] || (EYES[k] = [OBK[k].orb, TAB[k].el, ROW[k].el].map((e) => J.$$('.e', e)).flat());
    for (let i = 0; i < ev.length; i++) J.animate(ev[i], [{ scale: '1 1' }, { scale: '1.35 1.55', offset: 0.22 }, { scale: '1 1' }], { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)' });
    J.animate(o.orb, [{ filter: 'brightness(1.7) saturate(1.3)' }, { filter: 'none' }], { duration: 600, easing: 'ease-out' });
  }
  function slow() {
    if (TIP.city >= 0 && TIP.a > 0) tipText();
    // eyes follow the globe (≤4 Hz) + countdown text
    for (let i = 0; i < OB.length; i++) {
      const o = OB[i], dx = OB_X - o.x, dy = OB_Y - o.y, dl = Math.hypot(dx, dy) || 1, ex = Math.round((dx / dl) * 3) / 2, ey = Math.round((dy / dl) * 3) / 2;
      if (J.reduce && (ex !== o.ex || ey !== o.ey)) { o.ex = ex; o.ey = ey; o.orb.style.setProperty('--ex', ex + 'px'); o.orb.style.setProperty('--ey', ey + 'px'); }
    }
    tickCd();
  }

  /* ================================================================ ticket in flight + the six agents ================================================================ */
  const hexRgb = (h) => { const n = parseInt(h.slice(1), 16); return (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255); };
  const T = {
    id: J.$('#dkw-tid'), tk: J.$('#dkw-tk'), side: J.$('#dkw-side'), sym: J.$('#dkw-sym'), dest: J.$('#dkw-dest'), not: J.$('#dkw-not'), edge: J.$('#dkw-edge'), sz: J.$('#dkw-sz'), px: J.$('#dkw-px'), cf: J.$('#dkw-cf'),
    rail: J.$('#dkw-rail'), tl: J.$('.dkw-tl', root), sds: J.$$('.dkw-sd', root), now: J.$('.dkw-now', root), nowO: J.$('#dkw-now-o'), nowN: J.$('#dkw-now-n'), nowV: J.$('#dkw-now-v'), nowX: J.$('#dkw-now-x'),
    cd: J.$('#dkw-cd'), cdf: J.$('#dkw-cdf'), stn: J.$('#dkw-stn'), stv: J.$('#dkw-stv'), loop: J.$('#dkw-loop'),
  };
  const TAB = {}, ROW = {};
  J.$$('.dkw-tab', tabsEl).forEach((el) => (TAB[el.dataset.k] = { el, ts: J.$('.dkw-ts', el) }));
  J.$$('.dkw-ar', root).forEach((el) => (ROW[el.dataset.k] = { el, v: J.$('.dkw-av', el), bar: J.$('.dkw-ab i', el), an: J.$('.dkw-an i', el), role: J.$('.dkw-an i', el).textContent }));
  const ST = { step: -1, loop: 14, tk: null, ttl: 104, t0: 0, dur: 1000, pnl: 0, pin: null, working: -1, status: AGK.map(() => 'idle'), alt: 0 };
  const LAST = {}, SIDE = { buy: 'buy', sell: 'sell', close: 'close', flatten: 'flat' };
  const ORBC = { spotter: 'green', prior: 'amber', edge: 'pink', kelly: 'violet', taker: 'blue', closer: 'orange' };
  const AGCOL = [4, 0, 2, 5, 3, 6], AMB_COL = [0, 1, 2, 3, 0, 2];
  const activeKey = () => ST.pin || (ST.working >= 0 ? AGK[ST.working] : null);
  const flash = (el) => { const a = el.classList.contains('ha'); el.classList.remove(a ? 'ha' : 'hb'); el.classList.add(a ? 'hb' : 'ha'); };

  /* presentation is skipped while neither the card nor the tab strip is on screen (or the tab is hidden): the state machine keeps running, `dirty` marks that
   * the DOM lags it, and resync() repaints everything from state when the strip comes back into view */
  const live = () => (cardIn || tabsIn) && !document.hidden;
  let dirty = false, nowKey = '', railN = -1;
  const PA = AGK.map(() => ({ on: null, pin: null })); // what the DOM currently shows per agent

  function paintStatus(i) {
    const k = AGK[i], s = ST.status[i], tb = TAB[k].el;
    if (tb.dataset.st !== s) { tb.dataset.st = s; ROW[k].el.dataset.st = s; }
    txt(TAB[k].ts, s);
  }
  function setStatus(i, s) {
    if (ST.status[i] === s) return;
    ST.status[i] = s;
    if (live()) paintStatus(i); else dirty = true;
  }
  function paintNow() {
    const key = activeKey() || AGK[0], i = AGI[key], ev = LAST[key];
    const cn = 'orb ' + ORBC[key]; if (T.nowO.className !== cn) T.nowO.className = cn;
    if (nowKey !== key) { nowKey = key; T.now.style.setProperty('--ac-rgb', hexRgb(AG[i].col)); }
    txt(T.nowN, key); txt(T.nowV, ST.status[i] === 'halted' ? 'halted · read-only' : ev ? VERB[i].toLowerCase() : 'idle'); txt(T.nowX, ev ? ev.chip : '—');
  }
  /** highlight / pin state: only the agents whose state changed since the last paint touch the DOM */
  function applyOn() {
    const on = activeKey();
    for (let i = 0; i < AGK.length; i++) {
      const k = AGK[i], isOn = k === on, pinned = ST.pin === k, p = PA[i];
      if (p.on !== isOn) { p.on = isOn; TAB[k].el.classList.toggle('is-on', isOn); ROW[k].el.classList.toggle('is-on', isOn); OBK[k].el.classList.toggle('is-on', isOn); }
      if (p.pin !== pinned) { p.pin = pinned; const v = String(pinned); TAB[k].el.classList.toggle('is-pin', pinned); TAB[k].el.setAttribute('aria-pressed', v); ROW[k].el.setAttribute('aria-pressed', v); }
    }
    paintNow();
  }
  function togglePin(k) { ST.pin = ST.pin === k ? null : k; applyOn(); }

  function synth() { for (let i = 0; i < 60; i++) { const d = J.makeDecision(); if (d.dest === 'execute') return d; } return null; }
  function paintTicket(d) {
    const s = d.state, sol = d.symbol === 'SOL-PERP', notional = (CAP * d.size) / 100, sd = SIDE[d.action] || d.action, trade = d.action === 'buy' || d.action === 'sell', net = Math.abs(d.net || 0);
    txt(T.id, '#' + String(d.id).slice(0, 4)); txt(T.sym, d.symbol.toLowerCase()); txt(T.side, sd); if (T.side.dataset.s !== sd) T.side.dataset.s = sd; txt(T.dest, d.dest);
    txt(T.not, fmt(Math.round(notional))); txt(T.edge, trade ? '+' + net.toFixed(1) + 'bp edge' : 'reduce risk'); if (T.edge.className) T.edge.className = '';
    txt(T.sz, d.size + '%'); txt(T.px, fmt(s.price, sol ? 2 : 1)); txt(T.cf, d.conf.toFixed(2));
  }
  function renderTicket(d) {
    const notional = (CAP * d.size) / 100, net = Math.abs(d.net || 0);
    ST.ttl = J.ri(88, 132);
    const win = Math.random() < 0.58, mag = notional * (net * 1e-4 * rnd(0.5, 1.4) + 0.00006 + Math.random() * 0.00018);
    ST.pnl = win ? mag : -mag * rnd(0.5, 1.1);
    ST.alt ^= 1;
    if (live()) { paintTicket(d); T.tk.className = 'dkw-tk ' + (ST.alt ? 'fa' : 'fb'); if ((J.tier || 2) >= 2) J.animate(T.not, [{ transform: 'translateY(55%)', opacity: 0.1 }, { transform: 'none', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' }); } else dirty = true; // (the fly-in flash only plays while it can be seen)
  }
  function adopt() {
    let d = null;
    if (!J.S.killed) { for (let i = 0; i < J.recent.length; i++) if (J.recent[i].dest === 'execute') { d = J.recent[i]; break; } if (!d) d = synth(); }
    if (!d) d = ST.tk;
    if (!d) { for (let i = 0; i < J.recent.length; i++) if (J.recent[i].dest === 'execute') { d = J.recent[i]; break; } }
    if (!d) return false;
    ST.tk = d; renderTicket(d); return true;
  }
  let cpLast = '';
  function tickCd() {
    if (killed || ST.step < 0) return;
    const frac = clamp((performance.now() - ST.t0) / ST.dur, 0, 1), prog = Math.min(1, (ST.step + frac) / 6), left = Math.max(0, Math.round(ST.ttl * (1 - prog)));
    txt(T.cd, Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0')); const cp = (1 - prog).toFixed(3); if (cp !== cpLast) { cpLast = cp; T.cdf.style.setProperty('--cp', cp); }
  }
  function bestFeed(sell) { let b = FD[0]; for (let i = 1; i < FD.length; i++) if (sell ? FD[i].price > b.price : FD[i].price < b.price) b = FD[i]; return b; }

  /** what each agent says about the current ticket (simulated, terse, lowercase) */
  function describe(i, kd) {
    const d = ST.tk;
    if (!d) return { text: 'warming up the books', chip: '—' };
    const s = d.state, sym = d.symbol.toLowerCase(), sd = SIDE[d.action] || d.action, sell = d.action === 'sell', f = bestFeed(sell);
    switch (i) {
      case 0: return { text: kd ? 'scan only · kill switch holds every order' : 'scanned 8 books · best ' + (sell ? 'bid ' : 'ask ') + f.k + ' ' + fmt(f.price, 1), chip: CITIES[f.city].c, city: f.city };
      case 1: { const p = clamp(0.5 + ((d.p[d.action] || d.conf) - 0.5) * 0.42 + J.gauss() * 0.015, 0.52, 0.9); return { text: kd ? 'prior refreshed · nothing sent' : 'prior ' + d.action + ' p ' + p.toFixed(2) + ' · ' + fmt(J.ri(420, 1840)) + ' similar books', chip: p.toFixed(2).replace('0.', '.') }; }
      case 2: { const n = Math.abs(d.net || 0); return { text: kd ? 'edge priced · routed to human review' : 'edge +' + n.toFixed(1) + 'bps net of costs · ' + s.regime, chip: '+' + n.toFixed(1) }; }
      case 3: return { text: 'size ' + d.size + '% of capital · cap ' + J.RULES.maxPos + '% · risk_ok ' + (d.riskOk ? 'yes' : 'no'), chip: d.size + '%' };
      case 4: { const slip = 0.15 + s.spread_bps * 0.25 + Math.random() * 0.2; return { text: 'crossed ' + s.spread_bps.toFixed(1) + 'bps spread · ' + sd + ' ' + d.size + '% ' + sym + ' on ' + f.k, chip: slip.toFixed(1) + 'bp', city: f.city }; }
      default: { const p = ST.pnl; return { text: 'closed ' + sym + ' at ' + (p >= 0 ? 'target' : 'stop') + ' · ' + (p >= 0 ? '+' : '') + J.usd(p, 2), chip: (p >= 0 ? '+' : '-') + '$' + Math.abs(Math.round(p)), pnl: p, city: f.city }; }
    }
  }
  function unbar(k) { const t = TAB[k].el, r = ROW[k].bar; t.style.removeProperty('--v'); t.style.removeProperty('--d'); r.style.removeProperty('--v'); r.style.removeProperty('--d'); }
  function runBar(k, ms) { const d = Math.round(ms) + 'ms'; TAB[k].el.style.setProperty('--d', d); TAB[k].el.style.setProperty('--v', '1'); ROW[k].bar.style.setProperty('--d', d); ROW[k].bar.style.setProperty('--v', '1'); }
  function paintRow(k) { const ev = LAST[k]; if (!ev) return; const r = ROW[k]; txt(r.v, ev.chip); txt(r.an, ev.text); if (r.an.title !== ev.text) r.an.title = ev.text; }
  /** step rail + stage header + orbit labels for step i (only what changed) */
  function paintStep(i, all) {
    if (railN !== i || all) {
      T.rail.style.setProperty('--q', i); T.rail.style.setProperty('--mc', AG[i].col);
      for (let j = 0; j < T.sds.length; j++) if (all || (j <= i) !== (j <= railN)) T.sds[j].classList.toggle('on', j <= i);
      if (!all && i > railN && railN >= 0) J.animate(T.tl, [{ scale: '2.6 1', opacity: 1 }, { scale: '1 1', opacity: 0.75 }], { duration: 750, easing: 'cubic-bezier(.2,.8,.2,1)' });
      railN = i;
    }
    txt(T.stn, '0' + (i + 1)); txt(T.stv, VERB[i].toLowerCase()); txt(T.loop, String(ST.loop));
    for (let j = 0; j < OB.length; j++) txt(OB[j].label, j === i ? AGK[j] + ' · ' + VERB[j].toLowerCase() : AGK[j]);
  }
  function paintEdge() { if (ST.step === 5 && !J.S.killed) { const p = ST.pnl, v = (p >= 0 ? 'closed +' : 'closed -') + '$' + Math.abs(p).toFixed(2); txt(T.edge, v); const c = p >= 0 ? 'up' : 'dn'; if (T.edge.className !== c) T.edge.className = c; } }
  /** repaint every agent surface from state (the strip was off screen / the tab hidden while steps went by) */
  function resync() {
    dirty = false; const i = ST.step; if (i < 0) return;
    const left = Math.max(0, ST.dur - (performance.now() - ST.t0));
    for (let j = 0; j < 6; j++) { const k = AGK[j]; paintStatus(j); paintRow(k); if (ST.status[j] === 'working') runBar(k, left); else unbar(k); }
    if (ST.tk) paintTicket(ST.tk);
    paintStep(i, true); paintEdge(); applyOn(); tickCd();
  }

  let timer = 0;
  function runStep() {
    timer = 0;
    if (document.hidden) return; // the visibilitychange handler restarts the chain
    const kd = J.S.killed, pv = ST.working, show = live();
    if (show && dirty) resync();
    let i = (ST.step + 1) % 6;
    if (kd && i > 2) i = 0;
    if (i === 0) {
      ST.loop++; adopt();
      for (let j = 0; j < 6; j++) { if (show) unbar(AGK[j]); setStatus(j, kd && j > 2 ? 'halted' : 'idle'); }
    } else if (pv >= 0 && pv !== i) { if (show) unbar(AGK[pv]); setStatus(pv, 'done'); }
    const key = AGK[i], dur = (kd ? 1350 : rnd(700, 1500)) * (J.reduce ? 1.8 : 1), ev = describe(i, kd);
    ev.pnl = i === 5 && !kd ? ST.pnl : null;
    ST.step = i; ST.working = i; ST.t0 = performance.now(); ST.dur = dur; LAST[key] = ev;
    setStatus(i, 'working');
    if (show) {
      runBar(key, dur); paintRow(key); paintStep(i); paintEdge();
      flash(TAB[key].el); flash(ROW[key].el); react(key);
      applyOn(); tickCd();
      // the world reacts: a burst down a beam to the ticket, a packet out of the venue the agent looked at
      if (!kd) {
        if (BEAMS.length >= 7) spawn(1, (Math.random() * 7) | 0, AGCOL[i], 0.8, false, 1.15);
        if (ev.city != null) { const arcs = ARC_BY_CITY[ev.city], ai = arcs[(Math.random() * arcs.length) | 0]; FL[ev.city] = 1; ARCS[ai].lit = Math.min(1, ARCS[ai].lit + 0.6); spawn(0, ai, i === 4 ? 3 : i === 5 ? 2 : 0, 0.6, ARCS[ai].a !== ev.city, 1.15); }
      }
    } else dirty = true;
    J.bus.emit('agentstep', { agent: key, verb: VERB[i], text: ev.text, pnl: ev.pnl == null ? null : +ev.pnl.toFixed(2) });
    timer = setTimeout(runStep, dur);
  }

  /* ================================================================ interactions + bus ================================================================ */
  function setFocusRow(c) { focusCity = c; for (let i = 0; i < FD.length; i++) FD[i].el.classList.toggle('is-f', FD[i].city === c); }
  function focusVenue(c) {
    focusYaw = -CITIES[c].lon * D2R; focusHold = 4.2; kbi = c; yawVel = 0; setFocusRow(c); FL[c] = 1; if ((J.tier || 2) >= 2 && !killed) ripple(c, 3);
    const f = FDC[c]; if (liveEl && f) liveEl.textContent = 'facing ' + f.k + ' ' + CITIES[c].c.toLowerCase() + ', latency ' + Math.round(f.lat) + ' milliseconds, ' + J.sgn((f.price / J.market.price - 1) * 1e4, 1) + ' basis points versus oracle (simulated)';
    if (J.reduce) { yaw = focusYaw; redraw(); }
    if (!killed) for (let k = 0; k < ARC_BY_CITY[c].length; k++) { const ai = ARC_BY_CITY[c][k], A = ARCS[ai]; A.lit = 1; spawn(0, ai, (k + 2) % 4, 0.5, A.a !== c, 1.1); }
  }
  FD.forEach((f) => f.el.addEventListener('click', () => focusVenue(f.city)));
  Object.keys(TAB).forEach((k) => { TAB[k].el.addEventListener('click', () => togglePin(k)); ROW[k].el.addEventListener('click', () => togglePin(k)); OBK[k].el.addEventListener('click', () => togglePin(k)); });

  const liveEl = J.$('#dkw-live');
  function redraw() { if (J.reduce && g) { draw(J.time || 0, 0); orbits(J.time || 0, 0.2); } } // (under reduced motion the frame task is frozen: interactions repaint directly)
  function hit(e) {
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / cks, y = (e.clientY - r.top) / cks; let best = -1, bd = (e.pointerType === 'mouse' ? 22 : 30) ** 2;
    for (let i = 0; i < CITIES.length; i++) { if (MZ[i] < 0.12) continue; const d2 = (MX[i] - x) * (MX[i] - x) + (MY[i] - y) * (MY[i] - y); if (d2 < bd) { bd = d2; best = i; } }
    return best;
  }
  function setHover(c) { if (c === hoverCity) return; hoverCity = c; grab.classList.toggle('is-hot', c >= 0); redraw(); }
  let lastX = 0, lastY = 0, lastT = 0, moved = 0, downX = 0, downY = 0;
  grab.addEventListener('pointerdown', (e) => { dragging = true; moved = 0; lastX = downX = e.clientX; lastY = downY = e.clientY; lastT = performance.now(); focusYaw = null; setFocusRow(-1); yawVel = 0; setHover(-1); try { grab.setPointerCapture(e.pointerId); } catch (_) { /* noop */ } });
  grab.addEventListener('pointermove', (e) => {
    if (!dragging) { if (e.pointerType === 'mouse') setHover(hit(e)); return; }
    const dx = e.clientX - lastX, now = performance.now(), dtm = Math.max(8, now - lastT) / 1000, dy = dx / (R * 0.9);
    if (e.pointerType === 'mouse') tiltOff = clamp(tiltOff + (e.clientY - lastY) / (R * 1.7), -0.4, 0.4); // (touch keeps vertical drags for page scroll; the tilt springs back on release)
    lastX = e.clientX; lastY = e.clientY; lastT = now; moved += Math.abs(dx); yaw += dy; yawVel = lerp(yawVel, dy / dtm, 0.4); redraw();
  });
  grab.addEventListener('pointerup', (e) => {
    if (!dragging) return; dragging = false;
    if (moved < 6 && Math.hypot(e.clientX - downX, e.clientY - downY) < 8) { const best = hit(e); if (best >= 0) focusVenue(best); }
    else yawVel = clamp(yawVel, -3, 3);
  });
  grab.addEventListener('pointercancel', () => { dragging = false; });
  grab.addEventListener('pointerleave', () => { if (!dragging) setHover(-1); });
  grab.addEventListener('keydown', (e) => {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'ArrowRight') { focusYaw = null; setFocusRow(-1); yawVel = clamp(yawVel + (k === 'ArrowLeft' ? -1.5 : 1.5), -3, 3); if (J.reduce) { yaw += (k === 'ArrowLeft' ? -0.3 : 0.3); redraw(); } }
    else if (k === 'ArrowUp' || k === 'ArrowDown') { tiltOff = clamp(tiltOff + (k === 'ArrowUp' ? 0.2 : -0.2), -0.4, 0.4); redraw(); }
    else if (k === 'Enter' || k === ' ') { kbi = (kbi + 1) % CITIES.length; focusVenue(kbi); }
    else if (k === 'Escape') { focusYaw = null; setFocusRow(-1); }
    else return;
    e.preventDefault();
  });

  J.bus.on('tier', () => { lastSig = ''; if (g) layout(); });
  J.bus.on('tick', (m) => updateFeeds(m.price, cardIn));
  J.bus.on('decision', (d) => {
    if (killed || !cardIn) return; // (nothing here is visible off screen; a queued burst of packets on return would not be either)
    let f = null; for (let i = 0; i < FD.length; i++) if (FD[i].k === d.venue) { f = FD[i]; break; }
    if (!f) f = FD[(Math.random() * FD.length) | 0];
    FL[f.city] = Math.min(1, FL[f.city] + 0.7);
    const arcs = ARC_BY_CITY[f.city], ai = arcs[(Math.random() * arcs.length) | 0], A = ARCS[ai];
    spawn(0, ai, d.dest === 'execute' ? 2 : d.dest === 'review' ? 0 : 1, rnd(0.42, 0.66), A.a !== f.city, 1);
    A.lit = Math.min(1, A.lit + 0.5);
    if (d.dest === 'execute') { flash(f.el); if (BEAMS.length >= 7) spawn(1, (Math.random() * 7) | 0, 0, 0.7, false, 1); }
  });
  J.bus.on('kill', (v) => {
    killed = !!v;
    if (killed) { for (let i = 0; i < POOL.length; i++) POOL[i].on = 0; for (let i = 0; i < ARCS.length; i++) ARCS[i].lit = 0; for (let j = 3; j < 6; j++) setStatus(j, 'halted'); }
    else for (let j = 3; j < 6; j++) if (ST.status[j] === 'halted') setStatus(j, 'idle');
    if (live()) paintNow(); else dirty = true;
  });
  // the card (feeds, globe) and the tab strip under it are watched together: the agent surfaces repaint from state as soon as either comes back
  const vio = new IntersectionObserver((es) => {
    const wasCard = cardIn, wasLive = live();
    for (const e of es) { if (e.target === root) cardIn = e.isIntersecting; else tabsIn = e.isIntersecting; }
    if (cardIn && !wasCard) updateFeeds(J.market.price, true);
    if (!wasLive && live() && dirty) resync();
  }, { rootMargin: '120px' });
  vio.observe(root); vio.observe(tabsEl);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { clearTimeout(timer); timer = 0; return; } // a hidden tab gets no frames: stop stepping, resume without catch-up
    if (!timer) timer = setTimeout(runStep, 400);
    if (live() && dirty) resync();
  });
  // the reveal transform changes measured rects: re-measure once it settles
  root.addEventListener('transitionend', (e) => { if (e.target === root && e.propertyName === 'transform') layout(); });

  /* ================================================================ boot ================================================================ */
  for (let i = 0; i < 12; i++) updateFeeds(J.market.price, false);
  updateFeeds(J.market.price, true);
  adopt();
  if (killed) for (let j = 3; j < 6; j++) setStatus(j, 'halted');
  applyOn();
  J.watch(body, layout);
  J.task(body, frame);
  timer = setTimeout(runStep, 900);
});
