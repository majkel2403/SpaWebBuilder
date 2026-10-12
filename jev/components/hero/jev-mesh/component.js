/* hero / jev-mesh — the woven JEV SYSTEM ONE mesh: 3 layers, dense additive edges (cached), bright cable strands, white-hot beams that hop input -> a -> b -> c -> out on every decision, nodes flash on arrival.
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot()
 * Data: JEV.bus 'decision' (beam colour: pink execute, amber review, dim skip) and 'kill' (bool, red). Click the canvas to fire a simulated decision. */
JEV.mod('hero-jev-mesh', () => {
  'use strict';
  const J = JEV, cv = J.$('#hjmCv');
  if (!cv) return;
  const LC = [18, 24, 18], LS = [0, 18, 42, 60], NN = 60, X = [0.14, 0.5, 0.86];
  const nx = new Float32Array(NN), ny = new Float32Array(NN), fl = new Float32Array(NN);
  const ED = [[], []]; // layer a->b, b->c
  { const R = J.rng(7); for (let l = 0; l < 2; l++) for (let i = 0; i < LC[l]; i++) { const seen = {}, k = 9, off = R() * LC[l + 1]; for (let t = 0; t < k; t++) { const j = Math.floor((off + t * LC[l + 1] / k) % LC[l + 1]); if (!seen[j]) { seen[j] = 1; ED[l].push([LS[l] + i, LS[l + 1] + j, 0.2 + R() * 0.12]); } } } }
  const RGB = [[255, 46, 110], [255, 193, 61], [196, 150, 178], [255, 77, 94]];
  const SPR = RGB.map((c) => { const s = document.createElement('canvas'); s.width = s.height = 64; const x = s.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.1, 'rgba(255,235,242,.96)'); gr.addColorStop(.3, 'rgba(' + c.join(',') + ',.6)'); gr.addColorStop(.65, 'rgba(' + c.join(',') + ',.14)'); gr.addColorStop(1, 'rgba(' + c.join(',') + ',0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return s; });
  const BN = 120, bS = new Int16Array(BN), bD = new Int16Array(BN), bT = new Float64Array(BN).fill(-9), bC = new Uint8Array(BN), bL = new Uint8Array(BN); let bi = 0, f = null, st = null, killed = J.S.killed, cable = [];
  function layout() {
    f = J.fit(cv); st = null; if (!f.W) return; const W = f.W, H = f.H, y0 = 16, y1 = H - 16;
    for (let l = 0; l < 3; l++) for (let i = 0; i < LC[l]; i++) { nx[LS[l] + i] = W * X[l] + (i % 2 ? 4 : -4); ny[LS[l] + i] = y0 + (y1 - y0) * (0.02 + 0.96 * i / (LC[l] - 1)); }
    const pts = [[0, H * 0.78], [W * 0.14, H * 0.66], [W * 0.32, H * 0.6], [W * 0.5, H * 0.49], [W * 0.68, H * 0.4], [W * 0.86, H * 0.29], [W, H * 0.5]]; cable = [];
    for (let s = 0; s < 6; s++) { const p0 = pts[Math.max(0, s - 1)], p1 = pts[s], p2 = pts[s + 1], p3 = pts[Math.min(6, s + 2)]; for (let k = 0; k < 8; k++) { const t = k / 8, t2 = t * t, t3 = t2 * t; cable.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } }
    cable.push(pts[6]);
    st = document.createElement('canvas'); st.width = Math.round(W * f.dpr); st.height = Math.round(H * f.dpr); const g = st.getContext('2d'); g.setTransform(f.dpr, 0, 0, f.dpr, 0, 0);
    const lg = g.createLinearGradient(W * 0.25, 0, W * 0.75, 0); lg.addColorStop(0, 'rgba(255,60,130,0)'); lg.addColorStop(.5, 'rgba(255,90,160,.12)'); lg.addColorStop(1, 'rgba(255,60,130,0)'); g.fillStyle = lg; g.fillRect(W * 0.25, 0, W * 0.5, H);
    g.globalCompositeOperation = 'lighter'; g.lineWidth = 0.75;
    for (const L of ED) for (const e of L) { g.strokeStyle = 'rgba(255,62,134,' + e[2].toFixed(3) + ')'; g.beginPath(); g.moveTo(nx[e[0]], ny[e[0]]); g.lineTo(nx[e[1]], ny[e[1]]); g.stroke(); }
    const n = cable.length;
    for (let k = -3; k <= 3; k++) {
      g.strokeStyle = k === 0 ? 'rgba(255,190,220,.75)' : 'rgba(255,100,170,' + (0.5 - Math.abs(k) * 0.07).toFixed(3) + ')'; g.lineWidth = k === 0 ? 1.5 : 1; g.beginPath();
      for (let i = 0; i < n; i++) { const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1); let ux = cable[b][1] - cable[a][1], uy = cable[a][0] - cable[b][0]; const nl = Math.hypot(ux, uy) || 1; ux /= nl; uy /= nl; const off = Math.sin(i * 0.42 + k * 1.3) * 7 * (k / 3) * Math.sin(Math.PI * i / (n - 1)); if (i) g.lineTo(cable[i][0] + ux * off, cable[i][1] + uy * off); else g.moveTo(cable[i][0] + ux * off, cable[i][1] + uy * off); }
      g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
    for (let i = 0; i < NN; i++) { g.beginPath(); g.arc(nx[i], ny[i], 2, 0, J.TAU); g.fillStyle = '#ff8fbb'; g.fill(); }
  }
  const add = (s, d, t, c) => { bS[bi] = s; bD[bi] = d; bT[bi] = t; bC[bi] = c; bi = (bi + 1) % BN; };
  function onDecision(d) {
    const c = killed ? 3 : d.dest === 'review' ? 1 : d.dest === 'skip' ? 2 : 0, t = performance.now() / 1000, R = Math.random;
    for (let k = 0; k < 14; k++) { const e0 = ED[0][Math.floor(R() * ED[0].length)], nxt = ED[1].filter((e) => e[0] === e0[1]), e1 = nxt.length ? nxt[Math.floor(R() * nxt.length)] : ED[1][0], s = t + R() * 0.25;
      add(-1, e0[0], s, c); add(e0[0], e0[1], s + 0.32, c); add(e1[0], e1[1], s + 0.64, c); }
  }
  J.bus.on('decision', onDecision); J.bus.on('kill', (k) => { killed = !!k; });
  J.watch(cv, layout);
  J.task(cv, (t, dt) => {
    if (!f || !st) return; const g = f.g, W = f.W, H = f.H, tn = performance.now() / 1000;
    g.setTransform(f.dpr, 0, 0, f.dpr, 0, 0); g.clearRect(0, 0, W, H); g.drawImage(st, 0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    for (let b = 0; b < BN; b++) {
      const u = (tn - bT[b]) / 0.3; if (u < 0 || u > 1.3) continue; const s = bS[b], d = bD[b], k = Math.min(1, u);
      const x0 = s < 0 ? 0 : nx[s], y0 = s < 0 ? ny[d] + (H * 0.78 - ny[d]) * 0.5 : ny[s], x1 = nx[d], y1 = ny[d], hx = x0 + (x1 - x0) * k, hy = y0 + (y1 - y0) * k;
      for (let tr = 0; tr < 4; tr++) { const kk = Math.max(0, k - tr * 0.1); g.globalAlpha = (0.55 - tr * 0.13) * (u > 1 ? Math.max(0, 1 - (u - 1) * 3) : 1); g.drawImage(SPR[bC[b]], x0 + (x1 - x0) * kk - 7, y0 + (y1 - y0) * kk - 7, 14, 14); }
      g.globalAlpha = u > 1 ? Math.max(0, 1 - (u - 1) * 3) : 1; g.drawImage(SPR[bC[b]], hx - 12, hy - 12, 24, 24);
      if (u >= 1 && u < 1.1) fl[d] = 1;
    }
    for (let i = 0; i < NN; i++) { if (fl[i] > 0.02) { g.globalAlpha = fl[i]; g.drawImage(SPR[killed ? 3 : 0], nx[i] - 11, ny[i] - 11, 22, 22); fl[i] *= Math.exp(-dt * 4); } }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  });
  cv.addEventListener('click', () => { const n = performance.now(); if (n - (cv._t || 0) > 160) { cv._t = n; J.fire(); } });
  const b = J.$('#hjmFire'); if (b) b.addEventListener('click', () => J.fire());
  const d0 = J.recent[0] || J.makeDecision(); if (d0) onDecision(d0);
});
