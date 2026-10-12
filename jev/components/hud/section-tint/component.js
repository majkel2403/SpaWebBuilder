/* Section tint wash (hud/section-tint)
   Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
   Data: bus "tint" + JEV.tint (core.js owns the tint easing; sections need ids hero/builds/hour/desk/lab).
*/
JEV.mod('hud-section-tint', () => {
  const J = JEV;
  const v = document.getElementById('hx-tint-v'), s = document.getElementById('hx-tint-s');
  const NAMES = { '255,46,110': 'hero · pink', '236,44,176': 'builds · magenta', '255,170,50': 'hour · amber', '96,130,255': 'desk · blue-violet', '46,230,166': 'lab · green', '196,58,214': 'code · orchid', '166,107,255': 'footer · violet' };
  const show = (t) => { const k = t.join(','); if (v) v.textContent = '--tint ' + k; if (s) s.textContent = 'target: ' + (NAMES[k] || 'custom'); };
  J.bus.on('tint', show);
  if (v) { const live = () => { v.textContent = '--tint ' + J.tint.map(Math.round).join(','); }; setInterval(() => { if (!document.hidden) live(); }, 250); }
});
