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
  /** number → "1,234.50"; one cached Intl.NumberFormat per digit count (toLocaleString rebuilt a formatter on every call: ~27x slower, ~100 calls/s page-wide) */
  const NF = [];
  J.fmt = (n, d) => { d = d > 0 ? Math.min(20, d | 0) : 0; return (NF[d] || (NF[d] = new Intl.NumberFormat('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }))).format(n); };
  J.usd = (n, d) => (n < 0 ? '-$' : '$') + J.fmt(Math.abs(n), d || 0);
  J.sgn = (n, d) => (n >= 0 ? '+' : '-') + J.fmt(Math.abs(n), d == null ? 1 : d);
  /** device-pixel ratio used by every canvas: ≤ 2, and lowered (never below 1) only when a viewport-sized canvas would exceed the backing-store budget (~8.4 MP: 1920×1080@2x, 1440×900@2x are untouched) */
  J.DPR = Math.max(1, Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(8.4e6 / Math.max(1, window.innerWidth * window.innerHeight))));
  J.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  J.narrow = () => window.innerWidth < 700;
  J.C = { pink: '#ff2e6e', pink2: '#ff7ab3', green: '#2ee6a6', blue: '#4d8dff', amber: '#ffc13d', violet: '#a66bff', orange: '#ff8a3d', cyan: '#3be0ff', red: '#ff4d5e', ink: '#f4eef6', mut: '#8d8499', dim: '#837a8f', bg: '#05030a' };
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
  let raf = 0;
  /** (re)arm the frame loop; it disarms itself when no task is visible (footer, hidden tab…) so the main thread can sleep */
  const wake = () => { if (!raf) raf = requestAnimationFrame(frame); };
  const io = new IntersectionObserver((es) => {
    let on = false;
    for (const e of es) { const ks = e.target.__jevTasks || []; for (const k of ks) k.vis = e.isIntersecting; if (e.isIntersecting && ks.length) on = true; }
    if (on) wake();
  }, { rootMargin: '160px 0px' });
  J.task = (el, fn) => {
    const k = { el, fn, vis: !el, n: 0 };
    if (el) { (el.__jevTasks || (el.__jevTasks = [])).push(k); io.observe(el); }
    tasks.add(k); if (k.vis) wake();
    return { stop() { tasks.delete(k); } };
  };
  J.time = 0;
  let last = 0;
  function frame(ms) {
    raf = 0;
    tierSample(ms);
    const t = ms / 1000, dt = Math.min(0.05, t - last || 0.016);
    last = t; J.time = t;
    let busy = false;
    for (const k of tasks) {
      if (!k.vis) continue;
      if (J.reduce && k.n >= 3) continue; // reduced motion: render a few frames then freeze
      busy = true; k.n++;
      try { k.fn(t, dt); k.err = 0; } catch (e) { console.error('[task]', e); if ((k.err = (k.err || 0) + 1) >= 5) tasks.delete(k); } // drop a task only after 5 failures in a row
    }
    if (busy) wake();
  }
  wake();


  /* ---------- quality tier: J.tier 3 high · 2 medium · 1 low (+ bus 'tier', <html data-tier>) ---------- */
  /* start from a device heuristic (the CEILING), then measure the real frame cost: a rolling median of rAF deltas (only while frames flow back to back) plus
     long-task hints. Downgrades need 2 agreeing evaluations (~6 s), upgrades 4 (~12 s), one step at a time, and a change locks the tier for 10 s: it never flaps.
     `?tier=1|2|3` pins it (for screenshots / debugging). Effects read J.tier lazily (or CSS [data-tier]) and degrade; tier 1 looks like the page always did. */
  const nav = navigator, touchPhone = window.matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 700;
  let ceil = 3;
  if (J.reduce) ceil = 1;
  else if (touchPhone || (nav.hardwareConcurrency || 8) <= 4 || (nav.deviceMemory || 8) <= 4 || ((window.devicePixelRatio || 1) >= 2.5 && (nav.hardwareConcurrency || 8) < 8)) ceil = 2;
  const pin = (/[?&]tier=([123])\b/.exec(location.search) || [])[1];
  J.tier = pin ? +pin : touchPhone ? 2 : ceil;
  const setTier = (n) => { J.tier = n; document.documentElement.dataset.tier = n; J.bus.emit('tier', n); };
  document.documentElement.dataset.tier = J.tier;
  const FR = new Float32Array(90); let frN = 0, frI = 0, frLast = 0, evalAt = 0, votes = 0, voteTo = 0, lockUntil = 0, longHits = [];
  try { if (!pin && 'PerformanceObserver' in window) new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.duration > 120) longHits.push(e.startTime); }).observe({ entryTypes: ['longtask'] }); } catch (e) { /* unsupported */ }
  function tierSample(ms) {
    const raw = ms - frLast; frLast = ms;
    if (pin || document.hidden) return;
    if (raw > 0 && raw < 220) { FR[frI] = raw; frI = (frI + 1) % FR.length; if (frN < FR.length) frN++; } else if (raw >= 220) { frN = 0; frI = 0; } // a gap (idle loop, tab switch) is not a slow frame: restart the window
    if (ms < 2500 || ms < evalAt || frN < 45) return;
    evalAt = ms + 3000;
    const a = Array.prototype.slice.call(FR, 0, frN).sort((x, y) => x - y), med = a[frN >> 1];
    while (longHits.length && longHits[0] < ms - 6000) longHits.shift();
    let cand = med > 34 || longHits.length >= 3 ? 1 : med > 21 ? 2 : 3;
    cand = Math.min(cand, ceil);
    if (cand === J.tier || ms < lockUntil) { votes = 0; return; }
    if (cand !== voteTo) { voteTo = cand; votes = 0; }
    votes++;
    if (votes >= (cand < J.tier ? 2 : 4)) { votes = 0; lockUntil = ms + 10000; setTier(J.tier + (cand < J.tier ? -1 : 1)); frN = 0; frI = 0; }
  }

  /* ---------- shared scroll loop: J.scrollProgress(el, fn(p)) · J.scroll {y, vel} · --sy / --vel on <html> (tier 3 only) ---------- */
  /* One passive scroll listener arms one rAF that disarms itself once the scroll has settled. Element geometry is cached (re-measured on resize / body resize),
     so a frame reads scrollY only: no per-frame layout reads. p = 0 when the element's top enters the viewport bottom, 1 when its bottom leaves the viewport top. */
  const SP = [], root = document.documentElement;
  J.scroll = { y: window.scrollY, vel: 0 };
  let spRaf = 0, spLast = window.scrollY, spT = 0, spSy = -1, spVel = '';
  function spMeasure(e) { const r = e.el.getBoundingClientRect(); e.top = r.top + window.scrollY; e.h = r.height; }
  function spRemeasure() { for (const e of SP) spMeasure(e); spWake(); }
  const spIo = new IntersectionObserver((es) => { for (const x of es) { const e = x.target.__sp; if (e) { e.vis = x.isIntersecting; if (e.vis) spWake(); } } }, { rootMargin: '60% 0px' });
  function spCalc(e, vh) { const p = J.clamp((vh - (e.top - J.scroll.y)) / (vh + e.h), 0, 1); if (p !== e.p) { e.p = p; try { e.fn(p); } catch (er) { console.error('[scrollProgress]', er); } } }
  function spFrame(ms) {
    spRaf = 0;
    const y = window.scrollY, dt = Math.max(8, ms - spT || 16), vh = window.innerHeight; spT = ms;
    const sc = J.scroll, dy = y - spLast; spLast = y; sc.y = y;
    sc.vel += (J.clamp(dy / dt / 3, -1, 1) - sc.vel) * 0.18; // smoothed, px/ms ÷ 3 → -1..1
    if (Math.abs(sc.vel) < 0.004 && !dy) sc.vel = 0;
    for (const e of SP) if (e.vis || e.p == null || e.p % 1 !== 0) spCalc(e, vh);
    if (J.tier >= 3 && !J.reduce) { // custom props on :root restyle the whole tree: tier 3 only, and only when the value changed
      const v = sc.vel.toFixed(2);
      if (y !== spSy) { spSy = y; root.style.setProperty('--sy', y); }
      if (v !== spVel) { spVel = v; root.style.setProperty('--vel', v); }
    }
    if (dy || sc.vel) spWake();
  }
  function spWake() { if (!spRaf) spRaf = requestAnimationFrame(spFrame); }
  window.addEventListener('scroll', spWake, { passive: true });
  window.addEventListener('resize', () => { clearTimeout(spRemeasure.t); spRemeasure.t = setTimeout(spRemeasure, 150); }, { passive: true });
  window.addEventListener('load', () => setTimeout(spRemeasure, 400));
  if ('ResizeObserver' in window) new ResizeObserver(() => { clearTimeout(spRemeasure.t); spRemeasure.t = setTimeout(spRemeasure, 120); }).observe(document.body);
  J.scrollProgress = (el, fn) => {
    const e = { el, fn, p: null, vis: true, top: 0, h: 1 };
    el.__sp = e; SP.push(e); spMeasure(e); spIo.observe(el); spCalc(e, window.innerHeight);
    return { stop() { const i = SP.indexOf(e); if (i >= 0) SP.splice(i, 1); spIo.unobserve(el); } };
  };

  /* ---------- section cross-light: J.tint [r,g,b] (0..255, live, eased) · --tint "r,g,b" on <html> · bus 'tint' (target) ---------- */
  const TINTS = { hero: [255, 46, 110], code: [196, 58, 214], builds: [236, 44, 176], hour: [255, 170, 50], desk: [96, 130, 255], lab: [46, 230, 166], foot: [166, 107, 255] };
  J.tint = TINTS.hero.slice();
  let tgt = TINTS.hero, tintRaf = 0, tintStr = '255,46,110', tintT = 0;
  function tintFrame(ms) {
    tintRaf = 0;
    const dt = Math.min(0.05, (ms - tintT) / 1000 || 0.016), k = 1 - Math.exp(-dt * 3.2); tintT = ms;
    let moving = false;
    for (let i = 0; i < 3; i++) { const d = tgt[i] - J.tint[i]; if (Math.abs(d) < 0.6) J.tint[i] = tgt[i]; else { J.tint[i] += d * k; moving = true; } }
    const s = Math.round(J.tint[0]) + ',' + Math.round(J.tint[1]) + ',' + Math.round(J.tint[2]);
    if (s !== tintStr) { tintStr = s; root.style.setProperty('--tint', s); }
    if (moving) tintRaf = requestAnimationFrame(tintFrame);
  }
  function tintInit() {
    if (!('IntersectionObserver' in window)) return;
    const io2 = new IntersectionObserver((es) => {
      for (const x of es) {
        if (!x.isIntersecting) continue;
        const el = x.target, key = el.id && TINTS[el.id] ? el.id : el.tagName === 'FOOTER' ? 'foot' : null;
        if (!key || tgt === TINTS[key]) continue;
        tgt = TINTS[key]; J.bus.emit('tint', tgt.slice());
        if (J.tier <= 1 || J.reduce) { J.tint = tgt.slice(); tintStr = ''; tintT = performance.now(); tintFrame(tintT); } else if (!tintRaf) { tintT = performance.now(); tintRaf = requestAnimationFrame(tintFrame); }
      }
    }, { rootMargin: '-50% 0px -49.9% 0px' }); // a hairline across the viewport middle: the section under it owns the colour temperature
    document.querySelectorAll('#hero, #code, #builds, #hour, #desk, #lab, body > footer').forEach((el) => io2.observe(el));
  }

  /* ---------- split-text headings: J.splitText(el) → letters in .st-c (--i = index, --j = index inside <em>), words in .st-w ---------- */
  /* idempotent; the heading keeps its text through aria-label (the spans are aria-hidden). CSS (base.css) rises/blurs the letters in when `.st-in` lands. */
  J.splitText = (el) => {
    if (!el || el.__st) return el;
    el.__st = 1;
    if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    let i = 0, j = 0;
    const walk = (node, inEm) => {
      for (const n of Array.from(node.childNodes)) {
        if (n.nodeType === 3) {
          const f = document.createDocumentFragment();
          for (const part of n.textContent.split(/(\s+)/)) {
            if (!part) continue;
            if (part.trim() === '') { f.appendChild(document.createTextNode(' ')); continue; }
            const w = document.createElement('span'); w.className = 'st-w'; w.setAttribute('aria-hidden', 'true');
            for (const ch of part) { const c = document.createElement('span'); c.className = 'st-c'; c.style.cssText = '--i:' + i++ + (inEm ? ';--j:' + j++ : ''); c.textContent = ch; w.appendChild(c); }
            f.appendChild(w);
          }
          node.replaceChild(f, n);
        } else if (n.nodeType === 1 && !n.classList.contains('fx-hsw')) walk(n, inEm || n.tagName === 'EM');
      }
    };
    walk(el, false);
    el.classList.add('st-ready');
    return el;
  };
  function headings() {
    const hs = Array.from(document.querySelectorAll('.h2'));
    for (const h of hs) J.splitText(h);
    if (J.reduce || !('IntersectionObserver' in window)) { hs.forEach((h) => h.classList.add('st-in')); return; }
    const io3 = new IntersectionObserver((es) => { for (const x of es) if (x.isIntersecting) { x.target.classList.add('st-in'); io3.unobserve(x.target); } }, { threshold: 0.3, rootMargin: '0px 0px -8% 0px' });
    hs.forEach((h) => io3.observe(h));
  }

  /* ---------- off-screen pause: sections / cards / stages far outside the viewport get .is-off → base.css pauses their CSS animations ---------- */
  /* (every running CSS animation costs a style invalidation per frame whether or not it is visible; ~220 of them run on this page) */
  const OFF_SEL = 'body > section, body > footer, main > section, .card, [class*="-stage"]';
  const offIo = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
    for (const e of es) e.target.classList.toggle('is-off', !e.isIntersecting);
  }, { rootMargin: '200px 0px' }) : null;
  const pauseOffscreen = () => { if (offIo) document.querySelectorAll(OFF_SEL).forEach((el) => offIo.observe(el)); };

  /* ---------- canvas helpers ---------- */
  /**
   * size a canvas' backing store to its CSS box × DPR; returns {g, W, H, dpr} in CSS px with the transform applied.
   * Measures the LAYOUT box (clientWidth/Height), not getBoundingClientRect: a canvas inside a `.rv` reveal is mid-scale(.985) when first fitted,
   * and ResizeObserver never fires when that transform ends, so the rect would leave the backing store ~1.5% small for good.
   * Optional 2nd arg (number = dpr cap, or {dpr, maxPx}) or data-dpr / data-maxpx on the canvas: cap the ratio for glow-only canvases
   * (e.g. data-dpr="1.5"), or the backing-store pixel budget. A capped canvas must draw through the returned `g` (or use the returned `dpr`), never J.DPR.
   */
  J.fit = (c, o) => {
    let cw = c.clientWidth, ch = c.clientHeight;
    if (!cw || !ch) { const r = c.getBoundingClientRect(); cw = r.width; ch = r.height; } // inline / detached canvas
    const W = Math.max(1, Math.round(cw)), H = Math.max(1, Math.round(ch));
    if (typeof o === 'number') o = { dpr: o };
    const ds = c.dataset || {};
    let dpr = J.DPR;
    const cap = (o && o.dpr) || +ds.dpr; if (cap > 0) dpr = Math.min(dpr, cap);
    const px = (o && o.maxPx) || +ds.maxpx; if (px > 0) dpr = Math.min(dpr, Math.max(1, Math.sqrt(px / (W * H))));
    dpr = Math.min(dpr, 8192 / Math.max(W, H)); // hard side limit (older mobile browsers refuse bigger canvases)
    const w = Math.max(1, Math.round(W * dpr)), h = Math.max(1, Math.round(H * dpr));
    if (c.width !== w) c.width = w;
    if (c.height !== h) c.height = h;
    const g = c.getContext('2d');
    g.setTransform(w / W, 0, 0, h / H, 0, 0);
    return { g, W, H, dpr: w / W };
  };
  /** call cb(rect) now and whenever el resizes (coalesced to one rAF); also once more when an enclosing `.rv` reveal finishes (its scale() transform changes the rect without a resize) */
  J.watch = (el, cb) => {
    let raf = 0;
    const run = () => { raf = 0; cb(el.getBoundingClientRect()); };
    const kick = () => { if (!raf) raf = requestAnimationFrame(run); };
    const ro = new ResizeObserver(kick);
    ro.observe(el); run();
    if (!J.reduce) {
      for (let a = el.closest('.rv'); a; a = a.parentElement && a.parentElement.closest('.rv')) {
        if (a.classList.contains('fx-done') || (a.classList.contains('in') && getComputedStyle(a).transform === 'none')) continue;
        const done = (e) => { if (e.target !== a || e.propertyName !== 'transform') return; a.removeEventListener('transitionend', done); kick(); };
        a.addEventListener('transitionend', done);
      }
    }
    return ro;
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
  J.setFloor = (v) => { if (!isFinite(+v) || v === null || v === '') return; S.floor = J.clamp(+v, 0.5, 0.99); E.RULES.floor = S.floor; J.bus.emit('floor', S.floor); hud(); };
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

  /* ---------- tab visibility ---------- */
  /* A hidden tab gets no animation frames, so document.timeline stands still and every Element.animate() a 'decision'/'tick' handler starts can never finish:
     the live-animation count (and heap) grew ~16/s until the tab came back. The market tick and the decision stream therefore stop while hidden and
     resume on return WITHOUT catching up (no burst of queued decisions). */
  J.hidden = () => document.hidden;
  /** Element.animate that is a no-op (returns null) while the tab is hidden or the element has no WAAPI — use for fire-and-forget flashes */
  J.animate = (el, kf, o) => { if (document.hidden || !el || !el.animate) return null; try { return el.animate(kf, o); } catch (e) { return null; } };

  /* ---------- simulated market (4 Hz) ---------- */
  const M = (J.market = { price: 84722, open: 84722, hist: [], vol: 0.00016 });
  let tickT = 0;
  const tick = () => {
    const dp = M.price * (J.gauss() * M.vol + (84722 - M.price) * 1e-6);
    M.price = Math.max(1000, M.price + dp);
    M.hist.push(M.price); if (M.hist.length > 1200) M.hist.shift();
    J.bus.emit('tick', { price: M.price, dp });
  };
  const runTick = (on) => { if (on && !tickT) tickT = setInterval(tick, 250); else if (!on && tickT) { clearInterval(tickT); tickT = 0; } };
  runTick(!document.hidden);
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
    else if (d.reason.indexOf('conf ') === 0) d.reason = 'conf ' + d.conf.toFixed(2) + ' < ' + S.floor.toFixed(2); // reason quotes the displayed (jittered) confidence
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
  let loopT = 0, started = false;
  function loop() { loopT = 0; if (document.hidden) return; try { J.fire(); } catch (e) { console.error('[loop]', e); } loopT = setTimeout(loop, 700 + Math.random() * 650); }
  J.start = () => { started = true; if (!document.hidden && !loopT) loopT = setTimeout(loop, 400); };
  document.addEventListener('visibilitychange', () => {
    const on = !document.hidden;
    runTick(on);
    if (on) { if (started && !loopT) loopT = setTimeout(loop, 500 + Math.random() * 600); } // resume gently, nothing queued while away
    else { clearTimeout(loopT); loopT = 0; }
  });

  /* ---------- HUD (header metrics + kill switch) ---------- */
  function median(a) { const s = a.slice().sort((x, y) => x - y); return s[(s.length / 2) | 0]; }
  const hudEls = {};
  /** odometer: every digit is a 0-9 reel that rolls to its value (transform transition); separators stay static. Rebuilt only when the glyph layout changes.
      The reels are aria-hidden, a visually hidden copy carries the text for assistive tech. */
  function odo(el, text) {
    if (!el || el.__od === text) return;
    const prev = el.__od; el.__od = text;
    let wrap = el.__odw;
    const lay = text.replace(/\d/g, '0');
    if (!wrap || el.__odl !== lay) {
      el.__odl = lay; el.textContent = '';
      wrap = el.__odw = document.createElement('span'); wrap.className = 'od'; wrap.setAttribute('aria-hidden', 'true');
      for (const ch of text) {
        const c = document.createElement('span');
        if (ch >= '0' && ch <= '9') {
          c.className = 'od-d'; const r = document.createElement('span'); r.className = 'od-r'; r.style.setProperty('--d', ch);
          for (let i = 0; i < 10; i++) { const n = document.createElement('i'); n.textContent = i; r.appendChild(n); }
          c.appendChild(r);
        } else { c.className = 'od-s'; c.textContent = ch; }
        wrap.appendChild(c);
      }
      const sr = document.createElement('span'); sr.className = 'sr-only'; el.__ods = sr;
      el.append(wrap, sr);
    } else {
      let i = 0; for (const ch of text) { if (ch >= '0' && ch <= '9') wrap.children[i].firstChild.style.setProperty('--d', ch); i++; }
    }
    el.__ods.textContent = text;
    return prev;
  }
  const flash = (el) => { if (el && !J.reduce) J.animate(el, [{ textShadow: '0 0 12px rgba(255,46,110,.95)', color: '#fff' }, { offset: 1 }], { duration: 520, easing: 'ease-out' }); };
  function hud() {
    const set = (id, v) => { const el = hudEls[id] || (hudEls[id] = document.getElementById(id)); if (el && el.textContent !== v) { const had = el.textContent; el.textContent = v; return had; } };
    odo(hudEls.mDec || (hudEls.mDec = document.getElementById('mDec')), J.fmt(S.count));
    const cEl = hudEls.mCost || (hudEls.mCost = document.getElementById('mCost')), cPrev = cEl && cEl.__od;
    odo(cEl, '$' + S.cost.toFixed(3)); if (cPrev && cPrev !== cEl.__od && hudEls.ready) flash(cEl);
    const mp = set('mMed', median(S.ms).toFixed(1) + ' ms'); if (mp && hudEls.ready) flash(hudEls.mMed);
    const fp = set('mFloor', S.floor.toFixed(2)); if (fp && hudEls.ready) flash(hudEls.mFloor);
    set('secExec', J.fmt(S.dest.execute)); set('secRev', J.fmt(S.dest.review)); set('secSkip', J.fmt(S.dest.skip)); // desk header: live gate tally (this session)
    if (hudEls.fl !== S.floor) { hudEls.fl = S.floor; document.querySelectorAll('.foot-fl').forEach((el) => (el.textContent = 'floor ' + S.floor.toFixed(2))); }
    const k = hudEls.killBtn || (hudEls.killBtn = document.getElementById('killBtn'));
    if (k) { k.setAttribute('aria-pressed', String(S.killed)); const t = hudEls.killTxt || (hudEls.killTxt = document.getElementById('killTxt')); if (t && t.textContent !== (S.killed ? 'HALTED' : 'ARMED')) t.textContent = S.killed ? 'HALTED' : 'ARMED'; }
  }
  J.hud = hud;

  /* ---------- keyboard shortcuts: J.shortcut(key, fn, label) + '?' help dialog ---------- */
  const keys = [];
  /** register a single-key shortcut (case-insensitive, no modifiers). `label` (optional) lists it in the '?' dialog. Returns an unregister fn. */
  J.shortcut = (key, fn, label) => { const o = { key: String(key).toLowerCase(), fn, label }; keys.push(o); return () => { const i = keys.indexOf(o); if (i >= 0) keys.splice(i, 1); }; };
  const SECS = ['hero', 'builds', 'hour', 'desk', 'lab'];
  const goto = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: J.reduce ? 'auto' : 'smooth', block: 'start' }); };
  J.toTop = () => { window.scrollTo({ top: 0, behavior: J.reduce ? 'auto' : 'smooth' }); const l = document.querySelector('.logo'); if (l) l.focus({ preventScroll: true }); };
  let dlg = null, dlgBack = null, dlgFrom = null;
  function helpOpen() { return !!(dlg && dlg.classList.contains('on')); }
  function helpClose() {
    if (!helpOpen()) return;
    dlg.classList.remove('on'); dlgBack.classList.remove('on'); document.body.classList.remove('kb-open');
    if (dlgFrom && dlgFrom.focus && document.contains(dlgFrom)) dlgFrom.focus({ preventScroll: true });
    dlgFrom = null;
  }
  function helpBuild() {
    dlgBack = document.createElement('div'); dlgBack.className = 'kb-back'; dlgBack.addEventListener('click', helpClose);
    dlg = document.createElement('div'); dlg.className = 'kb'; dlg.id = 'kbDlg'; dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-labelledby', 'kbTitle'); dlg.tabIndex = -1;
    const rows = [['?', 'this help'], ['1 – 5', 'jump to decides · builds · hour · desk · lab']].concat(keys.filter((k) => k.label).map((k) => [k.key === ' ' ? 'space' : k.key, k.label])).concat([['esc', 'close']]);
    dlg.innerHTML = '<div class="kb-h"><div><span class="kb-eb">keyboard</span><h2 id="kbTitle">shortcuts</h2></div><button type="button" class="kb-x" aria-label="Close shortcuts">esc</button></div><dl class="kb-l"></dl>'
      + '<p class="kb-n">simulation console. shortcuts never place orders; the kill switch only reroutes simulated tickets to review.</p>';
    const dl = dlg.querySelector('dl');
    for (const [k, t] of rows) { const dt = document.createElement('dt'), dd = document.createElement('dd'); const kb = document.createElement('kbd'); kb.textContent = k; dt.appendChild(kb); dd.textContent = t; dl.append(dt, dd); }
    dlg.querySelector('.kb-x').addEventListener('click', helpClose);
    document.body.append(dlgBack, dlg);
  }
  J.help = (on) => {
    if (on === false) return helpClose();
    if (helpOpen()) return helpClose();
    if (!dlg) helpBuild();
    dlgFrom = document.activeElement; dlg.classList.add('on'); dlgBack.classList.add('on'); document.body.classList.add('kb-open');
    dlg.querySelector('.kb-x').focus({ preventScroll: true });
  };
  J.shortcut('k', () => J.setKilled(!S.killed), 'kill switch (arm / halt)');
  J.shortcut('f', () => { J.fire(); if (J.pulse) J.pulse(0.45); }, 'fire a simulated decision');
  J.shortcut('t', () => J.toTop(), 'back to top');
  SECS.forEach((id, i) => J.shortcut(String(i + 1), () => goto(id)));
  J.shortcut('?', () => J.help());
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    if (helpOpen()) {
      if (e.key === 'Escape') { e.preventDefault(); helpClose(); } else if (e.key === 'Tab') { e.preventDefault(); dlg.querySelector('.kb-x').focus(); } else if (e.key === '?') { e.preventDefault(); helpClose(); }
      return;
    }
    const t = e.target, tag = t && t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
    if (document.getElementById('fx-boot')) return; // boot overlay: any key only skips it
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    for (const k of keys) if (k.key === key) { e.preventDefault(); try { k.fn(e); } catch (er) { console.error('[shortcut]', er); } return; }
  });

  /* ---------- HUD tooltips (one fixed element: .mets scrolls, so a CSS child would clip) + scroll progress ---------- */
  function hudExtras() {
    const hudEl = document.getElementById('hud'); if (!hudEl) return;
    const tip = document.createElement('div'); tip.className = 'hud-tip'; tip.setAttribute('aria-hidden', 'true'); document.body.appendChild(tip);
    let cur = null, tm = 0, touch = false;
    const hide = () => { clearTimeout(tm); cur = null; tip.classList.remove('on'); };
    const show = (m) => {
      if (m === cur) return; cur = m; clearTimeout(tm);
      tip.textContent = m.getAttribute('data-tip'); tip.classList.add('on');
      const r = m.getBoundingClientRect(), w = tip.offsetWidth;
      tip.style.left = Math.round(J.clamp(r.left, 8, innerWidth - w - 8)) + 'px'; tip.style.top = Math.round(r.bottom + 10) + 'px';
      if (touch) tm = setTimeout(hide, 3000);
    };
    window.addEventListener('pointerdown', (e) => { touch = e.pointerType === 'touch'; }, { passive: true, capture: true });
    hudEl.addEventListener('mouseover', (e) => { const m = e.target.closest && e.target.closest('.m[data-tip]'); if (m) show(m); });
    hudEl.addEventListener('mouseout', (e) => { const m = e.target.closest && e.target.closest('.m[data-tip]'); if (m && !m.contains(e.relatedTarget)) hide(); });
    hudEl.addEventListener('focusin', (e) => { const m = e.target.closest && e.target.closest('.m[data-tip]'); if (m && e.target.matches(':focus-visible')) show(m); });
    hudEl.addEventListener('focusout', hide);
    window.addEventListener('scroll', () => { if (cur) hide(); }, { passive: true });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
    // section scroll offset follows the real sticky HUD height; page scroll progress hairline (transform only, one write per frame)
    const prog = hudEl.querySelector('.hud-prog'); let pr = 0;
    const root = document.documentElement;
    const upd = () => { pr = 0; if (prog) prog.style.transform = 'scaleX(' + J.clamp(scrollY / Math.max(1, root.scrollHeight - innerHeight), 0, 1).toFixed(4) + ')'; };
    window.addEventListener('scroll', () => { if (!pr) pr = requestAnimationFrame(upd); }, { passive: true }); upd();
    new ResizeObserver(() => root.style.setProperty('--hud-h', hudEl.offsetHeight + 'px')).observe(hudEl);
    const hb = document.getElementById('helpBtn'); if (hb) hb.addEventListener('click', () => J.help());
    document.querySelectorAll('[data-act="help"]').forEach((b) => b.addEventListener('click', () => J.help()));
    document.querySelectorAll('[data-act="top"]').forEach((b) => b.addEventListener('click', () => J.toTop()));
  }

  /* ---------- module registry: JEV.mod(name, init) — each module is a closure, no globals ---------- */
  const mods = [];
  J.mod = (name, init) => mods.push({ name, init });
  J.boot = () => {
    const kb = document.getElementById('killBtn');
    if (kb) kb.addEventListener('click', () => J.setKilled(!S.killed));
    hud(); hudEls.ready = true; hudExtras(); pauseOffscreen();
    try { headings(); tintInit(); } catch (e) { console.error('[core:spectacle]', e); }
    for (const m of mods) {
      const t0 = performance.now();
      try { m.init(); } catch (e) { console.error('[module:' + m.name + ']', e); }
      J.bootLog = (J.bootLog || []); J.bootLog.push(m.name + ' ' + (performance.now() - t0).toFixed(1) + 'ms');
    }
    J.start();
    document.documentElement.classList.add('ready');
  };
})();
