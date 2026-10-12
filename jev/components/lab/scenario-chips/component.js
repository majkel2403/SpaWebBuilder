/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Markup: <button class="lab-sc" type="button" aria-pressed="false" data-p="trend"><svg class="lab-sc-i">..</svg><span>trend</span></button> inside <div class="lab-presets" role="group">.
 * Emits: JEV.bus 'lab-preset' {name, state} (state = edge_bps, imbalance, spread_bps, vol_1h, position_pct, daily_pnl, drawdown_pct, latency_ms, signal_age_s).
 * Runs JEV.decide(state) on the pick and prints action / size / conf / destination. Key R = random scenario.
 */
JEV.mod('lab-scenario-chips', () => {
  'use strict';
  const J = JEV, C = J.C, clamp = J.clamp, lerp = J.lerp;
  const HAS_WA = typeof Element.prototype.animate === 'function';
  const anim = (el, kf, o) => { if (!el || !HAS_WA || J.reduce) return null; try { return el.animate(kf, o); } catch (e) { return null; } };
  const fxa = (el, kf, o) => (J.hidden() ? null : anim(el, kf, o));
  const setTxt = (el, t) => { if (el && el.textContent !== t) el.textContent = t; };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const tierN = () => J.tier || 2;
  const lastD = () => { let d = J.recent && J.recent[0]; if (!d) { try { d = J.makeDecision(); } catch (e) { d = null; } } return d; };
  const root = J.$('#lab-scx'); if (!root) return;
  const K = ['edge_bps', 'imbalance', 'spread_bps', 'vol_1h', 'position_pct', 'daily_pnl', 'drawdown_pct', 'latency_ms', 'signal_age_s'];
  const LIM = { edge_bps: [-40, 40], imbalance: [-1, 1], spread_bps: [0.2, 20], vol_1h: [10, 200], position_pct: [-4, 4], daily_pnl: [-2500, 1500], drawdown_pct: [0, 14], latency_ms: [5, 600], signal_age_s: [0, 120] };
  // order = K: edge, imbalance, spread, vol, position, pnl, drawdown, latency, age
  const PRESETS = {
    trend: [22, 0.34, 1.4, 58, 0, 420, 1.4, 38, 6],
    'mean-revert': [-7, 0.12, 2.2, 30, 0, 120, 1, 44, 9],
    'wide book': [22, 0.3, 12.5, 84, 0, 200, 2.1, 140, 8],
    'stale feed': [16, 0.2, 2.2, 52, 0, 150, 1.8, 360, 52],
    reversal: [-12, -0.2, 1.6, 62, 2.4, 380, 2, 40, 6],
    stress: [-6, -0.3, 6.5, 168, 3.2, -1900, 10.2, 190, 12],
  };
  const btns = Array.from(root.querySelectorAll('.lab-sc'));
  const out = root.querySelector('#lab-scx-out'), stEl = root.querySelector('#lab-scx-st');
  const AC = { buy: '#2ee6a6', sell: '#ff7a88', hold: '#d6d0df', close: '#ff9d5c', flatten: '#c39bff' };
  const DC = { execute: '#2ee6a6', review: '#ffc13d', skip: '#b8b2c2' };
  function randomState() {
    let s = null;
    try { s = window.JEVEngine.sampleState(() => J.market.price).state; } catch (e) { s = null; }
    const o = {};
    K.forEach((k) => { let v = s ? s[k] : NaN; if (v == null || isNaN(v)) v = lerp(LIM[k][0], LIM[k][1], Math.random()); o[k] = +clamp(v, LIM[k][0], LIM[k][1]).toFixed(2); });
    return o;
  }
  function run(name, btn) {
    btns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    const st = {};
    if (name === 'random') Object.assign(st, randomState()); else K.forEach((k, i) => (st[k] = PRESETS[name][i]));
    let d = null; try { d = J.decide(st); } catch (e) { d = null; }
    if (d) {
      out.innerHTML = '<b>' + esc(name) + '</b> &rarr; <u style="text-decoration:none;font-weight:800;color:' + AC[d.action] + '">' + d.action + '</u>' + (d.action === 'hold' ? '' : ' ' + d.size + '%') + ' &middot; conf ' + d.conf.toFixed(2) + ' &rarr; <u style="text-decoration:none;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:' + DC[d.dest] + '">' + d.dest + '</u>';
    } else out.innerHTML = '<b>' + esc(name) + '</b>';
    stEl.textContent = 'edge ' + J.sgn(st.edge_bps, 1) + ' \u00b7 imb ' + J.sgn(st.imbalance, 2) + ' \u00b7 spread ' + st.spread_bps.toFixed(1) + ' \u00b7 vol ' + Math.round(st.vol_1h) + '% \u00b7 lat ' + Math.round(st.latency_ms) + 'ms \u00b7 age ' + Math.round(st.signal_age_s) + 's';
    if (btn) fxa(btn, [{ transform: 'scale(1)' }, { transform: 'scale(1.08)', offset: 0.3 }, { transform: 'scale(1)' }], { duration: 360, easing: 'cubic-bezier(.2,1.5,.3,1)' });
    J.bus.emit('lab-preset', { name: name, state: st });
  }
  btns.forEach((b) => b.addEventListener('click', () => run(b.getAttribute('data-p'), b)));
  if (J.shortcut) J.shortcut('r', () => run('random', root.querySelector('.lab-sc-r')), 'scenario chips: random');
  run('trend', btns[0]);
});
