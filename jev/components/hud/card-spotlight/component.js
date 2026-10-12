/* Card spotlight border (hud/card-spotlight)
   Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
   Data: bus decision (dest, conf, line). Sets --mx/--my on .card from the pointer.
*/
JEV.mod('hud-card-spotlight', () => {
  const J = JEV;
  const cards = J.$$('.card'); if (!cards.length) return;
  for (const c of cards) c.addEventListener('pointermove', (e) => { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px'); c.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px'); }, { passive: true });
  if (window.matchMedia('(hover: none)').matches) {
    cards.forEach((c, i) => J.task(c, (t) => {
      const r = c.offsetWidth, h = c.offsetHeight, a = t * 0.5 + i * 2;
      c.style.setProperty('--mx', (r / 2 + Math.cos(a) * r * 0.42).toFixed(0) + 'px'); c.style.setProperty('--my', (h / 2 + Math.sin(a * 1.3) * h * 0.4).toFixed(0) + 'px');
      c.classList.add('hx-lit');
    }));
    const st = document.createElement('style'); st.textContent = '.hx-lit::before, .hx-lit::after { opacity: 1; }'; document.head.appendChild(st);
  }
  J.bus.on('decision', (d) => {
    const c = J.$('.card[data-d="' + d.dest + '"]'); if (!c) return;
    const cf = J.$('[data-f="conf"]', c), ln = J.$('[data-f="line"]', c);
    if (cf) cf.textContent = d.conf.toFixed(2); if (ln) ln.textContent = d.action + ' · ' + d.line;
  });
});
