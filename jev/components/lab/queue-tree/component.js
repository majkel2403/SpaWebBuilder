/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod J.$ J.$$ J.C J.bus J.recent J.reduce J.hidden J.tier (optional J.makeDecision).
 * Data: bus 'decision' -> d.action, d.size, d.venue, d.conf, d.riskOk, d.reason, d.dest ('execute'|'review'|'skip').
 *   Each decision becomes a typed handoff.json (types itself out) and lands as a file in queue/<dest>/ (two newest per folder, counters per folder).
 */
JEV.mod('lab-queue-tree', () => {
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
  const DC = { execute: 'green', review: 'yellow', skip: 'gray' };
  const DHEX = { execute: C.green, review: C.amber, skip: '#b8b2c2' };
  const fmtSize = (s) => s + '%';
  const jsEl = $('#lab-js'), sbEl = $('#lab-s4-b');
  const files = { execute: [], review: [], skip: [] }, fcount = { execute: 0, review: 0, skip: 0 };
  const treeEl = $('#lab-tree'), folders = {};
  treeEl.innerHTML = '<div class="lab-tr-h">queue/</div>';
  ['execute', 'review', 'skip'].forEach((k) => {
    const fo = document.createElement('div');
    fo.className = 'lab-fo'; fo.setAttribute('data-c', DC[k]); fo.setAttribute('data-d', k);
    fo.innerHTML = '<div class="lab-fo-h"><b>' + k + '/</b><em>0</em></div><div class="lab-fi-l"></div>';
    treeEl.appendChild(fo);
    folders[k] = { el: fo, em: $('em', fo), list: $('.lab-fi-l', fo) };
  });
  const flyDelay = () => 0;
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
  function showJson(d, pop) {
    const rowsJ = [['action', jS(d.action)], ['size', jN(d.size)], ['venue', jS(d.venue)], ['conf', jN(d.conf.toFixed(2))], ['risk_ok', jB(d.riskOk)], ['reason', jS(d.reason)], ['dest', jS(d.dest)]];
    let h = '<span class="lab-jl p" style="--i:0">{</span>';
    rowsJ.forEach((r, i) => { h += '<span class="lab-jl" style="--i:' + (i + 1) + '">  <u class="k">"' + r[0] + '"</u><span class="p">:</span> ' + r[1] + (i < rowsJ.length - 1 ? '<span class="p">,</span>' : '') + '</span>'; });
    h += '<span class="lab-jl p" style="--i:8">}</span>';
    jsEl.className = 'lab-js' + (pop ? ' type' : '');
    jsEl.innerHTML = h;
  }
  function pulse(k) {
    const f = folders[k]; if (!f) return;
    fxa(f.em, [{ transform: 'scale(1)' }, { transform: 'scale(1.7)', offset: 0.25 }, { transform: 'scale(.92)', offset: 0.6 }, { transform: 'scale(1)' }], { duration: 560, easing: 'ease-out' });
    fxa(f.el, [{ boxShadow: '-6px 0 0 -2px rgba(255,255,255,0)' }, { boxShadow: '-10px 0 22px -8px var(--cc)', offset: 0.3 }, { boxShadow: '-6px 0 0 -2px rgba(255,255,255,0)' }], { duration: 700, easing: 'ease-out' });
  }
  let seq = 0;
  const norm = (d) => { const n = ++seq; return { action: d.action, size: d.size, venue: d.venue || (d.state && d.state.venue) || 'binance', conf: d.conf, riskOk: d.riskOk !== false, reason: d.reason, dest: d.dest, n, file: hex2(n) + rhex(6) + '.json' }; };
  function take(d, pop) {
    const x = norm(d);
    showJson(x, pop); landFile(x, pop); if (pop) pulse(x.dest);
    setTxt(sbEl, '#' + hex2(x.n));
    return x;
  }
  J.bus.on('decision', (d) => take(d, true));
  let seed = (J.recent || []).slice(0, 6).reverse();
  if (!seed.length) { try { for (let i = 0; i < 4; i++) seed.push(J.makeDecision()); } catch (e) { seed = []; } }
  let lastX = null;
  seed.forEach((d) => { const x = norm(d); landFile(x, false); lastX = x; });
  ['execute', 'review', 'skip'].forEach((k) => renderFolder(k, false));
  if (lastX) { showJson(lastX, false); setTxt(sbEl, '#' + hex2(lastX.n)); }
});
