/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod J.$ J.$$ J.clamp J.animate J.reduce; bus 'decision'.
 * Data: none required; the first row pings one lit square per decision. Rows come from data-n="0..10" and --bc (colour).
 */
JEV.mod('builds-segmented-squares', () => {
const J = JEV, $ = J.$, $$ = J.$$, reduce = J.reduce;
  const rows = $$('.bld-rr');
  const PING = [{ offset: 0, filter: 'brightness(2.2)', transform: 'scale(1.35)' }];
  function paint(li, n) {
    n = J.clamp(n, 0, 10); li.dataset.n = n;
    $$('.bld-sg i', li).forEach((e, i) => e.classList.toggle('on', i < n));
    const b = $('.l b', li); if (b) b.textContent = String(n);
    const g = $('.bld-sg', li); if (g) { g.setAttribute('aria-label', n + ' of 10'); g.setAttribute('aria-valuenow', n); }
  }
  rows.forEach((li) => {
    const g = $('.bld-sg', li); if (!g) return;
    let h = ''; for (let i = 0; i < 10; i++) h += '<i style="--n:' + i + '"></i>';
    g.innerHTML = h; paint(li, +li.dataset.n);
    if (li.hasAttribute('data-edit')) {
      $$('i', g).forEach((e, i) => e.addEventListener('click', () => paint(li, +li.dataset.n === i + 1 ? i : i + 1)));
      g.addEventListener('keydown', (e) => { const d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0; if (d) { e.preventDefault(); paint(li, +li.dataset.n + d); } });
    }
  });
  const ping = rows.find((r) => r.hasAttribute('data-ping')); let cur = 0;
  J.bus.on('decision', () => {
    if (!ping || reduce) return; const on = $$('.bld-sg i.on', ping); const e = on[cur++ % (on.length || 1)];
    if (e) J.animate(e, PING, { duration: 700, easing: 'ease-out' });
  });
});
