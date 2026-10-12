/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod J.$ J.$$ J.C J.S J.BUILDS J.fmt J.clamp J.animate J.task J.onView J.reduce J.bus; J.bus 'decision'.
 * Data: only body.killed for the red stop row; the bar values are static illustrative copy in component.js.
 * Optional: body.killed class (set by core on kill). Everything is simulated.
 */
JEV.mod('builds-tile-code-owns', () => {
  const J = JEV, $ = J.$, $$ = J.$$, C = J.C, S = J.S, B = J.BUILDS, clamp = J.clamp, fmt = J.fmt, reduce = J.reduce;
  const setT = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  const short = (s) => s.split('-')[0];
  const bIdx = {}; B.forEach((b, i) => (bIdx[b.key] = i));
  const PCOL = { choice: C.pink, score: C.amber, flag: C.green };
  const TICK = [{ offset: 0, color: '#fff' }];
  const root = document;
  /* value-on-hover bubble for the tile bars / rows (pointer + tap; one element, moved with transform) */
  const vt = $('#bld-vt'), tilesEl = $('.bld-tiles'), vtFn = new WeakMap();
  let vtEl = null, vtTimer = 0;
  const vtReg = (el, fn) => { vtFn.set(el, fn); el.setAttribute('data-vt', ''); };
  function vtHide() { if (vtEl) { vtEl = null; vt.classList.remove('on'); } }
  function vtMove(e) {
    const t = e.target.closest ? e.target.closest('[data-vt]') : null;
    if (!t || !tilesEl.contains(t)) { vtHide(); return; }
    if (t !== vtEl) { vtEl = t; setT(vt, vtFn.get(t)()); vt.classList.add('on'); }
    const r = tilesEl.getBoundingClientRect(), w = vt.offsetWidth, h = vt.offsetHeight;
    vt.style.transform = 'translate(' + clamp(e.clientX - r.left - w / 2, 0, Math.max(0, r.width - w)).toFixed(0) + 'px,' + (e.clientY - r.top - h - 16).toFixed(0) + 'px)';
    if (e.pointerType === 'touch') { clearTimeout(vtTimer); vtTimer = setTimeout(vtHide, 2000); }
  }
  const vtRefresh = () => { if (vtEl) setT(vt, vtFn.get(vtEl)()); };
  tilesEl.addEventListener('pointermove', vtMove); tilesEl.addEventListener('pointerdown', vtMove);
  tilesEl.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch') vtHide(); });
  tilesEl.addEventListener('pointercancel', vtHide);

  // (6) what code owns
  const ownEl = $('#bld-own');
  [['the menu', 96, C.pink, ''], ['thresholds', 92, C.pink, ''], ['orders', 84, C.pink2, ''], ['the stop', 100, C.amber, 'stop'], ['the log', 70, '#ffd4e4', '']].forEach(([label, w, col, cl], n) => {
    const li = document.createElement('li'); li.className = 'bld-or ' + cl; li.style.setProperty('--bc', col); li.style.setProperty('--w', (w / 100).toFixed(2)); li.style.setProperty('--n', String(n));
    li.innerHTML = '<i></i><span>' + label + '</span><div class="tr"><i></i></div><em>code</em>'; ownEl.appendChild(li);
    vtReg(li, () => label + ' · held by code · ' + w + '/100, illustrative');
  });
  J.bus.on('decision', (d) => {  });

});
