/* desk/globe-arcs — venue network on a sphere: 8 venue markers with ping rings, 13 great-circle arcs lifted above the surface, glowing packets (quote / order / jev / fill) flying along them
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot(). Edit CITIES (lat/lon) and ARC_PAIRS [from, to, colour] to draw your own network.
 * Data: bus 'decision' (a pink packet leaves a venue, a fill packet returns; colour of the ping = destination), 'kill' (red, traffic stops). Drag to spin.
 */
JEV.mod('desk-globe-arcs', () => {
  'use strict';
  const J = JEV, TAU = J.TAU, clamp = J.clamp, D2R = Math.PI / 180;
  const cv = J.$('#dkx-arcs');
  if (!cv) return;
  const llv = (lat, lon) => { const a = lat * D2R, b = lon * D2R; return [Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)]; };
  const CITIES = [['NYC', 40.7, -74], ['LON', 51.5, -0.1], ['FRA', 50.1, 8.7], ['DXB', 25.2, 55.3], ['SGP', 1.35, 103.8], ['TYO', 35.7, 139.7], ['SYD', -33.9, 151.2], ['SFO', 37.8, -122.4]].map((c) => ({ c: c[0], v: llv(c[1], c[2]) }));
  const VCOL = ['#4d8dff', '#a66bff', '#ffc13d', '#e6e0f0', '#ff8a3d', '#ff4d9e', '#3be0ff', '#2ee6a6'];
  const COLS = ['#ffc13d', '#f4eef6', '#ff7ab3', '#3be0ff', '#2ee6a6', '#a66bff', '#ff8a3d', '#ff4d5e'];
  const SPR = COLS.map((hex) => { const c = document.createElement('canvas'); c.width = c.height = 48; const q = c.getContext('2d'), gr = q.createRadialGradient(24, 24, 0, 24, 24, 24);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.16, J.rgba(hex, 0.95)); gr.addColorStop(0.42, J.rgba(hex, 0.34)); gr.addColorStop(1, J.rgba(hex, 0)); q.fillStyle = gr; q.fillRect(0, 0, 48, 48); return c; });
  const ARC_PAIRS = [[0, 1, 0], [1, 3, 3], [2, 3, 2], [3, 4, 0], [4, 5, 1], [5, 7, 2], [7, 0, 3], [6, 4, 0], [6, 5, 2], [0, 2, 1], [1, 4, 3], [3, 5, 0], [7, 6, 1]];
  const SEG = 36;
  const ARCS = ARC_PAIRS.map((pr) => {
    const a = CITIES[pr[0]].v, b = CITIES[pr[1]].v, ang = Math.acos(clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1)), sn = Math.sin(ang) || 1, h = 0.07 + 0.22 * (ang / Math.PI), pts = new Float32Array((SEG + 1) * 3);
    for (let i = 0; i <= SEG; i++) { const t = i / SEG, w0 = Math.sin((1 - t) * ang) / sn, w1 = Math.sin(t * ang) / sn, r = 1 + h * Math.sin(Math.PI * t);
      pts[i * 3] = (a[0] * w0 + b[0] * w1) * r; pts[i * 3 + 1] = (a[1] * w0 + b[1] * w1) * r; pts[i * 3 + 2] = (a[2] * w0 + b[2] * w1) * r; }
    return { a: pr[0], b: pr[1], col: pr[2], pts, lit: 0, sx: new Float32Array(SEG + 1), sy: new Float32Array(SEG + 1), vis: new Uint8Array(SEG + 1) };
  });
  const LINES = [];
  (function () {
    const mk = (fn, n) => { const v = new Float32Array((n + 1) * 3); for (let i = 0; i <= n; i++) { const p = fn(i / n); v[i * 3] = p[0]; v[i * 3 + 1] = p[1]; v[i * 3 + 2] = p[2]; } return v; };
    [-60, -30, 0, 30, 60].forEach((lat) => LINES.push(mk((u) => llv(lat, u * 360), 72)));
    for (let m = 0; m < 8; m++) LINES.push(mk((u) => llv(-90 + u * 180, m * 45), 72));
  })();
  const POOL = Array.from({ length: 40 }, () => ({ on: 0, arc: 0, t: 0, spd: 0.5, col: 0, rev: 0, sz: 1 }));
  const PINGS = CITIES.map(() => ({ t: 9, col: 0 }));
  function spawn(arc, col, spd, rev, sz) { for (const p of POOL) if (!p.on) { p.on = 1; p.arc = arc; p.t = 0; p.spd = spd; p.col = col; p.rev = rev ? 1 : 0; p.sz = sz || 1; return p; } return null; }
  let g = null, W = 0, H = 0, cx = 0, cy = 0, R = 100, yaw = 0.2, yawVel = 0, tilt = 0.4, dragging = false, lastX = 0, lastT = 0, killed = !!J.S.killed, km = killed ? 1 : 0, spawnT = 0;
  const MX = new Float32Array(8), MY = new Float32Array(8), MZ = new Float32Array(8);
  function layout() { const f = J.fit(cv, 1.5); g = f.g; W = f.W; H = f.H; R = Math.max(70, Math.min(W * 0.36, H * 0.36)); cx = W / 2; cy = H * 0.49; }
  J.watch(cv, layout); layout();
  J.bus.on('kill', (k) => { killed = !!k; });
  J.bus.on('decision', (d) => {
    if (killed || J.hidden()) return;
    const col = d.dest === 'execute' ? 3 : d.dest === 'review' ? 2 : 1, i = (Math.random() * ARCS.length) | 0;
    spawn(i, 2, 0.7, false, 1.5); ARCS[i].lit = 1; setTimeout(() => { if (!killed) { const p = spawn(i, col, 0.8, true, 1.3); if (p) ARCS[i].lit = 1; } }, 700);
  });
  const root = cv.parentElement;
  root.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastT = performance.now(); yawVel = 0; try { root.setPointerCapture(e.pointerId); } catch (x) { /* none */ } });
  root.addEventListener('pointermove', (e) => { if (!dragging) return; const now = performance.now(), dx = e.clientX - lastX; yaw += dx / R; yawVel = dx / R / Math.max(0.008, (now - lastT) / 1000); lastX = e.clientX; lastT = now; });
  const up = () => { dragging = false; yawVel = clamp(yawVel, -4, 4); };
  root.addEventListener('pointerup', up); root.addEventListener('pointercancel', up);

  J.task(cv, (t, dt) => {
    if (!g) return;
    km += ((killed ? 1 : 0) - km) * Math.min(1, dt * 2.6);
    if (!dragging) { yaw += (0.1 * (1 - 0.85 * km) + yawVel) * dt; yawVel *= Math.exp(-dt * 2.2); }
    tilt = 0.4 + 0.045 * Math.sin(t * 0.21);
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt), red = km > 0.5;
    g.clearRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    // sphere body + rim
    const m0 = g.createRadialGradient(cx - R * 0.34, cy - R * 0.4, R * 0.04, cx, cy, R * 1.04);
    m0.addColorStop(0, red ? 'rgba(112,22,40,.8)' : 'rgba(34,84,176,.8)'); m0.addColorStop(0.5, red ? 'rgba(54,10,20,.92)' : 'rgba(10,30,78,.92)'); m0.addColorStop(1, red ? 'rgba(16,3,8,.98)' : 'rgba(3,8,26,.98)');
    g.fillStyle = m0; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill(); g.lineWidth = 1.2; g.strokeStyle = red ? 'rgba(255,120,130,.6)' : 'rgba(110,230,255,.55)'; g.stroke();
    // graticule
    g.lineWidth = 1; g.strokeStyle = red ? 'rgba(255,120,130,.14)' : 'rgba(120,190,255,.2)'; g.beginPath();
    for (const v of LINES) { let pen = false; for (let i = 0; i < v.length; i += 3) {
      const x = v[i], y = v[i + 1], z = v[i + 2], x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw, y2 = y * ct - z1 * st, z2 = y * st + z1 * ct;
      if (z2 > 0) { if (!pen) { g.moveTo(cx + R * x1, cy - R * y2); pen = true; } else g.lineTo(cx + R * x1, cy - R * y2); } else pen = false; } }
    g.stroke();
    // markers
    for (let c = 0; c < 8; c++) { const v = CITIES[c].v, x1 = v[0] * cyw + v[2] * syw, z1 = -v[0] * syw + v[2] * cyw, y2 = v[1] * ct - z1 * st, z2 = v[1] * st + z1 * ct; MX[c] = cx + R * x1; MY[c] = cy - R * y2; MZ[c] = z2; }
    // arcs
    g.globalCompositeOperation = 'lighter';
    for (const A of ARCS) {
      A.lit = Math.max(0, A.lit - dt * 0.7); const n = SEG + 1;
      for (let i = 0; i < n; i++) { const x = A.pts[i * 3], y = A.pts[i * 3 + 1], z = A.pts[i * 3 + 2], x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw, y2 = y * ct - z1 * st, z2 = y * st + z1 * ct; A.sx[i] = cx + R * x1; A.sy[i] = cy - R * y2; A.vis[i] = z2 > 0 || x1 * x1 + y2 * y2 > 1.02 ? 1 : 0; }
      g.strokeStyle = red ? 'rgba(255,100,110,' + (0.16 + A.lit * 0.5).toFixed(2) + ')' : 'rgba(150,200,255,' + (0.16 + A.lit * 0.5).toFixed(2) + ')'; g.lineWidth = 1 + A.lit; g.beginPath(); let pen = false;
      for (let i = 0; i < n; i++) { if (A.vis[i]) { if (!pen) { g.moveTo(A.sx[i], A.sy[i]); pen = true; } else g.lineTo(A.sx[i], A.sy[i]); } else pen = false; }
      g.stroke();
    }
    // ambient quotes
    spawnT -= dt; if (spawnT <= 0 && !killed && !J.hidden()) { spawnT = 0.45 + Math.random() * 0.6; const i = (Math.random() * ARCS.length) | 0; spawn(i, ARCS[i].col, 0.35 + Math.random() * 0.3, Math.random() < 0.5, 1); }
    for (const p of POOL) {
      if (!p.on) continue; p.t += dt * p.spd; if (p.t >= 1) { p.on = 0; const A = ARCS[p.arc]; const city = p.rev ? A.a : A.b; PINGS[city].t = 0; PINGS[city].col = p.col; A.lit = Math.max(A.lit, 0.6); continue; }
      const A = ARCS[p.arc], u = p.rev ? 1 - p.t : p.t, f = u * SEG, i0 = Math.min(SEG - 1, f | 0), fr = f - i0;
      if (!A.vis[i0] || !A.vis[i0 + 1]) continue;
      const x = A.sx[i0] + (A.sx[i0 + 1] - A.sx[i0]) * fr, y = A.sy[i0] + (A.sy[i0 + 1] - A.sy[i0]) * fr, sz = 18 * p.sz, spr = SPR[red ? 7 : p.col];
      g.globalAlpha = Math.min(1, p.t * 6, (1 - p.t) * 6); g.drawImage(spr, x - sz / 2, y - sz / 2, sz, sz);
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    // markers on top (front only) + ping rings
    for (let c = 0; c < 8; c++) {
      if (MZ[c] < 0.02) continue; const col = red ? '#ff4d5e' : VCOL[c], P = PINGS[c], a = clamp(MZ[c] * 2, 0, 1);
      if (P.t < 1) { P.t += dt * 0.9; g.globalAlpha = (1 - P.t) * 0.8 * a; g.strokeStyle = COLS[P.col]; g.lineWidth = 1.5; g.beginPath(); g.arc(MX[c], MY[c], 4 + P.t * 22, 0, TAU); g.stroke(); }
      g.globalAlpha = a; g.fillStyle = col; g.shadowBlur = 0; g.beginPath(); g.arc(MX[c], MY[c], 3.2, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1; g.beginPath(); g.arc(MX[c], MY[c], 5.5, 0, TAU); g.stroke();
      g.fillStyle = 'rgba(236,229,242,' + (0.85 * a).toFixed(2) + ')'; g.font = '700 9px ui-monospace, monospace'; g.fillText(CITIES[c].c, MX[c] + 8, MY[c] + 3);
    }
    g.globalAlpha = 1;
  });
});
