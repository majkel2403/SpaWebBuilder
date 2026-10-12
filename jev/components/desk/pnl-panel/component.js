/* desk-pnl-panel — SWARM P&L card: odometer balance, balance-history line with live head, win/loss strip, proportion bars and stats  (everything here is SIMULATED)
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* API relied on:
 *   JEV.mod(name, init)  JEV.task(el, fn(t,dt))  JEV.fit(canvas)  JEV.watch(el, cb)  JEV.animate(el, kf, opts)
 *   JEV.bus  events: 'tick' ({price, dp}, 4 Hz), 'decision' (d: action, symbol, size, sizeIdx, conf, net, dest, venue, build, state{edge_bps, imbalance, spread_bps})
 *   JEV.market {price, open}   JEV.S {killed, floor, cost, dest{execute,review,skip}}   JEV.C palette   JEV.RULES   JEV.tier   JEV.reduce
 *   JEV.rng(seed)  JEV.fmt  JEV.clamp  JEV.TAU  JEV.AGENTS  JEV.SIZES  JEV.narrow()
 * Safe without the rest of the page: optional DOM and optional JEV facilities are guarded. */
JEV.mod('desk-pnl-panel', () => {
  const J = JEV, $ = J.$, $$ = J.$$, C = J.C, S = J.S, M = J.market, TAU = J.TAU, clamp = J.clamp, fmt = J.fmt;
  const pnl = $('#dkt-pnl');
  if (!pnl) return;
  const reduce = J.reduce;
  const MONO = "'JetBrains Mono', ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, Consolas, monospace";
  const nowMs = () => performance.now();
  const setT = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  const rgbOf = (h) => { const n = parseInt(h.slice(1), 16); return (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255); };
  const GRN = rgbOf(C.green), RED = rgbOf(C.red), AMB = rgbOf(C.amber), VIO = rgbOf(C.violet), PNK = rgbOf(C.pink);
  const cG = (a) => 'rgba(' + GRN + ',' + a + ')', cR = (a) => 'rgba(' + RED + ',' + a + ')';
  const sgnUsd = (v) => (v >= 0 ? '+$' : '-$') + fmt(Math.abs(Math.round(v)));
  const sgnPct = (v, d) => (v >= 0 ? '+' : '-') + Math.abs(v).toFixed(d == null ? 2 : d) + '%';
  const short = (s) => s.split('-')[0].toLowerCase();
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  /** soft additive glow sprite (drawn with 'lighter'; replaces shadowBlur) */
  const sprite = (rgb) => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(' + rgb + ',.9)'); gr.addColorStop(.3, 'rgba(' + rgb + ',.3)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c;
  };
  const SP = { g: sprite(GRN), r: sprite(RED), a: sprite(AMB), p: sprite(PNK) };
  const glow = (g, spr, x, y, r, a) => { g.globalAlpha = a; g.drawImage(spr, x - r, y - r, r * 2, r * 2); g.globalAlpha = 1; };
  /* ---- spectacle kit (tier-gated: tier 1 = the page as it always was; reduced motion = off) ---- */
  const tier = () => (reduce ? 1 : (J.tier || 2));
  const SPW = sprite('255,255,255'), SPR = [SP.g, SP.r, SP.a, SP.p, SPW];       // particle sprites: 0 green 1 red 2 amber 3 pink 4 white
  const bandSpr = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 4; const g = c.getContext('2d'), h = g.createLinearGradient(0, 0, 64, 0);
    h.addColorStop(0, 'rgba(255,255,255,0)'); h.addColorStop(.5, 'rgba(255,255,255,.2)'); h.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = h; g.fillRect(0, 0, 64, 4); return c; })();
  /** bounded particle pool (typed arrays, ring-reused: no allocation per spawn / frame). slot = x y vx vy life max size kind */
  const mkPool = (n) => ({ n, a: new Float32Array(n * 8), c: 0 });
  function spawn(p, x, y, vx, vy, life, size, kind) {
    const a = p.a, o = p.c * 8; p.c = (p.c + 1) % p.n;
    a[o] = x; a[o + 1] = y; a[o + 2] = vx; a[o + 3] = vy; a[o + 4] = life; a[o + 5] = life; a[o + 6] = size; a[o + 7] = kind;
  }
  /** burst of radial sparks; ay = vertical accel (px/s^2, negative rises) */
  function burst(p, x, y, n, kind, speed, life, size, ay) {
    for (let i = 0; i < n; i++) { const an = Math.random() * TAU, sp = speed * (0.35 + Math.random() * 0.75); spawn(p, x, y, Math.cos(an) * sp, Math.sin(an) * sp + (ay || 0) * 0.02, life * (0.6 + Math.random() * 0.6), size * (0.7 + Math.random() * 0.6), Math.random() < 0.25 ? 4 : kind); }
  }
  function drawPool(p, g, dt, ay, drag, flick) {
    const a = p.a, k = Math.exp(-dt * drag); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < p.n; i++) {
      const o = i * 8; let life = a[o + 4]; if (life <= 0) continue;
      life -= dt; a[o + 4] = life; if (life <= 0) continue;
      a[o + 2] *= k; a[o + 3] = a[o + 3] * k + ay * dt; a[o] += a[o + 2] * dt; a[o + 1] += a[o + 3] * dt;
      const f = life / a[o + 5], fl = flick ? 0.65 + 0.35 * Math.sin(life * 38 + i * 1.7) : 1;
      glow(g, SPR[a[o + 7]], a[o], a[o + 1], a[o + 6] * (0.35 + 0.65 * f), Math.min(1, f * 1.6) * fl);
    }
    g.globalCompositeOperation = 'source-over';
  }

  /* =====================================================================================
   * shared simulation state
   * ===================================================================================== */
  const BASE = 527759, CAP = BASE, LEV = 10, HEDGE = 0.3, HN = 300, OW = 200;
  const hist = new Float64Array(HN); let hh = 0;               // balance ring: one sample per market tick (4 Hz)
  const hpush = (v) => { hist[hh] = v; hh = (hh + 1) % HN; };
  const hat = (i) => hist[(hh + i) % HN];                      // i = 0 oldest
  const sim = {
    bal: BASE, open: BASE, peak: BASE, dd: 0, shown: BASE, tixN: 14882, outc: [], sumBps: 0, nBps: 300, sizeN: [31, 36, 22, 11],
    tix: [], holder: 'kelly', gap: 1.0, lastDec: 0, edgeAvg: 9, imbT: 0, spr: 1.1, last: null, jump: 0, jumpT: -99, stripDirty: true,
  };
  const rgs = J.rng(7741), gzs = () => Math.sqrt(-2 * Math.log(rgs() + 1e-9)) * Math.cos(TAU * rgs());
  (function seedSim() {
    let nz = 0, step = 0; const raw = [];
    for (let i = 0; i < HN; i++) {
      const x = i / (HN - 1);
      nz = nz * 0.965 + gzs() * 38;
      if (rgs() < 0.075) step += (rgs() < 0.56 ? 1 : -1) * (55 + rgs() * 120);
      raw.push(1100 * x - 2300 * Math.exp(-Math.pow((x - 0.5) / 0.12, 2)) + 420 * Math.sin(x * 11) + nz + step * 0.8 + gzs() * 12);
    }
    const off = BASE - raw[HN - 1];
    sim.open = raw[0] + off; sim.peak = sim.open;
    for (let i = 0; i < HN; i++) {
      const v = raw[i] + off; hpush(v);
      if (v > sim.peak) sim.peak = v; else sim.dd = Math.max(sim.dd, (sim.peak - v) / sim.peak);
    }
    for (let i = 0; i < OW; i++) { const m = 3 + rgs() * 9; sim.outc.push(rgs() < 0.55 ? m : -m * 0.85); }
    sim.sumBps = 1.78 * sim.nBps;
    const t = nowMs();
    [[1, 52800], [-1, 26400], [1, 105600], [1, 52800]].forEach((a, i) => sim.tix.push({ dir: a[0], notional: a[1], born: t - 4000 * i, life: 16000 + i * 7000 }));
  })();

/* events: tick → mark-to-market, decision → executed tickets move the balance */
  const bigEl = $('#dkt-big'); let popN = 0;
  function pop(txt, dir) {
    if (reduce || !bigEl || popN > 3) return;
    const e = document.createElement('i'); e.className = 'dkt-pop'; e.textContent = txt; e.style.color = dir > 0 ? C.green : C.red;
    e.style.right = (Math.random() * 20).toFixed(0) + 'px'; e.style.top = innerWidth < 420 ? '-15px' : '10px';   // narrow: float above the numeral, never over its digits
    bigEl.appendChild(e);
    const a = J.animate(e, [{ opacity: 0, transform: 'translateY(16px) scale(.85)' }, { opacity: 1, transform: 'translateY(0) scale(1)', offset: .16 }, { opacity: 1, offset: .62 }, { opacity: 0, transform: 'translateY(-26px) scale(1)' }], { duration: 1800, easing: 'cubic-bezier(.2,.8,.2,1)' });
    if (!a) { e.remove(); return; }                                // hidden tab / no WAAPI: never leave an unfinishable animation behind
    popN++; a.onfinish = a.oncancel = () => { popN--; e.remove(); };
  }
  function setBal(v) {
    sim.bal = v;
    if (v > sim.peak) sim.peak = v; else { const d = (sim.peak - v) / sim.peak; if (d > sim.dd) sim.dd = d; }
  }
  function execute(d, t) {
    const a = d.action;
    if (a === 'buy' || a === 'sell') {
      const dir = a === 'buy' ? 1 : -1, notional = d.size / 100 * CAP * LEV;
      const pWin = clamp(0.54 + (d.conf - 0.88) * 1.1 - clamp((sim.bal - BASE) / 2600, -0.22, 0.22), 0.3, 0.78);
      const mag = (3 + Math.abs(d.net) * 0.26) * (0.55 + Math.random() * 0.9);
      const bps = Math.random() < pWin ? mag : -mag * 0.85, jump = notional * bps / 1e4;
      setBal(sim.bal + jump); sim.jump = jump; sim.jumpT = t;
      sim.outc.push(bps); if (sim.outc.length > OW) sim.outc.shift(); sim.sumBps += bps; sim.nBps++; sim.stripDirty = true;
      sim.tixN++; sim.sizeN[d.sizeIdx]++;
      sim.tix.push({ dir, notional, born: t, life: 9000 + Math.random() * 26000 }); if (sim.tix.length > 6) sim.tix.shift();
      pop(sgnUsd(jump) + ' · ' + a + ' ' + d.size + '%', jump);
    } else if (a === 'close') { sim.tix.shift(); sim.tixN++; } else if (a === 'flatten') { sim.tix.length = 0; sim.tixN++; }
  }
  J.bus.on('tick', (e) => {
    const t = nowMs();
    for (let i = sim.tix.length - 1; i >= 0; i--) if (t - sim.tix[i].born > sim.tix[i].life) sim.tix.splice(i, 1);
    let ex = 0; for (const k of sim.tix) ex += k.dir * k.notional;
    setBal(sim.bal + ex * HEDGE * (e.dp / e.price) + (BASE - sim.bal) * 0.0002);
    hpush(sim.bal);
  });
  J.bus.on('decision', (d) => { if (d.dest === 'execute') execute(d, nowMs()); });

  /* =====================================================================================
   * swarm p&l
   * ===================================================================================== */
  const balEl = $('#dkt-bal'), balSr = $('#dkt-bal-sr'), runEl = $('#dkt-run'), dvEl = $('#dkt-dv'), dpcEl = $('#dkt-dpc'), darEl = $('#dkt-dar'), subEl = $('#dkt-sub'), liveEl = $('#dkt-live');
  const sTix = $('#dkt-s-tix'), sWin = $('#dkt-s-win'), sEdge = $('#dkt-s-edge'), sDd = $('#dkt-s-dd'), ringEl = $('#dkt-ring');
  let digs = [], srT = 0;
  /* flashes: the glow is a static text-shadow on a child overlay (.dkt-gl, rasterised once); only its opacity (and the digit's transform) animate,
   * so a flash is compositor-only - the old color + textShadow(30px) animations repainted blurred glyphs on the main thread every frame. One flash per host per 420 ms. */
  const FLASH_MS = 420, GLOW_KF = [{ opacity: 1 }, { opacity: .55, offset: .3 }, { opacity: 0 }];
  function glowFlash(host, txt, cls) {
    if (reduce) return null;
    let gl = host._gl;
    if (!gl) { gl = host._gl = document.createElement('i'); gl.setAttribute('aria-hidden', 'true'); gl.textContent = txt; host.appendChild(gl); }
    else if (gl.textContent !== txt) gl.textContent = txt;           // a still-fading overlay always mirrors the current text (never a ghost of the old digit)
    const t = nowMs(); if (t - (host._ft || -1e9) < FLASH_MS) return null;
    const a = J.animate(gl, GLOW_KF, { duration: 780, easing: 'cubic-bezier(.2,.7,.3,1)' }); if (!a) return null;
    host._ft = t; gl.className = 'dkt-gl ' + cls;
    return a;
  }
  let rollN = 0;
  /** odometer roll: the old glyph slides out one way while the new one rolls in from the other, with a springy settle (transform + opacity only) */
  function digitFlash(sp, ch, dir, old) {
    glowFlash(sp, ch, dir > 0 ? 'u' : 'd');
    if (reduce) return;
    const tn = sp.firstChild;
    const a = J.animate(sp, [{ transform: 'translateY(' + (dir > 0 ? '34%' : '-34%') + ') scale(1.04)', opacity: .15 }, { transform: 'translateY(' + (dir > 0 ? '-3%' : '3%') + ')', opacity: 1, offset: .55 }, { transform: 'none', opacity: 1 }], { duration: 620, easing: 'cubic-bezier(.2,.9,.25,1.12)' });
    if (!a || rollN > 9 || old == null) return;
    const g = document.createElement('i'); g.className = 'dkt-ol'; g.setAttribute('aria-hidden', 'true'); g.textContent = old; sp.appendChild(g);
    const b = J.animate(g, [{ transform: 'none', opacity: .5 }, { transform: 'translateY(' + (dir > 0 ? '-48%' : '48%') + ')', opacity: 0 }], { duration: 340, easing: 'cubic-bezier(.4,0,.8,.4)' });
    if (!b) { g.remove(); return; }
    rollN++; b.onfinish = b.oncancel = () => { rollN--; g.remove(); };
  }
  function setBalText(s, dir) {
    if (digs.length !== s.length) {
      balEl.textContent = ''; digs = [];
      for (let i = 0; i < s.length; i++) { const sp = document.createElement('span'); sp.className = s[i] === ',' ? 'dkt-cm' : 'dkt-dg'; sp.appendChild(document.createTextNode(s[i])); balEl.appendChild(sp); digs.push(sp); }
      return;
    }
    for (let i = 0; i < s.length; i++) { const sp = digs[i], tn = sp.firstChild; if (tn.data !== s[i]) { const old = tn.data; tn.data = s[i]; if (sp.className === 'dkt-dg') digitFlash(sp, s[i], dir, old); } }
  }
  /** stat value with a flash overlay: text lives in firstChild so the overlay survives text updates */
  const flashStat = (el, txt) => { const tn = el.firstChild; if (tn.data === txt) return; tn.data = txt; glowFlash(el, txt, 's'); };
  const setW = (el, pct) => { const v = pct.toFixed(1) + '%'; if (el.style.getPropertyValue('--w') !== v) el.style.setProperty('--w', v); };
  const segs = (id) => $$('#' + id + ' i');
  const pb1 = segs('dkt-pb1'), pb2 = segs('dkt-pb2'), pb3 = segs('dkt-pb3'), pv1 = $('#dkt-pv1'), pv2 = $('#dkt-pv2'), pv3 = $('#dkt-pv3');
  function flushPnl() {
    const bal = sim.bal, delta = bal - sim.open, pos = delta >= 0, pct = delta / sim.open * 100;
    if (pnl.classList.contains('dkt-neg') === pos) {
      pnl.classList.toggle('dkt-neg', !pos);
      const pill = $('.dkt-dp', pnl); if (pill && pill._pos != null) J.animate(pill, [{ transform: 'scale(1)' }, { transform: 'scale(1.12)', offset: .35 }, { transform: 'scale(1)' }], { duration: 560, easing: 'cubic-bezier(.2,.9,.3,1.2)' });   // sign flip: the pill morphs colour (css transition) and pops
    }
    { const pill = $('.dkt-dp', pnl); if (pill) pill._pos = pos; }
    if (dpcEl) { const arrow = darEl; if (arrow && arrow._pos !== pos) { arrow._pos = pos; arrow.style.transform = pos ? 'none' : 'rotate(180deg)'; } }
    const dir = bal >= sim.shown ? 1 : -1; sim.shown = bal;
    const s = fmt(Math.round(bal)); setBalText(s, dir);
    const t = nowMs(); if (t - srT > 6000) { srT = t; setT(balSr, 'swarm balance ' + s + ' dollars, ' + sgnUsd(delta) + ' on the session, simulated'); }
    setT(runEl, sgnUsd(delta)); setT(dvEl, sgnUsd(delta)); setT(dpcEl, sgnPct(pct)); setT(darEl, '▲');
    setT(subEl, 'vs open $' + fmt(Math.round(sim.open)) + ' · settled by code');
    setT(liveEl, S.killed ? 'halted' : 'live');
    // stats
    flashStat(sTix, fmt(sim.tixN));
    let w = 0; for (let i = 0; i < sim.outc.length; i++) if (sim.outc[i] > 0) w++;
    const wr = w / sim.outc.length * 100; flashStat(sWin, wr.toFixed(1) + '%'); ringEl.style.setProperty('--p', wr.toFixed(1));
    const ae = sim.sumBps / sim.nBps; flashStat(sEdge, (ae >= 0 ? '+' : '-') + Math.abs(ae).toFixed(2) + 'bp');
    setT(sDd, (sim.dd * 100).toFixed(2) + '%');
    // proportion bars
    setW(pb1[0], wr); setW(pb1[1], 100 - wr); const up = Math.round(wr); setT(pv1, up + '% up · ' + (100 - up) + '% down');
    const dx = S.dest, a = 38 + dx.execute, b = 24 + dx.review, c = 38 + dx.skip, tt = a + b + c;
    setW(pb2[0], a / tt * 100); setW(pb2[1], b / tt * 100); setW(pb2[2], c / tt * 100);
    const pa = Math.round(a / tt * 100), pbb = Math.round(b / tt * 100); setT(pv2, pa + ' go · ' + pbb + ' rev · ' + (100 - pa - pbb) + ' skip');   // always sums to 100
    const sz = sim.sizeN, st = sz[0] + sz[1] + sz[2] + sz[3];
    for (let i = 0; i < 4; i++) setW(pb3[i], sz[i] / st * 100);
    setT(pv3, '.5 · 1 · 2 · 4 %');
  }

  /* p&l canvases.
   * The line + area + labels + the end tag only change when the balance series moves (a 4 Hz tick or a decision), the y-range is still easing or the kill switch flips, so they are
   * rendered into offscreen layers ONLY then (one Path2D shared by the fill, the glow stroke and the line) and every frame just blits them and draws the live end dot / ripple.
   * No `ctx.font` is assigned on the visible canvas per frame: that assignment forces a style+layout update whenever anything dirtied style (measured ~2.6 ms per frame here). */
  const pcv = $('#dkt-pc'), wcv = $('#dkt-wl');
  const pc = { g: null, W: 0, H: 0, ax: 64, yMin: 0, yMax: 1, init: false, gG: null, gR: null, off: document.createElement('canvas'), og: null, dirty: true,
    tag: document.createElement('canvas'), tg: null, tw: 55, dpr: 1, rKill: false, rHh: -1, rBal: NaN, tMin: 0, tMax: 1, lo: 0, hi: 0, rMin: 0, rMax: 0, yEnd: 0, ty: 0, up: true, fs: 9.5 };
  const tfs = (w) => clamp(w / 110, 9.5, 10.5);                // canvas text never below 9.5px, grows gently with the panel width
  const wl = { g: null, W: 0, H: 0 };
  J.watch(pcv.parentNode, () => {
    const r = J.fit(pcv); pc.g = r.g; pc.W = r.W; pc.H = r.H; pc.ax = r.W < 300 ? 54 : 64; pc.fs = tfs(r.W); pc.dpr = r.dpr; pc.tw = pc.ax - 9;
    pc.off.width = pcv.width; pc.off.height = pcv.height; const og = pc.og = pc.off.getContext('2d'); og.setTransform(pcv.width / r.W, 0, 0, pcv.height / r.H, 0, 0);
    pc.tag.width = Math.max(1, Math.round(pc.tw * r.dpr)); pc.tag.height = Math.max(1, Math.round(16 * r.dpr)); const tg2 = pc.tg = pc.tag.getContext('2d'); tg2.setTransform(r.dpr, 0, 0, r.dpr, 0, 0);
    pc.gG = og.createLinearGradient(0, 0, 0, r.H); pc.gG.addColorStop(0, cG(0.5)); pc.gG.addColorStop(1, cG(0));
    pc.gR = og.createLinearGradient(0, 0, 0, r.H); pc.gR.addColorStop(0, cR(0)); pc.gR.addColorStop(1, cR(0.5));
    pc.dirty = true;
  });
  J.watch(wcv, () => { const r = J.fit(wcv); wl.g = r.g; wl.W = r.W; wl.H = r.H; wl.fs = tfs(r.W); sim.stripDirty = true; });
  /* hover / touch scrub over the balance history: a vertical guide + dot are drawn per frame (no text), the readout is a DOM chip updated only when the sample changes */
  const scrub = document.createElement('div'); scrub.className = 'dkt-scrub'; scrub.setAttribute('aria-hidden', 'true');
  scrub.innerHTML = '<b></b><span></span>'; pcv.parentNode.appendChild(scrub);
  const scB = scrub.firstChild, scS = scrub.lastChild; const sc = { on: false, x: 0, i: -1, t: 0, touch: false };
  const scMove = (e) => { sc.on = true; sc.x = e.offsetX; sc.t = nowMs(); sc.touch = e.pointerType === 'touch'; };
  pcv.addEventListener('pointermove', scMove, { passive: true }); pcv.addEventListener('pointerdown', scMove, { passive: true });
  pcv.addEventListener('pointerleave', () => { if (!sc.touch) sc.on = false; }); pcv.addEventListener('pointercancel', () => { if (!sc.touch) sc.on = false; });
  pcv.style.touchAction = 'pan-y'; pcv.style.cursor = 'crosshair';
  const PY0 = 16, PX0 = 8;
  const pfx = { pool: mkPool(56), hiT: -1e9, loT: -1e9, crackT: -1e9, crack: new Float32Array(24), trail: 0 };
  /** the cached layer: grid, above/below-open fill, glow + line, open baseline, axis labels */
  function renderPnl() {
    const og = pc.og, W = pc.W, H = pc.H, x0 = PX0, x1 = W - pc.ax, y0 = PY0, y1 = H - 10, yMin = pc.yMin;
    const ys = (y1 - y0) / (pc.yMax - yMin), Yp = (v) => y1 - (v - yMin) * ys;
    pc.rMin = pc.yMin; pc.rMax = pc.yMax; pc.rKill = S.killed;
    og.clearRect(0, 0, W, H);
    og.strokeStyle = 'rgba(255,255,255,.045)'; og.lineWidth = 1; og.beginPath();       // faint grid
    for (let i = 0; i < 4; i++) { const y = Math.round(y0 + (y1 - y0) * i / 3) + 0.5; og.moveTo(x0, y); og.lineTo(x1 + 6, y); }
    og.stroke();
    const dx = (x1 - x0) / HN, yEnd = Yp(sim.bal), by = clamp(Yp(sim.open), y0, y1);
    const line = new Path2D(); line.moveTo(x0, Yp(hat(0)));
    for (let i = 1; i < HN; i++) line.lineTo(x0 + i * dx, Yp(hat(i)));
    line.lineTo(x1, yEnd);
    const area = new Path2D(line); area.lineTo(x1, by); area.lineTo(x0, by); area.closePath();
    for (let side = 0; side < 2; side++) {                       // above the open line = green, below = red
      const up = side === 0, top = up ? 0 : by, hgt = up ? by : H - by; if (hgt <= 0) continue;
      og.save(); og.beginPath(); og.rect(0, top, W, hgt); og.clip();
      og.fillStyle = up ? pc.gG : pc.gR; og.fill(area);
      og.globalCompositeOperation = 'lighter'; og.lineJoin = 'round';
      og.lineWidth = 6; og.strokeStyle = up ? cG(0.13) : cR(0.13); og.stroke(line);
      og.lineWidth = 2; og.strokeStyle = up ? cG(1) : cR(1); og.stroke(line);
      og.restore();
    }
    // open baseline + axis
    og.setLineDash([2, 4]); og.strokeStyle = 'rgba(255,255,255,.28)'; og.beginPath(); og.moveTo(x0, by + 0.5); og.lineTo(x1 + 4, by + 0.5); og.stroke(); og.setLineDash([]);
    og.font = '500 ' + pc.fs + 'px ' + MONO; og.textBaseline = 'middle'; og.textAlign = 'left';
    og.fillStyle = '#b4abc2'; og.fillText('open', x1 + 8, clamp(by, y0 + 6, y1 - 6));
    og.fillStyle = '#cfc6dc'; og.fillText(fmt(Math.round(pc.hi)), x1 + 8, y0 - 3); og.fillText(fmt(Math.round(pc.lo)), x1 + 8, y1 + 1);
    if (S.killed) { og.fillStyle = cR(0.9); og.font = '700 ' + pc.fs + 'px ' + MONO; og.fillText('halted · tickets go to review', x0 + 2, y0 + 2); }
    pc.yEnd = yEnd; pc.ty = clamp(yEnd, y0 + 9, y1 - 9); pc.up = sim.bal >= sim.open;
    // end tag (own tiny layer: drawn after the live glow so the glow never tints it)
    const tg2 = pc.tg; tg2.clearRect(0, 0, pc.tw, 16); rr(tg2, 0, 0, pc.tw, 16, 4); tg2.fillStyle = pc.up ? C.green : C.red; tg2.fill();
    tg2.fillStyle = '#0a0710'; tg2.font = '700 ' + pc.fs + 'px ' + MONO; tg2.textBaseline = 'middle'; tg2.textAlign = 'left'; tg2.fillText(fmt(Math.round(sim.bal)), 4, 8.5);
  }
  function drawPnl(t, dt) {
    const g = pc.g; if (!g) return;
    const W = pc.W, H = pc.H, ax = pc.ax, x1 = W - ax, y0 = PY0, y1 = H - 10;
    pc.frames++;
    let fresh = pc.dirty || pc.rKill !== S.killed;
    if (pc.rHh !== hh || pc.rBal !== sim.bal) {                  // series moved: new y-range targets (hist scan only here, not every frame)
      pc.rHh = hh; pc.rBal = sim.bal; fresh = true;
      let lo = sim.open, hi = sim.open;
      for (let i = 0; i < HN; i++) { const v = hist[i]; if (v < lo) lo = v; if (v > hi) hi = v; }
      if (sim.bal < lo) lo = sim.bal; if (sim.bal > hi) hi = sim.bal;
      if (pc.init && tier() >= 2) {                              // new window high: embers rise off the head; new window low: a red crack + a glitch jolt (rate-limited)
        const tn = nowMs();
        if (sim.bal > pc.hi + 0.5 && tn - pfx.hiT > 2500) {
          pfx.hiT = tn; const ex = pc.W - pc.ax, n = tier() >= 3 ? 26 : 14;
          for (let i = 0; i < n; i++) spawn(pfx.pool, ex + (Math.random() - 0.5) * 8, pc.yEnd, (Math.random() - 0.7) * 44, -(30 + Math.random() * 70), 0.9 + Math.random() * 1.3, 5 + Math.random() * 6, i % 3 === 0 ? 4 : i % 3 === 1 ? 2 : 0);
        } else if (sim.bal < pc.lo - 0.5 && tn - pfx.loT > 2500) {
          pfx.loT = tn; pfx.crackT = tn; const c = pfx.crack;
          for (let b = 0; b < 3; b++) { let x = 0, y = 0; const an = Math.PI * (0.6 + b * 0.35) + (Math.random() - 0.5) * 0.4; for (let j = 0; j < 4; j++) { const l = 9 + Math.random() * 12, a2 = an + (Math.random() - 0.5) * 1.1; x += Math.cos(a2) * l; y += Math.sin(a2) * l; c[b * 8 + j * 2] = x; c[b * 8 + j * 2 + 1] = y; } }
          if (bigEl) J.animate(bigEl, [{ transform: 'none' }, { transform: 'translateX(-3px) skewX(-4deg)', offset: .12 }, { transform: 'translateX(4px)', offset: .24 }, { transform: 'translateX(-2px) skewX(3deg)', offset: .38 }, { transform: 'translateX(1px)', offset: .55 }, { transform: 'none' }], { duration: 420, easing: 'steps(7, end)' });
        }
      }
      const pad = Math.max((hi - lo) * 0.16, 30); pc.lo = lo; pc.hi = hi; pc.tMin = lo - pad; pc.tMax = hi + pad;
    }
    if (!pc.init) { pc.yMin = pc.tMin; pc.yMax = pc.tMax; pc.init = true; } else { const k = 1 - Math.exp(-dt * 4); pc.yMin += (pc.tMin - pc.yMin) * k; pc.yMax += (pc.tMax - pc.yMax) * k; }
    const ys = (y1 - y0) / (pc.yMax - pc.yMin);
    if (fresh || Math.abs(pc.yMin - pc.rMin) * ys > 0.12 || Math.abs(pc.yMax - pc.rMax) * ys > 0.12) { renderPnl(); pc.dirty = false; }
    g.clearRect(0, 0, W, H); g.drawImage(pc.off, 0, 0, W, H);
    // end tag + live dot
    const yEnd = pc.yEnd, rgb = pc.up ? SP.g : SP.r;
    g.globalCompositeOperation = 'lighter'; glow(g, rgb, x1, yEnd, 14 + Math.sin(t * 4) * 3, 0.9);
    const age = (nowMs() - sim.jumpT) / 1000;
    if (age < 1.1) { g.strokeStyle = sim.jump >= 0 ? cG(1 - age / 1.1) : cR(1 - age / 1.1); g.lineWidth = 1.5; g.beginPath(); g.arc(x1, yEnd, 5 + age * 34, 0, TAU); g.stroke(); }
    const tr = tier();
    if (tr >= 2) {
      const ys2 = (y1 - y0) / (pc.yMax - pc.yMin), dxp = (x1 - PX0) / HN, K = tr >= 3 ? 36 : 22, yb = y1 + pc.yMin * ys2;
      g.lineCap = 'round'; g.strokeStyle = pc.up ? '#b8ffe6' : '#ffc0c6';                  // comet trail: the last ~6-9 s of the curve, tapering toward the tail
      let px0 = x1 - K * dxp, py0 = yb - hat(HN - K) * ys2;
      for (let i = HN - K + 1; i < HN; i++) {
        const r = (i - (HN - K)) / K, x = x1 - (HN - 1 - i) * dxp, y = i === HN - 1 ? yEnd : yb - hat(i) * ys2;
        g.globalAlpha = r * r * 0.85; g.lineWidth = 0.8 + 3.4 * r; g.beginPath(); g.moveTo(px0, py0); g.lineTo(x, y); g.stroke(); px0 = x; py0 = y;
      }
      g.globalAlpha = 1; g.lineCap = 'butt';
      const ph = (t * 0.13) % 1.25, sx = PX0 + (ph - 0.1) * (x1 - PX0);                      // scanning highlight: a soft band sweeps the plot, a bead rides the curve under it
      if (sx > PX0 && sx < x1) {
        g.globalAlpha = 0.9; g.drawImage(bandSpr, sx - 46, y0 - 4, 92, y1 - y0 + 8); g.globalAlpha = 1;
        const ix = clamp(Math.round((sx - PX0) / dxp), 0, HN - 1); glow(g, pc.up ? SP.g : SP.r, sx, yb - (ix === HN - 1 ? sim.bal : hat(ix)) * ys2, 9, 0.85);
      }
      glow(g, SPW, x1, yEnd, 6 + Math.sin(t * 6) * 1.5, 0.55);
      const ca = (nowMs() - pfx.crackT) / 1000;
      if (ca < 0.75) {                                                                          // crack: three jagged red forks from the head, flickering out
        g.globalAlpha = (1 - ca / 0.75) * (ca < 0.3 ? 1 : 0.5 + 0.5 * Math.sin(ca * 70)); g.lineWidth = 1.6; g.strokeStyle = C.red; g.lineJoin = 'miter';
        for (let b = 0; b < 3; b++) { g.beginPath(); g.moveTo(x1, yEnd); for (let j = 0; j < 4; j++) g.lineTo(x1 + pfx.crack[b * 8 + j * 2], yEnd + pfx.crack[b * 8 + j * 2 + 1]); g.stroke(); }
        g.globalAlpha = 1; g.lineJoin = 'round';
      }
      drawPool(pfx.pool, g, Math.min(dt, 0.05), -18, 1.6, true);
    }
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x1, yEnd, 2.6, 0, TAU); g.fill();
    g.drawImage(pc.tag, x1 + 7, pc.ty - 8, pc.tw, 16);
    if (sc.on && sc.touch && nowMs() - sc.t > 3500) sc.on = false;
    if (sc.on && pc.W) {
      const dxs = (x1 - PX0) / HN, k = clamp(Math.round((sc.x - PX0) / dxs), 0, HN - 1), v = k === HN - 1 ? sim.bal : hat(k), xx = PX0 + k * dxs, ysc = (y1 - y0) / (pc.yMax - pc.yMin), yy = y1 - (v - pc.yMin) * ysc;
      g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(Math.round(xx) + 0.5, y0 - 4); g.lineTo(Math.round(xx) + 0.5, y1 + 6); g.stroke(); g.setLineDash([]);
      g.fillStyle = v >= sim.open ? C.green : C.red; g.beginPath(); g.arc(xx, yy, 4, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke();
      if (k !== sc.i) {
        sc.i = k; const dlt = v - sim.open, ago = (HN - 1 - k) / 4;
        setT(scB, '$' + fmt(Math.round(v))); setT(scS, sgnUsd(dlt) + ' vs open · ' + (ago < 1 ? 'now' : '-' + Math.round(ago) + 's')); scB.style.color = dlt >= 0 ? C.green : C.red;
      }
      scrub.style.transform = 'translate(' + Math.round(clamp(xx - 62, 4, pc.W - ax - 112)) + 'px,' + 2 + 'px)'; if (!scrub.classList.contains('on')) scrub.classList.add('on');
    } else if (scrub.classList.contains('on')) { scrub.classList.remove('on'); sc.i = -1; }
  }
  function drawStrip() {
    const g = wl.g; if (!g) return;
    const W = wl.W, H = wl.H, n = 96, o = sim.outc, st = o.length - n, x0 = 32, slot = (W - x0 - 2) / n, bw = Math.max(1.4, slot * 0.62), mid = H / 2;
    g.clearRect(0, 0, W, H);
    let mx = 1; for (let i = st; i < o.length; i++) { const a = Math.abs(o[i]); if (a > mx) mx = a; }
    g.fillStyle = cG(0.95);
    for (let i = st; i < o.length; i++) if (o[i] > 0) { const h = Math.max(1.5, o[i] / mx * (mid - 2)); g.fillRect(x0 + (i - st) * slot, mid - 0.5 - h, bw, h); }
    g.fillStyle = cR(0.95);
    for (let i = st; i < o.length; i++) if (o[i] < 0) { const h = Math.max(1.5, -o[i] / mx * (mid - 2)); g.fillRect(x0 + (i - st) * slot, mid + 0.5, bw, h); }
    g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(x0 - 4, Math.round(mid), W - x0 + 4, 1);
    g.font = '500 ' + wl.fs + 'px ' + MONO; g.textBaseline = 'middle'; g.textAlign = 'left';
    g.fillStyle = '#7fe9c4'; g.fillText('win', 0, mid - 8); g.fillStyle = '#ff8b97'; g.fillText('loss', 0, mid + 8);
    sim.stripDirty = false;
  }
  let acP = 0;
  J.task(pnl, (t, dt) => {
    drawPnl(t, dt); if (sim.stripDirty) drawStrip();
    acP += dt; if (acP < 0.25) return; acP = 0; flushPnl();
  });

  flushPnl();
});
