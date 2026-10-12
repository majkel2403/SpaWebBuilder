/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod J.$ J.$$ J.C J.S J.BUILDS J.rng J.fit J.watch J.task J.onView J.animate J.tier J.pointer J.DPR J.reduce J.hidden J.sgn J.usd J.RULES J.recent J.bus; J.bus 'decision' | 'kill' | 'floor'.
 * Data: decision fields d.id d.build d.action d.symbol d.venue d.conf d.size d.sizes d.p d.pRisk d.riskOk d.dest d.reason d.ms; JEV.BUILDS (10 build definitions), JEV.S.floor / JEV.S.killed, JEV.RULES.
 * Optional: body.killed class (set by core on kill). Everything is simulated.
 */
/* builds / hub: one particle canvas behind a DOM hub (ten build cards -> JEV core -> three typed questions -> five answers -> hard rules). Prefix bld-. */
JEV.mod('builds-hub', () => {
  const J = JEV, $ = J.$, $$ = J.$$, C = J.C, S = J.S, B = J.BUILDS, TAU = J.TAU, clamp = J.clamp, fmt = J.fmt;
  const root = $('#builds'), stage = $('#bld-stage'), cv = $('#bld-cv');
  if (!root || !stage || !cv) return;
  const reduce = J.reduce, mq = window.matchMedia('(max-width: 759px)');
  const setT = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  const short = (s) => s.split('-')[0];
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };

  /* ---------- palette (index = tint id used by ribbons) ---------- */
  const TINT = ['#ff6fa6', '#c9c2d6', '#35e0a8', '#5a8cff', '#ffc53d'];
  const TIDX = { pink: 0, gray: 1, green: 2, blue: 3, yellow: 4 };
  const TRGB = TINT.map(hex), RED = [255, 77, 94], WHITE = [255, 255, 255];
  const PRIMS = ['choice', 'score', 'flag'];
  const PCOL = { choice: C.pink, score: C.amber, flag: C.green };
  const bIdx = {}; B.forEach((b, i) => (bIdx[b.key] = i));
  const mix = (a, b, k) => 'rgba(' + ((a[0] + (b[0] - a[0]) * k) | 0) + ',' + ((a[1] + (b[1] - a[1]) * k) | 0) + ',' + ((a[2] + (b[2] - a[2]) * k) | 0);

  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const TICK = [{ offset: 0, color: '#fff' }];


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

  /* ---------- ribbons + particles (one canvas behind the DOM cards) ---------- */
  const NS = 40, NR = 33, NB = 12;
  const R_BUILD = 0, R_CORE = 10, R_PD = 13, R_DR = 28; // slot bases: build 0-9 · core->prim 10-12 · prim->dec 13-27 · dec->rules 28-32
  const LENS = new Float32Array(NS); for (let i = 0; i < NS; i++) LENS[i] = Math.pow(Math.sin(Math.PI * i / (NS - 1)), 0.72);
  const L = new Float32Array(NR * NS * 4), RLEN = new Float32Array(NR), RW = new Float32Array(NR), RN = new Int32Array(NR), RTINT = new Uint8Array(NR);
  const EX = new Float32Array(NR), EY = new Float32Array(NR);
  const boost = new Float32Array(NR), hovT = new Float32Array(NR), hov = new Float32Array(NR), hovUntil = new Float64Array(NR), SM = new Float32Array(NR), EFF = new Float32Array(NR);
  const SPH = new Float32Array(NR * 7), SK = new Float32Array(NR * 7), SA = new Float32Array(NR * 7), SOM = new Float32Array(NR * 7);
  const MAXP = 3600, MAXB = 380;
  const PR = new Uint8Array(MAXP), PU = new Float32Array(MAXP), PVU = new Float32Array(MAXP), PPH = new Float32Array(MAXP), PK = new Float32Array(MAXP), PA = new Float32Array(MAXP), POM = new Float32Array(MAXP), PJ = new Float32Array(MAXP), PX = new Float32Array(MAXP), PY = new Float32Array(MAXP);
  const PTX = new Float32Array(MAXP), PTY = new Float32Array(MAXP), PT = new Float32Array(MAXP), HOT1 = new Int32Array(MAXP), HOT2 = new Int32Array(MAXP);
  const bs = new Int32Array(NB + 1);
  let NP = 0, stars = new Int32Array(0), ridx = [];
  const BR = new Int16Array(MAXB).fill(-1), BU = new Float32Array(MAXB), BV = new Float32Array(MAXB), BL = new Float32Array(MAXB), BP = new Float32Array(MAXB);
  let ready = false, g = null, W = 0, H = 0, sx0 = 0, sy0 = 0, coreCx = 0, coreCy = 0;
  const hz = document.createElement('canvas');
  let kk = S.killed ? 1 : 0, kT = kk, kShown = -1;
  const bstyle = new Array(NB).fill('#fff'), hotS = ['#fff', '#fff'];
  const BALPHA = [0.5, 0.95];
  const bsz = [1.0, 1.55];
  const spr = TRGB.concat([WHITE, RED]).map((c) => {
    const s = document.createElement('canvas'); s.width = s.height = 32; const x = s.getContext('2d');
    const gr = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(0.18, 'rgba(' + c.join(',') + ',.75)'); gr.addColorStop(0.5, 'rgba(' + c.join(',') + ',.18)'); gr.addColorStop(1, 'rgba(' + c.join(',') + ',0)');
    x.fillStyle = gr; x.fillRect(0, 0, 32, 32); return s;
  });

  const anc = { x: 0, y: 0 };
  function addRibbon(slot, a, p1, p2, b, w, dens, tint) {
    const o = slot * NS * 4;
    let len = 0, px = a.x, py = a.y;
    for (let i = 0; i < NS; i++) {
      const s = i / (NS - 1), m = 1 - s;
      const x = m * m * m * a.x + 3 * m * m * s * p1.x + 3 * m * s * s * p2.x + s * s * s * b.x;
      const y = m * m * m * a.y + 3 * m * m * s * p1.y + 3 * m * s * s * p2.y + s * s * s * b.y;
      let dx = 3 * m * m * (p1.x - a.x) + 6 * m * s * (p2.x - p1.x) + 3 * s * s * (b.x - p2.x);
      let dy = 3 * m * m * (p1.y - a.y) + 6 * m * s * (p2.y - p1.y) + 3 * s * s * (b.y - p2.y);
      const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
      L[o + i * 4] = x; L[o + i * 4 + 1] = y; L[o + i * 4 + 2] = -dy; L[o + i * 4 + 3] = dx;
      if (i) len += Math.hypot(x - px, y - py); px = x; py = y;
    }
    RLEN[slot] = len; RW[slot] = w; RTINT[slot] = tint; EX[slot] = b.x; EY[slot] = b.y;
    RN[slot] = Math.min(520, Math.max(mq.matches ? 22 : 36, Math.round(len * dens * QF * (mq.matches ? 0.42 : 1))));
  }

  const setFR = (i, r) => { flR[i * 4] = r.l; flR[i * 4 + 1] = r.t; flR[i * 4 + 2] = r.w; flR[i * 4 + 3] = r.h; };
  let lastSig = '', mTimer = 0, QF = 1; // QF: particle quality, lowered once if frames run slow
  function measure() {
    const f = J.fit(cv); g = f.g; W = f.W; H = f.H;
    const sr = cv.getBoundingClientRect(); // everything is measured in canvas space (the canvas overhangs the stage by GM px so card glows are not clipped at its edges)
    sY = window.scrollY; sx0 = sr.left; sy0 = sr.top + sY;
    let sig = W + 'x' + H + (mq.matches ? 'm' : 'd') + '/' + J.DPR;
    const rc = (el) => { const r = el.getBoundingClientRect(); const l = r.left - sr.left, t = r.top - sr.top; sig += '|' + (l | 0) + ',' + (t | 0) + ',' + (r.width | 0) + ',' + (r.height | 0); return { l, t, r: l + r.width, b: t + r.height, w: r.width, h: r.height, cx: l + r.width / 2, cy: t + r.height / 2 }; };
    const mob = mq.matches, core = rc(coreBox); szk = mob ? 0.72 : 1;
    const bc = bCard.map((c) => rc(c.el)), pc = pCard.map((c) => rc(c.el)), dc = dCard.map((c) => rc(c.el)), ru = rc(rulesEl);
    bc.forEach((r, i) => setFR(i, r)); pc.forEach((r, j) => setFR(10 + j, r)); dc.forEach((r, m) => setFR(13 + m, r)); setFR(FI_RULES, ru);
    coreCx = core.cx; coreCy = core.cy;
    for (let i = 0; i < FLN; i++) { const dx = flR[i * 4] + flR[i * 4 + 2] / 2 - coreCx, dy = flR[i * 4 + 1] + flR[i * 4 + 3] / 2 - coreCy, d = Math.hypot(dx, dy) || 1; NDX[i] = dx / d; NDY[i] = dy / d; ND[i] = d; }
    if (tipOn) tipPlace(tipI);
    if (sig === lastSig && ready) return;
    lastSig = sig;
    RN.fill(0);
    const P = (x, y) => ({ x, y });
    // 1) ten builds -> core (inputs flow INTO the core)
    for (let i = 0; i < 10; i++) {
      const c = bc[i], left = i < 5, k = left ? i : i - 5, tint = TIDX[B[i].col];
      const a = P(left ? c.r : c.l, c.cy);
      if (!mob) {
        const b = P(left ? core.l + 1 : core.r - 1, core.t + core.h * (0.17 + 0.66 * k / 4)), dx = b.x - a.x;
        addRibbon(R_BUILD + i, a, P(a.x + dx * 0.5, a.y), P(b.x - dx * 0.5, b.y), b, 15 + 7 * Math.abs(k - 2) / 2, 0.72, tint);
      } else {
        const b = P(core.cx + (left ? -1 : 1) * (14 + 26 * (4 - k) / 4), core.b - 1), dxs = core.cx - a.x;
        addRibbon(R_BUILD + i, a, P(a.x + dxs * 0.85, a.y), P(b.x, b.y + (a.y - b.y) * 0.5), b, 7, 0.6, tint);
      }
    }
    // 2) core -> three primitives
    for (let j = 0; j < 3; j++) {
      const a = P(core.cx + (j - 1) * core.w * 0.2, core.b - 1), b = P(pc[j].cx, pc[j].t + 1), dy = b.y - a.y;
      addRibbon(R_CORE + j, a, P(a.x, a.y + dy * 0.52), P(b.x, b.y - dy * 0.52), b, mob ? 11 : 22, mob ? 0.9 : 0.6, 0);
    }
    // 3) primitives -> five decisions (mesh); on mobile row two is fed by row one
    for (let j = 0; j < 3; j++) for (let m = 0; m < 5; m++) {
      let a, b = P(dc[m].cx + (j - 1) * dc[m].w * 0.14, dc[m].t + 1);
      if (!mob) a = P(pc[j].cx + (m - 2) * pc[j].w * 0.13, pc[j].b - 1);
      else if (m < 3) a = P(pc[j].cx + (m - 1) * pc[j].w * 0.12, pc[j].b - 1);
      else if (j < 2) { const s = dc[m - 3 + j]; a = P(s.cx, s.b - 1); b = P(dc[m].cx + (j ? 10 : -10), dc[m].t + 1); }
      else continue;
      const dy = b.y - a.y; if (dy < 8) continue;
      addRibbon(R_PD + j * 5 + m, a, P(a.x, a.y + dy * 0.55), P(b.x, b.y - dy * 0.55), b, mob ? 6 : 9, mob ? 0.5 : 0.22, TIDX[dCard[m].el.dataset.c]);
    }
    // 4) decisions -> thresholds + hard rules
    for (let m = 0; m < 5; m++) {
      if (mob && m < 3) continue;
      const a = P(dc[m].cx, dc[m].b - 1), b = P(ru.l + ru.w * (0.14 + 0.72 * m / 4), ru.t + 1), dy = b.y - a.y;
      addRibbon(R_DR + m, a, P(a.x, a.y + dy * 0.55), P(b.x, b.y - dy * 0.55), b, mob ? 7 : 13, mob ? 0.8 : 0.85, TIDX[dCard[m].el.dataset.c]);
    }
    buildParticles();
    paintHaze();
    genCracks();
    ready = true;
    draw(performance.now() / 1000, 0.016, true);
  }
  let live = false;
  const measureSoon = () => { if (!live || mTimer) return; mTimer = setTimeout(() => { mTimer = 0; measure(); }, 60); };

  function buildParticles() {
    const rnd = J.rng(901), cnt = new Int32Array(NB), bk = new Uint8Array(MAXP), rr = new Uint8Array(MAXP);
    let n = 0, tot = 0; for (let ri = 0; ri < NR; ri++) tot += RN[ri];
    if (tot > MAXP) for (let ri = 0; ri < NR; ri++) RN[ri] = Math.floor(RN[ri] * MAXP / tot); // fair share when over budget
    for (let ri = 0; ri < NR; ri++) {
      for (let s = 0; s < 7; s++) { const q = ri * 7 + s; SPH[q] = rnd() * TAU; SK[q] = 2.2 + rnd() * 6.4; SA[q] = 0.35 + rnd() * 0.65; SOM[q] = (rnd() < 0.5 ? -1 : 1) * (0.3 + rnd() * 0.8); }
      for (let k = 0; k < RN[ri] && n < MAXP; k++, n++) {
        const white = rnd() < 0.36, bright = rnd() < (white ? 0.4 : 0.3);
        const b = white ? 10 + (bright ? 1 : 0) : RTINT[ri] * 2 + (bright ? 1 : 0);
        bk[n] = b; rr[n] = ri; cnt[b]++;
      }
    }
    NP = n; let p = 0; const pos = new Int32Array(NB);
    for (let b = 0; b < NB; b++) { bs[b] = p; pos[b] = p; p += cnt[b]; } bs[NB] = p;
    for (let i = 0; i < NP; i++) PR[pos[bk[i]]++] = rr[i];
    const cr = new Int32Array(NR), st = [];
    for (let i = 0; i < NP; i++) {
      const ri = PR[i]; cr[ri]++;
      PU[i] = rnd(); PVU[i] = (62 + rnd() * 70) / RLEN[ri];
      if (rnd() < 0.2) { PK[i] = 0; POM[i] = 0; PPH[i] = Math.PI / 2; PA[i] = (rnd() * 2 - 1) * 0.95; }
      else { const q = ri * 7 + ((rnd() * 7) | 0); PPH[i] = SPH[q] + (rnd() - 0.5) * 0.09; PK[i] = SK[q]; POM[i] = SOM[q]; PA[i] = SA[q]; }
      PJ[i] = (rnd() - 0.5) * 2.2; PT[i] = rnd();
    }
    ridx = []; for (let ri = 0; ri < NR; ri++) ridx.push(new Int32Array(cr[ri]));
    cr.fill(0);
    for (let i = 0; i < NP; i++) { const ri = PR[i]; ridx[ri][cr[ri]++] = i; }
    for (let i = bs[11]; i < NP; i += 9) st.push(i);
    stars = Int32Array.from(st);
  }

  const HS = 0.4; // haze is painted at 40% size and upscaled: free softness, tiny cost
  const HL = [1.4, 1.08, 0.8, 0.54, 0.3], HA = [0.016, 0.024, 0.032, 0.044, 0.06];
  function paintHaze() {
    hz.width = Math.max(2, Math.round(W * HS)); hz.height = Math.max(2, Math.round(H * HS));
    const h = hz.getContext('2d');
    h.setTransform(HS, 0, 0, HS, 0, 0); h.clearRect(0, 0, W, H);
    h.globalCompositeOperation = 'lighter';
    for (let ri = 0; ri < NR; ri++) {
      if (!RN[ri]) continue;
      const c = TRGB[RTINT[ri]].join(',');
      for (let s = 0; s < 5; s++) { h.fillStyle = 'rgba(' + c + ',' + HA[s] + ')'; lens(h, ri, HL[s]); h.fill(); }
      h.strokeStyle = 'rgba(' + c + ',.16)'; h.lineWidth = 2; h.beginPath();
      const o = ri * NS * 4; h.moveTo(L[o], L[o + 1]);
      for (let i = 1; i < NS; i++) h.lineTo(L[o + i * 4], L[o + i * 4 + 1]);
      h.stroke();
      // soft nodes where a ribbon leaves a card / enters the next one
      for (let e = 0; e < 2; e++) {
        const x = e ? EX[ri] : L[o], y = e ? EY[ri] : L[o + 1];
        h.fillStyle = 'rgba(' + c + ',.07)'; h.beginPath(); h.arc(x, y, 11, 0, TAU); h.fill();
        h.fillStyle = 'rgba(' + c + ',.2)'; h.beginPath(); h.arc(x, y, 5, 0, TAU); h.fill();
      }
    }
  }
  function lens(c, ri, sc) {
    const o = ri * NS * 4, w = RW[ri] * sc;
    c.beginPath();
    for (let i = 0; i < NS; i++) { const q = o + i * 4, d = w * LENS[i]; if (i) c.lineTo(L[q] + L[q + 2] * d, L[q + 1] + L[q + 3] * d); else c.moveTo(L[q] + L[q + 2] * d, L[q + 1] + L[q + 3] * d); }
    for (let i = NS - 1; i >= 0; i--) { const q = o + i * 4, d = w * LENS[i]; c.lineTo(L[q] - L[q + 2] * d, L[q + 1] - L[q + 3] * d); }
    c.closePath();
  }

  function recolor() {
    for (let b = 0; b < NB; b++) {
      const white = b >= 10, bright = b & 1, a = white ? (bright ? 0.95 : 0.45) : BALPHA[bright];
      bstyle[b] = mix(white ? WHITE : TRGB[b >> 1], white ? [255, 200, 205] : RED, kk) + ',' + a + ')';
    }
    hotS[0] = mix([255, 196, 140], [255, 150, 150], kk) + ',.8)'; hotS[1] = mix([255, 246, 225], [255, 215, 215], kk) + ',.95)';
    kShown = kk;
  }
  recolor();

  function spawn(ri, n) {
    if (!RN[ri] || reduce) return;
    for (let k = 0, i = 0; k < n && i < MAXB; i++) {
      if (BR[i] >= 0) continue;
      BR[i] = ri; BU[i] = -Math.random() * 0.22; BV[i] = 1.55 + Math.random() * 0.5; BL[i] = (Math.random() * 2 - 1) * 0.85; BP[i] = Math.random() * TAU; k++;
    }
  }
  function boostR(ri, a, n) { if (ri < 0 || ri >= NR || !RN[ri]) return; if (a > boost[ri]) boost[ri] = a; if (n) spawn(ri, n); }

  /* card glow: one 9-slice sprite per tint (analytic rounded-rect falloff = the profile of `0 0 42px` + a 1px ring), built lazily on the first flash, drawn as 8 slices */
  const GM = 50, GR = 9, GK = GM + GR, GS = 2 * GM + 2 * GR + 2, glowS = [];
  function glowSpr(ti) {
    if (glowS[ti]) return glowS[ti];
    const s = document.createElement('canvas'); s.width = s.height = GS;
    const x = s.getContext('2d'), im = x.createImageData(GS, GS), d = im.data, c = TRGB[ti], hw = GS / 2 - GM;
    for (let py = 0; py < GS; py++) for (let px = 0; px < GS; px++) {
      const qx = Math.abs(px + 0.5 - GS / 2) - (hw - GR), qy = Math.abs(py + 0.5 - GS / 2) - (hw - GR);
      const sd = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - GR; // distance outside the card edge (px)
      let a = Math.min(1, 1.6 / (1 + Math.exp(1.702 * Math.max(sd, 0) / 22))); // gaussian edge, sigma ~22 (a 42-44px blur), x1.6 because the old filter brightened the glow with the card
      const tp = Math.min(1, Math.max(0, (GM - 1 - sd) / 22)); a *= tp * tp * (3 - 2 * tp); // taper to 0 before the sprite edge: no visible box
      if (sd > -0.5 && sd < 1.5) a = Math.max(a, sd < 0.5 ? 1 : 1.5 - sd);
      const o = (py * GS + px) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = Math.min(255, a * 255);
    }
    x.putImageData(im, 0, 0);
    return (glowS[ti] = s);
  }
  function glow(c, s, x, y, w, h, a) {
    x -= GM; y -= GM; w += 2 * GM; h += 2 * GM; c.globalAlpha = a;
    const iw = w - 2 * GK, ih = h - 2 * GK, mid = GS - 2 * GK;
    c.drawImage(s, 0, 0, GK, GK, x, y, GK, GK); c.drawImage(s, GS - GK, 0, GK, GK, x + w - GK, y, GK, GK);
    c.drawImage(s, 0, GS - GK, GK, GK, x, y + h - GK, GK, GK); c.drawImage(s, GS - GK, GS - GK, GK, GK, x + w - GK, y + h - GK, GK, GK);
    if (iw > 0) { c.drawImage(s, GK, 0, mid, GK, x + GK, y, iw, GK); c.drawImage(s, GK, GS - GK, mid, GK, x + GK, y + h - GK, iw, GK); }
    if (ih > 0) { c.drawImage(s, 0, GK, GK, mid, x, y + GK, GK, ih); c.drawImage(s, GS - GK, GK, GK, mid, x + w - GK, y + GK, GK, ih); }
  }

  /* ---------- spectacle: travelling pulses · shockwave + card nudge · ice cracks + red static · additive bloom (all tier / reduced-motion gated) ---------- */
  const NPUL = 16, PLR = new Int16Array(NPUL).fill(-1), PLU = new Float32Array(NPUL), PLV = new Float32Array(NPUL), PLS = new Float32Array(NPUL);
  let rpx = 0, rpy = 0;
  const ribPt = (ri, u) => { const fi = Math.min(NS - 1.001, u * (NS - 1)), j = fi | 0, tt = fi - j, o = ri * NS * 4 + j * 4; rpx = L[o] + (L[o + 4] - L[o]) * tt; rpy = L[o + 1] + (L[o + 5] - L[o + 1]) * tt; };
  const fancyNow = () => (J.tier || 2) >= 2 && !reduce;
  function pulse(ri, str, dur) {
    if (ri < 0 || ri >= NR || !RN[ri] || !fancyNow()) return;
    for (let i = 0; i < NPUL; i++) if (PLR[i] < 0) { PLR[i] = ri; PLU[i] = 0; PLV[i] = 1 / dur; PLS[i] = str; return; }
  }
  const NSW = 3, SWT = new Float32Array(NSW).fill(-1), SWA = new Float32Array(NSW), SW_LIFE = 1.7;
  let nudging = false;
  function shock(a) {
    if (!fancyNow()) return;
    let k = 0; for (let i = 0; i < NSW; i++) { if (SWT[i] < 0) { k = i; break; } if (SWT[i] > SWT[k]) k = i; }
    SWT[k] = 0; SWA[k] = a;
  }
  function drawShock(dt, tr) {
    let act = false;
    const kmul = mq.matches ? 0.6 : 1;
    for (let k = 0; k < NSW; k++) {
      if (SWT[k] < 0) continue;
      const age = (SWT[k] += dt); if (age > SW_LIFE) { SWT[k] = -1; continue; }
      act = true;
      const R = 1000 * (1 - Math.exp(-age * 2.1)), f = 1 - age / SW_LIFE, fa = f * f * SWA[k];
      g.lineCap = 'butt'; g.strokeStyle = kk > 0.5 ? '#ff4d5e' : '#ff6fa6';
      g.globalAlpha = fa * 0.08; g.lineWidth = 34; g.beginPath(); g.arc(coreCx, coreCy, R, 0, TAU); g.stroke();
      g.globalAlpha = fa * 0.4; g.lineWidth = 5; g.beginPath(); g.arc(coreCx, coreCy, R, 0, TAU); g.stroke();
      g.strokeStyle = '#fff'; g.globalAlpha = fa * 0.85; g.lineWidth = 1.5; g.beginPath(); g.arc(coreCx, coreCy, R, 0, TAU); g.stroke();
      if (tr >= 3) { // chromatic split of the front
        g.lineWidth = 1.4; g.globalAlpha = fa * 0.55;
        g.strokeStyle = '#35e0ff'; g.beginPath(); g.arc(coreCx, coreCy, Math.max(1, R - 5), 0, TAU); g.stroke();
        g.strokeStyle = '#ff2e9a'; g.beginPath(); g.arc(coreCx, coreCy, R + 5, 0, TAU); g.stroke();
      }
    }
    if (act || nudging) { // the front pushes cards away from the core (inner `translate`, so measured rects and hover tilt stay put)
      let any = false;
      for (let i = 0; i < FLN; i++) {
        let m = 0;
        for (let k = 0; k < NSW; k++) {
          if (SWT[k] < 0) continue;
          const age = SWT[k], R = 1000 * (1 - Math.exp(-age * 2.1)), f = 1 - age / SW_LIFE, z = (ND[i] - R) / 120;
          m += SWA[k] * 7 * kmul * f * Math.exp(-z * z);
        }
        if (m > 0.05) any = true;
        if (Math.abs(m - NTR[i]) > 0.06 || (m === 0 && NTR[i] !== 0)) { NTR[i] = m; NCI[i].style.translate = m > 0.05 ? (NDX[i] * m).toFixed(1) + 'px ' + (NDY[i] * m).toFixed(1) + 'px' : ''; if (m <= 0.05) NTR[i] = 0; }
      }
      nudging = any || act;
    }
    g.globalAlpha = 1;
  }
  let CK = new Float32Array(0), CKN = 0;
  function genCracks() {
    const r = J.rng(77), out = [];
    const crack = (x, y, a, steps, t0, step, depth) => {
      for (let i = 0; i < steps; i++) {
        const l = step * (0.6 + r() * 0.8); a += (r() - 0.5) * 0.7; const nx = x + Math.cos(a) * l, ny = y + Math.sin(a) * l;
        out.push(x, y, nx, ny, Math.min(0.95, t0 + (i / steps) * 0.5));
        if (depth < 2 && r() < 0.22) crack(nx, ny, a + (r() < 0.5 ? -1 : 1) * (0.5 + r() * 0.6), Math.max(2, ((steps - i) * 0.5) | 0), t0 + (i / steps) * 0.5, step * 0.8, depth + 1);
        x = nx; y = ny;
      }
    };
    const n = mq.matches ? 7 : 11;
    for (let k = 0; k < n; k++) crack(coreCx, coreCy, (k / n) * TAU + r() * 0.5, 12, r() * 0.1, mq.matches ? 22 : 34, 0);
    for (let ri = 0; ri < NR; ri++) {
      if (!RN[ri] || r() < 0.4) continue;
      const j = 6 + ((r() * (NS - 12)) | 0), o = ri * NS * 4 + j * 4;
      crack(L[o], L[o + 1], r() * TAU, 5, 0.25 + r() * 0.3, 14, 1);
    }
    CK = Float32Array.from(out); CKN = CK.length / 5;
  }
  function drawIce(tr) {
    const kc = kk; if (kc < 0.03) return;
    g.beginPath();
    for (let i = 0, q = 0; i < CKN; i++, q += 5) if (CK[q + 4] <= kc) { g.moveTo(CK[q], CK[q + 1]); g.lineTo(CK[q + 2], CK[q + 3]); }
    g.lineJoin = 'round'; g.strokeStyle = '#ff4d5e'; g.globalAlpha = 0.22 * kc; g.lineWidth = 4; g.stroke();
    g.strokeStyle = '#e4f0ff'; g.globalAlpha = 0.85 * kc; g.lineWidth = 1; g.stroke();
    // red static: speckle bursts on the frozen ribbons
    const nn = (kc * (tr >= 3 ? 90 : 55)) | 0;
    g.fillStyle = '#ff5a68'; g.globalAlpha = 0.85 * kc; g.beginPath();
    for (let k = 0; k < nn; k++) {
      const ri = (Math.random() * NR) | 0; if (!RN[ri]) continue;
      const j = (Math.random() * (NS - 1)) | 0, o = ri * NS * 4 + j * 4, off = RW[ri] * LENS[j] * (Math.random() * 2 - 1);
      g.rect(L[o] + L[o + 2] * off, L[o + 1] + L[o + 3] * off, 1 + ((Math.random() * 3) | 0) * 1.6, 1);
    }
    g.fill();
    g.fillStyle = '#fff'; g.globalAlpha = 0.7 * kc; g.beginPath();
    for (let k = 0; k < nn >> 2; k++) {
      const ri = (Math.random() * NR) | 0; if (!RN[ri]) continue;
      const j = (Math.random() * (NS - 1)) | 0, o = ri * NS * 4 + j * 4, off = RW[ri] * LENS[j] * (Math.random() * 2 - 1);
      g.rect(L[o] + L[o + 2] * off, L[o + 1] + L[o + 3] * off, 1.4, 1.4);
    }
    g.fill(); g.globalAlpha = 1;
  }
  /* bloom: the finished frame is box-downsampled in x2 steps (/2 /4 /8) and added back soft; refreshed every other frame */
  let bl = null, blF = 0;
  function bloom() {
    const w = cv.width, h = cv.height;
    if (!bl || bl.w !== w || bl.h !== h) {
      bl = { w, h, c: [] };
      for (let k = 1; k <= 3; k++) { const c = document.createElement('canvas'); c.width = Math.max(2, w >> k); c.height = Math.max(2, h >> k); const x = c.getContext('2d'); x.globalCompositeOperation = 'copy'; bl.c.push([c, x]); }
    }
    if ((blF++ & 1) === 0) { let src = cv; for (let k = 0; k < 3; k++) { const c = bl.c[k]; c[1].drawImage(src, 0, 0, c[0].width, c[0].height); src = c[0]; } }
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.42; g.drawImage(bl.c[1][0], 0, 0, W, H);
    g.globalAlpha = 0.5; g.drawImage(bl.c[2][0], 0, 0, W, H);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }

  let dimV = 0, dimT = 0, tw = 0;
  let szk = 1, lastNow = performance.now(), sY = window.scrollY;
  window.addEventListener('scroll', () => { sY = window.scrollY; }, { passive: true });
  function draw(t, dt, still) {
    if (!ready) return;
    // ---- state ----
    const now = performance.now(), rdt = Math.min(0.4, (now - lastNow) / 1000); lastNow = now; // eased state follows wall-clock, motion follows dt
    const ek = 1 - Math.exp(-rdt * 3.2); kk += (kT - kk) * ek; if (Math.abs(kk - kT) < 0.003) kk = kT;
    if (Math.abs(kk - kShown) > 0.004) recolor();
    const tr = J.tier || 2, fancy = tr >= 2 && !reduce;
    tw += dt * (fancy ? 1 - 0.97 * kk : 1); const tws = fancy ? tw : t; // ribbon wobble clock: freezes under the kill switch
    const dec = Math.exp(-rdt * 1.55), hk = 1 - Math.exp(-rdt * 9);
    dimV += (dimT - dimV) * (1 - Math.exp(-rdt * 7)); if (Math.abs(dimV - dimT) < 0.004) dimV = dimT;
    const dA = 1 - 0.6 * dimV; // pinned / hovered build: every other stream recedes
    for (let i = 0; i < NR; i++) {
      boost[i] *= dec; if (boost[i] < 0.004) boost[i] = 0;
      hov[i] += ((hovT[i] || now < hovUntil[i] ? 1 : 0) - hov[i]) * hk;
      const e = boost[i] > hov[i] * 0.85 ? boost[i] : hov[i] * 0.85; EFF[i] = e;
      SM[i] = (1 + 2.4 * e) * (1 - (fancy ? 0.97 : 0.7) * kk);
    }
    // ---- pointer (stage space) ----
    const Pt = J.pointer, pxs = Pt.x - sx0, pys = Pt.y + sY - sy0, pOn = Pt.x > -5000 && pxs > -120 && pxs < W + 120 && pys > -120 && pys < H + 120;
    if (pOn && !reduce) { const nx = clamp((pxs - coreCx) / 420, -1, 1), ny = clamp((pys - coreCy) / 260, -1, 1); tiltTo(-ny * 9, nx * 13); } else if (fancy) tiltTo(Math.sin(tws * 0.5) * 2.2, Math.cos(tws * 0.37) * 3.5); else tiltTo(0, 0);
    // ---- draw ----
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.clearRect(0, 0, W, H);
    g.globalAlpha = 1 - 0.5 * dimV; g.drawImage(hz, 0, 0, W, H); g.globalAlpha = 1;
    g.globalCompositeOperation = 'lighter';
    // card hit flashes (decaying halos behind the cards)
    const fdec = Math.exp(-rdt * 3.4);
    for (let i = 0; i < FLN; i++) {
      const v = flv[i] * fdec; if (flv[i] <= 0) continue;
      if (v < 0.06) { flv[i] = 0; continue; } // below ~6% the halo is invisible: stop paying 8 drawImage for it
      flv[i] = v; glow(g, glowSpr(flT[i]), flR[i * 4], flR[i * 4 + 1], flR[i * 4 + 2], flR[i * 4 + 3], v);
    }
    // boosted haze + end glows
    for (let ri = 0; ri < NR; ri++) {
      const e = EFF[ri]; if (e < 0.04 || !RN[ri]) continue;
      g.fillStyle = kk > 0.5 ? '#ff4d5e' : TINT[RTINT[ri]];
      g.globalAlpha = e * 0.1; lens(g, ri, 0.85); g.fill();
      g.globalAlpha = Math.min(1, e * 0.85); g.drawImage(spr[kk > 0.5 ? 6 : 5], EX[ri] - 26, EY[ri] - 26, 52, 52);
    }
    g.globalAlpha = 1;
    // particles, batched per colour bucket
    const px = still ? 0 : 1; let nh1 = 0, nh2 = 0;
    for (let b = 0; b < NB; b++) {
      const s0 = bs[b], s1 = bs[b + 1]; if (s0 === s1) continue;
      const sz = (b >= 10 ? (b & 1 ? 1.65 : 1.1) : bsz[b & 1]) * szk;
      g.fillStyle = bstyle[b]; g.globalAlpha = dA; g.beginPath();
      for (let i = s0; i < s1; i++) {
        const ri = PR[i];
        let u = PU[i] + dt * PVU[i] * SM[ri] * px; if (u >= 1) u -= 1; PU[i] = u;
        const fi = u * (NS - 1), j = fi | 0, tt = fi - j, o = ri * NS * 4 + j * 4;
        let x = L[o] + (L[o + 4] - L[o]) * tt, y = L[o + 1] + (L[o + 5] - L[o + 1]) * tt;
        const nx = L[o + 2] + (L[o + 6] - L[o + 2]) * tt, ny = L[o + 3] + (L[o + 7] - L[o + 3]) * tt;
        const ln = LENS[j] + (LENS[j + 1] - LENS[j]) * tt;
        const off = ln * (RW[ri] * PA[i] * Math.sin(PPH[i] + u * PK[i] + tws * POM[i]) + PJ[i]);
        x += nx * off; y += ny * off;
        if (pOn) { const dx = x - pxs, dy = y - pys, d2 = dx * dx + dy * dy; if (d2 < 7000) { const d = Math.sqrt(d2) + 0.01, f = (1 - d2 / 7000), s = f * f * 22 / d; x += dx * s; y += dy * s; } }
        PX[i] = x; PY[i] = y;
        g.rect(x, y, sz, sz);
        if (fancy) {
          PTX[i] = ny; PTY[i] = -nx; // travel direction (ribbon normal rotated)
          const h = (ri >= R_CORE ? 1 - u : u) * 0.75 + PT[i] * 0.35; // colour temperature: charging toward the core, cooling as it leaves
          if (h > 1.0) HOT2[nh2++] = i; else if (h > 0.8) HOT1[nh1++] = i;
        }
      }
      g.fill();
    }
    if (fancy) {
      // motion-blur trails (every other particle, length follows ribbon speed)
      const tm = tr >= 3 ? 0.085 : 0.06;
      g.lineWidth = 1; g.lineCap = 'round';
      for (let b = 0; b < NB; b++) {
        const s0 = bs[b], s1 = bs[b + 1]; if (s0 === s1) continue;
        g.strokeStyle = bstyle[b]; g.globalAlpha = dA * (tr >= 3 ? 0.4 : 0.28); g.beginPath();
        for (let i = s0; i < s1; i += 2) {
          const ri = PR[i], l = Math.min(30, tm * PVU[i] * RLEN[ri] * SM[ri]); if (l < 1.6) continue;
          g.moveTo(PX[i], PY[i]); g.lineTo(PX[i] - PTX[i] * l, PY[i] - PTY[i] * l);
        }
        g.stroke();
      }
      g.lineCap = 'butt';
      if (nh1) { g.fillStyle = hotS[0]; g.globalAlpha = dA; g.beginPath(); for (let k = 0; k < nh1; k++) { const i = HOT1[k]; g.rect(PX[i] - 0.3, PY[i] - 0.3, 2, 2); } g.fill(); }
      if (nh2) { g.fillStyle = hotS[1]; g.globalAlpha = dA; g.beginPath(); for (let k = 0; k < nh2; k++) { const i = HOT2[k]; g.rect(PX[i] - 0.6, PY[i] - 0.6, 2.8, 2.8); } g.fill(); }
    }
    g.globalAlpha = 1;
    // boosted ribbons: bright overlay on their own particles
    for (let ri = 0; ri < NR; ri++) {
      const e = EFF[ri]; if (e < 0.05) continue;
      const ix = ridx[ri]; g.globalAlpha = Math.min(0.9, e * 0.85); g.fillStyle = '#fff'; g.beginPath();
      for (let k = 0; k < ix.length; k++) g.rect(PX[ix[k]] - 0.4, PY[ix[k]] - 0.4, 2.3, 2.3);
      g.fill();
    }
    g.globalAlpha = 1;
    // bursts (decision packets)
    let any = false; for (let i = 0; i < MAXB; i++) if (BR[i] >= 0) { any = true; break; }
    if (any) {
      g.fillStyle = kk > 0.5 ? 'rgba(255,225,225,.95)' : 'rgba(255,255,255,.95)'; g.beginPath();
      for (let i = 0; i < MAXB; i++) {
        const ri = BR[i]; if (ri < 0) continue;
        BU[i] += dt * BV[i] * (1 - (fancy ? 0.95 : 0.55) * kk);
        const u = BU[i]; if (u >= 1) { BR[i] = -1; continue; } if (u < 0) continue;
        const fi = u * (NS - 1), j = fi | 0, tt = fi - j, o = ri * NS * 4 + j * 4, ln = LENS[j] + (LENS[j + 1] - LENS[j]) * tt;
        const off = ln * RW[ri] * BL[i] * Math.sin(BP[i] + u * 5 + t * 1.3);
        const x = L[o] + (L[o + 4] - L[o]) * tt + (L[o + 2] + (L[o + 6] - L[o + 2]) * tt) * off, y = L[o + 1] + (L[o + 5] - L[o + 1]) * tt + (L[o + 3] + (L[o + 7] - L[o + 3]) * tt) * off;
        g.rect(x - 0.5, y - 0.5, 2.6, 2.6);
      }
      g.fill();
    }
    // sparkle stars
    const sp = kk > 0.5 ? 6 : 0;
    for (let k = 0; k < stars.length; k++) {
      const i = stars[k], ri = PR[i];
      g.globalAlpha = (0.34 + 0.4 * Math.sin(t * 2.1 + k * 1.7)) * (0.7 + 0.5 * EFF[ri]) * (EFF[ri] > 0.5 ? 1 : dA);
      g.drawImage(spr[kk > 0.5 ? 6 : RTINT[ri]], PX[i] - 8, PY[i] - 8, 16, 16);
    }
    g.globalAlpha = 1;
    if (fancy) {
      // comets travelling a ribbon (a decision firing from a build runs toward the core)
      for (let i = 0; i < NPUL; i++) {
        const ri = PLR[i]; if (ri < 0) continue;
        const u = (PLU[i] += dt * PLV[i] * (1 - 0.95 * kk)); if (u > 1.2) { PLR[i] = -1; continue; }
        const si = kk > 0.5 ? 6 : RTINT[ri];
        for (let k = 8; k >= 0; k--) {
          const uu = u - k * 0.02; if (uu < 0 || uu > 1) continue;
          ribPt(ri, uu); const f = 1 - k / 9, r = 6 + 9 * f;
          g.globalAlpha = Math.min(1, PLS[i] * f * f * 0.95); g.drawImage(spr[si], rpx - r, rpy - r, r * 2, r * 2);
        }
        if (u <= 1) { ribPt(ri, u); g.globalAlpha = PLS[i]; g.drawImage(spr[kk > 0.5 ? 6 : 5], rpx - 11, rpy - 11, 22, 22); }
      }
      g.globalAlpha = 1;
      drawShock(dt, tr);
      drawIce(tr);
      if (tr >= 3) bloom();
    }
  }

  /* wordmark tilt (cached values, writes only when it moved) */
  const wmw = $('#bld-wmw') || wm;
  let tx = 0, ty = 0, cx0 = 0, cy0 = 0;
  function tiltTo(rx, ry) {
    tx += (rx - tx) * 0.1; ty += (ry - ty) * 0.1;
    if (Math.abs(tx - cx0) + Math.abs(ty - cy0) < 0.04) return;
    cx0 = tx; cy0 = ty; wmw.style.setProperty('--rx', tx.toFixed(2) + 'deg'); wmw.style.setProperty('--ry', ty.toFixed(2) + 'deg');
    coreBox.style.setProperty('--cpx', (50 + ty / 13 * 40).toFixed(1) + '%'); coreBox.style.setProperty('--cpy', (40 - tx / 9 * 40).toFixed(1) + '%'); // caustic light follows the pointer
  }

  /* ---------- timeline of one decision through the hub ---------- */
  const Q = [];
  const later = (ms, f) => { if (reduce) { f(); return; } if (J.hidden()) return; if (Q.length > 60) Q.shift().f(); Q.push({ at: performance.now() + ms, f }); };
  function runQ() { if (!Q.length) return; if (J.hidden()) { Q.length = 0; return; } const now = performance.now(); for (let i = 0; i < Q.length;) { if (Q[i].at <= now) { const q = Q.splice(i, 1)[0]; q.f(); } else i++; } }

  const DEC_FROM = [[0, 2], [1], [0], [0, 2], [2]]; // which primitives feed enter / size / route / exit / flatten
  function activeDecs(d) {
    const a = d.action;
    if (a === 'hold') return [0];
    if (a === 'buy' || a === 'sell') return [0, 1, 2];
    if (a === 'close') return [3, 2];
    return [4, 2]; // flatten
  }
  /* Each step writes the card text/bars first (`fx` false = text only: used by the catch-up when a zone scrolls back into view), then the flash + stream boost. */
  function stepBuild(d, fx) {
    const i = bIdx[d.build]; if (i == null) return;
    const c = bCard[i];
    setT(c.v, ans(d.build, d)); setConf(c, d.conf);
    if (c.lastId !== d.id) { c.lastId = d.id; c.ld = d; pushSpark(c, d.conf); }
    if (tipI === i) tipFill(i, fx);
    if (!fx) return;
    flashCard(c);
    boostR(R_BUILD + i, 1, 34); pulse(R_BUILD + i, 1, 0.52);
  }
  const FL_CORE = [{ offset: 0, filter: 'brightness(1.5) saturate(1.25)' }], FL_WM = [{ offset: 0, textShadow: '0 0 14px #fff, 0 0 46px #ff5a96, 0 0 90px #ff2e6e' }], FL_DOT = [{ offset: 0, opacity: 1, scale: '1.9' }], FL_FADE = [{ opacity: 0.95 }, { opacity: 0 }], CHIP_POP = [{ offset: 0, scale: '1.35', filter: 'brightness(1.8)' }];
  function stepCore(d, fx) {
    setT(lastEl, d.symbol + ' · ' + d.action + ' · ' + d.conf.toFixed(2) + ' → ' + d.dest); lastEl.dataset.d = d.dest;
    const k = clamp((d.conf - 0.5) / 0.5, 0, 1); // halo breathes harder (bigger, brighter) on a confident answer
    coreEl.style.setProperty('--hi', (0.8 + 0.5 * k).toFixed(2)); coreEl.style.setProperty('--hs', (0.88 + 0.2 * k).toFixed(2));
    if (chipEl.dataset.a !== d.action) { chipEl.dataset.a = d.action; chipEl.textContent = d.action; if (fx && !reduce) J.animate(chipEl, CHIP_POP, { duration: 520, easing: 'cubic-bezier(.3,1.6,.5,1)' }); }
    if (!fx) return;
    if (!reduce) {
      J.animate(flashEl, FL_FADE, { duration: 900, easing: 'ease-out' });
      J.animate(coreBox, FL_CORE, { duration: 700, easing: 'ease-out' });
      J.animate(wm, FL_WM, { duration: 800, easing: 'ease-out' });
      dotEls.forEach((e) => J.animate(e, FL_DOT, { duration: 650, easing: 'ease-out' }));
    }
    pulse(R_CORE, 0.9, 0.55); pulse(R_CORE + 1, 0.9, 0.55); pulse(R_CORE + 2, 0.9, 0.55);
    boostR(R_CORE, 1, 40); boostR(R_CORE + 1, d.action === 'hold' ? 0.5 : 1, d.action === 'hold' ? 8 : 34); boostR(R_CORE + 2, 1, 34);
  }
  function stepPrims(d, fx) {
    setT(pCard[0].v, d.action); setConf(pCard[0], d.conf);
    setT(pCard[1].v, d.size + '%'); setConf(pCard[1], maxOf(d.sizes));
    setT(pCard[2].v, d.riskOk ? 'yes' : 'no'); setConf(pCard[2], d.pRisk);
    if (!fx) return;
    pCard.forEach(flashCard);
    const act = activeDecs(d);
    for (const m of act) for (const j of DEC_FROM[m]) { boostR(R_PD + j * 5 + m, 1, 18); pulse(R_PD + j * 5 + m, 0.8, 0.5); }
  }
  function stepDecs(d, fx) {
    const a = d.action, e = dCard[0], z = dCard[1], r = dCard[2], x = dCard[3], f = dCard[4];
    setT(e.v, a === 'hold' ? 'hold' : a === 'buy' || a === 'sell' ? a : 'hold'); setConf(e, d.conf);
    setT(z.v, d.size + '%'); setConf(z, maxOf(d.sizes));
    setT(r.v, d.venue); setT(r.c, d.dest); r.c.dataset.d = d.dest;
    setT(x.v, a === 'close' ? 'close' : 'hold'); setConf(x, d.p.close);
    setT(f.v, a === 'flatten' ? 'yes' : 'no'); setConf(f, d.p.flatten);
    if (!fx) return;
    const act = activeDecs(d);
    for (const m of act) { flashCard(dCard[m]); if (d.dest !== 'skip') { boostR(R_DR + m, 1, 22); pulse(R_DR + m, 0.9, 0.5); } }
  }
  const FL_RULES = [{ offset: 0, filter: 'brightness(1.12)' }];
  const FL_RC_BAD = [{ offset: 0, background: 'rgba(255,193,61,.4)' }], FL_RC_OK = [{ offset: 0, background: 'rgba(46,230,166,.28)' }];
  function stepRules(d) {
    if (reduce) return;
    if (d.dest === 'execute') shock(0.55 + 0.45 * clamp((d.conf - 0.5) / 0.5, 0, 1));
    let key = null;
    if (d.reason === 'kill switch') key = 'kill'; else if (d.reason === 'risk flag') key = 'cap'; else if (d.reason.indexOf('conf') === 0) key = 'floor'; else if (d.size >= 4) key = 'pos';
    if (key && rcEls[key]) J.animate(rcEls[key], d.dest !== 'execute' ? FL_RC_BAD : FL_RC_OK, { duration: 1100, easing: 'ease-out' });
    flv[FI_RULES] = 1; J.animate(rulesEl, FL_RULES, { duration: 900, easing: 'ease-out' });
  }

  /* ---------- build cards: tilt + glare, tooltip card, stream focus (hover / keyboard / pin) ---------- */
  const tip = $('#bld-tip'), tipEls = { n: $('#bld-tip-n'), p: $('#bld-tip-p'), a: $('#bld-tip-a'), c: $('#bld-tip-c'), m: $('#bld-tip-m'), g: $('#bld-tip-g') };
  let hovI = -1, focI = -1, pinI = -1, tipI = -1, tipOn = false;
  const isHot = (i) => i === hovI || i === focI || i === pinI;
  function tipFill(i, pulse) {
    const c = bCard[i], b = B[i], d = c.ld;
    tip.dataset.c = b.col;
    setT(tipEls.n, b.name); setT(tipEls.p, b.prim);
    setT(tipEls.a, c.v.textContent); setT(tipEls.m, (d ? d.ms : b.ms).toFixed(1) + ' ms'); setT(tipEls.g, d ? d.dest : 'n/a');
    tipEls.g.dataset.d = d ? d.dest : '';
    const cs = c.c.textContent;
    if (tipEls.c.textContent !== cs) { setT(tipEls.c, cs); if (pulse && !reduce) J.animate(tipEls.c, TICK, { duration: 600, easing: 'ease-out' }); }
    tipEls.c.classList.toggle('lo', parseFloat(cs) < S.floor);
  }
  function tipPlace(i) {
    const sr = stage.getBoundingClientRect(), r = bCard[i].el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    let x, y;
    if (!mq.matches) { x = i < 5 ? r.right - sr.left + 14 : r.left - sr.left - w - 14; y = r.top - sr.top + r.height / 2 - h / 2; }
    else { x = r.left - sr.left + r.width / 2 - w / 2; y = r.top - sr.top - h - 10; if (y < 0) y = r.bottom - sr.top + 10; }
    x = clamp(x, 0, Math.max(0, sr.width - w)); y = clamp(y, 0, Math.max(0, sr.height - h));
    tip.style.transform = 'translate(' + x.toFixed(0) + 'px,' + y.toFixed(0) + 'px)';
  }
  function applyFocus() {
    const act = hovI >= 0 ? hovI : focI >= 0 ? focI : pinI;
    for (let i = 0; i < B.length; i++) {
      const hot = isHot(i), c = bCard[i];
      hovT[R_BUILD + i] = hot ? 1 : 0;
      c.el.classList.toggle('bld-hot', hot); c.el.classList.toggle('bld-pin', i === pinI);
      const pr = i === pinI ? 'true' : 'false'; if (c.el.getAttribute('aria-pressed') !== pr) c.el.setAttribute('aria-pressed', pr);
    }
    dimT = act >= 0 ? 1 : 0; stage.classList.toggle('bld-focus', act >= 0);
    if (act < 0) { tipI = -1; tipOn = false; tip.classList.remove('on'); tip.setAttribute('aria-hidden', 'true'); return; }
    const first = !tipOn || tipI !== act; tipI = act; tipFill(act, false);
    if (!tipOn) { tip.style.transition = 'none'; tipPlace(act); void tip.offsetWidth; tip.style.transition = ''; } else if (first) tipPlace(act);
    tipOn = true; tip.classList.add('on'); tip.setAttribute('aria-hidden', 'false');
  }
  function togglePin(i) {
    pinI = pinI === i ? -1 : i;
    if (pinI >= 0 && !reduce) spawn(R_BUILD + i, 26);
    applyFocus();
  }
  function buildInteract() {
    bCard.forEach((c, i) => {
      const el = c.el; let rect = null;
      el.addEventListener('pointerenter', (e) => {
        if (e.pointerType === 'touch') return;
        hovI = i; applyFocus();
        if (!reduce && e.pointerType === 'mouse' && fine.matches) { rect = el.getBoundingClientRect(); el.classList.remove('bld-settle'); el.classList.add('bld-tilt'); }
      });
      el.addEventListener('pointermove', (e) => {
        if (!rect || e.pointerType !== 'mouse') return;
        const px = (e.clientX - rect.left) / rect.width, py = (e.clientY - rect.top) / rect.height, st = el.style;
        st.setProperty('--tx', ((0.5 - py) * 12).toFixed(2) + 'deg'); st.setProperty('--ty', ((px - 0.5) * 16).toFixed(2) + 'deg'); st.setProperty('--ts', '1.025');
        st.setProperty('--gx', (px * 100).toFixed(1) + '%'); st.setProperty('--gy', (py * 100).toFixed(1) + '%'); st.setProperty('--ga', '1');
      });
      el.addEventListener('pointerleave', (e) => {
        if (e.pointerType === 'touch') return;
        if (hovI === i) { hovI = -1; applyFocus(); }
        if (el.classList.contains('bld-tilt')) {
          rect = null; el.classList.add('bld-settle'); const st = el.style;
          st.setProperty('--tx', '0deg'); st.setProperty('--ty', '0deg'); st.setProperty('--ts', '1'); st.setProperty('--ga', '0');
        }
      });
      el.addEventListener('transitionend', (e) => { if (e.target === el && e.propertyName === 'transform' && el.classList.contains('bld-settle')) el.classList.remove('bld-tilt', 'bld-settle'); });
      el.addEventListener('pointerdown', () => { const u = performance.now() + 1500; hovUntil[R_BUILD + i] = u; if (!reduce) spawn(R_BUILD + i, 20); });
      el.addEventListener('click', () => togglePin(i));
      el.addEventListener('focus', () => { if (el.matches(':focus-visible')) { focI = i; applyFocus(); } });
      el.addEventListener('blur', () => { if (focI === i) { focI = -1; applyFocus(); } });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePin(i); }
        else if (e.key === 'Escape' && pinI >= 0) { pinI = -1; applyFocus(); }
      });
    });
    document.addEventListener('pointerdown', (e) => { if (pinI >= 0 && e.pointerType === 'touch' && !(e.target.closest && e.target.closest('.bld-b'))) { pinI = -1; applyFocus(); } });
    J.bus.on('floor', floorLines);
  }

  /* ---------- hover / tap boosts a card's streams ---------- */
  function linkCard(el, slots) {
    const on = () => slots.forEach((s) => (hovT[s] = 1)), off = () => slots.forEach((s) => (hovT[s] = 0));
    el.addEventListener('pointerenter', () => { on(); el.classList.add('bld-hot'); });
    el.addEventListener('pointerleave', () => { off(); el.classList.remove('bld-hot'); });
    el.addEventListener('pointerdown', () => { const u = performance.now() + 1500; slots.forEach((s) => { hovUntil[s] = u; if (!reduce) spawn(s, 20); }); });
  }
  buildInteract();
  pCard.forEach((c, j) => linkCard(c.el, [R_CORE + j, R_PD + j * 5, R_PD + j * 5 + 1, R_PD + j * 5 + 2, R_PD + j * 5 + 3, R_PD + j * 5 + 4]));
  dCard.forEach((c, m) => linkCard(c.el, [R_PD + m, R_PD + 5 + m, R_PD + 10 + m, R_DR + m]));
  linkCard(rulesEl, [R_DR, R_DR + 1, R_DR + 2, R_DR + 3, R_DR + 4]);
  linkCard(coreEl, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);


  /* ---------- head stats + rules readouts ---------- */
  const rEls = ['floor', 'cap', 'pos', 'kill'].map((k) => $('#bld-r-' + k)), coreSt = $('#bld-core-st'), liveT = $('#bld-live-t');
  function updRules() {
    const k = S.killed ? 'halted' : 'armed';
    setT(rEls[0], S.floor.toFixed(2)); setT(rEls[1], J.usd(J.RULES.lossCap)); setT(rEls[2], J.RULES.maxPos + '%'); setT(rEls[3], k); setT(coreSt, k); setT(liveT, S.killed ? 'halted' : 'live');
  }

  /* ---------- off-screen gate ---------- */
  /* decisions only repaint the hub while it is within 160px of the viewport; when it comes back it is repainted ONCE from J.recent (final values, no flashes). */
  const zone = { stage: false };
  function catchUp() {
    const rec = J.recent; if (!rec.length) return;
    const seen = {};
    for (let i = 0; i < rec.length; i++) { const d = rec[i]; if (seen[d.build]) continue; seen[d.build] = 1; stepBuild(d, false); }
    stepCore(rec[0], false); stepPrims(rec[0], false); stepDecs(rec[0], false);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => {
      for (const e of es) { const v = e.isIntersecting; if (zone.stage === v) continue; zone.stage = v; if (v) catchUp(); else Q.length = 0; }
    }, { rootMargin: '160px 0px' }).observe(stage);
  } else zone.stage = true;

  /* ---------- bus ---------- */
  J.bus.on('decision', (d) => {
    if (!zone.stage) return;
    stepBuild(d, true);
    later(520, () => stepCore(d, true));
    later(1040, () => stepPrims(d, true));
    later(1520, () => stepDecs(d, true));
    later(1980, () => stepRules(d));
  });
  J.bus.on('kill', (k) => { kT = k ? 1 : 0; updRules(); if (reduce) { kk = kT; recolor(); draw(performance.now() / 1000, 0.016, true); } });
  J.bus.on('floor', () => { updRules(); [...bCard, ...pCard, ...dCard].forEach((c) => c.c.classList.toggle('lo', parseFloat(c.c.textContent) < S.floor && !isNaN(parseFloat(c.c.textContent)))); });
  updRules();



  /* ---------- entrance + frame task + layout watch ---------- */
  J.onView(stage, () => { live = true; measure(); }, { threshold: 0, rootMargin: '700px 0px' });
  J.onView(stage, () => { stage.classList.remove('bld-pre'); [250, 1500].forEach((ms) => setTimeout(measure, ms)); }, { threshold: 0.05 });
  setTimeout(() => stage.classList.remove('bld-pre'), 9000); // failsafe: never leave the hub hidden
  let cost = 0, nf = 0;
  J.task(stage, (t, dt) => {
    const a = performance.now(); runQ(); draw(t, dt, false); cost += performance.now() - a;
    if (++nf === 90) { if (cost / nf > 6.5 && QF > 0.5) { QF *= 0.75; lastSig = ''; measure(); } cost = 0; nf = 0; } // adaptive: slow device -> fewer particles
  });
  requestAnimationFrame(() => J.watch(stage, measureSoon));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureSoon);
  window.addEventListener('load', measureSoon, { once: true });
  if (mq.addEventListener) mq.addEventListener('change', measureSoon);
});

