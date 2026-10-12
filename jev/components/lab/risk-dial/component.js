/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Consumes: bus 'decision' -> d.pRisk (0..1), d.riskOk, d.state{spread_bps, latency_ms, signal_age_s, daily_pnl, drawdown_pct, vol_1h}; bus 'kill' (bool) refreshes the kill chip.
 * Gauge: stroke-dashoffset = 100 * (1 - pRisk) on .lab-gva, needle rotate((pRisk - .5) * 180deg) on .lab-gnd. Chips: <li class="[bad]"><span>spread</span><u>1.8</u></li>.
 */
JEV.mod('lab-risk-dial', () => {
  'use strict';
  const J = JEV, C = J.C, clamp = J.clamp, lerp = J.lerp;
  const HAS_WA = typeof Element.prototype.animate === 'function';
  const anim = (el, kf, o) => { if (!el || !HAS_WA || J.reduce) return null; try { return el.animate(kf, o); } catch (e) { return null; } };
  const fxa = (el, kf, o) => (J.hidden() ? null : anim(el, kf, o));
  const setTxt = (el, t) => { if (el && el.textContent !== t) el.textContent = t; };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const tierN = () => J.tier || 2;
  const lastD = () => { let d = J.recent && J.recent[0]; if (!d) { try { d = J.makeDecision(); } catch (e) { d = null; } } return d; };
  const root = J.$('#lab-rd'); if (!root) return;
  const sec = root.querySelector('.lab-s2'), gva = root.querySelector('#lab-gva'), gnd = root.querySelector('#lab-gnd'), yn = root.querySelector('#lab-yn'), yp = root.querySelector('#lab-yp');
  const ACOL = { buy: '46,230,166', sell: '255,77,94', hold: '184,178,194', close: '255,138,61', flatten: '166,107,255' };
  const fmtP = (p) => (p >= 0.995 ? '>99%' : p < 0.005 ? '<1%' : Math.round(p * 100) + '%');
  const ease3 = (p) => 1 - Math.pow(1 - p, 3);
  const nums = [];
  function numTo(el, to, animate) {
    for (let i = nums.length - 1; i >= 0; i--) if (nums[i].el === el) nums.splice(i, 1);
    const from = parseFloat(el.textContent) || 0;
    if (!animate || Math.abs(from - to) < 0.004) { setTxt(el, to.toFixed(2)); return; }
    nums.push({ el, from, to, t0: performance.now(), dur: 650 });
  }
  function tickNums() {
    if (!nums.length) return;
    const n = performance.now();
    for (let i = nums.length - 1; i >= 0; i--) { const k = nums[i], p = clamp((n - k.t0) / k.dur, 0, 1); setTxt(k.el, lerp(k.from, k.to, ease3(p)).toFixed(2)); if (p >= 1) nums.splice(i, 1); }
  }
  /* the 1 s "on" flash of the card: scan line + ring sweep + winner streak */
  let onT = 0;
  function flash(sec, pop) { if (pop && !J.reduce) { sec.classList.add('on'); clearTimeout(onT); onT = setTimeout(() => sec.classList.remove('on'), 1000); } }
  function scanline(sec) { const sc = document.createElement('i'); sc.className = 'lab-scan'; sc.setAttribute('aria-hidden', 'true'); sec.appendChild(sc); }
  const stateOf = (d) => d.st || d.state || {};
  function riskChecks(s, killed) {
    const lossUse = clamp(-(s.daily_pnl || 0) / (J.RULES.lossCap || 2000), 0, 1.5);
    return [
      { id: 'spread', bad: s.spread_bps > 8, val: (+s.spread_bps).toFixed(1) },
      { id: 'latency', bad: s.latency_ms > 300, val: Math.round(s.latency_ms) + 'ms' },
      { id: 'age', bad: s.signal_age_s > 45, val: Math.round(s.signal_age_s) + 's' },
      { id: 'loss', bad: lossUse >= 0.8, val: Math.round(lossUse * 100) + '%' },
      { id: 'dd', bad: s.drawdown_pct >= 8, val: (+s.drawdown_pct).toFixed(1) + '%' },
      { id: 'vol', bad: s.vol_1h >= 160, val: Math.round(s.vol_1h) + '%' },
      { id: 'kill', bad: !!killed, val: killed ? 'on' : 'off' },
    ];
  }
  const host = root.querySelector('#lab-ck'), ck = {};
  [['spread', 'spread'], ['latency', 'latency'], ['age', 'age'], ['loss', 'loss'], ['dd', 'drawdown'], ['vol', 'vol'], ['kill', 'kill']].forEach((c) => {
    const li = document.createElement('li'); li.innerHTML = '<span>' + c[1] + '</span><u></u>'; host.appendChild(li); ck[c[0]] = { li, u: li.querySelector('u') };
  });
  let last = null;
  function show(d, pop) {
    last = d;
    gva.style.strokeDashoffset = (100 * (1 - d.pRisk)).toFixed(1);
    gnd.style.transform = 'rotate(' + ((d.pRisk - 0.5) * 180).toFixed(1) + 'deg)';
    setTxt(yn, d.riskOk ? 'YES' : 'NO'); yn.classList.toggle('no', !d.riskOk);
    setTxt(yp, 'p ' + d.pRisk.toFixed(2));
    riskChecks(d.state || d.st || {}, J.S.killed).forEach((c) => { const r = ck[c.id]; r.li.classList.toggle('bad', c.bad); setTxt(r.u, c.val); });
    flash(sec, pop);
  }
  scanline(sec);
  J.bus.on('decision', (d) => show(d, true));
  J.bus.on('kill', () => { if (last) show(last, false); });
  const d0 = lastD(); if (d0) show(d0, false);
});
