/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* used: JEV.mod, $, $$, animate, hidden, reduce, bus.on. Data: bus 'decision' (hops the band ask -> gate -> skip/write; d.dest decides the route).
 * Everything is simulated. */
JEV.mod('code-line-gutter', () => {
  const J = JEV, $ = J.$;
  const root = $('#cx-lg'); if (!root) return;
  const body = $('.cx-lg-body', root), band = $('.code-band', root), nEl = $('.cx-lg-n', root), lines = J.$$('.code-ln', root);
  const LH = 19; let cur = 0, timers = [];
  function sweep() { // a hop selects the line for a beat
    if (J.reduce || J.hidden()) return;
    J.animate(band, [{ boxShadow: 'inset 2px 0 0 var(--code-bandc), inset 0 0 0 40px var(--code-sel)' }, { boxShadow: 'inset 2px 0 0 var(--code-bandc), inset 0 0 0 40px rgba(255,255,255,0)' }], { duration: 640, easing: 'ease-out' });
  }
  function go(i, fx) {
    i = Math.max(0, Math.min(lines.length - 1, i));
    lines[cur].classList.remove('act'); cur = i; lines[cur].classList.add('act');
    band.style.transform = 'translate3d(0,' + (cur * LH) + 'px,0)'; nEl.textContent = String(cur + 1);
    if (fx) sweep();
  }
  lines.forEach((el, i) => el.addEventListener('click', () => go(i, true)));
  body.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowDown') go(cur + 1, true); else if (e.key === 'ArrowUp') go(cur - 1, true); else if (e.key === 'Home') go(0, true); else if (e.key === 'End') go(lines.length - 1, true); else return;
    e.preventDefault();
  });
  J.bus.on('decision', (d) => { // ask -> gate -> (skip) -> write
    for (const t of timers) clearTimeout(t); timers = [];
    const route = d.dest === 'skip' ? [1, 2, 4, 5, 6] : [1, 2, 3, 6];
    route.forEach((ln, k) => timers.push(setTimeout(() => { if (!J.hidden()) go(ln, true); }, k * 260)));
  });
  go(0, false);
});
