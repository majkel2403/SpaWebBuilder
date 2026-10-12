/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod J.$ J.$$ J.clamp J.animate J.reduce; bus 'decision'.
 * Data: decision d.symbol d.action d.conf d.dest.
 */
JEV.mod('builds-action-chip', () => {
const J = JEV, $ = J.$, $$ = J.$$, reduce = J.reduce;
  const chip = $('#bld-chip'), last = $('#bld-last'), dots = $$('.bld-dots i');
  if (!chip || !last) return;
  const POP = [{ offset: 0, scale: '1.35', filter: 'brightness(1.8)' }], DOT = [{ offset: 0, opacity: 1, scale: '1.9' }];
  function show(d, fx) {
    const t = d.symbol + ' \u00b7 ' + d.action + ' \u00b7 ' + d.conf.toFixed(2) + ' \u2192 ' + d.dest;
    if (last.textContent !== t) last.textContent = t; last.dataset.d = d.dest;
    if (chip.dataset.a !== d.action) { chip.dataset.a = d.action; chip.textContent = d.action; if (fx && !reduce) J.animate(chip, POP, { duration: 520, easing: 'cubic-bezier(.3,1.6,.5,1)' }); }
    if (fx && !reduce) dots.forEach((e) => J.animate(e, DOT, { duration: 650, easing: 'ease-out' }));
  }
  if (J.recent[0]) show(J.recent[0], false);
  J.bus.on('decision', (d) => show(d, true));
});
