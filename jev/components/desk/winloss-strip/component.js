/* desk-winloss-strip — Win/loss strip  (everything here is SIMULATED)
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* used: JEV.mod  JEV.task  JEV.fit  JEV.watch  JEV.animate  JEV.bus ('decision')  JEV.market  JEV.S  JEV.C
 * Safe without the rest of the page: every DOM lookup is guarded. */
JEV.mod('desk-winloss-strip', () => {
  const J = JEV, $ = J.$, $$ = J.$$, C = J.C, S = J.S, M = J.market, TAU = J.TAU, clamp = J.clamp, fmt = J.fmt;
  const setT = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  const sgnUsd = (v) => (v >= 0 ? '+$' : '-$') + fmt(Math.abs(Math.round(v)));
  const sprite = (rgb) => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(' + rgb + ',.9)'); gr.addColorStop(.3, 'rgba(' + rgb + ',.3)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c;
  };
  const rgbOf = (h) => { const n = parseInt(h.slice(1), 16); return (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255); };
  const GRN = rgbOf(C.green), RED = rgbOf(C.red), AMB = rgbOf(C.amber);
  const OW = 200, rgs = J.rng(7741), outc = [];
  for (let i = 0; i < OW; i++) { const m = 3 + rgs() * 9; outc.push(rgs() < 0.55 ? m : -m * 0.85); }
  let flashT = -9;
const card = $('#dkws'), cv = $('#dkws-cv'); if (!card || !cv) return;
  let st = null; const SG = sprite(GRN), SRd = sprite(RED);
  J.watch(cv, () => { st = J.fit(cv); });
  J.bus.on('decision', (d) => {
    if (d.dest !== 'execute' || (d.action !== 'buy' && d.action !== 'sell')) return;
    const m = (3 + Math.abs(d.net) * 0.26) * (0.55 + Math.random() * 0.9), w = Math.random() < clamp(0.54 + (d.conf - 0.88) * 1.1, 0.3, 0.78);
    outc.push(w ? m : -m * 0.85); if (outc.length > OW) outc.shift(); flashT = performance.now() / 1000;
  });
  const pb = $$('#dkws-pb i');
  function draw(t) {
    if (!st) return; const g = st.g, W = st.W, H = st.H, mid = H / 2; g.clearRect(0, 0, W, H);
    const bw = W / OW; let mx = 6; for (const v of outc) mx = Math.max(mx, Math.abs(v));
    g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(0, mid, W, 1);
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < outc.length; i++) {
      const v = outc[i], h = Math.max(2, Math.abs(v) / mx * (mid - 3)), x = W - (outc.length - i) * bw, w = Math.max(1, bw - 1.2), last = i === outc.length - 1;
      g.fillStyle = v >= 0 ? 'rgba(' + GRN + ',' + (last ? 1 : 0.8) + ')' : 'rgba(' + RED + ',' + (last ? 1 : 0.8) + ')';
      g.fillRect(x, v >= 0 ? mid - h - 1 : mid + 1, w, h);
    }
    const f = Math.max(0, 1 - (t - flashT) * 1.6);
    if (f > 0) { const v = outc[outc.length - 1], r = 22; g.globalAlpha = f; g.drawImage(v >= 0 ? SG : SRd, W - bw - r, mid + (v >= 0 ? -1 : 1) * 10 - r, r * 2, r * 2); g.globalAlpha = 1; }
    g.globalCompositeOperation = 'source-over';
  }
  let ac = 0;
  J.task(card, (t, dt) => {
    draw(t); ac += dt; if (ac < 0.25) return; ac = 0;
    let w = 0, s = 0; for (const v of outc) { if (v > 0) w++; s += v; } const up = w / outc.length * 100;
    if (pb.length === 2) { pb[0].style.setProperty('--w', up.toFixed(1) + '%'); pb[1].style.setProperty('--w', (100 - up).toFixed(1) + '%'); }
    setT($('#dkws-pv'), Math.round(up) + '% up · ' + Math.round(100 - up) + '% down');
    const net = $('#dkws-net'); setT(net, (s >= 0 ? '+' : '') + (s / outc.length).toFixed(1) + 'bp'); net.style.color = s >= 0 ? C.green : C.red;
  });
});
