/* Metric chip strip (hud/metric-strip)
   Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
   Data: core.js drives #mDec #mCost #mMed #mFloor from JEV.S. This module only wires the floor steppers.
*/
JEV.mod('hud-metric-strip', () => {
  const J = JEV;
  const step = (d) => J.setFloor(Math.round((J.S.floor + d) * 100) / 100);
  const dn = document.getElementById('hx-fl-dn'), up = document.getElementById('hx-fl-up');
  if (dn) dn.addEventListener('click', () => step(-0.01));
  if (up) up.addEventListener('click', () => step(0.01));
});
