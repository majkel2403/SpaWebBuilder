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
  function floorLines() { const y = spY(S.floor); bCard.forEach((c) => { c.sp.fl.setAttribute('y1', y); c.sp.fl.setAttribute('y2', y); drawSpark(c); }); }

  /* ---------- the ten build cards (generated from JEV.BUILDS) ---------- */
  const colL = $('#bld-colL'), colR = $('#bld-colR'), seedR = J.rng(11);
  const wire = (el, ti) => ({ el, ti, v: $('.bld-v', el), c: $('.bld-c', el), m: $('.bld-m > i', el) });
  const bCard = B.map((b, i) => {
    const el = document.createElement('article');
    el.className = 'bld-card bld-b'; el.dataset.c = b.col; el.dataset.i = i;
    el.style.setProperty('--o', String(i < 5 ? i * 2 : (i - 5) * 2 + 1));
    el.style.setProperty('--d', (0.1 + (i % 5) * 0.07 + (i < 5 ? 0 : 0.04)).toFixed(2) + 's');
    const c0 = 0.86 + seedR() * 0.11;
    el.innerHTML = '<div class="bld-ci"><div class="bld-hd"><b>' + b.name + '</b><i>' + b.tag + '</i></div>' +
      '<div class="bld-rw"><span>' + b.k1 + '</span><b class="bld-v">' + b.v1 + '</b></div>' +
      '<div class="bld-rw"><span>conf</span><i class="bld-sp" aria-hidden="true"><svg viewBox="0 0 ' + SPW + ' ' + SPHT + '" preserveAspectRatio="none" focusable="false"><line class="fl" x1="0" x2="' + SPW + '"/><polygon/><polyline/></svg><em></em></i><b class="bld-c">' + c0.toFixed(2) + '</b></div></div><i class="bld-m"><i style="transform:scaleX(' + c0.toFixed(2) + ')"></i></i>';
    el.tabIndex = 0; el.setAttribute('role', 'button'); el.setAttribute('aria-pressed', 'false'); el.setAttribute('aria-describedby', 'bld-tip');
    el.setAttribute('aria-label', b.name + ', ' + b.prim + ' question. press enter to pin its stream');
    (i < 5 ? colL : colR).appendChild(el);
    const c = wire(el, TIDX[b.col]);
    c.sp = { wrap: $('.bld-sp', el), fl: $('.fl', el), ar: $('polygon', el), pl: $('polyline', el), dot: $('.bld-sp em', el) };
    c.h = Array.from({ length: SPN }, () => clamp(c0 + (seedR() - 0.5) * 0.09, 0.8, 0.99)); c.h[SPN - 1] = c0; c.lastId = -1; c.ld = null;
    return c;
  });
  J.recent.slice().reverse().forEach((d) => { const c = bCard[bIdx[d.build]]; if (c) { c.h.push(d.conf); c.h.shift(); c.lastId = d.id; c.ld = d; } });
  floorLines();
  const pCard = $$('.bld-p', root).map((el) => wire(el, 0));
  const dCard = $$('.bld-d', root).map((el) => wire(el, TIDX[el.dataset.c]));
  const rulesEl = $('#bld-rules'), coreEl = $('#bld-core'), coreBox = $('#bld-core-box');
  const chipEl = $('#bld-chip'), dotEls = $$('.bld-dots i', root), lastEl = $('#bld-last'), wm = $('#bld-wm'), flashEl = $('#bld-flash');
  const rcEls = {}; $$('.bld-rc', root).forEach((e) => (rcEls[e.dataset.r] = e));

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
  /* Hit flash = a halo painted on the stage canvas (glow() in the draw loop) + a plain brightness lift on the card. The old flash animated box-shadow + filter on the card itself:
     a re-raster of the card and everything it overlaps every frame, ~7 per decision. It is also "peak first, decay to rest" now (offset 0): a lone keyframe without an offset is
     the END state, which made the old flash ramp UP and then snap off. */
  const FLN = 19, FI_RULES = 18; // flash slots: 0-9 builds · 10-12 questions · 13-17 answers · 18 hard rules
  const flv = new Float32Array(FLN), flT = new Uint8Array(FLN), flR = new Float32Array(FLN * 4);
  bCard.concat(pCard, dCard).forEach((c, i) => { c.fi = i; flT[i] = c.ti; });
  flT[FI_RULES] = TIDX.yellow;
  const NCI = bCard.concat(pCard, dCard).map((c) => $('.bld-ci', c.el)).concat([$('.bld-ci', rulesEl)]);
  const NDX = new Float32Array(FLN), NDY = new Float32Array(FLN), ND = new Float32Array(FLN), NTR = new Float32Array(FLN);
  const FL_LIT = [{ offset: 0, filter: 'brightness(1.4)' }], FL_DECAY = { duration: 1000, easing: 'cubic-bezier(.2,.7,.2,1)' };
  const flashCard = (c) => { if (reduce) return; flv[c.fi] = 1; J.animate(c.el, FL_LIT, FL_DECAY); };
  const setConf = (c, p) => {
    setT(c.c, p.toFixed(2)); c.c.classList.toggle('lo', p < S.floor);
    if (c.m) { const s = 'scaleX(' + clamp(p, 0, 1).toFixed(3) + ')'; if (s !== c.ms) { c.ms = s; c.m.style.transform = s; } } // no style write when the bar did not move
  };

