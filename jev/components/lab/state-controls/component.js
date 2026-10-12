/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod J.$ J.$$ J.C J.S J.RULES J.bus J.decide J.setFloor J.setKilled J.clamp J.lerp J.fmt J.sgn J.tier J.reduce J.hidden J.task J.shortcut;
 *   window.JEVEngine.sampleState (random scenario); optional J.toast.
 * Emits:  JEV.bus.emit('lab-state', { state, floor, killed, why, decision })  - why: 'scrub' (while dragging) | 'decide' | 'preset' | 'input' | 'floor' | 'kill'
 *   state = { edge_bps, imbalance, spread_bps, vol_1h, position_pct, daily_pnl, drawdown_pct, latency_ms, signal_age_s }
 *   decision = { action, size, conf, dest, reason } (a preview from J.decide, so the readout is meaningful on its own).
 * Two-way: 'floor' and 'kill' on the bus (J.setFloor / J.setKilled); body.killed is toggled by core.
 */
JEV.mod('lab-state-controls', () => {
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
  const ctl = $('#lab-ctl'), go = $('#lab-go'), magw = $('#lab-magw'), autoB = $('#lab-auto'), killB = $('#lab-kill'), killS = $('#lab-kill-s');
  const jsEl = $('#lab-js'), outS = $('#lab-out-s'), outBox = $('.lab-out');
  const lv = true;
  const V = {};
  FIELDS.forEach((f) => (V[f.k] = f.v));
  let cur = null, auto = true, dirty = false, seq = 0, tween = null, ct = 0, liveT = 0, livePend = 0, touched = false;
  const touch = () => { touched = true; }, cancelRun = () => {};
  const setStat = (t) => setTxt(outS, t);
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
  /* ------------------------------------------------------------------ live json readout ------------------------------------------------------------------ */
  const jS = (v) => '<span class="s">"' + esc(v) + '"</span>', jN = (v) => '<span class="n">' + v + '</span>', jB = (v) => '<span class="b">' + v + '</span>';
  const jv = (v) => (typeof v === 'number' ? jN(v) : typeof v === 'boolean' ? jB(v) : jS(v));
  const kv = (k, v, last, ind) => '<span class="lab-jl">' + ind + '<u class="k">"' + k + '"</u><span class="p">:</span> ' + v + (last ? '' : '<span class="p">,</span>') + '</span>';
  function paintOut(d, pop) {
    const s = d.st;
    let h = '<span class="lab-jl p">{</span><span class="lab-jl">  <u class="k">"state"</u><span class="p">: {</span></span>';
    FIELDS.forEach((f, i) => { h += kv(f.k, jv(+(+s[f.k]).toFixed(f.usd ? 0 : f.dec == null ? 2 : f.dec)), i === FIELDS.length - 1, '    '); });
    h += '<span class="lab-jl p">  },</span>';
    h += kv('floor', jv(+J.S.floor.toFixed(2)), false, '  ') + kv('kill', jv(!!J.S.killed), false, '  ');
    h += '<span class="lab-jl">  <u class="k">"decision"</u><span class="p">: {</span></span>' + kv('action', jS(d.action), false, '    ') + kv('conf', jN(d.conf.toFixed(2)), false, '    ') + kv('dest', jS(d.dest), true, '    ') + '<span class="lab-jl p">  }</span>';
    h += '<span class="lab-jl p">}</span>';
    jsEl.innerHTML = h;
    if (pop) { outBox.classList.add('pulse'); clearTimeout(outBox._t); outBox._t = setTimeout(() => outBox.classList.remove('pulse'), 700); }
  }
  function emit(why, d) {
    try { J.bus.emit('lab-state', { state: stateNow(), floor: J.S.floor, killed: !!J.S.killed, why, decision: { action: d.action, size: d.size, conf: +d.conf.toFixed(3), dest: d.dest, reason: d.reason } }); } catch (e) { /* subscribers never break the controls */ }
  }
  function paintFloor(v) { v = +v; if (+floorR.input.value !== v) floorR.input.value = v; paintRow(floorR, v); }
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
  /* live scrub (throttled) vs committed decision */
  function live() {
    const t = now();
    if (t - liveT < 55) { if (!livePend) livePend = setTimeout(() => { livePend = 0; live(); }, 60); return; }
    liveT = t;
    cur = decideState(stateNow());
    paintOut(cur, false); paintBad(cur); emit('scrub', cur);
    if (!dirty) setStat('scrubbing …');
  }
  function commit(why) {
    clearTimeout(ct); clearTimeout(livePend); livePend = 0;
    const d = decideState(stateNow()); cur = d; d.n = ++seq;
    setDirty(false); go.classList.remove('dirty');
    paintOut(d, true); paintBad(d); emit(why === 'decide' ? 'decide' : why, d);
    setStat('emitted #' + hex2(d.n) + ' · ' + why);
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
  J.bus.on('floor', (v) => { paintFloor(v); if (!tween) { live(); scheduleCommit(420, 'floor'); } });
  J.bus.on('kill', (on) => { paintKill(on); if (!tween) { live(); scheduleCommit(90, 'kill'); } });
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
  /* ------------------------------------------------------------------ init ------------------------------------------------------------------ */
  paintFloor(J.S.floor != null ? J.S.floor : J.RULES.floor);
  paintKill(!!J.S.killed);
  cur = decideState(stateNow());
  paintOut(cur, false); paintBad(cur);
  setStat('bus · lab-state');
  J.task(ctl, tweenStep);
});
