/* Quality tier indicator (hud/tier-indicator)
   Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
   Data: JEV.tier + bus "tier". Pin buttons: [data-tier-pin].
*/
JEV.mod('hud-tier-indicator', () => {
  const J = JEV;
  const tr = document.getElementById('hx-tr'); if (!tr) return;
  const bars = J.$$('i', tr), n = document.getElementById('hx-tier-n'), t = document.getElementById('hx-tier-t');
  const pins = J.$$('[data-tier-pin]');
  const NAME = { 1: 'low', 2: 'medium', 3: 'high' };
  const paint = () => {
    const v = J.tier | 0;
    bars.forEach((b, i) => b.classList.toggle('on', i < v));
    if (n) n.textContent = v; if (t) t.textContent = NAME[v] || '';
    pins.forEach((p) => p.setAttribute('aria-pressed', String(+p.dataset.tierPin === v)));
  };
  for (const p of pins) p.addEventListener('click', () => { const v = +p.dataset.tierPin; J.tier = v; document.documentElement.dataset.tier = v; J.bus.emit('tier', v); });
  J.bus.on('tier', paint); paint();
});
