/* desk/oracle-card — oracle price card: serif price + decimal, change pill, glowing sparkline with a live head dot
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Data: JEV.market {price, open, hist[]} and bus 'tick' (4 Hz).
 */
JEV.mod('desk-oracle-card', () => {
  'use strict';
  const J = JEV, TAU = J.TAU, fmt = J.fmt;
  const cv = J.$('#dkw-ocv');
  if (!cv) return;
  const txt = (el, v) => { if (el && el.textContent !== v) el.textContent = v; };
  const E = { op: J.$('#dkw-op'), opd: J.$('#dkw-opd'), oc: J.$('#dkw-oc') };
  let g = null, W = 0, H = 0, fill = null;
  function draw() {
    if (!g) return;
    const h = J.market.hist, n = Math.min(h.length, 120), s = h.length - n;
    if (n < 4) return;
    let mn = 1e12, mx = -1e12; for (let i = 0; i < n; i++) { const v = h[s + i]; if (v < mn) mn = v; if (v > mx) mx = v; }
    const pad = 6, ih = H - pad * 2, rg = mx - mn || 1;
    g.clearRect(0, 0, W, H); g.beginPath();
    for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * W, y = pad + (1 - (h[s + i] - mn) / rg) * ih; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
    g.lineJoin = 'round'; g.strokeStyle = 'rgba(140,185,255,.28)'; g.lineWidth = 5; g.stroke(); g.strokeStyle = '#b7d0ff'; g.lineWidth = 1.5; g.stroke();
    g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fillStyle = fill; g.fill();
    const ly = pad + (1 - (h[h.length - 1] - mn) / rg) * ih; g.fillStyle = '#fff'; g.beginPath(); g.arc(W - 3, ly, 2.4, 0, TAU); g.fill();
  }
  function layout() {
    const f = J.fit(cv); g = f.g; W = f.W; H = f.H;
    fill = g.createLinearGradient(0, 0, 0, H); fill.addColorStop(0, 'rgba(120,170,255,.36)'); fill.addColorStop(1, 'rgba(120,170,255,0)');
    draw();
  }
  function update() {
    const M = J.market, price = M.price, chg = (price / M.open - 1) * 100;
    txt(E.op, fmt(Math.floor(price))); txt(E.opd, '.' + Math.floor((price % 1) * 10));
    txt(E.oc, (chg >= 0 ? '▲ ' : '▼ ') + J.sgn(chg, 2) + '%');
    const oc = 'dkw-orc ' + (chg >= 0 ? 'up' : 'dn'); if (E.oc.className !== oc) E.oc.className = oc;
    draw();
  }
  J.watch(cv, layout); layout(); update();
  J.bus.on('tick', () => { if (!J.hidden()) update(); });
});
