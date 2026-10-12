/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod J.$ J.$$ J.C J.S J.BUILDS J.fmt J.clamp J.animate J.task J.onView J.reduce J.bus; J.bus 'decision'.
 * Data: decision events only (as a heartbeat); the 8 / 1 / 1 split is static copy in component.js.
 * Optional: body.killed class (set by core on kill). Everything is simulated.
 */
JEV.mod('builds-tile-where-it-runs', () => {
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

  // (5) where it runs
  const runEl = $('#bld-run');
  const RUNS = [['api · typed answers', 8, C.pink], ['your laptop (hermes)', 1, C.green], ['gpu box (dots)', 1, C.amber]];
  let apiSq = [];
  RUNS.forEach(([label, n, col], r) => {
    const li = document.createElement('li'); li.className = 'bld-rr'; li.style.setProperty('--bc', col);
    let sq = ''; for (let i = 0; i < 10; i++) sq += '<i class="' + (i < n ? 'on' : '') + '" style="--n:' + i + '"></i>';
    li.innerHTML = '<div class="l"><span>' + label + '</span><b>' + n + '</b></div><div class="bld-sg">' + sq + '</div>';
    runEl.appendChild(li); if (!r) apiSq = $$('.bld-sg i.on', li);
    vtReg(li, () => label + ' · ' + n + ' of 10 builds');
  });
  let runCur = 0;
  const PING = [{ offset: 0, filter: 'brightness(2.2)', transform: 'scale(1.35)' }];
  function pingRun() { const e = apiSq[runCur++ % apiSq.length]; if (e && !reduce) J.animate(e, PING, { duration: 700, easing: 'ease-out' }); }
  J.bus.on('decision', (d) => { pingRun(); });

});
