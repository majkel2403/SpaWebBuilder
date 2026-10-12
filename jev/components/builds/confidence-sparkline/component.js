/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod J.$ J.$$ J.clamp J.S J.recent; bus 'decision' 'floor'.
 * Data: decision d.conf, max(d.sizes), d.pRisk, d.p.hold; J.S.floor draws the dashed line.
 */
JEV.mod('builds-confidence-sparkline', () => {
const J = JEV, $ = J.$, $$ = J.$$, S = J.S, clamp = J.clamp;
  const N = 24, W = 46, H = 12;
  const val = { conf: (d) => d.conf, size: (d) => Math.max(d.sizes[0], d.sizes[1], d.sizes[2], d.sizes[3]), risk: (d) => d.pRisk, hold: (d) => d.p.hold };
  const rows = $$('.bld-sprow').map((el) => {
    const lo = +el.dataset.lo, hi = +el.dataset.hi, k = el.dataset.k, sv = el.querySelector('svg');
    return { el, k, lo, hi, floor: el.hasAttribute('data-floor'), fl: $('.fl', el), ar: $('polygon', el), pl: $('polyline', el), dot: $('.bld-sp em', el), sp: $('.bld-sp', el), out: $('.bld-c', el), h: [] };
  });
  const yOf = (r, v) => 1 + (1 - clamp((v - r.lo) / (r.hi - r.lo), 0, 1)) * (H - 2);
  function draw(r) {
    const h = r.h, st = W / (N - 1); let p = '';
    for (let i = 0; i < N; i++) p += (i ? ' ' : '') + (i * st).toFixed(1) + ',' + yOf(r, h[i]).toFixed(1);
    r.pl.setAttribute('points', p); r.ar.setAttribute('points', '0,' + H + ' ' + p + ' ' + W + ',' + H);
    const last = h[N - 1]; r.dot.style.top = (yOf(r, last) / H * 100).toFixed(1) + '%';
    const low = r.floor && last < S.floor; r.sp.classList.toggle('lo', low); r.out.classList.toggle('lo', low);
    const t = last.toFixed(2); if (r.out.textContent !== t) r.out.textContent = t;
    if (r.floor) { const y = yOf(r, S.floor).toFixed(1); r.fl.setAttribute('y1', y); r.fl.setAttribute('y2', y); }
  }
  const hist = J.recent.slice().reverse();
  rows.forEach((r) => {
    const f = val[r.k]; const seed = hist.length ? f(hist[0]) : (r.lo + r.hi) / 2;
    r.h = Array.from({ length: N }, () => seed); hist.forEach((d) => { r.h.push(f(d)); r.h.shift(); }); draw(r);
  });
  J.bus.on('decision', (d) => rows.forEach((r) => { r.h.push(val[r.k](d)); r.h.shift(); draw(r); }));
  J.bus.on('floor', () => rows.forEach(draw));
});
