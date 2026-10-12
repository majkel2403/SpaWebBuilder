/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod J.$ J.$$ J.C J.S J.RULES J.bus ('decision' emitted, 'floor' 'kill' two-way) J.decide J.setFloor J.setKilled J.market J.recent
 *   J.fit J.watch J.task J.rgba J.fmt J.sgn J.scramble J.clamp J.lerp J.tier J.reduce J.hidden J.pointer J.scroll J.ACTIONS J.SIZES J.shortcut; optional J.hud J.toast.
 * Data: JEVEngine.sampleState (random scenario) + J.decide(state) on a hand-built state {edge_bps, imbalance, spread_bps, vol_1h, position_pct, daily_pnl,
 *   drawdown_pct, latency_ms, signal_age_s}. Every commit publishes a 'decision' record on the bus. Everything is simulated.
 */
JEV.mod('lab-decision-lab', () => {
  'use strict';
  const J = JEV;
  const root = J.$('#lab');
  if (!root) return;
  const $ = (s, r) => (r || root).querySelector(s);
  const $$ = (s, r) => Array.from((r || root).querySelectorAll(s));
  const clamp = J.clamp, lerp = J.lerp, C = J.C;
  const EN = window.JEVEngine;
  const ACTIONS = J.ACTIONS, SIZES = J.SIZES;
  const HAS_WA = typeof Element.prototype.animate === 'function';
  const anim = (el, kf, o) => { if (!el || !HAS_WA || J.reduce) return null; try { return el.animate(kf, o); } catch (e) { return null; } };
  const fxa = (el, kf, o) => (J.hidden() ? null : anim(el, kf, o));
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const ease3 = (p) => 1 - Math.pow(1 - p, 3);
  const eio = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const now = () => performance.now();
  const tierN = () => J.tier || 2;
  const setTxt = (el, t) => { if (el.textContent !== t) el.textContent = t; };
  const hex2 = (n) => (n & 255).toString(16).padStart(2, '0');
  const rhex = (n) => { let s = ''; while (s.length < n) s += Math.floor(Math.random() * 16).toString(16); return s; };

  /* ------------------------------------------------------------------ config ------------------------------------------------------------------ */
  const FIELDS = [
    { k: 'edge_bps', chip: 'edge', min: -40, max: 40, step: 0.5, v: 9, cc: 'pink', dec: 1, sign: 1, bi: 1, mark: 0 },
    { k: 'imbalance', chip: 'imb', min: -1, max: 1, step: 0.01, v: 0.2, cc: 'violet', dec: 2, sign: 1, bi: 1, mark: 0 },
    { k: 'spread_bps', chip: 'spread', min: 0.2, max: 20, step: 0.1, v: 1.8, cc: 'yellow', dec: 1, dz: [8, 20], risk: 'spread' },
    { k: 'vol_1h', chip: 'vol', min: 10, max: 200, step: 1, v: 54, cc: 'orange', dec: 0, unit: '%', dz: [160, 200], risk: 'vol' },
    { k: 'position_pct', chip: 'pos', min: -4, max: 4, step: 0.1, v: 0, cc: 'blue', dec: 1, sign: 1, bi: 1, mark: 0 },
    { k: 'daily_pnl', chip: 'pnl', min: -2500, max: 1500, step: 10, v: 320, cc: 'green', usd: 1, bi: 1, mark: 0, dz: [-2500, -1600], risk: 'loss' },
    { k: 'drawdown_pct', chip: 'dd', min: 0, max: 14, step: 0.1, v: 3.2, cc: 'red', dec: 1, dz: [8, 14], risk: 'dd' },
    { k: 'latency_ms', chip: 'lat', min: 5, max: 600, step: 1, v: 42, cc: 'cyan', dec: 0, dz: [300, 600], risk: 'latency' },
    { k: 'signal_age_s', chip: 'age', min: 0, max: 120, step: 1, v: 8, cc: 'gray', dec: 0, dz: [45, 120], risk: 'age' },
  ];
  FIELDS.forEach((f) => (f.label = f.k));
  const FLOOR = { k: 'floor', label: 'floor', min: 0.5, max: 0.99, step: 0.01, v: 0.85, cc: 'orange', dec: 2, mark: 0.85 };
  // order = FIELDS order: edge · imbalance · spread · vol · position · pnl · drawdown · latency · age
  const PRESETS = {
    trend: [22, 0.34, 1.4, 58, 0, 420, 1.4, 38, 6],
    'mean-revert': [-7, 0.12, 2.2, 30, 0, 120, 1, 44, 9],
    'wide book': [22, 0.3, 12.5, 84, 0, 200, 2.1, 140, 8],
    'stale feed': [16, 0.2, 2.2, 52, 0, 150, 1.8, 360, 52],
    reversal: [-12, -0.2, 1.6, 62, 2.4, 380, 2, 40, 6],
    stress: [-6, -0.3, 6.5, 168, 3.2, -1900, 10.2, 190, 12],
  };
  const ACOL = { buy: '46,230,166', sell: '255,77,94', hold: '184,178,194', close: '255,138,61', flatten: '166,107,255' };
  const DC = { execute: 'green', review: 'yellow', skip: 'gray' };
  const DHEX = { execute: C.green, review: C.amber, skip: '#b8b2c2' };
  const BUILD = { buy: 'entry', sell: 'entry', hold: 'guard', close: 'exit', flatten: 'liq' };
  const VENUES = ['binance', 'hyperliquid', 'okx', 'bybit', 'coinbase', 'kraken'];

  const fmtV = (f, v) => {
    if (f.usd) return (v < 0 ? '-$' : '+$') + J.fmt(Math.abs(Math.round(v)));
    if (Math.abs(v) < Math.pow(10, -(f.dec || 0)) / 2) v = 0;
    return (f.sign ? J.sgn(v, f.dec) : J.fmt(v, f.dec)) + (f.unit || '');
  };
  const fmtP = (p) => (p >= 0.995 ? '>99%' : p < 0.005 ? '<1%' : Math.round(p * 100) + '%');
  const fmtSize = (s) => s + '%';
  const snap = (f, v) => +(Math.round((v - f.min) / f.step) * f.step + f.min).toFixed(4);

  /* ------------------------------------------------------------------ refs ------------------------------------------------------------------ */
  const ctl = $('#lab-ctl'), pipe = $('#lab-pipe');
  const stg = [1, 2, 3, 4].map((i) => $('#lab-s' + i));
  const go = $('#lab-go'), magw = $('#lab-magw'), autoB = $('#lab-auto'), killB = $('#lab-kill'), killS = $('#lab-kill-s');
  const miniEl = $('#lab-mini'), miA = $('#lab-mi-a'), miS = $('#lab-mi-s'), miC = $('#lab-mi-c'), miD = $('#lab-mi-d');
  const statT = $('#lab-stat-t'), prog = $('#lab-prog'), srEl = $('#lab-sr');
  const gt = $('#lab-gt'), fl = $('#lab-fl'), flv = $('#lab-fl-v'), cf = $('#lab-cf'), cfv = $('#lab-cf-v'), tail = $('#lab-gt-tail');
  const verdict = $('#lab-verdict'), why = $('#lab-why');
  const ring = $('#lab-ring'), confEl = $('#lab-conf'), pickEl = $('#lab-pick'), pickS = $('#lab-pick-s'), qb = $('#lab-qb');
  const gva = $('#lab-gva'), gnd = $('#lab-gnd'), yn = $('#lab-yn'), yp = $('#lab-yp'), msEl = $('#lab-ms');
  const jsEl = $('#lab-js'), destEl = $('#lab-dest'), destT = $('#lab-dest-t'), destS = $('#lab-dest-s'), destR = $('.lab-dest-r', destEl);
  const tpEl = $('#lab-tp');

  /* ------------------------------------------------------------------ state ------------------------------------------------------------------ */
  const V = {};
  FIELDS.forEach((f) => (V[f.k] = f.v));
  let cur = null, auto = true, dirty = false, seq = 0, tween = null, ct = 0, timers = [], running = false;
  let lv = false, pv = false, pending = false, committed = false, runT0 = 0;
  const tape = [];
  let lastC = null, base = null, copyT = 0, hashT = 0, restored = false;
  const files = { execute: [], review: [], skip: [] }, fcount = { execute: 0, review: 0, skip: 0 };

  /* ------------------------------------------------------------------ slider rows ------------------------------------------------------------------ */
  function buildRow(f, host) {
    const id = 'lab-in-' + f.k, span = f.max - f.min;
    const row = document.createElement('div');
    row.className = 'lab-row'; row.setAttribute('data-c', f.cc); row.setAttribute('data-k', f.k);
    let dz = '';
    if (f.dz) dz = '<i class="lab-dz' + (f.dz[0] <= f.min ? ' lo' : '') + '"></i>';
    const mark = f.mark != null ? '<i class="lab-zero"></i>' : '';
    row.innerHTML = '<label for="' + id + '">' + f.label + '</label><output id="' + id + '-o" for="' + id + '"></output>' +
      '<div class="lab-rng"><i class="lab-tr"></i>' + dz + mark + '<i class="lab-trl"></i><i class="lab-fill"></i><b class="lab-bub" aria-hidden="true"></b>' +
      '<input id="' + id + '" type="range" min="' + f.min + '" max="' + f.max + '" step="' + f.step + '" value="' + f.v + '"></div>';
    host.appendChild(row);
    const rng = $('.lab-rng', row);
    if (f.dz) { rng.style.setProperty('--za', clamp((f.dz[0] - f.min) / span, 0, 1).toFixed(4)); rng.style.setProperty('--zb', clamp((f.dz[1] - f.min) / span, 0, 1).toFixed(4)); }
    if (f.mark != null) rng.style.setProperty('--zp', clamp((f.mark - f.min) / span, 0, 1).toFixed(4));
    const r = { f, row, rng, input: $('input', row), out: $('output', row), bub: $('.lab-bub', row), trl: $('.lab-trl', row), hold: 0, lp: null, tail: null, tra: null, sp: null, sk: 0, si: 0, lq: null };
    paintRow(r, f.v);
    return r;
  }
  /* glowing trail behind the thumb: a pooled element + ONE reusable WAAPI fade per row (no per-input allocation) */
  function trail(r, p) {
    const lp = r.lp; r.lp = p;
    if (lp == null || J.reduce || !HAS_WA || tierN() < 2 || J.hidden() || Math.abs(p - lp) < 0.0012) return;
    if (r.tail == null) r.tail = lp;
    r.tail = lerp(r.tail, p, 0.1);
    const lo = Math.min(r.tail, p), hi = Math.max(r.tail, p), dir = p >= r.tail ? '90deg' : '270deg';
    const st = r.trl.style;
    st.setProperty('--t0', lo.toFixed(4)); st.setProperty('--t1', hi.toFixed(4));
    if (r.td !== dir) { r.td = dir; st.setProperty('--td', dir); }
    if (!r.tra) {
      try { r.tra = r.trl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 720, easing: 'ease-out', fill: 'both' }); r.tra.onfinish = () => { r.tail = null; }; } catch (e) { r.tra = null; return; }
    } else { r.tra.currentTime = 0; r.tra.play(); }
  }
  /* tick sparks when the value snaps to a new step (3 pooled dots per row, replayed WAAPI) */
  const SPK = [[-11, -15], [1, -20], [12, -14]];
  function spark(r) {
    if (J.reduce || !HAS_WA || tierN() < 2 || J.hidden()) return;
    const t = now(); if (t - r.sk < 55) return; r.sk = t;
    if (!r.sp) {
      r.sp = SPK.map((d) => {
        const el = document.createElement('i'); el.className = 'lab-spk'; el.setAttribute('aria-hidden', 'true'); r.rng.appendChild(el);
        let a = null; try { a = el.animate([{ transform: 'translate(-50%,-50%) scale(1.3)', opacity: 1 }, { transform: 'translate(calc(-50% + ' + d[0] + 'px),calc(-50% + ' + d[1] + 'px)) scale(.1)', opacity: 0 }], { duration: 460, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' }); a.cancel(); } catch (e) { a = null; }
        return a;
      });
    }
    const n = tierN() >= 3 ? 3 : 2;
    for (let i = 0; i < n; i++) { const a = r.sp[(r.si + i) % 3]; if (a) { a.currentTime = 0; a.play(); } }
    r.si = (r.si + 1) % 3;
  }
  function paintRow(r, v) {
    const f = r.f, span = f.max - f.min;
    const p = clamp((v - f.min) / span, 0, 1), z = f.mark != null ? clamp((f.mark - f.min) / span, 0, 1) : 0;
    const a = f.bi ? Math.min(p, z) : 0, b = f.bi ? Math.max(p, z) : p;
    r.rng.style.setProperty('--a', a.toFixed(4)); r.rng.style.setProperty('--b', b.toFixed(4)); r.rng.style.setProperty('--p', p.toFixed(4));
    trail(r, p);
    const txt = fmtV(f, v);
    if (r.out.textContent !== txt) { r.out.textContent = txt; r.bub.textContent = txt; r.input.setAttribute('aria-valuetext', txt); }
  }
  const rows = {};
  const slHost = $('#lab-sliders');
  FIELDS.forEach((f) => (rows[f.k] = buildRow(f, slHost)));
  const floorR = buildRow(FLOOR, $('#lab-floorrow'));
  floorR.row.classList.add('lab-row-floor');

  function setVal(f, v) { V[f.k] = v; const r = rows[f.k]; r.input.value = v; paintRow(r, v); }

  /* ------------------------------------------------------------------ decision ------------------------------------------------------------------ */
  function route(s) {
    const h = Math.abs(Math.round(s.edge_bps * 2) * 31 + Math.round(s.imbalance * 20) * 17 + Math.round(s.latency_ms / 10) * 7 + Math.round(s.spread_bps * 3) * 13);
    return VENUES[h % VENUES.length];
  }
  function decideState(st) {
    const d = J.decide(st);
    d.conf = clamp(d.conf, 0.3, 0.995);
    if (/^conf /.test(d.reason)) d.reason = 'conf ' + d.conf.toFixed(2) + ' < ' + d.floor.toFixed(2);
    d.st = st; d.venue = route(st);
    return d;
  }
  const stateNow = () => { const st = {}; FIELDS.forEach((f) => (st[f.k] = V[f.k])); return st; };
  function riskChecks(s, killed) {
    const lossUse = clamp(-s.daily_pnl / (J.RULES.lossCap || 2000), 0, 1.5);
    return [
      { id: 'spread', bad: s.spread_bps > 8, val: s.spread_bps.toFixed(1) },
      { id: 'latency', bad: s.latency_ms > 300, val: Math.round(s.latency_ms) + 'ms' },
      { id: 'age', bad: s.signal_age_s > 45, val: Math.round(s.signal_age_s) + 's' },
      { id: 'loss', bad: lossUse >= 0.8, val: Math.round(lossUse * 100) + '%' },
      { id: 'dd', label: 'drawdown', bad: s.drawdown_pct >= 8, val: s.drawdown_pct.toFixed(1) + '%' },
      { id: 'vol', bad: s.vol_1h >= 160, val: Math.round(s.vol_1h) + '%' },
      { id: 'kill', bad: !!killed, val: killed ? 'on' : 'off' },
    ];
  }

  /* ------------------------------------------------------------------ stage 1 : encode chips ------------------------------------------------------------------ */
  const CH = FIELDS.map((f) => ({ k: f.k, n: f.chip, cc: f.cc, f, bi: !!f.bi })).concat([{ k: 'net', n: 'net_edge', cc: 'pink', bi: true, derived: true, f: { dec: 1, sign: 1, min: -40, max: 40 } }]);
  const ftsEl = $('#lab-fts');
  CH.forEach((c, i) => {
    const el = document.createElement('div');
    el.className = 'lab-ft' + (c.bi ? ' bi' : '') + (c.derived ? ' drv' : '');
    el.setAttribute('data-c', c.cc); el.style.setProperty('--d', (i * 0.03).toFixed(2) + 's');
    el.innerHTML = '<span>' + c.n + '</span><b>0</b><i class="lab-cb"><u></u></i>';
    ftsEl.appendChild(el);
    c.el = el; c.val = $('b', el); c.u = $('u', el);
  });
  const norm = (c, v) => {
    const f = c.f;
    if (c.bi) return clamp(v / Math.max(Math.abs(f.min), Math.abs(f.max)), -1, 1);
    return clamp((v - f.min) / (f.max - f.min), 0, 1);
  };
  function rEncode(d, pop) {
    const bad = {};
    riskChecks(d.st, d.killed).forEach((c) => (bad[c.id] = c.bad));
    CH.forEach((c, i) => {
      const v = c.derived ? d.net : d.st[c.k];
      setTxt(c.val, c.derived ? J.sgn(v, 1) : fmtV(c.f, v));
      c.u.style.setProperty('--v', norm(c, v).toFixed(3));
      c.el.classList.toggle('neg', c.bi && v < 0);
      c.el.classList.toggle('bad', !!(c.f.risk && bad[c.f.risk]));
      if (pop) anim(c.el, [{ opacity: 0, transform: 'translateY(9px) scale(.78)' }, { opacity: 1, transform: 'none' }], { duration: 300, delay: i * 26, easing: 'cubic-bezier(.2,1.5,.3,1)', fill: 'backwards' });
    });
  }

  /* ------------------------------------------------------------------ stage 2 : typed questions ------------------------------------------------------------------ */
  const pbHost = $('#lab-pb'), pbRows = {};
  ACTIONS.forEach((a, i) => {
    const li = document.createElement('li');
    li.setAttribute('data-a', a);
    li.innerHTML = '<span>' + a + '</span><i class="lab-bar"><u style="--d:' + (i * 0.06).toFixed(2) + 's"></u></i><em>0%</em>';
    pbHost.appendChild(li);
    pbRows[a] = { li, u: $('u', li), em: $('em', li) };
  });
  const szHost = $('#lab-sz'), szCols = [];
  SIZES.forEach((s, i) => {
    const el = document.createElement('div');
    el.className = 'lab-szc';
    el.innerHTML = '<em>0%</em><i class="lab-col"><u style="--d:' + (i * 0.07).toFixed(2) + 's"></u></i><span>' + fmtSize(s) + '</span>';
    szHost.appendChild(el);
    szCols.push({ el, u: $('u', el), em: $('em', el) });
  });
  const ckHost = $('#lab-ck'), ckRows = {};
  [['spread', 'spread'], ['latency', 'latency'], ['age', 'age'], ['loss', 'loss'], ['dd', 'drawdown'], ['vol', 'vol'], ['kill', 'kill']].forEach((c) => {
    const li = document.createElement('li');
    li.innerHTML = '<span>' + c[1] + '</span><u></u>';
    ckHost.appendChild(li);
    ckRows[c[0]] = { li, u: $('u', li) };
  });
  const nums = [];
  function numTo(el, to, animate) {
    for (let i = nums.length - 1; i >= 0; i--) if (nums[i].el === el) nums.splice(i, 1);
    const from = parseFloat(el.textContent) || 0;
    if (!animate || Math.abs(from - to) < 0.004) { setTxt(el, to.toFixed(2)); return; }
    nums.push({ el, from, to, t0: now(), dur: 650 });
  }
  function tickNums() {
    if (!nums.length) return;
    const n = now();
    for (let i = nums.length - 1; i >= 0; i--) {
      const k = nums[i], p = clamp((n - k.t0) / k.dur, 0, 1);
      setTxt(k.el, lerp(k.from, k.to, ease3(p)).toFixed(2));
      if (p >= 1) nums.splice(i, 1);
    }
  }
  function rQuestions(d, pop) {
    ACTIONS.forEach((a) => {
      const r = pbRows[a], p = d.p[a];
      r.u.style.transform = 'scaleX(' + Math.max(0.015, p).toFixed(3) + ')';
      setTxt(r.em, fmtP(p));
      r.li.classList.toggle('win', a === d.action);
    });
    ring.style.setProperty('--lab-v', d.conf.toFixed(3)); ring.style.setProperty('--rc', ACOL[d.action]);
    numTo(confEl, d.conf, pop);
    pickEl.textContent = d.action; pickEl.parentNode.setAttribute('data-a', d.action);
    SIZES.forEach((s, i) => {
      const c = szCols[i];
      c.u.style.transform = 'scaleY(' + Math.max(0.03, d.sizes[i]).toFixed(3) + ')';
      setTxt(c.em, fmtP(d.sizes[i]));
      c.el.classList.toggle('on', i === d.sizeIdx);
    });
    qb.classList.toggle('na', d.action === 'hold');
    pickS.innerHTML = d.action === 'hold' ? '&rarr; <b>no order</b> &middot; hold' : '&rarr; <b>' + fmtSize(d.size) + '</b> of capital';
    gva.style.strokeDashoffset = (100 * (1 - d.pRisk)).toFixed(1);
    gnd.style.transform = 'rotate(' + ((d.pRisk - 0.5) * 180).toFixed(1) + 'deg)';
    setTxt(yn, d.riskOk ? 'YES' : 'NO'); yn.classList.toggle('no', !d.riskOk);
    setTxt(yp, 'p ' + d.pRisk.toFixed(2));
    riskChecks(d.st, d.killed).forEach((c) => { const r = ckRows[c.id]; r.li.classList.toggle('bad', c.bad); setTxt(r.u, c.val); });
    setTxt(msEl, d.ms.toFixed(1) + ' ms');
  }

  /* ------------------------------------------------------------------ stage 3 : the gate ------------------------------------------------------------------ */
  function paintFloor(v) {
    v = +v; const t = v.toFixed(2);
    if (+floorR.input.value !== v) floorR.input.value = v;
    paintRow(floorR, v);
    gt.style.setProperty('--f', v);
    setTxt(flv, t);
    fl.setAttribute('aria-valuenow', t); fl.setAttribute('aria-valuetext', 'floor ' + t);
  }
  function rGate(d, pop) {
    const pass = d.conf >= d.floor, v = d.killed ? 'halt' : pass ? 'pass' : 'below';
    if (pop) {
      const col = v === 'pass' ? '46,230,166' : v === 'halt' ? '255,77,94' : '255,193,61';
      fxa(gt, [{ boxShadow: '0 0 0 0 rgba(' + col + ',.0), inset 0 0 0 0 rgba(' + col + ',0)' }, { boxShadow: '0 0 0 3px rgba(' + col + ',.55), 0 0 34px rgba(' + col + ',.55), inset 0 0 22px rgba(' + col + ',.35)', offset: 0.28 }, { boxShadow: '0 0 0 0 rgba(' + col + ',0), inset 0 0 0 0 rgba(' + col + ',0)' }], { duration: 900, delay: 520, easing: 'ease-out' });
      fxa($('.lab-cf-o', cf), [{ transform: 'scale(1)' }, { transform: 'scale(1.7)', offset: 0.22 }, { transform: 'scale(.88)', offset: 0.5 }, { transform: 'scale(1)' }], { duration: 640, delay: 560, easing: 'ease-out' });
      fxa(verdict, [{ transform: 'scale(1)' }, { transform: 'scale(1.22)', offset: 0.3 }, { transform: 'scale(1)' }], { duration: 520, delay: 560, easing: 'cubic-bezier(.2,1.6,.4,1)' });
      if (v === 'below' && tierN() >= 2) {
        fxa(gt, [{ transform: 'translateX(0)', filter: 'none' }, { transform: 'translateX(-5px)', filter: 'drop-shadow(4px 0 0 rgba(255,77,94,.85)) drop-shadow(-4px 0 0 rgba(0,229,255,.7))', offset: 0.14 }, { transform: 'translateX(6px)', offset: 0.3 }, { transform: 'translateX(-3px)', filter: 'drop-shadow(-3px 0 0 rgba(255,77,94,.8)) drop-shadow(3px 0 0 rgba(0,229,255,.6))', offset: 0.5 }, { transform: 'translateX(2px)', offset: 0.75 }, { transform: 'none', filter: 'none' }], { duration: 520, delay: 560, easing: 'steps(9, jump-none)' });
        fxa(verdict, [{ clipPath: 'inset(0 0 0 0)', transform: 'translateX(0)' }, { clipPath: 'inset(8% 0 58% 0)', transform: 'translateX(-7px)', offset: 0.16 }, { clipPath: 'inset(56% 0 6% 0)', transform: 'translateX(6px)', offset: 0.34 }, { clipPath: 'inset(0 0 0 0)', transform: 'translateX(-3px)', offset: 0.55 }, { clipPath: 'inset(30% 0 30% 0)', transform: 'translateX(4px)', offset: 0.7 }, { clipPath: 'inset(0 0 0 0)', transform: 'none' }], { duration: 480, delay: 560, easing: 'steps(8, jump-none)' });
      } else if (v === 'below') fxa(gt, [{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { duration: 300, delay: 560, easing: 'ease-out' });
      if (v === 'halt') fxa(gt, [{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(2px)' }, { transform: 'none' }], { duration: 420, delay: 560, easing: 'ease-out' });
    }
    cf.style.left = (d.conf * 100).toFixed(2) + '%'; cf.setAttribute('data-v', v);
    setTxt(cfv, d.conf.toFixed(2));
    tail.style.transform = 'scaleX(' + d.conf.toFixed(3) + ')';
    setTxt(verdict, v === 'halt' ? 'KILL SWITCH' : pass ? 'PASS' : 'BELOW FLOOR'); verdict.setAttribute('data-v', v);
    why.innerHTML = 'reason <b>' + esc(d.reason) + '</b> &rarr; <u style="color:' + DHEX[d.dest] + '">' + d.dest + '</u>';
  }

  /* ------------------------------------------------------------------ stage 4 : code acts ------------------------------------------------------------------ */
  const treeEl = $('#lab-tree'), folders = {};
  treeEl.innerHTML = '<div class="lab-tr-h">queue/</div>';
  ['execute', 'review', 'skip'].forEach((k) => {
    const fo = document.createElement('div');
    fo.className = 'lab-fo'; fo.setAttribute('data-c', DC[k]); fo.setAttribute('data-d', k);
    fo.innerHTML = '<div class="lab-fo-h"><b>' + k + '/</b><em>0</em></div><div class="lab-fi-l"></div>';
    treeEl.appendChild(fo);
    folders[k] = { el: fo, em: $('em', fo), list: $('.lab-fi-l', fo) };
  });
  const flyDelay = () => (J.reduce || tierN() < 2 ? 0 : 430);
  function renderFolder(k, fresh) {
    const f = folders[k], a = files[k];
    setTxt(f.em, String(fcount[k]));
    let h = '';
    for (let i = 0; i < 2; i++) h += a[i] ? '<div class="lab-fi' + (fresh && i === 0 ? ' new' : '') + '"' + (fresh && i === 0 && flyDelay() ? ' style="animation-delay:' + flyDelay() + 'ms"' : '') + '>' + a[i] + '</div>' : '<div class="lab-fi ghost">-</div>';
    f.list.innerHTML = h;
  }
  function landFile(d, pop) {
    const k = d.dest;
    files[k].unshift(d.file); if (files[k].length > 2) files[k].length = 2;
    fcount[k]++;
    renderFolder(k, pop);
    if (pop) { folders[k].el.classList.add('hit'); setTimeout(() => folders[k].el.classList.remove('hit'), 1700); }
  }
  const jS = (v) => '<span class="s">"' + esc(v) + '"</span>', jN = (v) => '<span class="n">' + v + '</span>', jB = (v) => '<span class="b">' + v + '</span>';
  function rActs(d, pop) {
    const rowsJ = [['action', jS(d.action)], ['size', jN(d.size)], ['venue', jS(d.venue)], ['conf', jN(d.conf.toFixed(2))], ['risk_ok', jB(d.riskOk)], ['reason', jS(d.reason)], ['dest', jS(d.dest)]];
    let h = '<span class="lab-jl p" style="--i:0">{</span>';
    rowsJ.forEach((r, i) => { h += '<span class="lab-jl" style="--i:' + (i + 1) + '">  <u class="k">"' + r[0] + '"</u><span class="p">:</span> ' + r[1] + (i < rowsJ.length - 1 ? '<span class="p">,</span>' : '') + '</span>'; });
    h += '<span class="lab-jl p" style="--i:8">}</span>';
    jsEl.className = 'lab-js' + (pop ? ' type' : '');
    jsEl.innerHTML = h;
    destEl.setAttribute('data-c', DC[d.dest]);
    const T = d.dest.toUpperCase();
    destT.setAttribute('data-text', T);
    if (pop) J.scramble(destT, T, 460); else setTxt(destT, T);
    setTxt(destS, d.dest === 'execute' ? 'order → ' + d.venue + ' · ' + fmtSize(d.size) : d.dest === 'review' ? '→ human review queue' : 'no order · nothing sent');
    if (pop) {
      anim(destEl, [{ transform: 'perspective(520px) rotateX(64deg) scale(1.45)', opacity: 0 }, { transform: 'perspective(520px) rotateX(0) scale(1)', opacity: 1 }], { duration: 460, easing: 'cubic-bezier(.2,1.3,.3,1)' });
      anim(destR, [{ opacity: 0.9, transform: 'scale(.9)' }, { opacity: 0, transform: 'scale(1.3)' }], { duration: 760, easing: 'ease-out' });
      if (d.killed && d.dest === 'review') anim(destEl, [{ transform: 'translateX(0)' }, { transform: 'translateX(-9px) rotate(-.6deg)' }, { transform: 'translateX(8px) rotate(.5deg)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(-2px)' }, { transform: 'none' }], { duration: 460, delay: 440, easing: 'ease-out' });
      if (d.dest === 'skip') {
        fxa(destEl, [{ filter: 'brightness(1)' }, { filter: 'brightness(.5) saturate(.3)', offset: 0.4 }, { filter: 'brightness(.8) saturate(.7)' }], { duration: 900, delay: 440, easing: 'ease-out' });
        fxa(destT, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.8, .55)', opacity: 0.25, offset: 0.4 }, { transform: 'scale(1)', opacity: 1 }], { duration: 820, delay: 440, easing: 'cubic-bezier(.3,0,.3,1)' });
      }
      if (d.dest === 'execute' && !J.reduce) {
        destEl.classList.remove('shim'); void destEl.offsetWidth; destEl.classList.add('shim');
        clearTimeout(destEl._sh); destEl._sh = setTimeout(() => destEl.classList.remove('shim'), 1500);
      }
    }
  }

  /* ------------------------------------------------------------------ tape / mini / status ------------------------------------------------------------------ */
  function renderTape(fresh) {
    let h = '';
    tape.forEach((r, i) => {
      h += '<li' + (fresh && i === 0 ? ' class="fresh"' : '') + ' data-i="' + i + '" tabindex="0" role="button" aria-label="restore inputs of #' + hex2(r.n) + ': ' + r.action + ', ' + r.dest + '"><span>#' + hex2(r.n) + '</span><b class="lab-tp-a" data-a="' + r.action + '">' + r.action + '</b><span>' + (r.action === 'hold' ? '-' : fmtSize(r.size)) +
        '</span><span class="lab-tp-c">' + r.conf.toFixed(2) + '</span><i class="lab-tp-d" data-d="' + r.dest + '">' + r.dest + '</i><em>' + esc(r.reason) + '</em></li>';
    });
    tpEl.innerHTML = h;
    if (fresh) anim(tpEl, [{ transform: 'translateY(-28px)' }, { transform: 'none' }], { duration: 340, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
  function pushTape(d) {
    tape.unshift({ n: d.n, action: d.action, size: d.size, conf: d.conf, dest: d.dest, reason: d.reason, st: Object.assign({}, d.st), floor: d.floor });
    if (tape.length > 5) tape.pop();
  }
  function rMini(d) {
    miniEl.setAttribute('data-d', d.dest);
    setTxt(miA, d.action); setTxt(miS, d.action === 'hold' ? '-' : fmtSize(d.size)); setTxt(miC, d.conf.toFixed(2)); setTxt(miD, d.dest);
  }
  const setStat = (t) => setTxt(statT, t);
  function setDirty(on) {
    if (dirty === on) return;
    dirty = on; go.classList.toggle('dirty', on);
    if (on) setStat('inputs changed · press decide');
  }
  function paintBad(d) {
    riskChecks(d.st, d.killed).forEach((c) => {
      const f = FIELDS.find((x) => x.risk === c.id);
      if (!f) return;
      const row = rows[f.k].row, was = row.classList.contains('bad');
      if (was !== c.bad) {
        row.classList.toggle('bad', c.bad);
        if (c.bad && lv) fxa($('output', row), [{ transform: 'scale(1.4)', filter: 'brightness(1.8)' }, { transform: 'scale(1)', filter: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,1.6,.4,1)' });
      }
    });
  }
  /* ---- what changed since the previous decision (baseline = last committed one) ---- */
  const diffEl = $('#lab-diff');
  function rDiff(d) {
    const o = base;
    CH.forEach((c) => {
      const v = c.derived ? d.net : d.st[c.k], w = !o ? v : c.derived ? o.net : o.st[c.k];
      const ch = !!o && Math.abs(v - w) > (c.derived ? 0.05 : (c.f.step || 0.01) * 0.5);
      if (c.el.classList.contains('chg') !== ch) c.el.classList.toggle('chg', ch);
    });
    if (!o) { setTxt(diffEl, 'first decision \u00b7 nothing to compare yet'); return; }
    const bits = [];
    if (o.action !== d.action) bits.push('action ' + o.action + ' \u2192 ' + d.action);
    if (o.size !== d.size && d.action !== 'hold') bits.push('size ' + fmtSize(o.size) + ' \u2192 ' + fmtSize(d.size));
    if (Math.abs(o.conf - d.conf) >= 0.005) bits.push('conf ' + (d.conf > o.conf ? '+' : '\u2212') + Math.abs(d.conf - o.conf).toFixed(2));
    if (o.dest !== d.dest) bits.push('dest ' + o.dest + ' \u2192 ' + d.dest);
    if (o.riskOk !== d.riskOk) bits.push('risk_ok ' + o.riskOk + ' \u2192 ' + d.riskOk);
    setTxt(diffEl, 'vs #' + hex2(o.n || 0) + ' \u00b7 ' + (bits.length ? bits.join(' \u00b7 ') : 'no change'));
    diffEl.classList.toggle('nc', !bits.length);
  }
  const rAll = (d, pop) => { rEncode(d, pop); rQuestions(d, pop); rGate(d); rActs(d, pop); rMini(d); paintBad(d); rDiff(d); };

  /* ------------------------------------------------------------------ fx : ribbons · comet · bursts (2 canvases) ------------------------------------------------------------------ */
  const fx = (() => {
    const c0 = $('#lab-fx0'), c1 = $('#lab-fx1');
    let g0 = null, g1 = null, W = 0, H = 0, L = null;
    const SC = [C.blue, C.pink, C.orange, C.green];
    const spr = {};
    const sprite = (col) => {
      if (spr[col]) return spr[col];
      const s = document.createElement('canvas'); s.width = s.height = 64;
      const g = s.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.16, J.rgba(col, 0.95)); gr.addColorStop(0.5, J.rgba(col, 0.26)); gr.addColorStop(1, J.rgba(col, 0));
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      return (spr[col] = s);
    };
    [C.blue, C.pink, C.orange, C.green, C.red, C.amber, C.pink2, '#b8b2c2', '#ffffff'].forEach(sprite);
    const act = [0, 0, 0], np = [0, 0, 0, 0];
    const cm = { y: 0, from: 0, to: 0, t0: 0, a: 0, fade: false, si: 0, pend: 0, pt: 0 };
    const rp = [];
    for (let g = 0; g < 3; g++) for (let k = 0; k < 14; k++) rp.push({ g, r: 0, u: Math.random(), sp: 0.3 + Math.random() * 0.5 });
    const sd = [];
    for (let k = 0; k < 7; k++) sd.push({ ph: k / 7 + Math.random() * 0.05 });
    const BP = Array.from({ length: 190 }, () => ({ gv: 40, dm: 1.8, on: 0, x: 0, y: 0, vx: 0, vy: 0, t: 0, d: 1, s: 10, c: C.pink }));
    const RG = Array.from({ length: 20 }, () => ({ on: 0, x: 0, y: 0, t0: 0, d: 600, r0: 4, r1: 60, c: C.pink, lw: 2, dir: 1 }));
    const BD = Array.from({ length: 10 }, () => ({ on: 0, x: 0, w: 0, y0: 0, y1: 0, h: 20, t0: 0, d: 600, c: C.amber, fl: 0 }));
    const MT = Array.from({ length: 40 }, (_, i) => ({ x: Math.random(), y: Math.random(), z: 0.25 + Math.random() * 0.75, ph: Math.random() * 6.28, c: SC[i & 3] }));
    const fl = [0, 0, 0, 0], FI = { on: 0, t0: 0, d: 520, x0: 0, y0: 0, x1: 0, y1: 0, cx: 0, cy: 0, c: C.green, dest: 'execute' };
    let landCb = null;
    const FL = Array.from({ length: 40 }, () => ({ on: 0, x0: 0, y0: 0, x1: 0, y1: 0, cx: 0, cy: 0, t0: 0, d: 600, c: C.pink, s: 14 }));

    function off(el) {
      let x = 0, y = 0, e = el;
      while (e && e !== pipe) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
      return { x, y, w: el.offsetWidth, h: el.offsetHeight };
    }
    function mk(src, dst) {
      const rb = [];
      if (!src.length || !dst.length) return rb;
      for (let i = 0; i < src.length; i++) rb.push({ x0: src[i], x1: dst[Math.min(dst.length - 1, Math.floor(i * dst.length / src.length))] });
      for (let j = 0; j < dst.length; j++) rb.push({ x0: src[Math.min(src.length - 1, Math.floor(j * src.length / dst.length))], x1: dst[j] });
      return rb;
    }
    function measure() {
      const st = stg.map(off);
      const sx = Math.max(7, parseFloat(getComputedStyle(pipe).paddingLeft) / 2 - 1);
      const nodes = stg.map((s) => { const h = off($('.lab-sh', s)); return h.y + h.h / 2; });
      const cx = (o) => o.x + o.w / 2;
      const chips = CH.map((c) => off(c.el)), maxB = Math.max.apply(null, chips.map((o) => o.y + o.h));
      const src0 = chips.filter((o) => o.y + o.h > maxB - 4).map(cx);
      const qp = $$('.lab-q', stg[1]).map(off), minQ = Math.min.apply(null, qp.map((o) => o.y)), maxQ = Math.max.apply(null, qp.map((o) => o.y + o.h));
      const dst0 = qp.filter((o) => o.y < minQ + 4).map(cx), src1 = qp.filter((o) => o.y + o.h > maxQ - 4).map(cx);
      const s3 = st[2], fan = [0.28, 0.5, 0.72].map((p) => s3.x + s3.w * p);
      const ap = [$('.lab-jsw', stg[3]), $('.lab-tree', stg[3]), $('.lab-dest', stg[3])].map(off), minA = Math.min.apply(null, ap.map((o) => o.y));
      const dst2 = ap.filter((o) => o.y < minA + 4).map(cx);
      const gaps = [
        { y0: st[0].y + st[0].h, y1: st[1].y, rb: mk(src0, dst0) },
        { y0: st[1].y + st[1].h, y1: st[2].y, rb: mk(src1, fan) },
        { y0: st[2].y + st[2].h, y1: st[3].y, rb: mk(fan, dst2) },
      ];
      const fo = {};
      ['execute', 'review', 'skip'].forEach((k) => (fo[k] = off(folders[k].el)));
      const fi = {}; ['execute', 'review', 'skip'].forEach((k) => (fi[k] = off(folders[k].list)));
      L = { sx, st, n: nodes, gaps, gt: off(gt), dest: off(destEl), js: off($('.lab-jsw', stg[3])), fo, fi };
      if (cm.a < 0.01) { cm.y = nodes[0]; cm.from = nodes[0]; cm.to = nodes[0]; }
    }
    function drawStatic() {
      if (!g0 || !L) return;
      const g = g0, killed = J.S.killed;
      g.clearRect(0, 0, W, H);
      const y0 = L.n[0], y1 = L.n[3], sx = L.sx;
      const gr = g.createLinearGradient(0, y0, 0, y1);
      SC.forEach((c, i) => gr.addColorStop(i / 3, J.rgba(killed ? C.red : c, 0.7)));
      g.lineCap = 'round';
      g.strokeStyle = gr; g.lineWidth = 1.4; g.beginPath(); g.moveTo(sx, y0); g.lineTo(sx, y1); g.stroke();
      g.globalAlpha = 0.14; g.lineWidth = 7; g.stroke(); g.globalAlpha = 1;
      L.gaps.forEach((gp, i) => {
        const dy = gp.y1 - gp.y0;
        if (dy < 6) return;
        const lg = g.createLinearGradient(0, gp.y0, 0, gp.y1);
        lg.addColorStop(0, J.rgba(killed ? C.red : SC[i], 0.5)); lg.addColorStop(1, J.rgba(killed ? C.red : SC[i + 1], 0.5));
        g.strokeStyle = lg;
        gp.rb.forEach((r) => {
          g.beginPath(); g.moveTo(r.x0, gp.y0); g.bezierCurveTo(r.x0, gp.y0 + dy * 0.6, r.x1, gp.y1 - dy * 0.6, r.x1, gp.y1);
          g.lineWidth = 1; g.globalAlpha = 0.55; g.stroke();
          g.lineWidth = 5; g.globalAlpha = 0.07; g.stroke();
        });
        g.globalAlpha = 1;
      });
      L.n.forEach((y, i) => {
        const c = killed ? C.red : SC[i];
        g.strokeStyle = J.rgba(c, 0.45); g.lineWidth = 1; g.beginPath(); g.moveTo(sx, y); g.lineTo(L.st[i].x, y); g.stroke();
        g.fillStyle = '#0a0610'; g.strokeStyle = c; g.lineWidth = 1.6; g.beginPath(); g.arc(sx, y, 5, 0, J.TAU); g.fill(); g.stroke();
        g.fillStyle = c; g.beginPath(); g.arc(sx, y, 2, 0, J.TAU); g.fill();
        g.fillStyle = c; g.beginPath(); g.arc(L.st[i].x, y, 2.2, 0, J.TAU); g.fill();
      });
    }
    function resize() {
      const a = J.fit(c0, 1.5), b = J.fit(c1, 1); // soft glow + hairlines: capped ratio (tall canvas, ~3x less backing store)
      g0 = a.g; g1 = b.g; W = a.W; H = a.H;
      measure(); drawStatic();
    }
    function spawn(x, y, col, n, spd, size, life, up, gv, dm) {
      if (J.reduce) return;
      for (let i = 0, k = 0; i < BP.length && k < n; i++) {
        const p = BP[i]; if (p.on) continue;
        const a = Math.random() * J.TAU, s = spd * (0.35 + Math.random() * 0.8);
        p.on = 1; p.x = x; p.y = y; p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s - spd * 0.12 - (up || 0) * (0.5 + Math.random() * 0.5); p.gv = gv == null ? 40 : gv; p.dm = dm == null ? 1.8 : dm; p.t = 0; p.d = life * (0.6 + Math.random() * 0.6); p.s = size * (0.6 + Math.random() * 0.7); p.c = col;
        k++;
      }
    }
    function stream(x0, y0, x1, y1, col, n) {
      if (J.reduce) return;
      const t = now();
      for (let i = 0, k = 0; i < FL.length && k < n; i++) {
        const f = FL[i]; if (f.on) continue;
        f.on = 1; f.x0 = x0; f.y0 = y0; f.x1 = x1 + (Math.random() - 0.5) * 6; f.y1 = y1 + (Math.random() - 0.5) * 8;
        f.cx = (x0 + x1) / 2 + (Math.random() - 0.5) * 70; f.cy = Math.min(y0, y1) - 10 - Math.random() * 40;
        f.t0 = t + k * 26; f.d = 520 + Math.random() * 240; f.c = col; f.s = 12 + Math.random() * 8;
        k++;
      }
    }
    function ring(x, y, c, r0, r1, d, lw, delay, dir) {
      if (J.reduce) return;
      for (let i = 0; i < RG.length; i++) {
        const r = RG[i]; if (r.on) continue;
        r.on = 1; r.x = x; r.y = y; r.c = c; r.r0 = r0; r.r1 = r1; r.d = d; r.lw = lw; r.t0 = now() + (delay || 0); r.dir = dir || 1;
        return;
      }
    }
    function band(x, w, y0, y1, h, d, c, flick, delay) {
      if (J.reduce) return;
      for (let i = 0; i < BD.length; i++) {
        const b = BD[i]; if (b.on) continue;
        b.on = 1; b.x = x; b.w = w; b.y0 = y0; b.y1 = y1; b.h = h; b.d = d; b.c = c; b.fl = flick ? 1 : 0; b.t0 = now() + (delay || 0);
        return;
      }
    }
    function implode(x, y, col, n, R, life) {
      if (J.reduce) return;
      for (let i = 0, k = 0; i < BP.length && k < n; i++) {
        const p = BP[i]; if (p.on) continue;
        const a = Math.random() * J.TAU, rr = R * (0.7 + Math.random() * 0.4);
        p.on = 1; p.x = x + Math.cos(a) * rr; p.y = y + Math.sin(a) * rr * 0.7; p.t = 0; p.d = life * (0.8 + Math.random() * 0.3); p.gv = 0; p.dm = 0;
        p.vx = -Math.cos(a) * rr / (p.d * 0.9); p.vy = -Math.sin(a) * rr * 0.7 / (p.d * 0.9); p.s = 8 + Math.random() * 7; p.c = col; k++;
      }
    }
    function ignite(i) { // the pulse reached stage i (1..4): flare + shockwave
      const y = L.n[i - 1], col = J.S.killed ? C.red : SC[i - 1], T = tierN();
      np[i - 1] = 1; fl[i - 1] = 1;
      spawn(L.sx, y, col, T >= 2 ? 12 : 8, 70, 14, 0.7);
      ring(L.sx, y, col, 6, T >= 2 ? 92 : 60, 720, 2.4);
      if (T >= 2) ring(L.st[i - 1].x, y, col, 3, 46, 560, 1.5, 90);
      if (T >= 3) ring(L.sx, y, '#ffffff', 2, 54, 520, 1.2, 50);
    }
    function fileFly(dest) {
      if (J.reduce || !L || !L.fi[dest]) return;
      const a = L.js, b = L.fi[dest];
      FI.on = 1; FI.t0 = now(); FI.d = 520; FI.x0 = a.x + a.w - 8; FI.y0 = a.y + a.h * 0.5; FI.x1 = b.x + 16; FI.y1 = b.y + 10;
      FI.cx = (FI.x0 + FI.x1) / 2 + 26; FI.cy = Math.min(FI.y0, FI.y1) - 46; FI.c = DHEX[dest]; FI.dest = dest;
    }
    function drawS(g, c, x, y, s, a) { if (a <= 0.005) return; g.globalAlpha = a > 1 ? 1 : a; g.drawImage(spr[c], x - s / 2, y - s / 2, s, s); }
    function frame(t, dt) {
      if (!g1 || !L) return;
      const g = g1, killed = J.S.killed, pc = killed ? C.red : C.pink, n = now();
      const T = tierN(), bloom = T >= 3;
      g.clearRect(0, 0, W, H); g.globalCompositeOperation = 'lighter';
      if (T >= 2 && !J.reduce) { // depth motes: far = small + slow, near = bigger; pointer + scroll parallax
        const cnt = T >= 3 ? 40 : 16, px = (J.pointer && J.pointer.nx) || 0, sy = (J.scroll && J.scroll.y) || 0;
        for (let i = 0; i < cnt; i++) {
          const m = MT[i], x = m.x * W - px * 18 * m.z, y = (((m.y * H - sy * 0.22 * m.z - t * 7 * m.z) % H) + H) % H;
          drawS(g, m.c, x, y, 5 + m.z * 13, (0.05 + 0.15 * m.z) * (0.65 + 0.35 * Math.sin(t * 0.9 + m.ph)));
        }
      }
      if (cm.pend && n >= cm.pt) { const pi = cm.pend; cm.pend = 0; ignite(pi); }
      for (let i = 0; i < 3; i++) act[i] = Math.max(0, act[i] - dt * 1.1);
      for (let i = 0; i < 4; i++) { np[i] = Math.max(0, np[i] - dt * 1.3); fl[i] = Math.max(0, fl[i] - dt * 1.7); }
      // ribbon particles
      for (let i = 0; i < rp.length; i++) {
        const p = rp[i], gp = L.gaps[p.g];
        if (!gp || !gp.rb.length) continue;
        const dy = gp.y1 - gp.y0; if (dy < 6) continue;
        p.u += dt * p.sp * (1 + 3.6 * act[p.g]);
        if (p.u >= 1 || p.r >= gp.rb.length) { p.u = p.u >= 1 ? p.u - 1 : 0; p.r = (Math.random() * gp.rb.length) | 0; }
        const r = gp.rb[p.r], u = p.u, mt = 1 - u, a3 = mt * mt * mt, b3 = 3 * mt * mt * u, c3 = 3 * mt * u * u, d3 = u * u * u;
        const x = (a3 + b3) * r.x0 + (c3 + d3) * r.x1, y = a3 * gp.y0 + b3 * (gp.y0 + dy * 0.6) + c3 * (gp.y1 - dy * 0.6) + d3 * gp.y1;
        const al = Math.sin(u * Math.PI) * (0.4 + 0.75 * act[p.g]);
        drawS(g, act[p.g] > 0.12 && !killed ? SC[p.g + 1] : pc, x, y, 10 + 12 * act[p.g], al);
      }
      // spine drift
      const sx = L.sx, y0 = L.n[0], len = L.n[3] - y0;
      if (len > 10) for (let i = 0; i < sd.length; i++) { const k = ((t * 0.045 + sd[i].ph) % 1), y = y0 + k * len; drawS(g, pc, sx, y, 8, Math.sin(k * Math.PI) * 0.55); }
      // nodes
      for (let i = 0; i < 4; i++) {
        const col = killed ? C.red : SC[i];
        drawS(g, col, sx, L.n[i], 22 + np[i] * 40, 0.3 + np[i] * 0.7);
        if (fl[i] > 0.02) { // ignition flare: horizontal lens streak into the stage + a vertical spike on the spine
          const f = fl[i], y = L.n[i], w = L.st[i].x - sx + 8;
          if (w > 8) { g.globalAlpha = Math.min(1, f * 0.85); g.drawImage(spr[col], sx - 6, y - 4 - 14 * f, w + 6, 8 + 28 * f); g.globalAlpha = f * 0.6; g.drawImage(spr['#ffffff'], sx - 6, y - 1.5 - 2 * f, w * 0.8, 3 + 4 * f); }
          g.globalAlpha = f * 0.7; g.drawImage(spr['#ffffff'], sx - 3, y - 70 * f, 6, 140 * f);
          if (bloom) drawS(g, col, sx, y, 110 * f + 30, f * 0.35);
        }
      }
      // comet
      if (cm.a > 0.01) {
        const p = clamp((n - cm.t0) / 300, 0, 1);
        cm.y = lerp(cm.from, cm.to, ease3(p));
        if (cm.fade) cm.a = Math.max(0, cm.a - dt * 1.6);
        const col = killed ? C.red : SC[Math.max(0, Math.min(3, cm.si | 0))];
        if (T >= 2 && cm.y > y0) { // the line stays lit behind the pulse
          g.strokeStyle = col; g.lineCap = 'round'; g.lineWidth = 2.4; g.globalAlpha = 0.5 * cm.a; g.beginPath(); g.moveTo(sx, y0); g.lineTo(sx, cm.y); g.stroke();
          g.lineWidth = 9; g.globalAlpha = 0.12 * cm.a; g.stroke();
        }
        const TK = T >= 2 ? 12 : 6, SP = T >= 2 ? 5 : 7;
        for (let k = TK; k >= 1; k--) { const ty = cm.y - k * SP; if (ty >= y0 - 2) drawS(g, col, sx, ty, 34 - k * (T >= 2 ? 1.8 : 3.4), (1 - k / (TK + 1)) * 0.5 * cm.a); }
        if (bloom) drawS(g, col, sx, cm.y, 96, 0.3 * cm.a);
        drawS(g, col, sx, cm.y, 46, cm.a); drawS(g, '#ffffff', sx, cm.y, 16, 0.9 * cm.a);
      }
      // flyers
      for (let i = 0; i < FL.length; i++) {
        const f = FL[i]; if (!f.on) continue;
        const p = (n - f.t0) / f.d; if (p < 0) continue;
        if (p >= 1) { f.on = 0; continue; }
        for (let k = 0; k < 3; k++) {
          const q = Math.max(0, ease3(p) - k * 0.045), mt = 1 - q;
          const x = mt * mt * f.x0 + 2 * mt * q * f.cx + q * q * f.x1, y = mt * mt * f.y0 + 2 * mt * q * f.cy + q * q * f.y1;
          drawS(g, f.c, x, y, f.s * (1 - k * 0.28), (1 - k * 0.3) * Math.min(1, (1 - p) * 3));
        }
      }
      // file flight : curved path, comet tail, landing ripple
      if (FI.on) {
        const p = (n - FI.t0) / FI.d;
        if (p >= 1) {
          FI.on = 0;
          ring(FI.x1, FI.y1, FI.c, 3, 40, 620, 2); ring(FI.x1, FI.y1, '#ffffff', 2, 22, 460, 1.2, 110);
          spawn(FI.x1, FI.y1, FI.c, T >= 2 ? 14 : 8, 90, 10, 0.6);
          if (landCb) landCb(FI.dest);
        } else if (p >= 0) {
          const TN = T >= 2 ? 14 : 8;
          for (let k = TN; k >= 1; k--) {
            const q = Math.max(0, p - k * 0.026), e = q * q * (3 - 2 * q), mt = 1 - e;
            drawS(g, FI.c, mt * mt * FI.x0 + 2 * mt * e * FI.cx + e * e * FI.x1, mt * mt * FI.y0 + 2 * mt * e * FI.cy + e * e * FI.y1, 22 - k * 1.2, (1 - k / (TN + 1)) * 0.6);
          }
          const e = p * p * (3 - 2 * p), mt = 1 - e;
          const x = mt * mt * FI.x0 + 2 * mt * e * FI.cx + e * e * FI.x1, y = mt * mt * FI.y0 + 2 * mt * e * FI.cy + e * e * FI.y1;
          const ang = Math.atan2(2 * mt * (FI.cy - FI.y0) + 2 * e * (FI.y1 - FI.cy), 2 * mt * (FI.cx - FI.x0) + 2 * e * (FI.x1 - FI.cx));
          drawS(g, FI.c, x, y, 40, 0.9); if (bloom) drawS(g, FI.c, x, y, 84, 0.3);
          g.globalAlpha = 1; g.save(); g.translate(x, y); g.rotate(ang * 0.35);
          g.fillStyle = 'rgba(255,255,255,.92)'; g.fillRect(-4, -5.5, 8, 11); g.strokeStyle = FI.c; g.lineWidth = 1.2; g.strokeRect(-4.5, -6, 9, 12);
          g.restore();
        }
      }
      // shockwave rings
      for (let i = 0; i < RG.length; i++) {
        const r = RG[i]; if (!r.on) continue;
        const p = (n - r.t0) / r.d; if (p < 0) continue;
        if (p >= 1) { r.on = 0; continue; }
        const e = ease3(p), rad = r.dir > 0 ? lerp(r.r0, r.r1, e) : lerp(r.r1, r.r0, e), a = Math.pow(1 - p, 1.5);
        g.strokeStyle = r.c; g.beginPath(); g.arc(r.x, r.y, rad, 0, J.TAU);
        g.lineWidth = r.lw * (1 - p * 0.55) + 0.4; g.globalAlpha = a * 0.9; g.stroke();
        if (bloom) { g.lineWidth = r.lw * 5; g.globalAlpha = a * 0.16; g.stroke(); }
      }
      // sweeps and tears
      for (let i = 0; i < BD.length; i++) {
        const b = BD[i]; if (!b.on) continue;
        const p = (n - b.t0) / b.d; if (p < 0) continue;
        if (p >= 1) { b.on = 0; continue; }
        const y = lerp(b.y0, b.y1, eio(p)); let a = Math.sin(p * Math.PI);
        if (b.fl && Math.random() < 0.45) a *= 0.35;
        g.globalAlpha = a * 0.9; g.drawImage(spr[b.c], b.x, y - b.h / 2, b.w, b.h);
        g.globalAlpha = a * 0.75; g.drawImage(spr['#ffffff'], b.x + b.w * 0.05, y - b.h * 0.09, b.w * 0.9, b.h * 0.18);
      }
      // bursts
      for (let i = 0; i < BP.length; i++) {
        const p = BP[i]; if (!p.on) continue;
        p.t += dt;
        if (p.t >= p.d) { p.on = 0; continue; }
        p.vx *= 1 - dt * p.dm; p.vy = p.vy * (1 - dt * p.dm) + p.gv * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        const k = 1 - p.t / p.d;
        drawS(g, p.c, p.x, p.y, p.s * (0.4 + k), k * 0.95);
        if (bloom) drawS(g, p.c, p.x, p.y, p.s * (0.4 + k) * 2.5, k * 0.2);
      }
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
    return {
      resize, frame, restyle: drawStatic,
      begin() { cm.pend = 0; cm.a = 1; cm.fade = false; cm.y = cm.from = cm.to = L ? L.n[0] : 0; cm.si = 0; cm.t0 = now(); },
      end() { cm.fade = true; },
      stage(i) { // i = 1..4
        if (!L) return;
        cm.from = cm.y; cm.to = L.n[i - 1]; cm.t0 = now(); cm.si = i - 1; cm.a = 1; cm.fade = false;
        if (i > 1) act[i - 2] = 1;
        if (J.reduce) { np[i - 1] = 1; return; }
        cm.pend = i; cm.pt = cm.t0 + (i > 1 ? 210 : 0); // flare + shockwave fire when the pulse arrives
      },
      gate(conf, v) {
        if (!L) return;
        const x = L.gt.x + conf * L.gt.w, y = L.gt.y + L.gt.h / 2, col = v === 'pass' ? C.green : v === 'halt' ? C.red : C.amber;
        spawn(x, y, col, 26, 150, 16, 0.9); spawn(x, y, '#ffffff', 8, 90, 10, 0.6);
        if (tierN() >= 2) ring(x, y, col, 4, 70, 640, 2.2);
        if (v === 'below') { // red glitch tear across the gate bar
          const w = L.gt.w + 24;
          for (let k = 0; k < 4; k++) band(L.gt.x - 12 + (Math.random() - 0.5) * 14, w, L.gt.y + 3 + Math.random() * (L.gt.h - 6), L.gt.y + 3 + Math.random() * (L.gt.h - 6), 10 + Math.random() * 8, 280 + k * 50, C.red, true, k * 70);
        }
      },
      land(dest) {
        if (!L) return;
        const f = L.fo[dest]; if (!f) return;
        stream(L.js.x + L.js.w - 8, L.js.y + L.js.h * 0.5, f.x + 12, f.y + 12, DHEX[dest], tierN() >= 2 ? 9 : 16);
        fileFly(dest);
      },
      setLand(f) { landCb = f; },
      stamp(dest, d) {
        if (!L) return;
        const x = L.dest.x + L.dest.w / 2, y = L.dest.y + L.dest.h / 2, T = tierN(), col = DHEX[dest], B = L.dest;
        if (T < 2) { spawn(x, y, col, 34, 200, 18, 1.0); spawn(x, y, '#ffffff', 10, 120, 10, 0.7); return; }
        if (dest === 'execute') { // green radial burst + particle shower
          spawn(x, y, col, 34, 210, 18, 1.0); spawn(x, y, '#ffffff', 10, 120, 10, 0.7);
          ring(x, y, col, 8, Math.max(B.w, 150) * 0.8, 780, 3); ring(x, y, '#ffffff', 4, 70, 520, 1.4, 70);
          spawn(x, y - B.h * 0.2, col, T >= 3 ? 46 : 24, 130, 12, 1.4, 250, 340, 0.7);
        } else if (dest === 'review') { // amber scan-line sweep
          const c = d && d.killed ? C.red : C.amber;
          band(B.x - 6, B.w + 12, B.y - 4, B.y + B.h + 4, 40, 720, c, false);
          if (T >= 3) band(B.x - 6, B.w + 12, B.y + B.h + 4, B.y - 4, 30, 640, c, false, 640);
          ring(x, y, c, 10, Math.max(B.w, 150) * 0.6, 760, 2); spawn(x, y, c, 14, 150, 14, 0.8);
        } else { // skip: dim collapse, everything drains inward
          ring(x, y, col, 8, Math.max(B.w, 150) * 0.6, 700, 2, 0, -1);
          implode(x, y, col, T >= 3 ? 26 : 16, Math.max(B.w, 140) * 0.55, 0.7);
        }
      },
    };
    function killed() { return J.S.killed; }
  })();

  // the flying file landed: ripple the folder badge
  fx.setLand((k) => {
    const f = folders[k]; if (!f) return;
    fxa(f.em, [{ transform: 'scale(1)' }, { transform: 'scale(1.7)', offset: 0.25 }, { transform: 'scale(.92)', offset: 0.6 }, { transform: 'scale(1)' }], { duration: 560, easing: 'ease-out' });
    fxa(f.el, [{ boxShadow: '-6px 0 0 -2px rgba(255,255,255,0)' }, { boxShadow: '-10px 0 22px -8px var(--cc)', offset: 0.3 }, { boxShadow: '-6px 0 0 -2px rgba(255,255,255,0)' }], { duration: 700, easing: 'ease-out' });
  });

  /* ------------------------------------------------------------------ run : live scrub vs cinematic commit ------------------------------------------------------------------ */
  const TL = [0, 290, 720, 990, 1300];
  const STAGE_TXT = ['encode', 'typed questions', 'the gate', 'code acts'];
  function cancelRun() {
    timers.forEach(clearTimeout); timers = [];
    if (running) { running = false; pipe.classList.remove('lab-run'); stg.forEach((s) => s.classList.remove('on')); fx.end(); }
  }
  function stageOn(i) {
    stg.forEach((s, k) => { s.classList.toggle('on', k === i - 1); if (k < i - 1) s.classList.add('done'); });
    setStat('stage ' + i + '/4 · ' + STAGE_TXT[i - 1]);
    fx.stage(i);
  }
  let liveT = 0, livePend = 0;
  function live() {
    const t = now();
    if (t - liveT < 55) { if (!livePend) livePend = setTimeout(() => { livePend = 0; live(); }, 60); return; }
    liveT = t;
    cancelRun();
    pipe.classList.add('lab-live'); pipe.classList.remove('lab-run');
    cur = decideState(stateNow());
    base = lastC;
    rAll(cur, false);
    if (!dirty) setStat('scrubbing …');
  }
  function finishRun(d, why, anim_) {
    running = false;
    pipe.classList.remove('lab-run');
    stg.forEach((s) => { s.classList.remove('on'); if (anim_) s.classList.add('done'); });
    fx.end();
    setStat('done · #' + hex2(d.n) + ' · ' + d.ms.toFixed(1) + ' ms');
    srEl.textContent = 'jev: ' + d.action + (d.action === 'hold' ? '' : ' ' + fmtSize(d.size)) + ' at confidence ' + d.conf.toFixed(2) + ', ' + d.dest + ', ' + d.reason;
  }
  function publish(d) {
    if (!lv) return;
    try {
      const S = J.S, s = d.st;
      const rec = Object.assign({}, d, { id: d.file.slice(0, 8), symbol: 'BTC-PERP', arch: 'lab', lab: true, build: BUILD[d.action] || 'entry' });
      rec.state = Object.assign({ symbol: 'BTC-PERP', price: J.market.price, vwap_dist_bps: s.edge_bps * 0.35, funding_bps: 0.8, venue: d.venue, regime: 'lab' }, s);
      rec.line = rec.symbol + ' edge ' + J.sgn(s.edge_bps) + 'bps imb ' + J.sgn(s.imbalance, 2) + ' spr ' + s.spread_bps.toFixed(1);
      S.count++; S.cost += 0.00003; S.ms.push(d.ms); if (S.ms.length > 41) S.ms.shift(); S.counts.choice++;
      if (S.dest[d.dest] != null) S.dest[d.dest]++;
      J.recent.unshift(rec); if (J.recent.length > 40) J.recent.pop();
      J.bus.emit('decision', rec); if (J.hud) J.hud();
    } catch (e) { /* the lab never breaks the page */ }
  }
  /** full cinematic decision: ~1.3 s, stage by stage. why: 'decide' | 'preset' | 'input' | 'floor' | 'kill' | 'view' | 'replay' */
  function commit(why) {
    clearTimeout(ct); clearTimeout(livePend); livePend = 0;
    cancelRun();
    const replay = why === 'replay' && !!cur && !!cur.n;
    const d = replay && cur ? cur : decideState(stateNow());
    cur = d;
    if (!replay) { d.n = ++seq; d.file = hex2(d.n) + rhex(6) + '.json'; }
    setDirty(false); go.classList.remove('dirty');
    committed = true; schedHash();
    if (!replay) { base = lastC; lastC = d; }
    const animate = pv && !J.reduce;
    if (!animate) {
      pipe.classList.add('lab-live'); pipe.classList.remove('lab-run');
      rAll(d, false);
      if (!replay) { landFile(d, false); pushTape(d); renderTape(false); if (why !== 'view') publish(d); pending = !pv; }
      finishRun(d, why, false);
      return;
    }
    pipe.classList.remove('lab-live'); pipe.classList.add('lab-run');
    running = true;
    stg.forEach((s) => s.classList.remove('on', 'done'));
    fx.begin();
    anim($('u', prog), [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: TL[4], easing: 'cubic-bezier(.4,0,.2,1)' });
    rMini(d); paintBad(d); rDiff(d);
    const T = (ms, fn) => timers.push(setTimeout(fn, ms));
    stageOn(1); rEncode(d, true);
    T(TL[1], () => { stageOn(2); rQuestions(d, true); });
    T(TL[2], () => { stageOn(3); rGate(d, true); });
    T(TL[2] + 560, () => fx.gate(d.conf, d.killed ? 'halt' : d.conf >= d.floor ? 'pass' : 'below'));
    T(TL[3], () => { stageOn(4); rActs(d, true); });
    if (!replay) T(TL[3] + 230, () => { landFile(d, true); fx.land(d.dest); });
    else T(TL[3] + 230, () => { folders[d.dest].el.classList.add('hit'); setTimeout(() => folders[d.dest].el.classList.remove('hit'), 1500); fx.land(d.dest); });
    T(TL[3] + 400, () => fx.stamp(d.dest, d));
    T(TL[4], () => {
      finishRun(d, why, true);
      if (!replay) { pushTape(d); renderTape(true); if (why !== 'view') publish(d); }
    });
  }
  function scheduleCommit(ms, why) { clearTimeout(ct); ct = setTimeout(() => commit(why), ms); }

  /* ------------------------------------------------------------------ interaction ------------------------------------------------------------------ */
  const presetBtns = $$('.lab-sc');
  const setActive = (btn) => presetBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
  function randomState() {
    let s = null;
    try { s = EN.sampleState(() => J.market.price).state; } catch (e) { s = null; }
    const o = {};
    FIELDS.forEach((f) => { let v = s ? s[f.k] : null; if (v == null || isNaN(v)) v = lerp(f.min, f.max, Math.random()); o[f.k] = snap(f, clamp(v, f.min, f.max)); });
    return o;
  }
  function glide(to, dur, stag) {
    touch();
    clearTimeout(ct);
    if (J.reduce) { FIELDS.forEach((f) => setVal(f, to[f.k])); commit('preset'); return; }
    tween = { t0: now(), from: Object.assign({}, V), to, dur: dur || 560, stag: stag == null ? 38 : stag };
  }
  function runPreset(name, btn) {
    setActive(btn);
    const to = {};
    if (name === 'random') Object.assign(to, randomState()); else FIELDS.forEach((f, i) => (to[f.k] = PRESETS[name][i]));
    glide(to);
  }
  // tape row -> put that decision's inputs (and floor) back
  function restoreRow(i) {
    const r = tape[i]; if (!r) return;
    setActive(null);
    glide(Object.assign({}, r.st));
    if (r.floor != null && Math.abs(r.floor - J.S.floor) > 0.0001) J.setFloor(r.floor);
    setStat('restoring #' + hex2(r.n) + ' inputs');
    fxa($('.lab-ctl'), [{ boxShadow: '0 0 0 0 rgba(255,46,110,0)' }, { boxShadow: '0 0 0 2px rgba(255,46,110,.55), 0 0 40px rgba(255,46,110,.35)' }, { boxShadow: '0 0 0 0 rgba(255,46,110,0)' }], { duration: 700, easing: 'ease-out' });
  }
  tpEl.addEventListener('click', (e) => { const li = e.target.closest('li[data-i]'); if (li) restoreRow(+li.getAttribute('data-i')); });
  tpEl.addEventListener('keydown', (e) => { if (e.key !== 'Enter' && e.key !== ' ') return; const li = e.target.closest('li[data-i]'); if (li) { e.preventDefault(); restoreRow(+li.getAttribute('data-i')); } });
  function tweenStep() {
    if (!tween) return;
    const n = now() - tween.t0; let done = true;
    FIELDS.forEach((f, i) => {
      const p = clamp((n - i * tween.stag) / tween.dur, 0, 1);
      if (p < 1) done = false;
      setVal(f, p >= 1 ? tween.to[f.k] : snap(f, lerp(tween.from[f.k], tween.to[f.k], eio(p))));
    });
    if (done) { tween = null; commit('preset'); } else live();
  }
  function onChange() {
    touch(); setActive(null);
    if (auto) { live(); scheduleCommit(560, 'input'); } else { cancelRun(); setDirty(true); }
  }
  FIELDS.forEach((f) => {
    const r = rows[f.k];
    r.input.addEventListener('input', () => { tween = null; V[f.k] = +r.input.value; if (r.lq !== V[f.k]) { r.lq = V[f.k]; spark(r); } paintRow(r, V[f.k]); onChange(); });
    r.input.addEventListener('change', () => { if (auto) scheduleCommit(90, 'input'); });
  });
  floorR.input.addEventListener('input', () => { touch(); spark(floorR); J.setFloor(+floorR.input.value); });
  presetBtns.forEach((b) => b.addEventListener('click', () => runPreset(b.getAttribute('data-p'), b)));
  function decideNow(x, y) {
    if (tween) { FIELDS.forEach((f) => setVal(f, tween.to[f.k])); tween = null; }
    if (HAS_WA && !J.reduce && !J.hidden()) {
      const r = go.getBoundingClientRect(), rip = document.createElement('i');
      rip.className = 'lab-rip'; rip.style.left = (x == null ? r.width / 2 : x - r.left) + 'px'; rip.style.top = (y == null ? r.height / 2 : y - r.top) + 'px'; go.appendChild(rip);
      const a = rip.animate([{ transform: 'scale(.4)', opacity: 0.7 }, { transform: 'scale(14)', opacity: 0 }], { duration: 650, easing: 'ease-out' });
      a.onfinish = () => rip.remove();
    }
    touch();
    commit('decide');
  }
  go.addEventListener('click', (e) => decideNow(e.detail !== 0 ? e.clientX : null, e.detail !== 0 ? e.clientY : null));
  // keyboard: Enter = DECIDE (anywhere while the lab is on screen, unless a button / link has the focus), R = random scenario
  addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.defaultPrevented || e.repeat || e.ctrlKey || e.metaKey || e.altKey || !lv || document.getElementById('fx-boot')) return;
    const t = e.target, tag = t && t.tagName;
    if (/^(A|TEXTAREA|SELECT|SUMMARY)$/.test(tag) || (tag === 'BUTTON' && t.getAttribute('role') !== 'slider') || (t && t.closest && t.closest('dialog,[role=dialog],li[data-i]'))) return;
    e.preventDefault(); decideNow();
    go.classList.add('kp'); setTimeout(() => go.classList.remove('kp'), 160);
  });
  J.shortcut('r', () => { if (lv) { const b = $('.lab-sc-r'); runPreset('random', b); } }, 'lab: random scenario');
  autoB.addEventListener('click', () => {
    auto = !auto;
    autoB.classList.toggle('on', auto); autoB.setAttribute('aria-checked', String(auto));
    if (auto && dirty) commit('input');
  });
  killB.addEventListener('click', () => J.setKilled(!J.S.killed));
  function paintKill(on) {
    killB.classList.toggle('on', on); killB.setAttribute('aria-checked', String(on));
    setTxt(killS, on ? 'halted · every order → review' : 'armed · orders flow');
  }
  J.bus.on('floor', (v) => { paintFloor(v); schedHash(); if (!tween) { live(); scheduleCommit(420, 'floor'); } });
  J.bus.on('kill', (on) => { paintKill(on); fx.restyle(); if (!tween) { live(); scheduleCommit(90, 'kill'); } });

  // magnetic decide button (mouse only; the rect is cached on enter)
  let mr = null;
  magw.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') mr = go.getBoundingClientRect(); });
  magw.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (!mr) mr = go.getBoundingClientRect();
    const dx = e.clientX - (mr.left + mr.width / 2), dy = e.clientY - (mr.top + mr.height / 2);
    go.style.setProperty('--tx', clamp(dx * 0.2, -9, 9).toFixed(1) + 'px'); go.style.setProperty('--ty', clamp(dy * 0.3, -6, 6).toFixed(1) + 'px');
    go.style.setProperty('--mx', (e.clientX - mr.left).toFixed(0) + 'px'); go.style.setProperty('--my', (e.clientY - mr.top).toFixed(0) + 'px');
  });
  magw.addEventListener('pointerleave', () => { mr = null; go.style.setProperty('--tx', '0px'); go.style.setProperty('--ty', '0px'); });

  // draggable floor marker on the gate track (+ keyboard)
  let drag = null;
  const floorFromX = (x) => {
    const v = clamp(Math.round(((x - drag.left) / drag.width) * 100) / 100, FLOOR.min, FLOOR.max);
    if (v !== J.S.floor) J.setFloor(v);
  };
  const dragStart = (e) => { drag = gt.getBoundingClientRect(); fl.classList.add('drag'); try { fl.setPointerCapture(e.pointerId); } catch (_) { /* noop */ } };
  fl.addEventListener('pointerdown', (e) => { if (e.button) return; e.preventDefault(); dragStart(e); });
  gt.addEventListener('pointerdown', (e) => { if (e.target.closest('#lab-fl') || e.pointerType === 'touch' || e.button) return; dragStart(e); floorFromX(e.clientX); });
  fl.addEventListener('pointermove', (e) => { if (drag) floorFromX(e.clientX); });
  const dragEnd = (e) => {
    if (!drag) return;
    drag = null; fl.classList.remove('drag');
    try { fl.releasePointerCapture(e.pointerId); } catch (_) { /* noop */ }
    scheduleCommit(90, 'floor');
  };
  fl.addEventListener('pointerup', dragEnd); fl.addEventListener('pointercancel', dragEnd);
  fl.addEventListener('keydown', (e) => {
    const big = e.shiftKey ? 0.05 : 0.01; let v = J.S.floor;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') v -= big; else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v += big;
    else if (e.key === 'PageDown') v -= 0.05; else if (e.key === 'PageUp') v += 0.05; else if (e.key === 'Home') v = FLOOR.min; else if (e.key === 'End') v = FLOOR.max; else return;
    e.preventDefault(); J.setFloor(clamp(Math.round(v * 100) / 100, FLOOR.min, FLOOR.max));
  });

  /* ------------------------------------------------------------------ slider craft : bubble · shift-nudge · reset ------------------------------------------------------------------ */
  function poke(r, ms) {
    r.row.classList.add('drag'); clearTimeout(r.hold);
    r.hold = setTimeout(() => r.row.classList.remove('drag'), ms);
  }
  function wireRow(r, reset) {
    const inp = r.input, f = r.f;
    inp.addEventListener('pointerdown', () => { clearTimeout(r.hold); r.row.classList.add('drag'); });
    const rel = () => poke(r, 520);
    inp.addEventListener('pointerup', rel); inp.addEventListener('pointercancel', rel);
    inp.addEventListener('keydown', (e) => {
      const dir = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
      if (!dir) return;
      if (e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) { // shift = x10
        e.preventDefault();
        const v = clamp(snap(f, +inp.value + dir * f.step * 10), f.min, f.max);
        inp.value = v; inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true }));
      }
      poke(r, 900);
    });
    r.rng.addEventListener('dblclick', (e) => { e.preventDefault(); reset(); poke(r, 700); });
  }
  FIELDS.forEach((f) => wireRow(rows[f.k], () => {
    if (Math.abs(V[f.k] - f.v) < f.step / 2) return;
    setActive(null);
    glide(Object.assign({}, V, { [f.k]: f.v }), 380, 0);
    setStat('reset ' + f.chip + ' · ' + fmtV(f, f.v));
  }));
  wireRow(floorR, () => { touch(); J.setFloor(J.RULES.floor); setStat('reset floor · ' + J.RULES.floor.toFixed(2)); });

  /* ------------------------------------------------------------------ shareable state : location.hash ------------------------------------------------------------------ */
  let touched = false;
  function touch() { touched = true; }
  const HK = FIELDS.map((f) => f.chip);
  function hashStr() {
    const q = [];
    const src = tween ? tween.to : V;
    FIELDS.forEach((f) => { if (Math.abs(src[f.k] - f.v) > f.step / 2) q.push(f.chip + '=' + +src[f.k].toFixed(3)); });
    const fv = J.S.floor != null ? J.S.floor : J.RULES.floor;
    if (Math.abs(fv - J.RULES.floor) > 0.004) q.push('floor=' + fv.toFixed(2));
    return '#lab' + (q.length ? '?' + q.join('&') : '');
  }
  function schedHash() {
    if (!touched) return;
    clearTimeout(hashT);
    hashT = setTimeout(() => { try { const h = hashStr(); if (location.hash !== h) history.replaceState(null, '', h); } catch (e) { /* sandboxed */ } }, 450);
  }
  function readHash() {
    let h = ''; try { h = location.hash; } catch (e) { return false; }
    if (h.indexOf('#lab?') !== 0) return false;
    let any = false;
    h.slice(5).split('&').forEach((kv) => {
      const i = kv.indexOf('='), k = kv.slice(0, i), v = parseFloat(kv.slice(i + 1));
      if (!isFinite(v)) return;
      const fi = HK.indexOf(k);
      if (fi >= 0) { const f = FIELDS[fi]; setVal(f, snap(f, clamp(v, f.min, f.max))); any = true; }
      else if (k === 'floor') { J.setFloor(clamp(Math.round(v * 100) / 100, FLOOR.min, FLOOR.max)); any = true; }
    });
    return any;
  }

  /* ------------------------------------------------------------------ copy link / copy handoff json ------------------------------------------------------------------ */
  function copyText(txt) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt).catch(() => legacyCopy(txt));
    return legacyCopy(txt);
  }
  function legacyCopy(txt) {
    return new Promise((res, rej) => {
      const ta = document.createElement('textarea');
      ta.value = txt; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove(); ok ? res() : rej(new Error('copy'));
    });
  }
  function handoffJson() {
    const d = cur; if (!d) return '{}';
    return JSON.stringify({ action: d.action, size: d.action === 'hold' ? null : d.size, venue: d.venue, conf: +d.conf.toFixed(2), risk_ok: d.riskOk, floor: +d.floor.toFixed(2), reason: d.reason, dest: d.dest, simulated: true }, null, 2);
  }
  function wireCopy(btn, make, msg) {
    const lab = $('span:last-child', btn), orig = lab.textContent;
    btn.addEventListener('click', () => {
      copyText(make()).then(() => {
        btn.classList.add('ok'); lab.textContent = 'copied';
        if (J.toast) J.toast(msg, 'ok');
        clearTimeout(btn._t); btn._t = setTimeout(() => { btn.classList.remove('ok'); lab.textContent = orig; }, 1500);
      }).catch(() => { if (J.toast) J.toast('copy blocked by the browser', 'info'); });
    });
  }
  wireCopy($('#lab-cp-link'), () => { const base0 = location.href.split('#')[0]; return base0 + hashStr(); }, 'scenario link copied · simulated inputs');
  wireCopy($('#lab-cp-json'), handoffJson, 'handoff json copied · simulated');

  /* ------------------------------------------------------------------ init ------------------------------------------------------------------ */
  stg.forEach((s) => { const sc = document.createElement('i'); sc.className = 'lab-scan'; sc.setAttribute('aria-hidden', 'true'); s.appendChild(sc); });
  paintFloor(J.S.floor != null ? J.S.floor : J.RULES.floor);
  paintKill(!!J.S.killed);
  restored = readHash();
  // earlier lab decisions, so the tape and the queue are alive before the first touch
  ['trend', 'wide book', 'mean-revert'].forEach((name) => {
    const st = {}; FIELDS.forEach((f, i) => (st[f.k] = PRESETS[name][i]));
    const d = decideState(st);
    d.n = ++seq; d.file = hex2(d.n) + rhex(6) + '.json';
    files[d.dest].unshift(d.file); fcount[d.dest]++; pushTape(d); lastC = d;
  });
  ['execute', 'review', 'skip'].forEach((k) => renderFolder(k, false));
  renderTape(false);
  cur = decideState(stateNow());
  rAll(cur, false);
  setStat(restored ? 'shared scenario loaded' : 'ready');
  if (restored) setTimeout(() => {
    const y = root.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hud-h')) || 64) + 8;
    scrollTo({ top: Math.max(0, y), behavior: J.reduce ? 'auto' : 'smooth' });
    if (J.toast) J.toast('shared scenario loaded \u00b7 simulated', 'info');
  }, 900);
  // keep sliders' danger flags + readouts correct if the floor/kill state was changed before init
  new IntersectionObserver((es) => { lv = es[0].isIntersecting; }, { rootMargin: '80px 0px' }).observe(root);
  new IntersectionObserver((es) => {
    pv = es[0].isIntersecting;
    if (!pv) return;
    if (!committed) commit('view');
    else if (pending) { pending = false; commit('replay'); }
  }, { threshold: 0.1 }).observe(pipe);
  J.task(ctl, tweenStep);
  J.task(pipe, (t, dt) => { fx.frame(t, dt); tickNums(); });
  J.watch(pipe, () => fx.resize());
  // desktop: the controls column is sticky; if it is taller than the viewport, pin it by its bottom edge so STATE + hard rules + tape stay reachable
  const left = $('.lab-left');
  if (left) { const stick = () => { const h = left.offsetHeight; left.style.top = (h ? Math.min(76, innerHeight - h - 16) : 76) + 'px'; }; J.watch(left, stick); addEventListener('resize', stick, { passive: true }); }
});
