/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod J.$ J.$$ J.C J.S J.BUILDS J.fmt J.clamp J.animate J.task J.onView J.reduce J.bus; J.bus 'decision'.
 * Data: d.build (which row to light); JEV.BUILDS[i].ms (baseline latency, jittered locally).
 * Optional: body.killed class (set by core on kill). Everything is simulated.
 */
JEV.mod('builds-tile-latency', () => {
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

  // (2) latency by build
  const latEl = $('#bld-lat'), latT = $('#bld-t-lat'), MAXMS = 9;
  const latRows = B.map((b, i) => {
    const li = document.createElement('li'); li.className = 'bld-lr'; li.dataset.i = i; li.style.setProperty('--bc', PCOL[b.prim]);
    li.innerHTML = '<span>' + b.tag.toLowerCase() + '</span><div class="tr"><i></i></div><b>' + b.ms.toFixed(1) + '</b>';
    latEl.appendChild(li); const o = { li, fill: $('.tr i', li), val: $('b', li), base: b.ms, cur: b.ms };
    vtReg(li, () => b.tag.toLowerCase() + ' · ' + o.cur.toFixed(1) + ' ms · ' + Math.round(o.cur / MAXMS * 100) + '% of the ' + MAXMS + ' ms scale');
    return o;
  });
  function jitterLat() { latRows.forEach((r) => { const v = r.base * (0.86 + Math.random() * 0.3); r.cur = v; r.fill.style.transform = 'scaleX(' + clamp(v / MAXMS, 0.03, 1).toFixed(3) + ')'; setT(r.val, v.toFixed(1)); }); vtRefresh(); }
  jitterLat();
  let latLast = 0;
  J.task(latT, (t) => { if (t - latLast < 0.7) return; latLast = t; jitterLat(); });
  const hitRow = (d) => { const r = latRows[bIdx[d.build]]; if (!r) return; r.li.classList.add('hit'); setTimeout(() => r.li.classList.remove('hit'), 900); };
  J.bus.on('decision', (d) => { hitRow(d); });

});
