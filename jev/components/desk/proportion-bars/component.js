/* desk-proportion-bars — Proportion bars  (everything here is SIMULATED)
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* used: JEV.mod  JEV.task  JEV.fit  JEV.watch  JEV.animate  JEV.bus ('decision')  JEV.market  JEV.S  JEV.C
 * Safe without the rest of the page: every DOM lookup is guarded. */
JEV.mod('desk-proportion-bars', () => {
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
const card = $('#dkpb'); if (!card) return;
  const segs = (id) => $$('#' + id + ' i');
  const b1 = segs('dkpb-1'), b2 = segs('dkpb-2'), b3 = segs('dkpb-3');
  const n = { up: 55, dn: 45, go: 38, rev: 24, skip: 38, sz: [31, 36, 22, 11] };
  const setW = (el, pct) => { const v = pct.toFixed(1) + '%'; if (el && el.style.getPropertyValue('--w') !== v) el.style.setProperty('--w', v); };
  J.bus.on('decision', (d) => {
    if (d.dest === 'execute') { n.go++; n.sz[d.sizeIdx]++; if (d.action === 'buy' || d.action === 'sell') { if (Math.random() < clamp(0.54 + (d.conf - 0.88) * 1.1, 0.3, 0.78)) n.up++; else n.dn++; } }
    else if (d.dest === 'review') n.rev++; else n.skip++;
  });
  const pc = (a, tot) => Math.round(a / tot * 100);
  function flush() {
    const t1 = n.up + n.dn, t2 = n.go + n.rev + n.skip, t3 = n.sz[0] + n.sz[1] + n.sz[2] + n.sz[3];
    setW(b1[0], n.up / t1 * 100); setW(b1[1], n.dn / t1 * 100); setT($('#dkpb-v1'), pc(n.up, t1) + '% up · ' + pc(n.dn, t1) + '% down');
    setW(b2[0], n.go / t2 * 100); setW(b2[1], n.rev / t2 * 100); setW(b2[2], n.skip / t2 * 100); setT($('#dkpb-v2'), pc(n.go, t2) + ' go · ' + pc(n.rev, t2) + ' rev · ' + pc(n.skip, t2) + ' skip');
    for (let i = 0; i < 4; i++) setW(b3[i], n.sz[i] / t3 * 100); setT($('#dkpb-v3'), n.sz.map((v) => pc(v, t3)).join(' · ') + ' %');
  }
  let ac = 0; J.task(card, (t, dt) => { ac += dt; if (ac < 0.5) return; ac = 0; flush(); });
});
