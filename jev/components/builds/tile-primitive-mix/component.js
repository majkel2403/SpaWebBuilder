/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod J.$ J.$$ J.C J.S J.BUILDS J.fmt J.clamp J.animate J.task J.onView J.reduce J.bus; J.bus 'decision'.
 * Data: J.S.counts {choice, flag, score}.
 * Optional: body.killed class (set by core on kill). Everything is simulated.
 */
JEV.mod('builds-tile-primitive-mix', () => {
  const J = JEV, $ = J.$, $$ = J.$$, C = J.C, S = J.S, B = J.BUILDS, clamp = J.clamp, fmt = J.fmt, reduce = J.reduce;
  const setT = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  const short = (s) => s.split('-')[0];
  const bIdx = {}; B.forEach((b, i) => (bIdx[b.key] = i));
  const PCOL = { choice: C.pink, score: C.amber, flag: C.green };
  const TICK = [{ offset: 0, color: '#fff' }];
  const root = document;
  /* ---------- odometer: reels per digit, spare 0 so 9 -> 0 keeps rolling forward; readable copy in .sr-only ---------- */
  const REEL = '0123456789'.concat('0').replace(/./g, '<bld-n>$&</bld-n>');
  const otf = (p) => 'translateY(calc(var(--oh,1.2em) * ' + -p + '))';
  function odo(el, text, from) {
    const sr = document.createElement('span'), vis = document.createElement('span');
    sr.className = 'sr-only'; vis.className = 'bld-odo'; vis.setAttribute('aria-hidden', 'true');
    el.textContent = ''; el.append(sr, vis); sr.textContent = text;
    let cells = [], cur = '';
    const snap = (c, p) => { c.pos = p; c.r.style.transition = 'none'; c.r.style.transform = otf(p); void c.r.offsetWidth; c.r.style.transition = ''; };
    function build(s) {
      vis.textContent = ''; cells = []; cur = s;
      for (let k = 0; k < s.length; k++) {
        const ch = s[k];
        if (ch >= '0' && ch <= '9') {
          const w = document.createElement('span'), r = document.createElement('span'), d = +ch;
          w.className = 'bld-od'; r.className = 'bld-od-r'; r.innerHTML = REEL; r.style.transform = otf(d); w.appendChild(r); vis.appendChild(w); cells.push({ w, r, d, pos: d });
        } else { const q = document.createElement('span'); q.className = 'bld-op'; q.textContent = ch; vis.appendChild(q); cells.push(null); }
      }
    }
    vis.addEventListener('transitionend', (e) => { if (e.propertyName !== 'transform') return; const c = cells.find((x) => x && x.r === e.target); if (c && c.pos === 10) snap(c, 0); });
    function set(s, o) {
      if (s === cur) return;
      sr.textContent = s;
      if (s.length !== cur.length) { build(s); return; }
      const flash = !(o && o.quiet) && !reduce, st = o && o.stagger;
      for (let k = s.length - 1, n = 0; k >= 0; k--, n++) {
        const c = cells[k], ch = s[k];
        if (!c || ch < '0' || ch > '9') { if (ch !== cur[k]) { build(s); return; } continue; }
        const d = +ch; if (c.d === d) continue;
        if (c.pos === 10) snap(c, 0);
        c.d = d; c.pos = d === 0 && c.pos > 0 ? 10 : d;
        c.r.style.transitionDelay = st ? n * 70 + 'ms' : ''; c.r.style.transform = otf(c.pos);
        if (flash) J.animate(c.w, TICK, { duration: 700, easing: 'ease-out' });
      }
      cur = s;
    }
    build(from || text);
    return { set };
  }
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

  // (4) primitive mix
  const mixEl = $('#bld-mix'), mixT = $('#bld-mix-t');
  const MIXC = [['choice', C.pink], ['flag', C.pink2], ['score', '#ffd4e4']];
  const mixRows = MIXC.map(([k, col]) => {
    const li = document.createElement('li'); li.className = 'bld-mr'; li.style.setProperty('--bc', col);
    li.innerHTML = '<div class="l"><span>' + k + '</span><b><span class="n">0</span><em>0%</em></b></div><div class="tr"><i></i></div>';
    mixEl.appendChild(li);
    const o = { k, n: odo($('.n', li), '0'), p: $('em', li), bar: $('.tr i', li) };
    vtReg(li, () => { const c = S.counts, tot = Math.max(1, c.choice + c.flag + c.score); return k + ' · ' + fmt(c[k]) + ' answers · ' + (c[k] / tot * 100).toFixed(1) + '% of the mix'; });
    return o;
  });
  const mixO = odo(mixT, '0');
  function updMix() {
    const c = S.counts, tot = c.choice + c.flag + c.score;
    mixRows.forEach((r) => { const v = c[r.k]; r.n.set(fmt(v)); setT(r.p, Math.round((v / tot) * 100) + '%'); r.bar.style.transform = 'scaleX(' + (v / tot * 1.5).toFixed(3) + ')'; });
    mixO.set(fmt(tot)); vtRefresh();
  }
  updMix();
  J.bus.on('decision', (d) => { updMix(); });

});
