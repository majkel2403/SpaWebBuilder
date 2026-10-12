/* desk-handoff-pulse — Handoff pulse  (everything here is SIMULATED)
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* used: JEV.mod  JEV.task  JEV.fit  JEV.watch  JEV.animate  JEV.bus ('decision')  JEV.market  JEV.S  JEV.C
 * Safe without the rest of the page: every DOM lookup is guarded. */
JEV.mod('desk-handoff-pulse', () => {
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
  const pulseEv = [], rgp = J.rng(31);
  { const t = performance.now(), dests = ['execute', 'execute', 'execute', 'review', 'review', 'skip', 'skip', 'skip'];
    for (let i = 0; i < 44; i++) pulseEv.push({ t: t - rgp() * 58000, dest: dests[(rgp() * dests.length) | 0], conf: 0.5 + rgp() * 0.48 });
    pulseEv.sort((a, b) => a.t - b.t); }
  const PD = { execute: '#2ee6a6', review: '#ffc13d', skip: '#7d7590' };
const card = $('#dkhp'), pu = $('#dkhp-cv'); if (!card || !pu) return;
  let st = null; J.watch(pu, () => { st = J.fit(pu); });
  J.bus.on('decision', (d) => { pulseEv.push({ t: performance.now(), dest: d.dest, conf: d.conf }); if (pulseEv.length > 90) pulseEv.shift(); });
  function draw() {
    if (!st) return; const g = st.g, W = st.W, H = st.H, t = performance.now(); g.clearRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(0, H - 1, W, 1); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < pulseEv.length; i++) {
      const e = pulseEv[i], age = (t - e.t) / 60000; if (age > 1) continue;
      const x = Math.round(W - 3 - age * (W - 4)), h = 4 + e.conf * (H - 8);
      g.globalAlpha = 1 - age * 0.7; g.fillStyle = PD[e.dest]; g.fillRect(x, H - 1 - h, 2, h);
      if (e.dest === 'execute' && age < 0.5) { g.globalAlpha = 0.14 * (1 - age * 2); g.fillRect(x - 2, H - 1 - h, 6, h); }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  let ac = 0;
  J.task(card, (t, dt) => {
    draw(); ac += dt; if (ac < 0.5) return; ac = 0; const now = performance.now(), n = { execute: 0, review: 0, skip: 0 };
    for (const e of pulseEv) if (now - e.t <= 60000) n[e.dest]++;
    setT($('#dkhp-n1'), String(n.execute)); setT($('#dkhp-n2'), String(n.review)); setT($('#dkhp-n3'), String(n.skip));
  });
});
