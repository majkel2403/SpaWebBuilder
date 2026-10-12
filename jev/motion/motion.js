/* JEV motion engine (vanilla, ~3 KB). API: JEVM.apply(config) · JEVM.play(root) · JEVM.out(root) · JEVM.replay(root) · JEVM.split(el) · JEVM.count(el, to, opts)
 * · JEVM.spring(stiffness, damping) -> CSS linear() string · JEVM.speed(x)
 * config: { root:{enter,exit,dur,delay,ease,dist}, items:[{sel, enter, stagger:true|ms, dur, delay, ease, dist, split, count}], loops:[{sel, loop, dur}], ui:true }
 * Reuse: copy motion.css + motion.js next to your page, add data-m="rise" (enter) and/or data-m-loop="breathe" (ambient) to any element. */
(function (root) {
  'use strict';
  var doc = document, html = doc.documentElement, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  html.classList.add('m-js');
  var ENTER = ['fade', 'rise', 'drop', 'slide-l', 'slide-r', 'scale', 'zoom', 'pop', 'blur', 'flip', 'tilt', 'wipe-x', 'wipe-y', 'iris', 'glow', 'spring'];
  var LOOPS = ['breathe', 'float', 'pulse', 'glow', 'shimmer', 'sweep', 'flicker', 'sway', 'orbit', 'ring'];
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var targets = [];
  function setVar(el, k, v) { if (v != null) el.style.setProperty(k, typeof v === 'number' ? v + 'ms' : v); }

  function mark(el, o, idx) {
    el.setAttribute('data-m', o.enter || 'rise');
    if (o.exit) el.setAttribute('data-m-exit', o.exit);
    setVar(el, '--m-dur', o.dur); setVar(el, '--m-delay', o.delay); if (o.ease) el.style.setProperty('--m-ease', o.ease); if (o.dist != null) el.style.setProperty('--m-dist', o.dist + 'px');
    el.style.setProperty('--m-i', idx || 0); targets.push(el);
  }
  function stagger(els, ms) { if (typeof ms === 'number') els.forEach(function (e) { e.style.setProperty('--m-stagger', ms + 'ms'); }); }

  function apply(cfg) {
    cfg = cfg || {};
    var stage = $$('.cmp-stage')[0] || doc.body;
    if (cfg.root) mark(stage, cfg.root, 0);
    (cfg.items || []).forEach(function (it) {
      var els = $$(it.sel, stage); if (!els.length && it.sel[0] !== '.') els = $$(it.sel);
      els.forEach(function (e, i) { mark(e, it, it.stagger ? i : 0); if (it.split) split(e); if (it.count != null) e.setAttribute('data-m-count', it.count); });
      if (typeof it.stagger === 'number') stagger(els, it.stagger);
    });
    (cfg.loops || []).forEach(function (l) { $$(l.sel, stage).forEach(function (e, i) { e.setAttribute('data-m-loop', l.loop); if (l.dur) e.style.setProperty('--m-loop-dur', l.dur + 'ms'); e.style.setProperty('--m-i', i); }); });
    if (cfg.ui !== false) bar(cfg);
    start();
  }
  function trigger(el) { el.classList.remove('m-out', 'm-done'); void el.offsetWidth; el.classList.add('m-in'); var d = parseFloat(getComputedStyle(el).transitionDuration) * 1000 + 1400 + (parseFloat(el.style.getPropertyValue('--m-i')) || 0) * 120; clearTimeout(el._md); el._md = setTimeout(function () { el.classList.add('m-done'); }, d); var c = el.getAttribute('data-m-count'); if (c != null) count(el, +c); }
  function start() { if (reduce) { targets.forEach(function (e) { e.classList.add('m-in', 'm-done'); }); return; } requestAnimationFrame(function () { requestAnimationFrame(function () { targets.forEach(trigger); }); }); }
  function play(r) { (r ? $$('[data-m]', r).concat(r.hasAttribute && r.hasAttribute('data-m') ? [r] : []) : targets).forEach(trigger); }
  function out(r) { (r ? $$('[data-m]', r) : targets).forEach(function (e) { e.classList.remove('m-in', 'm-done'); e.classList.add('m-out'); }); }
  function replay(r) { var els = r ? $$('[data-m]', r) : targets; els.forEach(function (e) { e.classList.remove('m-in', 'm-done', 'm-out'); e.querySelectorAll && void e.offsetWidth; }); setTimeout(function () { els.forEach(trigger); }, 60); }

  function split(el) { if (el._split) return; el._split = 1; el.setAttribute('data-m-split', ''); el.classList.add('m-split'); var txt = el.textContent; el.setAttribute('aria-label', txt); el.textContent = ''; var i = 0;
    txt.split(/(\s+)/).forEach(function (w) { if (/^\s+$/.test(w)) { el.appendChild(doc.createTextNode(w)); return; } var s = doc.createElement('span'); s.style.display = 'inline-block'; s.setAttribute('aria-hidden', 'true'); w.split('').forEach(function (c) { var ch = doc.createElement('span'); ch.className = 'm-ch'; ch.textContent = c; ch.style.setProperty('--m-i', i++); s.appendChild(ch); }); el.appendChild(s); });
    if (!el.hasAttribute('data-m')) { el.setAttribute('data-m', 'fade'); targets.push(el); } }
  function count(el, to, o) { o = o || {}; var from = o.from || 0, dur = reduce ? 1 : (o.dur || 1400), t0 = performance.now(), fmt = o.fmt || function (v) { return Math.round(v).toLocaleString('en-US'); }; (function f(now) { var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4); el.textContent = fmt(from + (to - from) * e); if (p < 1) requestAnimationFrame(f); })(t0); }
  /* spring -> CSS linear() easing */
  function spring(k, c) { k = k || 170; c = c || 14; var pts = [], x = 0, v = 0, dt = 1 / 120, n = 0; for (var t = 0; t < 1.6 && n < 400; t += dt, n++) { var a = -k * (x - 1) - c * v; v += a * dt; x += v * dt; pts.push(x); } var step = Math.max(1, Math.floor(pts.length / 36)), out = []; for (var i = 0; i < pts.length; i += step) out.push(+pts[i].toFixed(3)); out.push(1); return 'linear(' + [0].concat(out).join(',') + ')'; }
  function speed(x) { html.style.setProperty('--m-speed', x); }

  function bar(cfg) { if (doc.querySelector('.m-bar')) return; var b = doc.createElement('div'); b.className = 'm-bar'; b.innerHTML = '<b>motion</b><button data-a="replay" type="button">&#9654; replay</button><button data-a="out" type="button">exit</button><button data-a="speed" type="button" aria-pressed="false">0.5x</button><button data-a="loops" type="button" aria-pressed="true">loops</button>'; doc.body.appendChild(b);
    b.addEventListener('click', function (e) { var a = e.target.getAttribute && e.target.getAttribute('data-a'); if (!a) return; if (a === 'replay') replay(); else if (a === 'out') out(); else if (a === 'speed') { var on = e.target.getAttribute('aria-pressed') !== 'true'; e.target.setAttribute('aria-pressed', on); speed(on ? .5 : 1); } else if (a === 'loops') { var on2 = e.target.getAttribute('aria-pressed') !== 'true'; e.target.setAttribute('aria-pressed', on2); html.classList.toggle('m-paused', !on2); } }); }
  document.addEventListener('visibilitychange', function () { html.classList.toggle('m-paused', document.hidden); });
  root.JEVM = { apply: apply, play: play, out: out, replay: replay, split: split, count: count, spring: spring, speed: speed, ENTER: ENTER, LOOPS: LOOPS };
})(window);
