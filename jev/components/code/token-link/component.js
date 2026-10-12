/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* used: JEV.mod, $, $$. Data: none (static snippets); keys are matched case-insensitively, quotes stripped.
 * Everything is simulated. */
JEV.mod('code-token-link', () => {
  const J = JEV, $ = J.$;
  const root = $('#cx-tl'); if (!root) return;
  const st = $('.cx-tl-st', root), idle = st.dataset.idle;
  const KWS = new Set('import from def return if elif else and or not in is as for while with pass lambda True False None true false null'.split(' '));
  const IDC = /(?:^|\s)code-(?:v|ct|f|fa|fd|a|b|jk|s)(?:\s|$)/;
  let key = '', on = [];
  function keyOf(el) {
    if (!el || el.tagName !== 'SPAN' || !IDC.test(el.className)) return '';
    const t = el.textContent.trim().replace(/^f?["']|["']$/g, '');
    return /^[A-Za-z_][\w-]{1,24}$/.test(t) && !KWS.has(t) ? t : '';
  }
  function link(el) {
    const raw = keyOf(el), k = raw.toLowerCase();
    if (k === key) return;
    for (const e of on) e.classList.remove('code-lk');
    on = []; key = k;
    if (!k) { st.textContent = idle; return; }
    const panes = new Set();
    for (const e of J.$$('.cx-tl-src span', root)) if (e.firstChild && keyOf(e).toLowerCase() === k) { e.classList.add('code-lk'); on.push(e); panes.add(e.closest('.code-pane')); }
    st.textContent = raw + ' · ' + on.length + (on.length === 1 ? ' ref' : ' refs') + ' · ' + panes.size + (panes.size === 1 ? ' pane' : ' panes');
  }
  root.addEventListener('pointerover', (e) => link(e.target));
  root.addEventListener('pointerdown', (e) => link(e.target)); // tap on touch
  root.addEventListener('pointerleave', () => { if (!root.querySelector(':focus')) link(null); });
});
