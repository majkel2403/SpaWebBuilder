/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod J.$ J.$$ J.C J.S J.RULES J.bus J.clamp J.lerp J.fmt J.task J.tier J.reduce J.hidden J.ACTIONS J.SIZES J.recent (optional J.makeDecision).
 * Data: bus 'decision' -> d.action, d.p{buy,sell,hold,close,flatten}, d.conf, d.size, d.sizes[4], d.sizeIdx, d.pRisk, d.riskOk, d.ms, d.killed,
 *   d.state{spread_bps, latency_ms, signal_age_s, daily_pnl, drawdown_pct, vol_1h} (feeds the seven risk-check chips); bus 'kill' (bool) refreshes the kill chip.
 */
JEV.mod('lab-typed-questions', () => {
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
  const ACOL = { buy: '46,230,166', sell: '255,77,94', hold: '184,178,194', close: '255,138,61', flatten: '166,107,255' };
  const fmtP = (p) => (p >= 0.995 ? '>99%' : p < 0.005 ? '<1%' : Math.round(p * 100) + '%');
  const fmtSize = (s) => s + '%';
  const sec = $('#lab-s2');
  const ring = $('#lab-ring'), confEl = $('#lab-conf'), pickEl = $('#lab-pick'), pickS = $('#lab-pick-s'), qb = $('#lab-qb');
  const gva = $('#lab-gva'), gnd = $('#lab-gnd'), yn = $('#lab-yn'), yp = $('#lab-yp'), msEl = $('#lab-ms');
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
  let last = null, onT = 0;
  function show(d, pop) {
    last = d; d.st = d.st || d.state || {};
    rQuestions(d, pop);
    if (pop && !J.reduce) { sec.classList.add('on'); clearTimeout(onT); onT = setTimeout(() => sec.classList.remove('on'), 1000); }
  }
  J.bus.on('decision', (d) => show(d, true));
  J.bus.on('kill', (on) => { if (last) { last.killed = !!on; show(last, false); } });
  const sc = document.createElement('i'); sc.className = 'lab-scan'; sc.setAttribute('aria-hidden', 'true'); sec.appendChild(sc);
  let d0 = J.recent && J.recent[0];
  if (!d0) { try { d0 = J.makeDecision(); } catch (e) { d0 = null; } }
  if (d0) show(d0, false);
  J.task(sec, () => tickNums());
});
