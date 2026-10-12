/* fx / shockwave-ring - Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot()
 * Provides JEV.shockwave(x, y, {green, host}); x, y are viewport px (default: the kill button, else top right). Reacts to bus 'kill'.
 * Data: none - call it from any event (an order fill, a breach). */
JEV.mod('fx-shockwave-ring', () => {
  const J = JEV, doc = document;
  const host0 = J.$('#fx-shock'), box = J.$('#fxdWave');
  function shockwave(x, y, o) {
    o = o || {};
    const host = o.host || host0;
    if (!host || J.reduce) return;
    const r = host.getBoundingClientRect();
    if (x == null || y == null) { x = r.right - 90; y = r.top + 28; }
    const cx = x - r.left, cy = y - r.top;
    const far = Math.max(Math.hypot(cx, cy), Math.hypot(r.width - cx, cy), Math.hypot(cx, r.height - cy), Math.hypot(r.width - cx, r.height - cy));
    const s = (far * 2.1) / 520;
    (o.green ? [''] : ['', 'b']).forEach((cls) => {
      const el = doc.createElement('i');
      el.className = 'fx-ring ' + (o.green ? 'g ' : '') + cls; el.style.left = cx + 'px'; el.style.top = cy + 'px';
      el.style.setProperty('--s', (o.green ? s * 0.75 : s).toFixed(2));
      el.addEventListener('animationend', () => el.remove(), { once: true });
      host.appendChild(el);
      setTimeout(() => el.remove(), 1700);
    });
  }
  J.shockwave = shockwave;
  const kb = J.$('#fxdKill'), gb = J.$('#fxdGreen');
  const at = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  if (box) box.addEventListener('pointerdown', (e) => { if (!e.target.closest('button')) shockwave(e.clientX, e.clientY, { green: false }); });
  if (gb) gb.addEventListener('click', () => shockwave(...at(gb), { green: true }));
  if (kb) kb.addEventListener('click', () => { if (J.setKilled) J.setKilled(!J.S.killed); });
  J.bus.on('kill', (on) => { if (kb) { kb.setAttribute('aria-pressed', String(!!on)); shockwave(...at(kb), { green: !on }); } });
});
