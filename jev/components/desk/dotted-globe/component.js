/* desk/dotted-globe — the dotted planet on its own: noise continents (fibonacci sphere + fbm threshold), shelf + sparse ocean, graticule, night-side city lights, drag with inertia, kill-switch red
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot(). Add markers / arcs by projecting lat/lon with project().
 * Data: bus 'kill' only (decorative). Dot counts: NPT_SRC below.
 */
JEV.mod('desk-dotted-globe', () => {
  'use strict';
  const J = JEV, TAU = J.TAU, clamp = J.clamp, D2R = Math.PI / 180;
  const cv = J.$('#dkx-globe');
  if (!cv) return;
  function makeNoise(seed) {
    const r = J.rng(seed), perm = new Uint8Array(512), val = new Float32Array(256), p = [];
    for (let i = 0; i < 256; i++) { p.push(i); val[i] = r() * 2 - 1; }
    for (let i = 255; i > 0; i--) { const j = (r() * (i + 1)) | 0, tmp = p[i]; p[i] = p[j]; p[j] = tmp; }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10), l = (a, b, t) => a + (b - a) * t;
    return (x, y, z) => {
      const xf = Math.floor(x), yf = Math.floor(y), zf = Math.floor(z), X = xf & 255, Y = yf & 255, Z = zf & 255;
      x -= xf; y -= yf; z -= zf;
      const u = fade(x), v = fade(y), w = fade(z), A = perm[X] + Y, B = perm[X + 1] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z, BA = perm[B] + Z, BB = perm[B + 1] + Z;
      return l(l(l(val[perm[AA]], val[perm[AA + 1]], w), l(val[perm[AB]], val[perm[AB + 1]], w), v), l(l(val[perm[BA]], val[perm[BA + 1]], w), l(val[perm[BB]], val[perm[BB + 1]], w), v), u);
    };
  }
  const noise = makeNoise(20260);
  const fbm = (x, y, z) => { let s = 0, a = 0.5, f = 1; for (let o = 0; o < 5; o++) { s += a * noise(x * f + o * 17.3, y * f + o * 3.1, z * f - o * 9.7); f *= 2.07; a *= 0.5; } return s; };
  const llv = (lat, lon) => { const a = lat * D2R, b = lon * D2R; return [Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)]; };
  const CITIES = [[40.7, -74], [51.5, -0.1], [50.1, 8.7], [25.2, 55.3], [1.35, 103.8], [35.7, 139.7], [-33.9, 151.2], [37.8, -122.4]].map((c) => llv(c[0], c[1]));

  const NPT_SRC = 7600, GA = Math.PI * (3 - Math.sqrt(5));
  const PX = new Float32Array(NPT_SRC), PY = new Float32Array(NPT_SRC), PZ = new Float32Array(NPT_SRC), PK = new Uint8Array(NPT_SRC), LITV = new Uint8Array(NPT_SRC);
  let NPT = 0;
  (function build() {
    const vals = new Float32Array(NPT_SRC), sx = new Float32Array(NPT_SRC), sy = new Float32Array(NPT_SRC), sz = new Float32Array(NPT_SRC), r = J.rng(7);
    for (let i = 0; i < NPT_SRC; i++) {
      const y = 1 - (2 * (i + 0.5)) / NPT_SRC, rr = Math.sqrt(Math.max(0, 1 - y * y)), ph = i * GA, x = Math.cos(ph) * rr, z = Math.sin(ph) * rr;
      let v = fbm(x * 1.4 + 3.1, y * 1.4 - 1.7, z * 1.4 + 0.6);
      for (const q of CITIES) { const d2 = (x - q[0]) ** 2 + (y - q[1]) ** 2 + (z - q[2]) ** 2; v += 0.5 * Math.exp(-d2 / 0.05); }
      sx[i] = x; sy[i] = y; sz[i] = z; vals[i] = v;
    }
    const sorted = Float32Array.from(vals).sort(), thr = sorted[Math.floor(NPT_SRC * 0.62)], vmax = sorted[NPT_SRC - 1], keep = [];
    for (let i = 0; i < NPT_SRC; i++) {
      const v = vals[i]; let kind = -1;
      if (v >= thr) kind = (v - thr) / (vmax - thr) > 0.42 ? 3 : 2; else if (v > thr - 0.075) kind = r() < 0.72 ? 1 : -1; else kind = r() < 0.14 ? 0 : -1;
      if (kind >= 0) keep.push(i, kind);
    }
    const n = keep.length / 2;
    for (let i = 0; i < n; i++) { const s = keep[i * 2]; PX[i] = sx[s]; PY[i] = sy[s]; PZ[i] = sz[s]; PK[i] = keep[i * 2 + 1]; }
    NPT = n;
    for (let i = 0; i < n; i++) if (PK[i] >= 2 && noise(PX[i] * 9 + 5, PY[i] * 9, PZ[i] * 9) > 0.12 && r() < 0.8) LITV[i] = 1 + (i & 1);
  })();
  // 4 kinds (ocean, shelf, lowland, highland) x 4 depth levels: [night colour, kill colour, alpha[4], size[4]]
  const KIND = [
    { n: [78, 126, 226], k: [205, 72, 112], a: [0.1, 0.16, 0.22, 0.3], s: [1, 1.05, 1.1, 1.15] }, { n: [62, 186, 236], k: [255, 92, 110], a: [0.22, 0.32, 0.44, 0.56], s: [1.05, 1.15, 1.25, 1.35] },
    { n: [40, 224, 192], k: [255, 96, 96], a: [0.34, 0.54, 0.76, 0.96], s: [1.3, 1.55, 1.85, 2.1] }, { n: [175, 246, 255], k: [255, 196, 186], a: [0.5, 0.7, 0.9, 1], s: [1.5, 1.8, 2.15, 2.5] },
  ];
  const BACKK = [{ n: [96, 134, 226], k: [210, 80, 110], a: 0.08 }, { n: [64, 206, 206], k: [255, 100, 100], a: 0.2 }];
  const mixc = (a, b, m) => Math.round(a[0] + (b[0] - a[0]) * m) + ',' + Math.round(a[1] + (b[1] - a[1]) * m) + ',' + Math.round(a[2] + (b[2] - a[2]) * m);
  const BSZ = new Float32Array(18); for (let k = 0; k < 4; k++) for (let l = 0; l < 4; l++) BSZ[k * 4 + l] = KIND[k].s[l]; BSZ[16] = 1; BSZ[17] = 1.1;
  let palStep = -1, pal = [];
  function palette(ks) {
    if (ks === palStep) return pal; palStep = ks; const m = ks / 10; pal = [];
    for (let k = 0; k < 4; k++) for (let l = 0; l < 4; l++) pal.push('rgba(' + mixc(KIND[k].n, KIND[k].k, m) + ',' + KIND[k].a[l] + ')');
    pal.push('rgba(' + mixc(BACKK[0].n, BACKK[0].k, m) + ',' + BACKK[0].a + ')', 'rgba(' + mixc(BACKK[1].n, BACKK[1].k, m) + ',' + BACKK[1].a + ')'); return pal;
  }
  const LINES = [];
  (function () {
    const mk = (fn, n) => { const v = new Float32Array((n + 1) * 3); for (let i = 0; i <= n; i++) { const p = fn(i / n); v[i * 3] = p[0]; v[i * 3 + 1] = p[1]; v[i * 3 + 2] = p[2]; } return v; };
    [-60, -30, 0, 30, 60].forEach((lat) => LINES.push(mk((u) => llv(lat, u * 360), 72)));
    for (let m = 0; m < 8; m++) LINES.push(mk((u) => llv(-90 + u * 180, m * 45), 72));
  })();
  const SXa = new Float32Array(NPT_SRC), SYa = new Float32Array(NPT_SRC), NBK = 18, bIdx = Array.from({ length: NBK }, () => new Int32Array(NPT_SRC)), bN = new Int32Array(NBK);
  const LIX = [new Int32Array(NPT_SRC), new Int32Array(NPT_SRC)], LN2 = new Int32Array(2);

  let g = null, W = 0, H = 0, cx = 0, cy = 0, R = 100, layB = 0, layer = null, dpr = 1, yaw = 0.2, yawVel = 0, tilt = 0.4, dragging = false, lastX = 0, lastT = 0;
  let km = J.S.killed ? 1 : 0, kt = km;
  function paintLayer() {
    const sz = Math.ceil(layB * dpr), m = layB / 2; layer = layer || document.createElement('canvas'); layer.width = layer.height = sz;
    const q = layer.getContext('2d'); q.setTransform(sz / layB, 0, 0, sz / layB, 0, 0);
    const gl = q.createRadialGradient(m, m, R * 0.95, m, m, R * 1.4);
    gl.addColorStop(0, 'rgba(59,224,255,.35)'); gl.addColorStop(0.3, 'rgba(140,92,255,.14)'); gl.addColorStop(1, 'rgba(140,92,255,0)'); q.fillStyle = gl; q.fillRect(0, 0, layB, layB);
    q.save(); q.beginPath(); q.arc(m, m, R, 0, TAU); q.clip();
    const bd = q.createRadialGradient(m - R * 0.34, m - R * 0.4, R * 0.04, m, m, R * 1.04); bd.addColorStop(0, 'rgba(34,84,176,.8)'); bd.addColorStop(0.42, 'rgba(10,30,78,.92)'); bd.addColorStop(1, 'rgba(3,8,26,.98)');
    q.fillStyle = bd; q.fillRect(m - R, m - R, R * 2, R * 2); q.restore();
    q.lineWidth = 1.1; q.strokeStyle = 'rgba(170,240,255,.5)'; q.beginPath(); q.arc(m, m, R * 1.003, 0, TAU); q.stroke();
  }
  function layout() {
    const f = J.fit(cv, 1.5); g = f.g; W = f.W; H = f.H; dpr = f.dpr; R = Math.max(70, Math.min(W * 0.36, H * 0.36)); cx = W / 2; cy = H * 0.49; layB = Math.ceil(R * 3); paintLayer();
  }
  J.watch(cv, layout); layout();
  J.bus.on('kill', (k) => { kt = k ? 1 : 0; });
  cv.parentElement.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastT = performance.now(); yawVel = 0; try { e.currentTarget.setPointerCapture(e.pointerId); } catch (x) { /* none */ } });
  cv.parentElement.addEventListener('pointermove', (e) => { if (!dragging) return; const now = performance.now(), dx = e.clientX - lastX; yaw += dx / R; yawVel = dx / R / Math.max(0.008, (now - lastT) / 1000); lastX = e.clientX; lastT = now; });
  const up = () => { dragging = false; yawVel = clamp(yawVel, -4, 4); };
  cv.parentElement.addEventListener('pointerup', up); cv.parentElement.addEventListener('pointercancel', up);

  J.task(cv, (t, dt) => {
    if (!g) return;
    km += (kt - km) * Math.min(1, dt * 2.6); if (Math.abs(km - kt) < 0.003) km = kt;
    if (!dragging) { yaw += (0.1 * (1 - 0.85 * km) + yawVel) * dt; yawVel *= Math.exp(-dt * 2.2); }
    tilt = 0.4 + 0.045 * Math.sin(t * 0.21);
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt), alive = 1 - km, ks = Math.round(km * 10);
    g.clearRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.drawImage(layer, cx - layB / 2, cy - layB / 2, layB, layB);
    if (km > 0.01) { g.globalAlpha = km * 0.45; g.fillStyle = 'rgba(255,40,70,1)'; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill(); g.globalAlpha = 1; }
    // graticule (front hemisphere)
    g.lineWidth = 1; g.strokeStyle = km > 0.5 ? 'rgba(255,120,130,.13)' : 'rgba(120,190,255,.2)'; g.beginPath();
    for (const v of LINES) {
      let pen = false;
      for (let i = 0; i < v.length; i += 3) {
        const x = v[i], y = v[i + 1], z = v[i + 2], x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw, y2 = y * ct - z1 * st, z2 = y * st + z1 * ct;
        if (z2 > 0) { if (!pen) { g.moveTo(cx + R * x1, cy - R * y2); pen = true; } else g.lineTo(cx + R * x1, cy - R * y2); } else pen = false;
      }
    }
    g.stroke();
    const sxv = -0.62, syv = 0.4, szv = 0.62, sl = Math.hypot(sxv, syv, szv), sux = sxv / sl, suy = syv / sl, suz = szv / sl;
    bN.fill(0); LN2.fill(0);
    for (let i = 0; i < NPT; i++) {
      const x = PX[i], y = PY[i], z = PZ[i], x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw, y2 = y * ct - z1 * st, z2 = y * st + z1 * ct, kd = PK[i];
      SXa[i] = cx + R * x1; SYa[i] = cy - R * y2;
      const b = z2 > 0.02 ? kd * 4 + (z2 > 0.75 ? 3 : z2 > 0.45 ? 2 : z2 > 0.2 ? 1 : 0) : 16 + (kd > 1 ? 1 : 0);
      bIdx[b][bN[b]++] = i;
      if (LITV[i] && z2 > 0.06 && x1 * sux + y2 * suy + z2 * suz < -0.02) LIX[LITV[i] - 1][LN2[LITV[i] - 1]++] = i;
    }
    const P = palette(ks), dotK = clamp(R / 230, 0.8, 1.12);
    for (let b = 0; b < NBK; b++) {
      const n = bN[b]; if (!n) continue;
      const sz = BSZ[b] * dotK, h = sz / 2, ix = bIdx[b]; g.fillStyle = P[b]; g.beginPath();
      for (let j = 0; j < n; j++) { const i = ix[j]; g.rect(SXa[i] - h, SYa[i] - h, sz, sz); } g.fill();
    }
    g.globalCompositeOperation = 'lighter';
    const tw = 0.5 + 0.5 * Math.sin(t * 2.3), base = km > 0.5 ? '255,120,90,' : '255,206,128,';
    for (let q = 0; q < 2; q++) {
      const n = LN2[q]; if (!n) continue; g.fillStyle = 'rgba(' + base + (0.6 * (0.55 + 0.45 * (q ? tw : 1 - tw)) * alive).toFixed(2) + ')'; g.beginPath();
      for (let j = 0; j < n; j++) { const i = LIX[q][j]; g.rect(SXa[i] - 0.85 * dotK, SYa[i] - 0.85 * dotK, 1.7 * dotK, 1.7 * dotK); } g.fill();
    }
    g.globalCompositeOperation = 'source-over';
  });
});
