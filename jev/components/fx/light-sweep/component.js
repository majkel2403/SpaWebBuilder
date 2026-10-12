/* fx / light-sweep - Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot()
 * Provides JEV.sweep(el): builds the .fx-hsw band once and replays the sweep. Plays when el enters the viewport (JEV.onView) and on hover.
 * Data: none. Mark elements with data-loop for a periodic sweep. */
JEV.mod('fx-light-sweep', () => {
  const J = JEV, doc = document;
  function sweep(el) {
    if (!el) return;
    let host = el.querySelector(':scope > .fx-hsw');
    if (!host) {
      host = doc.createElement('span'); host.className = 'fx-hsw'; host.setAttribute('aria-hidden', 'true');
      host.appendChild(doc.createElement('i')); el.classList.add('fx-hs'); el.appendChild(host);
    }
    if (J.reduce) return;
    host.classList.remove('go'); void host.offsetWidth; host.classList.add('go');
  }
  J.sweep = sweep;
  const els = J.$$('[data-sweep]');
  els.forEach((el) => {
    J.onView(el, () => sweep(el), { once: true, threshold: 0.4 });
    el.addEventListener('pointerenter', () => sweep(el));
  });
  const loops = els.filter((e) => e.hasAttribute('data-loop'));
  if (loops.length) setInterval(() => { if (!J.hidden()) loops.forEach(sweep); }, 3500);
  const rb = J.$('#fxdReplay');
  if (rb) rb.addEventListener('click', () => els.forEach(sweep));
});
