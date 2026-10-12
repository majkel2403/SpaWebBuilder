/* Orb mascot kit (hud/orb-kit)
   Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
   Data: JEV.pointer, bus decision (dest) / kill. Markup: .orb > .e.l + .e.r, optional data-dest.
*/
JEV.mod('hud-orb-kit', () => {
  const J = JEV;
  const host = document.getElementById('hx-orbs') || document.body;
  const orbs = J.$$('.orb').map((o, i) => ({ o, i, e: J.$$('.e', o), x: 0, y: 0, r: null }));
  if (!orbs.length) return;
  const measure = () => { for (const k of orbs) { const r = k.o.getBoundingClientRect(); k.r = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, s: r.width }; } };
  measure(); window.addEventListener('resize', measure); window.addEventListener('scroll', measure, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(host);
  const anchor = host.closest('.hx-box') || host;
  J.task(anchor, (t) => {
    const p = J.pointer, known = p.x > -9000;
    for (const k of orbs) {
      if (!k.r) continue;
      const max = Math.max(1.5, k.r.s * 0.055);
      let tx, ty;
      if (known) { const dx = p.x - k.r.cx, dy = p.y - k.r.cy, d = Math.hypot(dx, dy) || 1, f = Math.min(1, d / (k.r.s * 1.2)); tx = (dx / d) * max * f; ty = (dy / d) * max * f; }
      else { tx = Math.sin(t * 0.7 + k.i * 1.3) * max * 0.8; ty = Math.sin(t * 0.5 + k.i * 2.1) * max * 0.5; }
      tx = Math.round(tx * 2) / 2; ty = Math.round(ty * 2) / 2;
      if (tx !== k.x || ty !== k.y) { k.x = tx; k.y = ty; k.o.style.setProperty('--ex', tx + 'px'); k.o.style.setProperty('--ey', ty + 'px'); }
    }
  });
  J.bus.on('decision', (d) => {
    for (const k of orbs) {
      if (!d || k.o.dataset.dest !== d.dest) continue;
      for (const e of k.e) J.animate(e, [{ scale: '1 1' }, { scale: '1.35 1.55', offset: 0.22 }, { scale: '1 1' }], { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)' });
      J.animate(k.o, [{ filter: 'brightness(1.7) saturate(1.3)' }, { filter: 'none' }], { duration: 600, easing: 'ease-out' });
    }
  });
});
