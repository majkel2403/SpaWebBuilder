/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Consumes: bus 'decision' -> d.action, d.p{buy,sell,hold,close,flatten}, d.conf. Bars: <li data-a="buy"><span>buy</span><i class="lab-bar"><u></u></i><em>62%</em></li> (u is scaled with transform).
 * Ring: set --lab-v (0..1) and --rc ("r,g,b") on .lab-ring.
 */
JEV.mod('lab-action-bars', () => {
  'use strict';
  const J = JEV, C = J.C, clamp = J.clamp, lerp = J.lerp;
  const HAS_WA = typeof Element.prototype.animate === 'function';
  const anim = (el, kf, o) => { if (!el || !HAS_WA || J.reduce) return null; try { return el.animate(kf, o); } catch (e) { return null; } };
  const fxa = (el, kf, o) => (J.hidden() ? null : anim(el, kf, o));
  const setTxt = (el, t) => { if (el && el.textContent !== t) el.textContent = t; };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const tierN = () => J.tier || 2;
  const lastD = () => { let d = J.recent && J.recent[0]; if (!d) { try { d = J.makeDecision(); } catch (e) { d = null; } } return d; };
  const root = J.$('#lab-ab'); if (!root) return;
  const sec = root.querySelector('.lab-s2'), ring = root.querySelector('#lab-ring'), confEl = root.querySelector('#lab-conf'), pickEl = root.querySelector('#lab-pick');
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
  const host = root.querySelector('#lab-pb'), rows = {};
  J.ACTIONS.forEach((a, i) => {
    const li = document.createElement('li'); li.setAttribute('data-a', a);
    li.innerHTML = '<span>' + a + '</span><i class="lab-bar"><u style="--d:' + (i * 0.06).toFixed(2) + 's"></u></i><em>0%</em>';
    host.appendChild(li); rows[a] = { li, u: li.querySelector('u'), em: li.querySelector('em') };
  });
  function show(d, pop) {
    J.ACTIONS.forEach((a) => {
      const r = rows[a], p = d.p[a];
      r.u.style.transform = 'scaleX(' + Math.max(0.015, p).toFixed(3) + ')'; setTxt(r.em, fmtP(p)); r.li.classList.toggle('win', a === d.action);
    });
    ring.style.setProperty('--lab-v', d.conf.toFixed(3)); ring.style.setProperty('--rc', ACOL[d.action]);
    numTo(confEl, d.conf, pop);
    setTxt(pickEl, d.action); pickEl.parentNode.setAttribute('data-a', d.action);
    flash(sec, pop);
  }
  scanline(sec);
  J.bus.on('decision', (d) => show(d, true));
  const d0 = lastD(); if (d0) show(d0, false);
  J.task(sec, tickNums);
});
