/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* used: JEV.mod, $, task, watch, fit, tier, reduce, S.killed, bus.on. Data: bus 'decision' (boost), 'kill' (palette). Gate: tier >= 2 (JEV.tier), frozen under reduced motion.
 * Everything is simulated. */
JEV.mod('code-matrix-rain', () => {
  const J = JEV, $ = J.$, doc = document, reduce = J.reduce;
  const rc = $('.code-rain', $('#cx-mr') || doc); if (!rc || reduce) return;
  const RCW = 9, RCH = 13, RG = '0123456789abcdef$%+-<>/=#{}';
  function atlas(color) {
    const a = doc.createElement('canvas'); a.width = RCW * RG.length; a.height = RCH;
    const g = a.getContext('2d'); g.font = '700 11px ui-monospace, Menlo, Consolas, monospace'; g.textBaseline = 'middle'; g.fillStyle = color;
    for (let i = 0; i < RG.length; i++) g.fillText(RG[i], i * RCW + 1, RCH / 2 + 0.5);
    return a;
  }
  const atl = atlas('#ff8fbd'), atlRed = atlas('#ff5a68');
  let g = null, W = 0, H = 0, ry = new Float32Array(0), rs = new Float32Array(0), fade = 0, boost = 0, on = false;
  J.watch(rc, () => {
    const f = J.fit(rc, 1); g = f.g; W = f.W; H = f.H; const n = Math.max(1, Math.floor(W / RCW));
    ry = new Float32Array(n); rs = new Float32Array(n);
    for (let i = 0; i < n; i++) { ry[i] = -Math.random() * (H / RCH); rs[i] = 5 + Math.random() * 9; }
  });
  J.task(rc, (t, dt) => {
    if (!g) return;
    if ((J.tier || 2) < 2) { if (on) { on = false; g.clearRect(0, 0, W, H); } return; }
    on = true; boost *= Math.exp(-dt * 2.2); fade += dt;
    if (fade >= 0.05) { g.globalCompositeOperation = 'destination-out'; g.fillStyle = 'rgba(0,0,0,' + (1 - Math.exp(-fade * 1.5)).toFixed(3) + ')'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; fade = 0; }
    const k = (1 + boost * 2.2) * dt, rows = H / RCH, a = J.S.killed ? atlRed : atl;
    for (let i = 0; i < ry.length; i++) {
      const p = ry[i] | 0; ry[i] += rs[i] * k;
      if ((ry[i] | 0) !== p && ry[i] > 0) g.drawImage(a, ((Math.random() * RG.length) | 0) * RCW, 0, RCW, RCH, i * RCW, (ry[i] | 0) * RCH, RCW, RCH);
      if (ry[i] > rows + 2) { ry[i] = -Math.random() * 18; rs[i] = 5 + Math.random() * 9; }
    }
  });
  J.bus.on('decision', () => { boost = 1; });
  J.bus.on('kill', () => { boost = 1; });
});
