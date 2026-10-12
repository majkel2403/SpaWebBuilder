/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod J.$ J.$$ J.C J.S J.BUILDS J.fmt J.clamp J.animate J.task J.onView J.reduce J.bus J.recent J.makeDecision; J.bus 'decision'.
 * Data: decision fields d.build d.dest d.action d.symbol d.conf d.venue d.ms d.reason; J.S.cost, J.S.count, J.S.counts, J.S.floor.
 * Optional: body.killed class (set by core on kill). Everything is simulated.
 */
JEV.mod('builds-tiles-all', () => {
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

  // (3) cost this run
  const costV = $('#bld-cost-v'), costS = $('#bld-cost-s'), costJ = $('#bld-cost-j');
  const costFmt = (v) => '$' + v.toFixed(4);
  const costO = odo(costV, costFmt(S.cost), costFmt(S.cost).replace(/[1-9]/g, '0')); let costOn = false; // starts on zeros, rolls up when the tile scrolls in
  function updCost() {
    if (costOn) costO.set(costFmt(S.cost));
    setT(costS, fmt(S.count) + ' decisions · $' + (S.cost / Math.max(1, S.count)).toFixed(6) + ' each');
    setT(costJ, '$' + S.cost.toFixed(3));
  }
  J.onView(costV, () => { costOn = true; costO.set(costFmt(S.cost), { stagger: true, quiet: true }); }, { threshold: 0.4 });

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

  // (6) what code owns
  const ownEl = $('#bld-own');
  [['the menu', 96, C.pink, ''], ['thresholds', 92, C.pink, ''], ['orders', 84, C.pink2, ''], ['the stop', 100, C.amber, 'stop'], ['the log', 70, '#ffd4e4', '']].forEach(([label, w, col, cl], n) => {
    const li = document.createElement('li'); li.className = 'bld-or ' + cl; li.style.setProperty('--bc', col); li.style.setProperty('--w', (w / 100).toFixed(2)); li.style.setProperty('--n', String(n));
    li.innerHTML = '<i></i><span>' + label + '</span><div class="tr"><i></i></div><em>code</em>'; ownEl.appendChild(li);
    vtReg(li, () => label + ' · held by code · ' + w + '/100, illustrative');
  });
  updCost(); updMix();
  J.bus.on('decision', (d) => { pushStream(d, true); hitRow(d); updCost(); updMix(); pingRun(); });

});
