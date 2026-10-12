/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod J.$ J.$$ J.clamp J.recent; bus 'decision'.
 * Data: counts of d.action over the stream. Register any element: vtReg(el, () => "text"); or put data-vt="static text" on it.
 */
JEV.mod('builds-value-bubble', () => {
const J = JEV, $ = J.$, $$ = J.$$, clamp = J.clamp;
  const setT = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  const vt = $('#bld-vt'), host = $('#bld-vtw'), list = $('#bld-vl');
  if (!vt || !host || !list) return;
  const vtFn = new WeakMap(); let vtEl = null, vtTimer = 0;
  const vtReg = (el, fn) => { vtFn.set(el, fn); el.setAttribute('data-vt', ''); };
  const txt = (el) => (vtFn.has(el) ? vtFn.get(el)() : el.getAttribute('data-vt') || '');
  const hide = () => { if (vtEl) { vtEl = null; vt.classList.remove('on'); } };
  function move(e) {
    const t = e.target.closest ? e.target.closest('[data-vt]') : null;
    if (!t || !host.contains(t)) { hide(); return; }
    if (t !== vtEl) { vtEl = t; setT(vt, txt(t)); vt.classList.add('on'); }
    const r = host.getBoundingClientRect(), w = vt.offsetWidth, h = vt.offsetHeight;
    vt.style.transform = 'translate(' + clamp(e.clientX - r.left - w / 2, 0, Math.max(0, r.width - w)).toFixed(0) + 'px,' + (e.clientY - r.top - h - 16).toFixed(0) + 'px)';
    if (e.pointerType === 'touch') { clearTimeout(vtTimer); vtTimer = setTimeout(hide, 2000); }
  }
  host.addEventListener('pointermove', move); host.addEventListener('pointerdown', move);
  host.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch') hide(); }); host.addEventListener('pointercancel', hide);
  // demo rows: share of each action
  const ACT = [['buy', '#35e0a8'], ['sell', '#ff4d5e'], ['hold', '#b8b2c2'], ['close', '#ffc53d'], ['flatten', '#ff6fa6']];
  const cnt = { buy: 0, sell: 0, hold: 0, close: 0, flatten: 0 }; let tot = 0;
  J.recent.forEach((d) => { cnt[d.action]++; tot++; });
  const rows = ACT.map(([a, col]) => {
    const li = document.createElement('li'); li.className = 'bld-vr'; li.style.setProperty('--bc', col);
    li.innerHTML = '<div class="l"><span>' + a + '</span><b>0%</b></div><div class="tr"><i></i></div>';
    list.appendChild(li); const r = { a, li, b: $('.l b', li), bar: $('.tr i', li) };
    vtReg(li, () => a + ' \u00b7 ' + cnt[a] + ' of ' + tot + ' answers \u00b7 ' + (tot ? Math.round(cnt[a] / tot * 100) : 0) + '%'); return r;
  });
  function upd() { rows.forEach((r) => { const p = tot ? cnt[r.a] / tot : 0; setT(r.b, Math.round(p * 100) + '%'); r.bar.style.transform = 'scaleX(' + p.toFixed(3) + ')'; }); if (vtEl) setT(vt, txt(vtEl)); }
  upd();
  J.bus.on('decision', (d) => { cnt[d.action]++; tot++; upd(); });
});
