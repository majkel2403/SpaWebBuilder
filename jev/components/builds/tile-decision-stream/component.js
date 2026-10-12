/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod J.$ J.$$ J.C J.S J.BUILDS J.fmt J.clamp J.animate J.task J.onView J.reduce J.bus; J.bus 'decision' | J.recent | J.makeDecision.
 * Data: d.build d.dest d.action d.symbol d.conf d.venue d.ms d.reason; J.recent (seed), J.S.floor.
 * Optional: body.killed class (set by core on kill). Everything is simulated.
 */
JEV.mod('builds-tile-decision-stream', () => {
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

  // (1) decision stream
  const dsList = $('#bld-ds'), RH = 28;
  function dsRow(d) {
    const b = B[bIdx[d.build]] || B[0], li = document.createElement('li');
    li.className = 'bld-dr'; li.dataset.d = d.dest;
    li.innerHTML = '<span class="bld-dr-b" data-p="' + b.prim + '">' + b.tag.toLowerCase() + '</span><span class="bld-dr-a">' + d.action + ' ' + short(d.symbol) + '</span><span class="bld-dr-c' + (d.conf < S.floor ? ' lo' : '') + '">' + d.conf.toFixed(2) + '</span><span class="bld-dr-d"><i></i>' + d.dest + '</span>';
    vtReg(li, () => b.name.toLowerCase() + ' · ' + d.symbol + ' · ' + d.venue + ' · ' + d.ms.toFixed(1) + ' ms · ' + (d.reason === 'ok' ? 'passed the gate' : d.reason));
    return li;
  }
  const DS_SLIDE = [{ transform: 'translateY(-' + RH + 'px)' }, { transform: 'translateY(0)' }], DS_FADE = [{ opacity: 0 }, { opacity: 1 }];
  function pushStream(d, animate) {
    const li = dsRow(d); dsList.insertBefore(li, dsList.firstChild);
    while (dsList.children.length > 7) dsList.removeChild(dsList.lastChild);
    if (animate && !reduce) {
      J.animate(dsList, DS_SLIDE, { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' });
      J.animate(li, DS_FADE, { duration: 520 });
    }
  }
  (function seed() {
    const src = J.recent.length >= 6 ? J.recent.slice(0, 6).reverse() : Array.from({ length: 6 }, () => J.makeDecision());
    src.forEach((d) => pushStream(d, false));
  })();
  J.bus.on('decision', (d) => { if (true) pushStream(d, true); });

});
