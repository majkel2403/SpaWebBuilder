/* desk/ticket-in-flight — the right column of the world card: the ticket in flight (side, symbol, notional, edge, size / price / conf, six-step rail, countdown, kill-switch stamp) and six agent rows that take turns working it
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* API relied on: $ $$ C TAU clamp lerp rnd ri gauss rng rgba fmt usd sgn · bus (on 'tick' 'decision' 'kill' 'tier', emit 'agentstep') · fit watch task animate · market recent S RULES AGENTS · makeDecision · tier reduce time.
 * Data: JEV.market {price, open, hist[]} (oracle + venue prices), decision records {id symbol venue action size conf net dest riskOk state{spread_bps regime price}}.
 */
JEV.mod('desk-ticket-in-flight', () => {
  'use strict';
  const J = JEV, C = J.C, TAU = J.TAU, clamp = J.clamp, lerp = J.lerp, D2R = Math.PI / 180;
  const root = J.$('#dkw-world');
  if (!root) return;
  const txt = (el, v) => { if (el && el.textContent !== v) el.textContent = v; };
  const fmt = J.fmt, rnd = J.rnd;
  let killed = !!J.S.killed;

  /* ---------------- data ---------------- */
  const CITIES = [
    { c: 'NYC', lat: 40.7, lon: -74.0 }, { c: 'LON', lat: 51.5, lon: -0.1 }, { c: 'FRA', lat: 50.1, lon: 8.7 }, { c: 'DXB', lat: 25.2, lon: 55.3 },
    { c: 'SGP', lat: 1.35, lon: 103.8 }, { c: 'TYO', lat: 35.7, lon: 139.7 }, { c: 'SYD', lat: -33.9, lon: 151.2 }, { c: 'SFO', lat: 37.8, lon: -122.4 },
  ];
  const CIDX = {}; CITIES.forEach((c, i) => (CIDX[c.c] = i));
  const FEEDS = [
    { k: 'coinbase', city: 'SFO', bias: 0.3, lat0: 24 }, { k: 'kraken', city: 'NYC', bias: -0.2, lat0: 31 }, { k: 'binance', city: 'SGP', bias: 0.1, lat0: 18 },
    { k: 'okx', city: 'SYD', bias: -0.1, lat0: 42 }, { k: 'bybit', city: 'DXB', bias: 0.2, lat0: 36 }, { k: 'bitstamp', city: 'LON', bias: -0.4, lat0: 58 },
    { k: 'upbit', city: 'TYO', bias: 0.8, lat0: 71 }, { k: 'deribit', city: 'FRA', bias: 0, lat0: 27 },
  ];
  const AG = J.AGENTS, AGK = AG.map((a) => a.key);
  const AGI = {}; AGK.forEach((k, i) => (AGI[k] = i));
  const VERB = ['SCAN', 'RESEARCH', 'PRICE', 'SIZE', 'FILL', 'CLOSE'];
  const CAP = 527000; // simulated desk capital used to turn "% of capital" into a notional

  /* ---------------- simulated venue prices (data only, no DOM): each venue = oracle + standing bias + mean-reverting noise ---------------- */
  const FD = FEEDS.map((f, i) => ({ k: f.k, i, city: CIDX[f.city], bias: f.bias, lat0: f.lat0, off: 0, lat: f.lat0, price: 0, prev: 0, up: true }));
  function updateFeeds(price) {
    for (const f of FD) {
      f.off = f.off * 0.82 + J.gauss() * 0.32; f.prev = f.price || price; f.price = price * (1 + (f.bias + f.off) * 1e-4);
      f.up = f.price >= f.prev; f.lat = clamp(f.lat + J.gauss() * 2.2 + (f.lat0 - f.lat) * 0.08, 6, 140);
    }
  }
  function bestFeed(sell) { let b = FD[0]; for (let i = 1; i < FD.length; i++) if (sell ? FD[i].price > b.price : FD[i].price < b.price) b = FD[i]; return b; }

  /* ---------------- ticket in flight + the six agents (state machine; every surface is optional) ---------------- */
  const hexRgb = (h) => { const n = parseInt(h.slice(1), 16); return (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255); };
  const T = {
    id: J.$('#dkw-tid'), tk: J.$('#dkw-tk'), side: J.$('#dkw-side'), sym: J.$('#dkw-sym'), dest: J.$('#dkw-dest'), not: J.$('#dkw-not'), edge: J.$('#dkw-edge'), sz: J.$('#dkw-sz'), px: J.$('#dkw-px'), cf: J.$('#dkw-cf'),
    rail: J.$('#dkw-rail'), tl: J.$('.dkw-tl', root), sds: J.$$('.dkw-sd', root), now: J.$('.dkw-now', root), nowO: J.$('#dkw-now-o'), nowN: J.$('#dkw-now-n'), nowV: J.$('#dkw-now-v'), nowX: J.$('#dkw-now-x'),
    cd: J.$('#dkw-cd'), cdf: J.$('#dkw-cdf'), stn: J.$('#dkw-stn'), stv: J.$('#dkw-stv'), loop: J.$('#dkw-loop'),
  };
  const TAB = {}, ROW = {};
  J.$$('.dkw-tab', root).forEach((el) => (TAB[el.dataset.k] = { el, ts: J.$('.dkw-ts', el) }));
  J.$$('.dkw-ar', root).forEach((el) => (ROW[el.dataset.k] = { el, v: J.$('.dkw-av', el), bar: J.$('.dkw-ab i', el), an: J.$('.dkw-an i', el), role: J.$('.dkw-an i', el).textContent }));
  const ST = { step: -1, loop: 14, tk: null, ttl: 104, t0: 0, dur: 1000, pnl: 0, pin: null, working: -1, status: AGK.map(() => 'idle'), alt: 0 };
  const LAST = {}, SIDE = { buy: 'buy', sell: 'sell', close: 'close', flatten: 'flat' };
  const ORBC = { spotter: 'green', prior: 'amber', edge: 'pink', kelly: 'violet', taker: 'blue', closer: 'orange' };
  const activeKey = () => ST.pin || (ST.working >= 0 ? AGK[ST.working] : null);
  const flash = (el) => { const a = el.classList.contains('ha'); el.classList.remove(a ? 'ha' : 'hb'); el.classList.add(a ? 'hb' : 'ha'); };
  let inView = true, dirty = false, nowKey = '', railN = -1, cpLast = '';
  const live = () => inView && !document.hidden; // presentation is skipped off screen / in a hidden tab; resync() repaints from state on return
  const PA = AGK.map(() => ({ on: null, pin: null }));

  function paintStatus(i) {
    const k = AGK[i], s = ST.status[i], tb = TAB[k], rw = ROW[k];
    if (tb) { if (tb.el.dataset.st !== s) tb.el.dataset.st = s; txt(tb.ts, s); }
    if (rw && rw.el.dataset.st !== s) rw.el.dataset.st = s;
  }
  function setStatus(i, s) { if (ST.status[i] === s) return; ST.status[i] = s; if (live()) paintStatus(i); else dirty = true; }
  function paintNow() {
    if (!T.now) return;
    const key = activeKey() || AGK[0], i = AGI[key], ev = LAST[key];
    const cn = 'orb ' + ORBC[key]; if (T.nowO.className !== cn) T.nowO.className = cn;
    if (nowKey !== key) { nowKey = key; T.now.style.setProperty('--ac-rgb', hexRgb(AG[i].col)); }
    txt(T.nowN, key); txt(T.nowV, ST.status[i] === 'halted' ? 'halted · read-only' : ev ? VERB[i].toLowerCase() : 'idle'); txt(T.nowX, ev ? ev.chip : '—');
  }
  function applyOn() {
    const on = activeKey();
    for (let i = 0; i < AGK.length; i++) {
      const k = AGK[i], isOn = k === on, pinned = ST.pin === k, p = PA[i], tb = TAB[k], rw = ROW[k];
      if (p.on !== isOn) { p.on = isOn; if (tb) tb.el.classList.toggle('is-on', isOn); if (rw) rw.el.classList.toggle('is-on', isOn); }
      if (p.pin !== pinned) { p.pin = pinned; const v = String(pinned); if (tb) { tb.el.classList.toggle('is-pin', pinned); tb.el.setAttribute('aria-pressed', v); } if (rw) rw.el.setAttribute('aria-pressed', v); }
    }
    paintNow();
  }
  function togglePin(k) { ST.pin = ST.pin === k ? null : k; applyOn(); }
  function synth() { for (let i = 0; i < 60; i++) { const d = J.makeDecision(); if (d.dest === 'execute') return d; } return null; }
  function paintTicket(d) {
    if (!T.tk) return;
    const s = d.state, sol = d.symbol === 'SOL-PERP', notional = (CAP * d.size) / 100, sd = SIDE[d.action] || d.action, trade = d.action === 'buy' || d.action === 'sell', net = Math.abs(d.net || 0);
    txt(T.id, '#' + String(d.id).slice(0, 4)); txt(T.sym, d.symbol.toLowerCase()); txt(T.side, sd); if (T.side.dataset.s !== sd) T.side.dataset.s = sd; txt(T.dest, d.dest);
    txt(T.not, fmt(Math.round(notional))); txt(T.edge, trade ? '+' + net.toFixed(1) + 'bp edge' : 'reduce risk'); if (T.edge.className) T.edge.className = '';
    txt(T.sz, d.size + '%'); txt(T.px, fmt(s.price, sol ? 2 : 1)); txt(T.cf, d.conf.toFixed(2));
  }
  function renderTicket(d) {
    const notional = (CAP * d.size) / 100, net = Math.abs(d.net || 0);
    ST.ttl = J.ri(88, 132);
    const win = Math.random() < 0.58, mag = notional * (net * 1e-4 * rnd(0.5, 1.4) + 0.00006 + Math.random() * 0.00018);
    ST.pnl = win ? mag : -mag * rnd(0.5, 1.1);
    ST.alt ^= 1;
    if (live()) { paintTicket(d); if (T.tk) { T.tk.className = 'dkw-tk ' + (ST.alt ? 'fa' : 'fb'); if ((J.tier || 2) >= 2) J.animate(T.not, [{ transform: 'translateY(55%)', opacity: 0.1 }, { transform: 'none', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' }); } } else dirty = true;
  }
  function adopt() {
    let d = null;
    if (!J.S.killed) { for (let i = 0; i < J.recent.length; i++) if (J.recent[i].dest === 'execute') { d = J.recent[i]; break; } if (!d) d = synth(); }
    if (!d) d = ST.tk;
    if (!d) { for (let i = 0; i < J.recent.length; i++) if (J.recent[i].dest === 'execute') { d = J.recent[i]; break; } }
    if (!d) return false;
    ST.tk = d; renderTicket(d); return true;
  }
  function tickCd() {
    if (!T.cd || killed || ST.step < 0) return;
    const frac = clamp((performance.now() - ST.t0) / ST.dur, 0, 1), prog = Math.min(1, (ST.step + frac) / 6), left = Math.max(0, Math.round(ST.ttl * (1 - prog)));
    txt(T.cd, Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0')); const cp = (1 - prog).toFixed(3); if (cp !== cpLast) { cpLast = cp; T.cdf.style.setProperty('--cp', cp); }
  }
  /** what each agent says about the current ticket (simulated, terse, lowercase) */
  function describe(i, kd) {
    const d = ST.tk;
    if (!d) return { text: 'warming up the books', chip: '—' };
    const s = d.state, sym = d.symbol.toLowerCase(), sd = SIDE[d.action] || d.action, sell = d.action === 'sell', f = bestFeed(sell);
    switch (i) {
      case 0: return { text: kd ? 'scan only · kill switch holds every order' : 'scanned 8 books · best ' + (sell ? 'bid ' : 'ask ') + f.k + ' ' + fmt(f.price, 1), chip: CITIES[f.city].c, city: f.city };
      case 1: { const p = clamp(0.5 + ((d.p[d.action] || d.conf) - 0.5) * 0.42 + J.gauss() * 0.015, 0.52, 0.9); return { text: kd ? 'prior refreshed · nothing sent' : 'prior ' + d.action + ' p ' + p.toFixed(2) + ' · ' + fmt(J.ri(420, 1840)) + ' similar books', chip: p.toFixed(2).replace('0.', '.') }; }
      case 2: { const n = Math.abs(d.net || 0); return { text: kd ? 'edge priced · routed to human review' : 'edge +' + n.toFixed(1) + 'bps net of costs · ' + s.regime, chip: '+' + n.toFixed(1) }; }
      case 3: return { text: 'size ' + d.size + '% of capital · cap ' + J.RULES.maxPos + '% · risk_ok ' + (d.riskOk ? 'yes' : 'no'), chip: d.size + '%' };
      case 4: { const slip = 0.15 + s.spread_bps * 0.25 + Math.random() * 0.2; return { text: 'crossed ' + s.spread_bps.toFixed(1) + 'bps spread · ' + sd + ' ' + d.size + '% ' + sym + ' on ' + f.k, chip: slip.toFixed(1) + 'bp', city: f.city }; }
      default: { const p = ST.pnl; return { text: 'closed ' + sym + ' at ' + (p >= 0 ? 'target' : 'stop') + ' · ' + (p >= 0 ? '+' : '') + J.usd(p, 2), chip: (p >= 0 ? '+' : '-') + '$' + Math.abs(Math.round(p)), pnl: p, city: f.city }; }
    }
  }
  const bars = (k) => [TAB[k] && TAB[k].el, ROW[k] && ROW[k].bar].filter(Boolean);
  function unbar(k) { bars(k).forEach((e) => { e.style.removeProperty('--v'); e.style.removeProperty('--d'); }); }
  function runBar(k, ms) { const d = Math.round(ms) + 'ms'; bars(k).forEach((e) => { e.style.setProperty('--d', d); e.style.setProperty('--v', '1'); }); }
  function paintRow(k) { const ev = LAST[k], r = ROW[k]; if (!ev || !r) return; txt(r.v, ev.chip); txt(r.an, ev.text); if (r.an.title !== ev.text) r.an.title = ev.text; }
  /** the eyes of this agent's tab / row widen when its step lands */
  function eyes(k) {
    [TAB[k] && TAB[k].el, ROW[k] && ROW[k].el].forEach((e) => { if (e) J.$$('.e', e).forEach((x) => J.animate(x, [{ scale: '1 1' }, { scale: '1.35 1.55', offset: 0.22 }, { scale: '1 1' }], { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)' })); });
  }
  function paintStep(i, all) {
    if (T.rail && (railN !== i || all)) {
      T.rail.style.setProperty('--q', i); T.rail.style.setProperty('--mc', AG[i].col);
      for (let j = 0; j < T.sds.length; j++) if (all || (j <= i) !== (j <= railN)) T.sds[j].classList.toggle('on', j <= i);
      if (!all && i > railN && railN >= 0) J.animate(T.tl, [{ scale: '2.6 1', opacity: 1 }, { scale: '1 1', opacity: 0.75 }], { duration: 750, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
    railN = i;
    txt(T.stn, '0' + (i + 1)); txt(T.stv, VERB[i].toLowerCase()); txt(T.loop, String(ST.loop));
  }
  function paintEdge() { if (T.edge && ST.step === 5 && !J.S.killed) { const p = ST.pnl, v = (p >= 0 ? 'closed +' : 'closed -') + '$' + Math.abs(p).toFixed(2); txt(T.edge, v); const c = p >= 0 ? 'up' : 'dn'; if (T.edge.className !== c) T.edge.className = c; } }
  function resync() {
    dirty = false; const i = ST.step; if (i < 0) return;
    const left = Math.max(0, ST.dur - (performance.now() - ST.t0));
    for (let j = 0; j < 6; j++) { const k = AGK[j]; paintStatus(j); paintRow(k); if (ST.status[j] === 'working') runBar(k, left); else unbar(k); }
    if (ST.tk) paintTicket(ST.tk);
    paintStep(i, true); paintEdge(); applyOn(); tickCd();
  }
  let timer = 0;
  function runStep() {
    timer = 0;
    if (document.hidden) return;
    const kd = J.S.killed, pv = ST.working, show = live();
    if (show && dirty) resync();
    let i = (ST.step + 1) % 6;
    if (kd && i > 2) i = 0;
    if (i === 0) {
      ST.loop++; adopt();
      for (let j = 0; j < 6; j++) { if (show) unbar(AGK[j]); setStatus(j, kd && j > 2 ? 'halted' : 'idle'); }
    } else if (pv >= 0 && pv !== i) { if (show) unbar(AGK[pv]); setStatus(pv, 'done'); }
    const key = AGK[i], dur = (kd ? 1350 : rnd(700, 1500)) * (J.reduce ? 1.8 : 1), ev = describe(i, kd);
    ev.pnl = i === 5 && !kd ? ST.pnl : null;
    ST.step = i; ST.working = i; ST.t0 = performance.now(); ST.dur = dur; LAST[key] = ev;
    setStatus(i, 'working');
    if (show) {
      runBar(key, dur); paintRow(key); paintStep(i); paintEdge();
      if (TAB[key]) flash(TAB[key].el); if (ROW[key]) flash(ROW[key].el); eyes(key);
      applyOn(); tickCd();
    } else dirty = true;
    J.bus.emit('agentstep', { agent: key, verb: VERB[i], text: ev.text, pnl: ev.pnl == null ? null : +ev.pnl.toFixed(2) });
    timer = setTimeout(runStep, dur);
  }
  Object.keys(TAB).forEach((k) => TAB[k].el.addEventListener('click', () => togglePin(k)));
  Object.keys(ROW).forEach((k) => ROW[k].el.addEventListener('click', () => togglePin(k)));
  J.bus.on('tick', (m) => updateFeeds(m.price));
  J.bus.on('kill', (v) => {
    killed = !!v;
    if (killed) { for (let j = 3; j < 6; j++) setStatus(j, 'halted'); }
    else for (let j = 3; j < 6; j++) if (ST.status[j] === 'halted') setStatus(j, 'idle');
    if (live()) paintNow(); else dirty = true;
  });
  new IntersectionObserver((es) => { const was = live(); inView = es[es.length - 1].isIntersecting; if (!was && live() && dirty) resync(); }, { rootMargin: '120px' }).observe(root);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { clearTimeout(timer); timer = 0; return; }
    if (!timer) timer = setTimeout(runStep, 400);
    if (live() && dirty) resync();
  });
  J.task(root, () => { if (live()) tickCd(); }); // (countdown text; the task is gated by the visibility of the component)
  for (let i = 0; i < 12; i++) updateFeeds(J.market.price);
  adopt();
  if (killed) for (let j = 3; j < 6; j++) setStatus(j, 'halted');
  applyOn();
  timer = setTimeout(runStep, 900);
});
