/* hero / legend-strip demo driver (standalone only): idle hint + fire button for the real legend markup. Not part of the hero section's source. */
JEV.mod('hero-legend-strip', () => {
  'use strict';
  const J = JEV, sim = J.$('.hero-leg-sim'), btn = J.$('#hlsFire');
  if (!sim) return;
  let last = performance.now();
  J.bus.on('decision', () => { last = performance.now(); sim.classList.remove('is-idle'); });
  setInterval(() => { if (J.hidden()) return; sim.classList.toggle('is-idle', performance.now() - last > 9000); }, 1000);
  if (btn) btn.addEventListener('click', () => J.fire());
});
