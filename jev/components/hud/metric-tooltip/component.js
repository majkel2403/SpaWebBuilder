/* Metric tooltip (hud/metric-tooltip)
   Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
   Markup: any [data-tip] element (give it tabindex="0"). Data: optional live text via bus "decision".
*/
JEV.mod('hud-metric-tooltip', () => {
  const J = JEV;
  const tip = document.createElement('div'); tip.className = 'hud-tip'; tip.setAttribute('role', 'tooltip'); tip.setAttribute('aria-hidden', 'true'); document.body.appendChild(tip);
  let cur = null, tm = 0, touch = false;
  const hide = () => { clearTimeout(tm); cur = null; tip.classList.remove('on'); };
  const show = (m) => {
    if (m === cur) return; cur = m; clearTimeout(tm);
    tip.textContent = m.getAttribute('data-tip'); tip.classList.add('on');
    const r = m.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.round(J.clamp(r.left, 8, innerWidth - w - 8)) + 'px';
    const below = r.bottom + 10, above = r.top - h - 10;
    tip.style.top = Math.round(below + h > innerHeight - 8 && above > 8 ? above : below) + 'px';
    if (touch) tm = setTimeout(hide, 3000);
  };
  const find = (e) => (e.target.closest ? e.target.closest('[data-tip]') : null);
  window.addEventListener('pointerdown', (e) => { touch = e.pointerType === 'touch'; }, { passive: true, capture: true });
  document.addEventListener('mouseover', (e) => { const m = find(e); if (m) show(m); });
  document.addEventListener('mouseout', (e) => { const m = find(e); if (m && !m.contains(e.relatedTarget)) hide(); });
  document.addEventListener('focusin', (e) => { const m = find(e); if (m && e.target.matches(':focus-visible')) show(m); });
  document.addEventListener('focusout', hide);
  window.addEventListener('scroll', () => { if (cur) hide(); }, { passive: true });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
  const live = document.getElementById('hx-tt-live'), last = document.getElementById('hx-tt-last');
  J.bus.on('decision', (d) => {
    if (last) last.textContent = d.symbol + ' ' + d.dest;
    if (live) { live.setAttribute('data-tip', d.line + ' - ' + d.dest + ' at conf ' + d.conf.toFixed(2)); if (cur === live) { tip.textContent = live.getAttribute('data-tip'); } }
  });
});
