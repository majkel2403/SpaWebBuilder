/* fx / cursor-spotlight - Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot()
 * Moves #fx-spot inside #fx-spotwrap toward JEV.pointer (eased, gated by JEV.task so it sleeps off-screen). The wrap's own rect is the coordinate space.
 * Data: JEV.pointer only; kill state via body.killed. */
JEV.mod('fx-cursor-spotlight', () => {
  const J = JEV;
  const wrap = J.$('#fx-spotwrap'), spot = J.$('#fx-spot');
  const kb = J.$('#fxdKill');
  if (kb) kb.addEventListener('click', () => { if (J.setKilled) J.setKilled(!J.S.killed); });
  J.bus.on('kill', (on) => { if (kb) kb.setAttribute('aria-pressed', String(!!on)); });
  if (!wrap || !spot || J.reduce) return;
  if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  let cx = 0, cy = 0, seen = false, lx = -1, ly = -1, r = null;
  const measure = () => { r = wrap.getBoundingClientRect(); };
  measure(); addEventListener('resize', measure); addEventListener('scroll', measure, { passive: true });
  J.task(wrap, (t, dt) => {
    const p = J.pointer; measure();
    const inside = p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
    wrap.classList.toggle('on', inside && p.x > -1000);
    if (p.x < -1000) return;
    const px = p.x - r.left, py = p.y - r.top;
    if (!seen) { seen = true; cx = px; cy = py; }
    const k = 1 - Math.exp(-dt * 16);
    cx += (px - cx) * k; cy += (py - cy) * k;
    if (Math.abs(cx - lx) < 0.05 && Math.abs(cy - ly) < 0.05) return;
    lx = cx; ly = cy;
    spot.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
  });
});
