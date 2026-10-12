/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod J.$ J.$$ J.C J.S J.BUILDS J.clamp J.rng J.animate J.reduce J.recent; J.bus 'decision' | 'floor'.
 * Data: decision fields d.conf d.action d.symbol d.size d.riskOk d.venue d.build d.state.funding_bps d.state.spread_bps; JEV.S.floor (the dashed floor line + amber dot below it). One card = one object of JEV.BUILDS ({key, name, tag, col, prim, k1, v1}).
 * Optional: body.killed class (set by core on kill). Everything is simulated.
 */
/* builds / build-card: one reusable build card (name + typed-question tag, answer row, confidence row with a live sparkline of the last 24 confidences,
 * a confidence meter along the bottom edge, hover tilt + glare, click to pin). This page shows four variants (accent colours).
 * To make a card listen only to its own build set FEED_ALL = false; with FEED_ALL = true (demo) every decision refreshes every card so the sparklines move. */
JEV.mod('builds-build-card', () => {
  const J = JEV, $ = J.$, $$ = J.$$, S = J.S, B = J.BUILDS, clamp = J.clamp, reduce = J.reduce;
  const grid = $('#bld-bc-grid'); if (!grid) return;
  const FEED_ALL = true;
  const VARIANTS = [['entry', 'pink'], ['sizer', 'gray'], ['news', 'green'], ['liq', 'blue']]; // [build key, accent: pink|gray|green|blue|yellow|violet|orange|cyan|red]
  const setT = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  const short = (s) => s.split('-')[0];
  const bIdx = {}; B.forEach((b, i) => (bIdx[b.key] = i));
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const seedR = J.rng(11);

  /* ---------- sparkline of the last 24 confidences (SVG, redrawn only when its build answers) ---------- */
  const SPN = 24, SPW = 46, SPHT = 12, SLO = 0.7, SHI = 1;
  const spY = (v) => (1 + (1 - clamp((v - SLO) / (SHI - SLO), 0, 1)) * (SPHT - 2)).toFixed(1);
  function drawSpark(c) {
    const h = c.h, st = SPW / (SPN - 1); let p = '';
    for (let i = 0; i < SPN; i++) p += (i ? ' ' : '') + (i * st).toFixed(1) + ',' + spY(h[i]);
    c.sp.pl.setAttribute('points', p); c.sp.ar.setAttribute('points', '0,' + SPHT + ' ' + p + ' ' + SPW + ',' + SPHT);
    const last = h[SPN - 1]; c.sp.dot.style.top = (spY(last) / SPHT * 100).toFixed(1) + '%'; c.sp.wrap.classList.toggle('lo', last < S.floor);
  }
  function pushSpark(c, v) { c.h.push(v); c.h.shift(); drawSpark(c); }

  function floorLines() { const y = spY(S.floor); cards.forEach((c) => { c.sp.fl.setAttribute('y1', y); c.sp.fl.setAttribute('y2', y); drawSpark(c); }); }

  /* ---------- text helpers ---------- */
  function ans(k, d) {
    const a = d.action, st = d.state;
    switch (k) {
      case 'entry': return a === 'hold' ? 'hold' : a + ' ' + short(d.symbol);
      case 'sizer': return d.size + '% of capital';
      case 'guard': return 'risk_ok? ' + (d.riskOk ? 'yes' : 'no');
      case 'router': return d.venue;
      case 'exit': return a === 'close' ? 'close ' + short(d.symbol) : 'hold';
      case 'funding': return J.sgn(st.funding_bps, 1) + ' bps';
      case 'news': return a === 'hold' ? 'ignore' : 'trade';
      case 'mm': return st.spread_bps > 3.5 ? 'widen' : 'tighten';
      case 'liq': return a === 'flatten' ? 'flatten: yes' : 'flatten: no';
      case 'rebal': return short(d.symbol);
    }
    return a;
  }
  const maxOf = (a) => Math.max(a[0], a[1], a[2], a[3]);
  const FL_LIT = [{ offset: 0, filter: 'brightness(1.4)' }], FL_DECAY = { duration: 1000, easing: 'cubic-bezier(.2,.7,.2,1)' };

  const cards = VARIANTS.map(([key, col], n) => {
    const i = bIdx[key], b = B[i];
    const el = document.createElement('article');
    el.className = 'bld-card bld-b'; el.dataset.c = col; el.dataset.i = i;
    el.style.setProperty('--d', '0s');
    const c0 = 0.86 + seedR() * 0.11;
    el.innerHTML = '<div class="bld-ci"><div class="bld-hd"><b>' + b.name + '</b><i>' + b.tag + '</i></div>' +
      '<div class="bld-rw"><span>' + b.k1 + '</span><b class="bld-v">' + b.v1 + '</b></div>' +
      '<div class="bld-rw"><span>conf</span><i class="bld-sp" aria-hidden="true"><svg viewBox="0 0 ' + SPW + ' ' + SPHT + '" preserveAspectRatio="none" focusable="false"><line class="fl" x1="0" x2="' + SPW + '"/><polygon/><polyline/></svg><em></em></i><b class="bld-c">' + c0.toFixed(2) + '</b></div></div><i class="bld-m"><i style="transform:scaleX(' + c0.toFixed(2) + ')"></i></i>';
    el.tabIndex = 0; el.setAttribute('role', 'button'); el.setAttribute('aria-pressed', 'false');
    el.setAttribute('aria-label', b.name + ', ' + b.prim + ' question. press enter to pin');
    grid.appendChild(el);
    const c = { el, key, v: $('.bld-v', el), c: $('.bld-c', el), m: $('.bld-m > i', el), ms: '' };
    c.sp = { wrap: $('.bld-sp', el), fl: $('.fl', el), ar: $('polygon', el), pl: $('polyline', el), dot: $('.bld-sp em', el) };
    c.h = Array.from({ length: SPN }, () => clamp(c0 + (seedR() - 0.5) * 0.09, 0.8, 0.99)); c.h[SPN - 1] = c0; c.lastId = -1;
    return c;
  });
  J.recent.slice().reverse().forEach((d) => { const c = cards.find((x) => x.key === d.build); if (c) { c.h.push(d.conf); c.h.shift(); c.lastId = d.id; } });
  floorLines();

  const setConf = (c, p) => {
    setT(c.c, p.toFixed(2)); c.c.classList.toggle('lo', p < S.floor);
    const s = 'scaleX(' + clamp(p, 0, 1).toFixed(3) + ')'; if (s !== c.ms) { c.ms = s; c.m.style.transform = s; }
  };
  function step(c, d) {
    setT(c.v, ans(c.key, d)); setConf(c, d.conf);
    if (c.lastId !== d.id) { c.lastId = d.id; pushSpark(c, d.conf); }
    if (!reduce) J.animate(c.el, FL_LIT, FL_DECAY);
  }
  J.bus.on('decision', (d) => { for (const c of cards) if (FEED_ALL || c.key === d.build) step(c, d); });
  J.bus.on('floor', () => { floorLines(); cards.forEach((c) => c.c.classList.toggle('lo', parseFloat(c.c.textContent) < S.floor)); });

  /* hover tilt + glare, click / enter pins (accent ring) */
  cards.forEach((c) => {
    const el = c.el; let rect = null;
    el.addEventListener('pointerenter', (e) => { if (!reduce && e.pointerType === 'mouse' && fine.matches) { rect = el.getBoundingClientRect(); el.classList.remove('bld-settle'); el.classList.add('bld-tilt'); } });
    el.addEventListener('pointermove', (e) => {
      if (!rect || e.pointerType !== 'mouse') return;
      const px = (e.clientX - rect.left) / rect.width, py = (e.clientY - rect.top) / rect.height, st = el.style;
      st.setProperty('--tx', ((0.5 - py) * 12).toFixed(2) + 'deg'); st.setProperty('--ty', ((px - 0.5) * 16).toFixed(2) + 'deg'); st.setProperty('--ts', '1.025');
      st.setProperty('--gx', (px * 100).toFixed(1) + '%'); st.setProperty('--gy', (py * 100).toFixed(1) + '%'); st.setProperty('--ga', '1');
    });
    el.addEventListener('pointerleave', () => {
      if (el.classList.contains('bld-tilt')) { rect = null; el.classList.add('bld-settle'); const st = el.style; st.setProperty('--tx', '0deg'); st.setProperty('--ty', '0deg'); st.setProperty('--ts', '1'); st.setProperty('--ga', '0'); }
    });
    el.addEventListener('transitionend', (e) => { if (e.target === el && e.propertyName === 'transform' && el.classList.contains('bld-settle')) el.classList.remove('bld-tilt', 'bld-settle'); });
    const toggle = () => { const on = !el.classList.contains('bld-pin'); el.classList.toggle('bld-pin', on); el.setAttribute('aria-pressed', on ? 'true' : 'false'); };
    el.addEventListener('click', toggle);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  });
});
