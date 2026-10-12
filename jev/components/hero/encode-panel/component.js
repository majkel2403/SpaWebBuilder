/* hero / encode-panel — 15 state ports -> 12 zig-zag vector nodes; every decision sends beams through the mesh and lights the nodes by how strongly their inputs moved.
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot()
 * Data: JEV.bus 'decision' (d.state, normalised per field into a 0..1 activation) and 'kill' (bool -> red beams). */
JEV.mod('hero-encode-panel', () => {
  'use strict';
  const J = JEV, cv = J.$('#hepCv');
  if (!cv) return;
  const NI = 15, NO = 12, ED = [];
  { const R = J.rng(31); for (let i = 0; i < NI; i++) { const c = Math.round(i * (NO - 1) / (NI - 1)), seen = {}; for (const j of [c, c - 1, c + 1, c + 2, Math.floor(R() * NO)]) if (j >= 0 && j < NO && !seen[j]) { seen[j] = 1; ED.push([i, j, 0.3 * (0.72 + R() * 0.56)]); } } }
  const spr = (rgb) => { const s = document.createElement('canvas'); s.width = s.height = 64; const x = s.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.12, 'rgba(255,230,240,.95)'); gr.addColorStop(.3, 'rgba(' + rgb + ',.55)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return s; };
  const SP = [spr('255,46,110'), spr('255,77,94')];
  const px = new Float32Array(NI), py = new Float32Array(NI), qx = new Float32Array(NO), qy = new Float32Array(NO), act = new Float32Array(NO), tgt = new Float32Array(NO), fl = new Float32Array(NO);
  const BN = 40, bE = new Int16Array(BN), bT = new Float64Array(BN).fill(-9); let bi = 0, f = null, st = null, now = 0, killed = J.S.killed;
  const ref = {}, sc = [1, 1, 1];
  function norm(s) { // each field -> 0..1 "how unusual" (simulated saliency)
    const a = [Math.abs(Math.log(s.price / (ref[s.symbol] || (ref[s.symbol] = s.price)))) * 40, Math.abs(s.vwap_dist_bps) / 25, s.spread_bps / 6, Math.abs(s.imbalance), Math.abs(s.funding_bps) / 8, s.vol_1h / 100, Math.abs(s.edge_bps) / 25, Math.abs(s.position_pct) / 4, Math.abs(s.daily_pnl) / 2000, s.drawdown_pct / 5, s.latency_ms / 120, s.signal_age_s / 15];
    return a.map((v) => Math.min(1, v));
  }
  function layout() {
    f = J.fit(cv); st = null; if (!f.W) return; const W = f.W, H = f.H, y0 = 14, y1 = H - 14;
    for (let i = 0; i < NI; i++) { px[i] = 18; py[i] = y0 + (i + 0.5) * (y1 - y0) / NI; }
    for (let j = 0; j < NO; j++) { qx[j] = W * (j % 2 ? 0.9 : 0.68); qy[j] = y0 + (j + 0.5) * (y1 - y0) / NO; }
    st = document.createElement('canvas'); st.width = Math.round(W * f.dpr); st.height = Math.round(H * f.dpr); const g = st.getContext('2d'); g.setTransform(f.dpr, 0, 0, f.dpr, 0, 0);
    g.globalCompositeOperation = 'lighter'; g.lineWidth = 0.8;
    for (const e of ED) { g.strokeStyle = 'rgba(255,62,134,' + (e[2] * 1.5).toFixed(3) + ')'; g.beginPath(); g.moveTo(px[e[0]], py[e[0]]); g.bezierCurveTo((px[e[0]] + qx[e[1]]) / 2, py[e[0]], (px[e[0]] + qx[e[1]]) / 2, qy[e[1]], qx[e[1]], qy[e[1]]); g.stroke(); }
    g.globalCompositeOperation = 'source-over';
    for (let i = 0; i < NI; i++) { g.beginPath(); g.arc(px[i], py[i], 3.2, 0, J.TAU); g.fillStyle = '#0b0610'; g.fill(); g.strokeStyle = 'rgba(255,110,170,.85)'; g.lineWidth = 1; g.stroke(); }
  }
  function onDecision(d) {
    const a = d.state ? norm(d.state) : []; for (let j = 0; j < NO; j++) tgt[j] = Math.min(1, (a[j] || 0.3) * 0.7 + (a[(j + 5) % 12] || 0.2) * 0.4);
    const t = performance.now() / 1000; let k = 0;
    for (let e = 0; e < ED.length && k < BN; e++) { if (Math.random() < 0.34) { bE[bi] = e; bT[bi] = t + k * 0.012 + Math.random() * 0.2; bi = (bi + 1) % BN; k++; } }
  }
  J.bus.on('decision', onDecision); J.bus.on('kill', (k) => { killed = !!k; });
  J.watch(cv, layout);
  J.task(cv, (t, dt) => {
    if (!f || !st) return; const g = f.g, W = f.W, H = f.H, ti = killed ? 1 : 0; now = t;
    g.setTransform(f.dpr, 0, 0, f.dpr, 0, 0); g.clearRect(0, 0, W, H); g.drawImage(st, 0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    const tn = performance.now() / 1000;
    for (let b = 0; b < BN; b++) {
      const u = (tn - bT[b]) / 0.7; if (u < 0 || u > 1.25) continue; const e = ED[bE[b]], k = Math.min(1, u), s = k * k * (3 - 2 * k), xs = k * (1.5 - 1.5 * k + k * k);
      const x0 = px[e[0]], y0 = py[e[0]], x1 = qx[e[1]], y1 = qy[e[1]], hx = x0 + (x1 - x0) * xs, hy = y0 + (y1 - y0) * s;
      g.globalAlpha = u > 1 ? Math.max(0, 1 - (u - 1) * 4) : 0.95; g.drawImage(SP[ti], hx - 9, hy - 9, 18, 18);
      if (u >= 1 && fl[e[1]] < 0.99) fl[e[1]] = Math.min(1, fl[e[1]] + 0.35);
    }
    for (let j = 0; j < NO; j++) {
      act[j] += (tgt[j] - act[j]) * Math.min(1, dt * 5); fl[j] *= Math.exp(-dt * 3.2); const v = 0.25 + act[j] * 0.5 + fl[j] * 0.6;
      g.globalAlpha = Math.min(1, v); g.drawImage(SP[ti], qx[j] - 11, qy[j] - 11, 22, 22);
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.beginPath(); g.arc(qx[j], qy[j], 2.6, 0, J.TAU); g.fillStyle = fl[j] > 0.3 ? '#fff' : '#ffa2c6'; g.fill(); g.globalCompositeOperation = 'lighter';
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  });
  const d0 = J.recent[0] || J.makeDecision(); if (d0) { onDecision(d0); for (let j = 0; j < NO; j++) act[j] = tgt[j]; }
  const b = J.$('#hepFire'); if (b) b.addEventListener('click', () => J.fire());
});
