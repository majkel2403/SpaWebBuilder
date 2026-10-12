/* desk-price-header — Live price header  (everything here is SIMULATED)
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* used: JEV.mod  JEV.task  JEV.fit  JEV.watch  JEV.animate  JEV.bus ('tick')  JEV.market  JEV.S  JEV.C
 * Safe without the rest of the page: every DOM lookup is guarded. */
JEV.mod('desk-price-header', () => {
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
const card = $('#dkph'); if (!card) return;
  const px = $('#dkph-px'), dec = $('#dkph-d'), pp = $('#dkph-pp'), pc = $('#dkph-c'), box = $('.dkt-pxv', card);
  const st = { hi: M.price, lo: M.price, vol: 0, last: M.price };
  function render(price) {
    const up = price >= st.last; st.last = price; if (price > st.hi) st.hi = price; if (price < st.lo) st.lo = price;
    setT(px, fmt(Math.floor(price))); setT(dec, '.' + String(Math.floor((price % 1) * 10)));
    const ch = (price - M.open) / M.open * 100, pos = ch >= 0;
    setT(pc, (pos ? '+' : '-') + Math.abs(ch).toFixed(2) + '%'); pp.classList.toggle('dn', !pos); pp.firstChild.textContent = pos ? '▲' : '▼';
    box.classList.toggle('up', up); box.classList.toggle('dn', !up); setTimeout(() => { box.classList.remove('up', 'dn'); }, 420);
    setT($('#dkph-hi'), fmt(Math.round(st.hi))); setT($('#dkph-lo'), fmt(Math.round(st.lo))); setT($('#dkph-vol'), (st.vol / 1000).toFixed(1) + 'k');
  }
  J.bus.on('tick', (e) => { st.vol += 0.8 + 2.4 * Math.abs(e.dp) / e.price * 1e4 * (0.55 + Math.random() * 0.9); render(e.price); });
  render(M.price);
});
