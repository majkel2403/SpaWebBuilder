/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* used: JEV.mod, $, task, time, recent, bus.on. Data: bus 'decision' (d.action d.conf d.size d.dest d.id).
 * Everything is simulated. */
JEV.mod('code-live-pill', () => {
  const J = JEV, $ = J.$, doc = document;
  const root = $('#cx-lv'); if (!root) return;
  const out = $('.cx-lv-out', root), log = $('.cx-lv-log', root), pill = $('.code-lv', root), pt = $('.code-lv-t', root), pn = $('.code-lv-n', root);
  const pad = (s, n) => s + ' '.repeat(Math.max(1, n - s.length));
  const st = { hover: false, focus: false, pin: false, ps: '', pc: -1 }, q = [];
  function line(d) {
    const el = doc.createElement('div'); el.className = 'cx-lv-ln';
    const parts = [['t-dim', 'choice='], ['t-' + d.action, pad(d.action, 8)], ['t-dim', 'conf='], ['t-conf', d.conf.toFixed(2) + ' '], ['t-dim', '-> '], ['t-dest', d.dest]];
    for (const p of parts) { const s = doc.createElement('span'); s.className = p[0]; s.textContent = p[1]; el.appendChild(s); }
    return el;
  }
  function push(d) { out.appendChild(line(d)); while (out.childNodes.length > 24) out.removeChild(out.firstChild); }
  for (const d of (J.recent || []).slice(0, 5).reverse()) push(d);
  const held = () => st.hover || st.focus || st.pin;
  function ui() {
    const s = st.pin ? 'pin' : held() ? 'hover' : 'live';
    if (s !== st.ps) { st.ps = s; pill.setAttribute('data-s', s); pill.setAttribute('aria-pressed', String(st.pin)); pt.textContent = s === 'live' ? 'live' : s === 'pin' ? 'pinned' : 'paused'; }
    const n = held() ? q.length : 0;
    if (n !== st.pc) { st.pc = n; pn.hidden = !n; pn.textContent = '+' + n + ' new'; }
  }
  const resume = () => { st.pin = false; st.hover = st.focus = false; };
  log.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') st.hover = true; });
  log.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') st.hover = false; });
  log.addEventListener('focus', () => { st.focus = true; }); log.addEventListener('blur', () => { st.focus = false; });
  pill.addEventListener('click', () => { if (held()) resume(); else st.pin = true; });
  log.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); if (st.pin) st.pin = false; else st.pin = true; } else if (e.key === 'Escape') { resume(); log.blur(); } });
  J.task(root, () => {
    if (!held()) { while (q.length) push(q.shift()); }
    ui();
  });
  J.bus.on('decision', (d) => { q.push(d); if (q.length > 40) q.shift(); });
  ui();
});
