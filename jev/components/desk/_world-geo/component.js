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
