/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod J.$ J.C J.S J.RULES J.bus J.setFloor J.clamp J.tier J.reduce J.hidden J.recent (optional J.makeDecision).
 * Data: bus 'decision' -> d.conf (0..1), d.floor, d.killed, d.riskOk, d.action, d.reason, d.dest ; bus 'floor' (number) and 'kill' (bool) re-route the last decision.
 * The floor marker is draggable / keyboard-adjustable and calls JEV.setFloor(v) (0.50 .. 0.99), so every other listener follows.
 * Gate semantics: hold -> skip; kill -> review; failed risk flag -> review (except close/flatten); conf < floor -> review; else execute.
 */
JEV.mod('lab-gate-bar', () => {
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
  const FLOOR = { min: 0.5, max: 0.99 };
  const gt = $('#lab-gt'), fl = $('#lab-fl'), flv = $('#lab-fl-v'), cf = $('#lab-cf'), cfv = $('#lab-cf-v'), tail = $('#lab-gt-tail');
  const verdict = $('#lab-verdict'), why = $('#lab-why');
  let last = null;
  function paintFloor(v) {
    v = +v; const t = v.toFixed(2);
    gt.style.setProperty('--f', v);
    setTxt(flv, t);
    fl.setAttribute('aria-valuenow', t); fl.setAttribute('aria-valuetext', 'floor ' + t);
  }
  function rGate(d, pop) {
    const pass = d.conf >= d.floor, v = d.killed ? 'halt' : pass ? 'pass' : 'below';
    if (pop) {
      const col = v === 'pass' ? '46,230,166' : v === 'halt' ? '255,77,94' : '255,193,61';
      fxa(gt, [{ boxShadow: '0 0 0 0 rgba(' + col + ',.0), inset 0 0 0 0 rgba(' + col + ',0)' }, { boxShadow: '0 0 0 3px rgba(' + col + ',.55), 0 0 34px rgba(' + col + ',.55), inset 0 0 22px rgba(' + col + ',.35)', offset: 0.28 }, { boxShadow: '0 0 0 0 rgba(' + col + ',0), inset 0 0 0 0 rgba(' + col + ',0)' }], { duration: 900, delay: 0, easing: 'ease-out' });
      fxa($('.lab-cf-o', cf), [{ transform: 'scale(1)' }, { transform: 'scale(1.7)', offset: 0.22 }, { transform: 'scale(.88)', offset: 0.5 }, { transform: 'scale(1)' }], { duration: 640, delay: 0, easing: 'ease-out' });
      fxa(verdict, [{ transform: 'scale(1)' }, { transform: 'scale(1.22)', offset: 0.3 }, { transform: 'scale(1)' }], { duration: 520, delay: 0, easing: 'cubic-bezier(.2,1.6,.4,1)' });
      if (v === 'below' && tierN() >= 2) {
        fxa(gt, [{ transform: 'translateX(0)', filter: 'none' }, { transform: 'translateX(-5px)', filter: 'drop-shadow(4px 0 0 rgba(255,77,94,.85)) drop-shadow(-4px 0 0 rgba(0,229,255,.7))', offset: 0.14 }, { transform: 'translateX(6px)', offset: 0.3 }, { transform: 'translateX(-3px)', filter: 'drop-shadow(-3px 0 0 rgba(255,77,94,.8)) drop-shadow(3px 0 0 rgba(0,229,255,.6))', offset: 0.5 }, { transform: 'translateX(2px)', offset: 0.75 }, { transform: 'none', filter: 'none' }], { duration: 520, delay: 0, easing: 'steps(9, jump-none)' });
        fxa(verdict, [{ clipPath: 'inset(0 0 0 0)', transform: 'translateX(0)' }, { clipPath: 'inset(8% 0 58% 0)', transform: 'translateX(-7px)', offset: 0.16 }, { clipPath: 'inset(56% 0 6% 0)', transform: 'translateX(6px)', offset: 0.34 }, { clipPath: 'inset(0 0 0 0)', transform: 'translateX(-3px)', offset: 0.55 }, { clipPath: 'inset(30% 0 30% 0)', transform: 'translateX(4px)', offset: 0.7 }, { clipPath: 'inset(0 0 0 0)', transform: 'none' }], { duration: 480, delay: 0, easing: 'steps(8, jump-none)' });
      } else if (v === 'below') fxa(gt, [{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { duration: 300, delay: 0, easing: 'ease-out' });
      if (v === 'halt') fxa(gt, [{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(2px)' }, { transform: 'none' }], { duration: 420, delay: 0, easing: 'ease-out' });
    }
    cf.style.left = (d.conf * 100).toFixed(2) + '%'; cf.setAttribute('data-v', v);
    setTxt(cfv, d.conf.toFixed(2));
    tail.style.transform = 'scaleX(' + d.conf.toFixed(3) + ')';
    setTxt(verdict, v === 'halt' ? 'KILL SWITCH' : pass ? 'PASS' : 'BELOW FLOOR'); verdict.setAttribute('data-v', v);
    why.innerHTML = 'reason <b>' + esc(d.reason) + '</b> &rarr; <u style="color:' + DHEX[d.dest] + '">' + d.dest + '</u>';
  }
  /* re-route a decision against the current floor / kill switch (same rules as the engine) */
  function reroute(d) {
    const S = J.S, r = Object.assign({}, d, { floor: S.floor, killed: !!S.killed });
    if (r.action === 'hold') { r.dest = 'skip'; r.reason = 'hold'; }
    else if (r.killed) { r.dest = 'review'; r.reason = 'kill switch'; }
    else if (r.riskOk === false && r.action !== 'close' && r.action !== 'flatten') { r.dest = 'review'; r.reason = 'risk flag'; }
    else if (r.conf < r.floor) { r.dest = 'review'; r.reason = 'conf ' + r.conf.toFixed(2) + ' < ' + r.floor.toFixed(2); }
    else { r.dest = 'execute'; r.reason = 'ok'; }
    return r;
  }
  function show(d, pop) { last = d; rGate(reroute(d), pop); }
  J.bus.on('decision', (d) => show(d, true));
  J.bus.on('floor', (v) => { paintFloor(v); if (last) show(last, false); });
  J.bus.on('kill', () => { if (last) show(last, true); });
  const scheduleCommit = () => {};
  // draggable floor marker on the gate track (+ keyboard)
  let drag = null;
  const floorFromX = (x) => {
    const v = clamp(Math.round(((x - drag.left) / drag.width) * 100) / 100, FLOOR.min, FLOOR.max);
    if (v !== J.S.floor) J.setFloor(v);
  };
  const dragStart = (e) => { drag = gt.getBoundingClientRect(); fl.classList.add('drag'); try { fl.setPointerCapture(e.pointerId); } catch (_) { /* noop */ } };
  fl.addEventListener('pointerdown', (e) => { if (e.button) return; e.preventDefault(); dragStart(e); });
  gt.addEventListener('pointerdown', (e) => { if (e.target.closest('#lab-fl') || e.pointerType === 'touch' || e.button) return; dragStart(e); floorFromX(e.clientX); });
  fl.addEventListener('pointermove', (e) => { if (drag) floorFromX(e.clientX); });
  const dragEnd = (e) => {
    if (!drag) return;
    drag = null; fl.classList.remove('drag');
    try { fl.releasePointerCapture(e.pointerId); } catch (_) { /* noop */ }
    scheduleCommit(90, 'floor');
  };
  fl.addEventListener('pointerup', dragEnd); fl.addEventListener('pointercancel', dragEnd);
  fl.addEventListener('keydown', (e) => {
    const big = e.shiftKey ? 0.05 : 0.01; let v = J.S.floor;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') v -= big; else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v += big;
    else if (e.key === 'PageDown') v -= 0.05; else if (e.key === 'PageUp') v += 0.05; else if (e.key === 'Home') v = FLOOR.min; else if (e.key === 'End') v = FLOOR.max; else return;
    e.preventDefault(); J.setFloor(clamp(Math.round(v * 100) / 100, FLOOR.min, FLOOR.max));
  });
  paintFloor(J.S.floor != null ? J.S.floor : J.RULES.floor);
  let d0 = J.recent && J.recent[0];
  if (!d0) { try { d0 = J.makeDecision(); } catch (e) { d0 = null; } }
  if (d0) show(d0, false);
});
