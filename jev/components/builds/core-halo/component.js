/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod J.$ J.clamp J.animate J.reduce; bus 'decision'.
 * Data: decision d.conf (0.5..1 drives halo size / brightness). body.killed turns it red.
 */
JEV.mod('builds-core-halo', () => {
const J = JEV, $ = J.$, clamp = J.clamp, reduce = J.reduce;
  const core = $('#bld-core'), flash = $('#bld-flash'), val = $('#bld-hc-v');
  if (!core) return;
  const FADE = [{ opacity: 0.95 }, { opacity: 0 }];
  function show(d, fx) {
    const k = clamp((d.conf - 0.5) / 0.5, 0, 1); // halo breathes harder (bigger, brighter) on a confident answer
    core.style.setProperty('--hi', (0.8 + 0.5 * k).toFixed(2)); core.style.setProperty('--hs', (0.88 + 0.2 * k).toFixed(2));
    if (val) val.textContent = d.conf.toFixed(2);
    if (fx && !reduce && flash) J.animate(flash, FADE, { duration: 900, easing: 'ease-out' });
  }
  if (J.recent[0]) show(J.recent[0], false);
  J.bus.on('decision', (d) => show(d, true));
});
