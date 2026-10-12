/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Consumes: bus 'decision' -> d.action, d.size (0.5|1|2|4), d.sizes[4] (probabilities), d.sizeIdx. A hold greys the card ("no order").
 * Column: <div class="lab-szc [on]"><em>34%</em><i class="lab-col"><u style="transform:scaleY(.34)"></u></i><span>1%</span></div>
 */
JEV.mod('lab-size-columns', () => {
  'use strict';
  const J = JEV, C = J.C, clamp = J.clamp, lerp = J.lerp;
  const HAS_WA = typeof Element.prototype.animate === 'function';
  const anim = (el, kf, o) => { if (!el || !HAS_WA || J.reduce) return null; try { return el.animate(kf, o); } catch (e) { return null; } };
  const fxa = (el, kf, o) => (J.hidden() ? null : anim(el, kf, o));
  const setTxt = (el, t) => { if (el && el.textContent !== t) el.textContent = t; };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const tierN = () => J.tier || 2;
  const lastD = () => { let d = J.recent && J.recent[0]; if (!d) { try { d = J.makeDecision(); } catch (e) { d = null; } } return d; };
  const root = J.$('#lab-sz-w'); if (!root) return;
  const sec = root.querySelector('.lab-s2'), qb = root.querySelector('#lab-qb'), pickS = root.querySelector('#lab-pick-s');
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
  const host = root.querySelector('#lab-sz'), cols = [];
  J.SIZES.forEach((s, i) => {
    const el = document.createElement('div'); el.className = 'lab-szc';
    el.innerHTML = '<em>0%</em><i class="lab-col"><u style="--d:' + (i * 0.07).toFixed(2) + 's"></u></i><span>' + s + '%</span>';
    host.appendChild(el); cols.push({ el, u: el.querySelector('u'), em: el.querySelector('em') });
  });
  function show(d, pop) {
    J.SIZES.forEach((s, i) => {
      const c = cols[i];
      c.u.style.transform = 'scaleY(' + Math.max(0.03, d.sizes[i]).toFixed(3) + ')'; setTxt(c.em, fmtP(d.sizes[i])); c.el.classList.toggle('on', i === d.sizeIdx);
    });
    qb.classList.toggle('na', d.action === 'hold');
    pickS.innerHTML = d.action === 'hold' ? '&rarr; <b>no order</b> &middot; hold' : '&rarr; <b>' + d.size + '%</b> of capital';
    flash(sec, pop);
  }
  scanline(sec);
  J.bus.on('decision', (d) => show(d, true));
  const d0 = lastD(); if (d0) show(d0, false);
});
