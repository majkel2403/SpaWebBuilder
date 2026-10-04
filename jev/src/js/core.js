/* JEV core — shared runtime for every module. Exposes window.JEV. Loaded after engine.js, before modules. */
(function () {
  'use strict';
  const J = (window.JEV = {});
  const E = window.JEVEngine;

  /* ---------- tiny utils ---------- */
  J.$ = (s, r) => (r || document).querySelector(s);
  J.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  J.TAU = Math.PI * 2;
  J.clamp = E.clamp;
  J.lerp = (a, b, t) => a + (b - a) * t;
  J.rnd = (a, b) => (b === undefined ? Math.random() * (a === undefined ? 1 : a) : a + Math.random() * (b - a));
  J.ri = (a, b) => Math.floor(J.rnd(a, b + 1));
  J.pick = (a) => a[(Math.random() * a.length) | 0];
  J.gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(J.TAU * v); };
  J.rng = (seed) => { let a = seed | 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  J.fmt = (n, d) => n.toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  J.usd = (n, d) => (n < 0 ? '-$' : '$') + J.fmt(Math.abs(n), d || 0);
  J.sgn = (n, d) => (n >= 0 ? '+' : '-') + J.fmt(Math.abs(n), d == null ? 1 : d);
  J.DPR = Math.min(window.devicePixelRatio || 1, 2);
  J.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  J.narrow = () => window.innerWidth < 700;
  J.C = { pink: '#ff2e6e', pink2: '#ff7ab3', green: '#2ee6a6', blue: '#4d8dff', amber: '#ffc13d', violet: '#a66bff', orange: '#ff8a3d', cyan: '#3be0ff', red: '#ff4d5e', ink: '#f4eef6', mut: '#8d8499', dim: '#5a5365', bg: '#05030a' };
  J.rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };

  /* ---------- event bus: 'decision' · 'tick' · 'kill' · 'floor' ---------- */
  const L = {};
  J.bus = {
    on(n, f) { (L[n] || (L[n] = [])).push(f); return () => J.bus.off(n, f); },
    off(n, f) { const a = L[n]; if (a) { const i = a.indexOf(f); if (i >= 0) a.splice(i, 1); } },
    emit(n, d) { (L[n] || []).slice().forEach((f) => { try { f(d); } catch (e) { console.error('[bus:' + n + ']', e); } }); },
  };

  /* ---------- pointer ---------- */
  J.pointer = { x: -9999, y: -9999, nx: 0, ny: 0, down: false };
  window.addEventListener('pointermove', (e) => {
    const p = J.pointer; p.x = e.clientX; p.y = e.clientY; p.nx = (e.clientX / innerWidth) * 2 - 1; p.ny = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });
  window.addEventListener('pointerdown', () => (J.pointer.down = true), { passive: true });
  window.addEventListener('pointerup', () => (J.pointer.down = false), { passive: true });
  /** pointer position relative to an element's top-left (CSS px); x/y are -9999 when far away */
  J.rel = (el) => { const r = el.getBoundingClientRect(); return { x: J.pointer.x - r.left, y: J.pointer.y - r.top, w: r.width, h: r.height }; };

  /* ---------- frame loop: J.task(el, fn(t,dt)) runs only while `el` is on screen ---------- */
  const tasks = new Set();
  const io = new IntersectionObserver((es) => {
    for (const e of es) (e.target.__jevTasks || []).forEach((k) => (k.vis = e.isIntersecting));
  }, { rootMargin: '160px 0px' });
  J.task = (el, fn) => {
    const k = { el, fn, vis: !el, n: 0 };
    if (el) { (el.__jevTasks || (el.__jevTasks = [])).push(k); io.observe(el); }
    tasks.add(k);
    return { stop() { tasks.delete(k); } };
  };
  J.time = 0;
  let last = 0;
  function frame(ms) {
    requestAnimationFrame(frame);
    const t = ms / 1000, dt = Math.min(0.05, t - last || 0.016);
    last = t; J.time = t;
    for (const k of tasks) {
      if (!k.vis) continue;
      if (J.reduce && k.n >= 3) continue; // reduced motion: render a few frames then freeze
      k.n++;
      try { k.fn(t, dt); } catch (e) { console.error('[task]', e); tasks.delete(k); }
    }
  }
  requestAnimationFrame(frame);

  /* ---------- canvas helpers ---------- */
  /** size a canvas' backing store to its CSS box × DPR; returns {g, W, H} in CSS px with the transform applied */
  J.fit = (c) => {
    const r = c.getBoundingClientRect();
    const W = Math.max(1, Math.round(r.width)), H = Math.max(1, Math.round(r.height));
    const w = Math.round(W * J.DPR), h = Math.round(H * J.DPR);
    if (c.width !== w) c.width = w;
    if (c.height !== h) c.height = h;
    const g = c.getContext('2d');
    g.setTransform(J.DPR, 0, 0, J.DPR, 0, 0);
    return { g, W, H };
  };
  /** call cb(rect) now and whenever el resizes (coalesced to one rAF) */
  J.watch = (el, cb) => {
    let raf = 0;
    const run = () => { raf = 0; cb(el.getBoundingClientRect()); };
    const ro = new ResizeObserver(() => { if (!raf) raf = requestAnimationFrame(run); });
    ro.observe(el); run(); return ro;
  };
  J.onView = (el, cb, o) => {
    o = o || {};
    const i2 = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { cb(e); if (o.once !== false) i2.disconnect(); } }), { threshold: o.threshold == null ? 0.15 : o.threshold, rootMargin: o.rootMargin || '0px' });
    i2.observe(el); return i2;
  };

  /* ---------- text fx ---------- */
  J.countTo = (el, to, o) => {
    o = o || {}; const from = o.from || 0, dur = (o.dur || 1400) / (J.reduce ? 1000 : 1), f = o.fmt || ((v) => J.fmt(Math.round(v)));
    const t0 = performance.now();
    const step = (now) => { const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = f(from + (to - from) * e); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  const SC = '▓▒░<>/\\|—_+*#@%&01';
  J.scramble = (el, text, ms) => {
    text = text == null ? el.textContent : text; ms = (ms || 900) / (J.reduce ? 1000 : 1);
    const t0 = performance.now(), n = text.length;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / ms); let s = '';
      for (let i = 0; i < n; i++) { const c = text[i]; s += c === ' ' || i < p * n * 1.15 - 2 ? c : SC[(Math.random() * SC.length) | 0]; }
      el.textContent = s; if (p < 1) requestAnimationFrame(step); else el.textContent = text;
    };
    requestAnimationFrame(step);
  };

  /* ---------- global state, rules, kill switch ---------- */
  J.RULES = E.RULES; J.ACTIONS = E.ACTIONS; J.SIZES = E.SIZES; J.STATE_KEYS = E.STATE_KEYS;
  const S = (J.S = { killed: false, floor: E.RULES.floor, count: 1892, cost: 0.046, ms: [3.1, 3.4, 2.9, 3.2, 3.6], counts: { choice: 1934, flag: 1102, score: 600 }, dest: { execute: 0, review: 0, skip: 0 } });
  J.setFloor = (v) => { S.floor = J.clamp(+v, 0.5, 0.99); E.RULES.floor = S.floor; J.bus.emit('floor', S.floor); hud(); };
  J.setKilled = (v) => { S.killed = !!v; document.body.classList.toggle('killed', S.killed); J.bus.emit('kill', S.killed); hud(); };

  /* ---------- shared catalogues (modules read, never mutate) ---------- */
  /** ten builds — all are the same decision layer asking typed questions (choice | score | flag) */
  J.BUILDS = [
    { key: 'entry', name: 'entry gate', tag: 'ENTER', col: 'pink', prim: 'choice', k1: 'picks', v1: 'buy · sell · hold', ms: 3.2 },
    { key: 'sizer', name: 'position sizer', tag: 'SIZE', col: 'gray', prim: 'score', k1: 'picks', v1: '0.5% → 4%', ms: 2.8 },
    { key: 'guard', name: 'risk guard', tag: 'RISK', col: 'pink', prim: 'flag', k1: 'asks', v1: 'risk_ok?', ms: 2.1 },
    { key: 'router', name: 'venue router', tag: 'ROUTE', col: 'gray', prim: 'choice', k1: 'picks', v1: 'which venue', ms: 4.4 },
    { key: 'exit', name: 'exit manager', tag: 'EXIT', col: 'pink', prim: 'choice', k1: 'picks', v1: 'close · hold', ms: 3.6 },
    { key: 'funding', name: 'funding carry', tag: 'CARRY', col: 'gray', prim: 'score', k1: 'scores', v1: 'basis · funding', ms: 5.1 },
    { key: 'news', name: 'headline filter', tag: 'NEWS', col: 'pink', prim: 'flag', k1: 'asks', v1: 'trade or ignore', ms: 6.3 },
    { key: 'mm', name: 'quote skew', tag: 'MAKER', col: 'gray', prim: 'score', k1: 'scores', v1: 'widen · tighten', ms: 2.6 },
    { key: 'liq', name: 'liquidation guard', tag: 'FLATTEN', col: 'pink', prim: 'flag', k1: 'asks', v1: 'flatten now?', ms: 1.9 },
    { key: 'rebal', name: 'rebalancer', tag: 'ALLOC', col: 'gray', prim: 'choice', k1: 'picks', v1: 'which asset', ms: 7.8 },
  ];
  /** the six desk agents (screenshot: prior · kelly · closer · spotter · edge · taker) */
  J.AGENTS = [
    { key: 'spotter', name: 'SPOTTER', role: 'scans books and venues', col: '#2ee6a6' },
    { key: 'prior', name: 'PRIOR', role: 'prior from history', col: '#ffc13d' },
    { key: 'edge', name: 'EDGE', role: 'fair value vs market', col: '#ff2e6e' },
    { key: 'kelly', name: 'KELLY', role: 'sizes the ticket', col: '#a66bff' },
    { key: 'taker', name: 'TAKER', role: 'crosses the spread', col: '#4d8dff' },
    { key: 'closer', name: 'CLOSER', role: 'takes profit / stops', col: '#ff8a3d' },
  ];
  /** the three heads of the build (screenshot 1): Hermes writes · Dots feeds · Jev decides */
  J.TRIO = [
    { key: 'hermes', name: 'HERMES', line: 'writes the strategy and the risk rules', sub: 'hermes agent · strategy.yaml', col: '#ff8a3d' },
    { key: 'dots', name: 'DOTS', line: 'pulls and cleans four years of data', sub: 'the data side', col: '#4d8dff' },
    { key: 'jev', name: 'JEV', line: 'backtests, caps and arms it', sub: 'the gate · cap · kill switch · orders', col: '#ff2e6e' },
  ];

  /* ---------- simulated market (4 Hz) ---------- */
  const M = (J.market = { price: 84722, open: 84722, hist: [], vol: 0.00016 });
  setInterval(() => {
    const dp = M.price * (J.gauss() * M.vol + (84722 - M.price) * 1e-6);
    M.price = Math.max(1000, M.price + dp);
    M.hist.push(M.price); if (M.hist.length > 1200) M.hist.shift();
    J.bus.emit('tick', { price: M.price, dp });
  }, 250);
  for (let i = 0; i < 300; i++) { M.price += M.price * J.gauss() * M.vol; M.hist.push(M.price); }

  /* ---------- live decision stream (real engine on sampled states) ---------- */
  J.recent = [];
  let seq = 0;
  function pickBuild(d) {
    if (d.action === 'buy' || d.action === 'sell') return J.pick(['entry', 'entry', 'entry', 'router', 'sizer', 'guard']);
    if (d.action === 'close') return J.pick(['exit', 'exit', 'guard']);
    if (d.action === 'flatten') return J.pick(['liq', 'liq', 'guard']);
    return J.pick(['news', 'mm', 'funding', 'rebal', 'guard']);
  }
  J.decide = (state, o) => E.decide(state, Object.assign({ floor: S.floor, killed: S.killed }, o));
  J.makeDecision = () => {
    const sm = E.sampleState(() => M.price);
    const d = J.decide(sm.state);
    // display confidence: slight organic jitter on top of the engine output
    d.conf = J.clamp(d.conf * (0.965 + Math.random() * 0.035), 0.3, 0.995);
    if (d.dest === 'execute' && d.conf < S.floor) { d.dest = 'review'; d.reason = 'conf ' + d.conf.toFixed(2) + ' < ' + S.floor.toFixed(2); }
    d.id = (++seq).toString(16).padStart(4, '0') + Math.random().toString(16).slice(2, 6);
    d.state = sm.state; d.arch = sm.arch; d.build = pickBuild(d);
    d.symbol = sm.state.symbol; d.venue = sm.state.venue;
    d.line = d.symbol + ' edge ' + J.sgn(sm.state.edge_bps) + 'bps imb ' + J.sgn(sm.state.imbalance, 2) + ' spr ' + sm.state.spread_bps.toFixed(1);
    return d;
  };
  /** emit one decision now (counters + bus). Used by the live stream and by manual triggers (clicks). */
  J.fire = () => {
    const d = J.makeDecision();
    S.count++; S.cost += 0.00003; S.ms.push(d.ms); if (S.ms.length > 41) S.ms.shift();
    S.counts.choice++; if (Math.random() < 0.55) S.counts.flag++; if (Math.random() < 0.3) S.counts.score++;
    S.dest[d.dest]++;
    J.recent.unshift(d); if (J.recent.length > 40) J.recent.pop();
    J.bus.emit('decision', d); hud();
    return d;
  };
  function loop() { J.fire(); setTimeout(loop, 700 + Math.random() * 650); }
  J.start = () => setTimeout(loop, 400);

  /* ---------- HUD (header metrics + kill switch) ---------- */
  function median(a) { const s = a.slice().sort((x, y) => x - y); return s[(s.length / 2) | 0]; }
  function hud() {
    const set = (id, v) => { const el = document.getElementById(id); if (el && el.textContent !== v) el.textContent = v; };
    set('mDec', J.fmt(S.count)); set('mCost', '$' + S.cost.toFixed(3));
    set('mMed', median(S.ms).toFixed(1) + ' ms'); set('mFloor', S.floor.toFixed(2));
    const k = document.getElementById('killBtn');
    if (k) { k.setAttribute('aria-pressed', String(S.killed)); const t = document.getElementById('killTxt'); if (t) t.textContent = S.killed ? 'HALTED' : 'ARMED'; }
  }
  J.hud = hud;

  /* ---------- module registry: JEV.mod(name, init) — each module is a closure, no globals ---------- */
  const mods = [];
  J.mod = (name, init) => mods.push({ name, init });
  J.boot = () => {
    const kb = document.getElementById('killBtn');
    if (kb) kb.addEventListener('click', () => J.setKilled(!S.killed));
    hud();
    for (const m of mods) {
      const t0 = performance.now();
      try { m.init(); } catch (e) { console.error('[module:' + m.name + ']', e); }
      J.bootLog = (J.bootLog || []); J.bootLog.push(m.name + ' ' + (performance.now() - t0).toFixed(1) + 'ms');
    }
    J.start();
    document.documentElement.classList.add('ready');
  };
})();
