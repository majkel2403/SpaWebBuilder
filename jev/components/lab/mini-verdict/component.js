/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Consumes: bus 'decision' -> d.action, d.size, d.conf, d.dest. Markup: <div class="lab-mini" data-d="execute|review|skip"><b class="lab-mi-a">buy</b><span class="lab-mi-s">1%</span><span class="lab-mi-c">0.93</span><i class="lab-mi-d">execute</i></div>.
 * data-d sets the accent (--cc / --cc-rgb). Only #lab-mini is bound to the stream, the two other rows are static variants.
 */
JEV.mod('lab-mini-verdict', () => {
  'use strict';
  const J = JEV, C = J.C, clamp = J.clamp, lerp = J.lerp;
  const HAS_WA = typeof Element.prototype.animate === 'function';
  const anim = (el, kf, o) => { if (!el || !HAS_WA || J.reduce) return null; try { return el.animate(kf, o); } catch (e) { return null; } };
  const fxa = (el, kf, o) => (J.hidden() ? null : anim(el, kf, o));
  const setTxt = (el, t) => { if (el && el.textContent !== t) el.textContent = t; };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const tierN = () => J.tier || 2;
  const lastD = () => { let d = J.recent && J.recent[0]; if (!d) { try { d = J.makeDecision(); } catch (e) { d = null; } } return d; };
  const root = J.$('#lab-mv'); if (!root) return;
  const mini = root.querySelector('#lab-mini'), a = root.querySelector('#lab-mi-a'), s = root.querySelector('#lab-mi-s'), c = root.querySelector('#lab-mi-c'), dd = root.querySelector('#lab-mi-d');
  function show(d, pop) {
    mini.setAttribute('data-d', d.dest);
    setTxt(a, d.action); setTxt(s, d.action === 'hold' ? '-' : d.size + '%'); setTxt(c, d.conf.toFixed(2)); setTxt(dd, d.dest);
    if (pop) fxa(mini, [{ transform: 'scale(1)' }, { transform: 'scale(1.025)', offset: 0.3 }, { transform: 'scale(1)' }], { duration: 320, easing: 'ease-out' });
  }
  J.bus.on('decision', (d) => show(d, true));
  const d0 = lastD(); if (d0) show(d0, false);
});
