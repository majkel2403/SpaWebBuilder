/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Consumes: bus 'decision' -> d.state{edge_bps, imbalance, spread_bps, vol_1h, position_pct, daily_pnl, drawdown_pct, latency_ms, signal_age_s} and d.net.
 * Chip markup: <div class="lab-ft [bi] [drv]" data-c="pink"><span>edge</span><b>+9.0</b><i class="lab-cb"><u style="--v:.4"></u></i></div>; .bi = bar grows from the centre, .neg = red, .bad = risk band.
 */
JEV.mod('lab-encode-chips', () => {
  'use strict';
  const J = JEV, C = J.C, clamp = J.clamp, lerp = J.lerp;
  const HAS_WA = typeof Element.prototype.animate === 'function';
  const anim = (el, kf, o) => { if (!el || !HAS_WA || J.reduce) return null; try { return el.animate(kf, o); } catch (e) { return null; } };
  const fxa = (el, kf, o) => (J.hidden() ? null : anim(el, kf, o));
  const setTxt = (el, t) => { if (el && el.textContent !== t) el.textContent = t; };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const tierN = () => J.tier || 2;
  const lastD = () => { let d = J.recent && J.recent[0]; if (!d) { try { d = J.makeDecision(); } catch (e) { d = null; } } return d; };
  const root = J.$('#lab-ec'); if (!root) return;
  const host = root.querySelector('#lab-fts'), sec = root.querySelector('.lab-st');
  const FIELDS = [
    { k: 'edge_bps', chip: 'edge', min: -40, max: 40, cc: 'pink', dec: 1, sign: 1, bi: 1 },
    { k: 'imbalance', chip: 'imb', min: -1, max: 1, cc: 'violet', dec: 2, sign: 1, bi: 1 },
    { k: 'spread_bps', chip: 'spread', min: 0.2, max: 20, cc: 'yellow', dec: 1, dz: [8, 20] },
    { k: 'vol_1h', chip: 'vol', min: 10, max: 200, cc: 'orange', dec: 0, unit: '%', dz: [160, 200] },
    { k: 'position_pct', chip: 'pos', min: -4, max: 4, cc: 'blue', dec: 1, sign: 1, bi: 1 },
    { k: 'daily_pnl', chip: 'pnl', min: -2500, max: 1500, cc: 'green', usd: 1, bi: 1, dz: [-2500, -1600] },
    { k: 'drawdown_pct', chip: 'dd', min: 0, max: 14, cc: 'red', dec: 1, dz: [8, 14] },
    { k: 'latency_ms', chip: 'lat', min: 5, max: 600, cc: 'cyan', dec: 0, dz: [300, 600] },
    { k: 'signal_age_s', chip: 'age', min: 0, max: 120, cc: 'gray', dec: 0, dz: [45, 120] },
  ];
  const CH = FIELDS.map((f) => ({ k: f.k, n: f.chip, cc: f.cc, f: f, bi: !!f.bi })).concat([{ k: 'net', n: 'net_edge', cc: 'pink', bi: true, derived: true, f: { dec: 1, sign: 1, min: -40, max: 40 } }]);
  const fmtV = (f, v) => {
    if (f.usd) return (v < 0 ? '-$' : '+$') + J.fmt(Math.abs(Math.round(v)));
    if (Math.abs(v) < Math.pow(10, -(f.dec || 0)) / 2) v = 0;
    return (f.sign ? J.sgn(v, f.dec) : J.fmt(v, f.dec)) + (f.unit || '');
  };
  CH.forEach((c, i) => {
    const el = document.createElement('div');
    el.className = 'lab-ft' + (c.bi ? ' bi' : '') + (c.derived ? ' drv' : '');
    el.setAttribute('data-c', c.cc); el.style.setProperty('--d', (i * 0.03).toFixed(2) + 's');
    el.innerHTML = '<span>' + c.n + '</span><b>0</b><i class="lab-cb"><u></u></i>';
    host.appendChild(el);
    c.el = el; c.val = el.querySelector('b'); c.u = el.querySelector('u');
  });
  const norm = (c, v) => c.bi ? clamp(v / Math.max(Math.abs(c.f.min), Math.abs(c.f.max)), -1, 1) : clamp((v - c.f.min) / (c.f.max - c.f.min), 0, 1);
  function show(d, pop) {
    const s = d.state || d.st || {};
    CH.forEach((c, i) => {
      const v = c.derived ? d.net : s[c.k];
      if (v == null || isNaN(v)) return;
      setTxt(c.val, c.derived ? J.sgn(v, 1) : fmtV(c.f, v));
      c.u.style.setProperty('--v', norm(c, v).toFixed(3));
      c.el.classList.toggle('neg', c.bi && v < 0);
      c.el.classList.toggle('bad', !!(c.f.dz && v >= c.f.dz[0] && v <= c.f.dz[1]));
      if (pop) anim(c.el, [{ opacity: 0, transform: 'translateY(9px) scale(.78)' }, { opacity: 1, transform: 'none' }], { duration: 300, delay: i * 26, easing: 'cubic-bezier(.2,1.5,.3,1)', fill: 'backwards' });
    });
    if (pop && !J.reduce) { sec.classList.add('on'); clearTimeout(show.t); show.t = setTimeout(() => sec.classList.remove('on'), 1000); }
  }
  const sc = document.createElement('i'); sc.className = 'lab-scan'; sc.setAttribute('aria-hidden', 'true'); sec.appendChild(sc);
  J.bus.on('decision', (d) => show(d, true));
  const d0 = lastD(); if (d0) show(d0, false);
});
