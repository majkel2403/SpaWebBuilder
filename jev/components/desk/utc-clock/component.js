/* desk-utc-clock — UTC clock  (everything here is SIMULATED)
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* used: JEV.mod  JEV.task  JEV.fit  JEV.watch  JEV.animate  JEV.bus (none)  JEV.market  JEV.S  JEV.C
 * Safe without the rest of the page: every DOM lookup is guarded. */
JEV.mod('desk-utc-clock', () => {
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
  const t0 = Date.now();
const card = $('#dkck'); if (!card) return;
  const clocks = $$('[data-clock]', card), dateEl = $('[data-date]', card), upEl = $('[data-up]', card), p2 = (n) => String(n).padStart(2, '0');
  function flush() {
    const d = new Date(), s = d.toISOString();
    clocks.forEach((e) => setT(e, s.slice(11, 19))); setT(dateEl, s.slice(0, 10));
    const u = Math.floor((Date.now() - t0) / 1000); setT(upEl, p2(Math.floor(u / 60)) + ':' + p2(u % 60));
  }
  flush(); let ac = 0; J.task(card, (t, dt) => { ac += dt; if (ac < 0.25) return; ac = 0; flush(); });
});
