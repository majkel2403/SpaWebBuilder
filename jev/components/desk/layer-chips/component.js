/* desk-layer-chips — Layer chips  (everything here is SIMULATED)
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* used: JEV.mod  JEV.task  JEV.fit  JEV.watch  JEV.animate  JEV.bus ('decision')  JEV.market  JEV.S  JEV.C
 * Safe without the rest of the page: every DOM lookup is guarded. */
JEV.mod('desk-layer-chips', () => {
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
const card = $('#dklc'); if (!card) return;
  const grp = $('#dklc-grp'), out = $('#dklc-out');
  function sync() {
    const on = $$('button.dkt-chip.on', grp).map((b) => b.textContent.trim()); setT(out, on.length ? on.join(' · ') : 'none');
  }
  if (grp) grp.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('button.dkt-chip'); if (!b) return;
    const on = b.classList.toggle('on'); b.setAttribute('aria-pressed', on ? 'true' : 'false'); sync();
    card.dispatchEvent(new CustomEvent('dkt-layer', { bubbles: true, detail: { layer: b.dataset.l, on } }));   // listen for this to show/hide a layer
  });
  const live = $('#dklc-live');
  J.bus.on('decision', (d) => { if (!live) return; live.dataset.c = d.dest === 'execute' ? 'green' : d.dest === 'review' ? 'yellow' : 'gray'; setT(live, 'last .' + String(Math.round(d.conf * 100)).padStart(2, '0') + ' · ' + d.dest); });
  sync();
});
