/* hero / legend-strip — destination legend with live tallies (execute / review / skip) and an idle "tap to fire" hint.
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot()
 * Data: JEV.S.dest {execute, review, skip} (updated by core on every JEV.bus 'decision'). */
JEV.mod('hero-legend-strip', () => {
  'use strict';
  const J = JEV, ex = J.$('#hlsEx'), rv = J.$('#hlsRv'), sk = J.$('#hlsSk'), sim = J.$('#hlsSim'), btn = J.$('#hlsFire');
  if (!ex || !rv || !sk) return;
  let last = performance.now();
  const paint = () => { ex.textContent = J.fmt(J.S.dest.execute, 0); rv.textContent = J.fmt(J.S.dest.review, 0); sk.textContent = J.fmt(J.S.dest.skip, 0); };
  paint();
  J.bus.on('decision', () => { last = performance.now(); paint(); if (sim) sim.classList.remove('is-idle'); });
  const iv = setInterval(() => { if (J.hidden()) return; if (sim) sim.classList.toggle('is-idle', performance.now() - last > 9000); }, 1000);
  if (btn) btn.addEventListener('click', () => J.fire());
});
