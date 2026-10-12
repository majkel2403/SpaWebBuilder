/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Two-way bound to the runtime: dragging the floor calls JEV.setFloor(v) (0.50 .. 0.99), the kill switch calls JEV.setKilled(bool); bus 'floor' (number) and 'kill' (bool) repaint the card
 * when anything else changes them. Consumes bus 'decision' (d.conf, d.action, d.riskOk) to show the gate verdict of the latest decision under the current floor / kill switch.
 * Caps are read from JEV.RULES.lossCap / maxPos.
 */
JEV.mod('lab-hard-rules', () => {
  'use strict';
  const J = JEV, C = J.C, clamp = J.clamp, lerp = J.lerp;
  const HAS_WA = typeof Element.prototype.animate === 'function';
  const anim = (el, kf, o) => { if (!el || !HAS_WA || J.reduce) return null; try { return el.animate(kf, o); } catch (e) { return null; } };
  const fxa = (el, kf, o) => (J.hidden() ? null : anim(el, kf, o));
  const setTxt = (el, t) => { if (el && el.textContent !== t) el.textContent = t; };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const tierN = () => J.tier || 2;
  const lastD = () => { let d = J.recent && J.recent[0]; if (!d) { try { d = J.makeDecision(); } catch (e) { d = null; } } return d; };
  const root = J.$('#lab-hr'); if (!root) return;

  const fmtV = (f, v) => {
    if (f.usd) return (v < 0 ? '-$' : '+$') + J.fmt(Math.abs(Math.round(v)));
    if (Math.abs(v) < Math.pow(10, -(f.dec || 0)) / 2) v = 0;
    return (f.sign ? J.sgn(v, f.dec) : J.fmt(v, f.dec)) + (f.unit || '');
  };
  const snap = (f, v) => +(Math.round((v - f.min) / f.step) * f.step + f.min).toFixed(4);
  const SPK = [[-11, -15], [1, -20], [12, -14]];
  /* one slider row from data-* attributes: label min max step value dec sign usd unit bi mark dz follow */
  function buildRow(el, id) {
    const D = el.dataset;
    const f = { k: D.label || id, min: +D.min, max: +D.max, step: +D.step || 1, v: +D.value, dec: +(D.dec || 0), sign: D.sign != null, usd: D.usd != null, unit: D.unit || '', bi: D.bi != null,
      mark: D.mark != null ? +D.mark : null, dz: D.dz ? D.dz.split(',').map(Number) : null, follow: D.follow || null };
    const span = f.max - f.min, inp = 'lab-in-' + id;
    el.innerHTML = '<label for="' + inp + '">' + esc(f.k) + '</label><output for="' + inp + '"></output>' +
      '<div class="lab-rng"><i class="lab-tr"></i>' + (f.dz ? '<i class="lab-dz' + (f.dz[0] <= f.min ? ' lo' : '') + '"></i>' : '') + (f.mark != null ? '<i class="lab-zero"></i>' : '') +
      '<i class="lab-trl"></i><i class="lab-fill"></i><b class="lab-bub" aria-hidden="true"></b>' +
      '<input id="' + inp + '" type="range" min="' + f.min + '" max="' + f.max + '" step="' + f.step + '" value="' + f.v + '"></div>';
    const rng = el.querySelector('.lab-rng');
    if (f.dz) { rng.style.setProperty('--za', clamp((f.dz[0] - f.min) / span, 0, 1).toFixed(4)); rng.style.setProperty('--zb', clamp((f.dz[1] - f.min) / span, 0, 1).toFixed(4)); }
    if (f.mark != null) rng.style.setProperty('--zp', clamp((f.mark - f.min) / span, 0, 1).toFixed(4));
    return { f, row: el, rng, input: el.querySelector('input'), out: el.querySelector('output'), bub: el.querySelector('.lab-bub'), trl: el.querySelector('.lab-trl'), hold: 0, lp: null, tail: null, tra: null, sp: null, sk: 0, si: 0, lq: null, v: f.v, goal: f.v, until: 0 };
  }
  /* glowing trail behind the thumb: one reusable WAAPI fade per row */
  function trail(r, p) {
    const lp = r.lp; r.lp = p;
    if (lp == null || J.reduce || !HAS_WA || tierN() < 2 || J.hidden() || Math.abs(p - lp) < 0.0012) return;
    if (r.tail == null) r.tail = lp;
    r.tail = lerp(r.tail, p, 0.1);
    const lo = Math.min(r.tail, p), hi = Math.max(r.tail, p), dir = p >= r.tail ? '90deg' : '270deg', st = r.trl.style;
    st.setProperty('--t0', lo.toFixed(4)); st.setProperty('--t1', hi.toFixed(4));
    if (r.td !== dir) { r.td = dir; st.setProperty('--td', dir); }
    if (!r.tra) {
      try { r.tra = r.trl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 720, easing: 'ease-out', fill: 'both' }); r.tra.onfinish = () => { r.tail = null; }; } catch (e) { r.tra = null; }
    } else { r.tra.currentTime = 0; r.tra.play(); }
  }
  /* tick sparks when the value snaps to a new step */
  function spark(r) {
    if (J.reduce || !HAS_WA || tierN() < 2 || J.hidden()) return;
    const t = performance.now(); if (t - r.sk < 55) return; r.sk = t;
    if (!r.sp) {
      r.sp = SPK.map((d) => {
        const el = document.createElement('i'); el.className = 'lab-spk'; el.setAttribute('aria-hidden', 'true'); r.rng.appendChild(el);
        let a = null; try { a = el.animate([{ transform: 'translate(-50%,-50%) scale(1.3)', opacity: 1 }, { transform: 'translate(calc(-50% + ' + d[0] + 'px),calc(-50% + ' + d[1] + 'px)) scale(.1)', opacity: 0 }], { duration: 460, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' }); a.cancel(); } catch (e) { a = null; }
        return a;
      });
    }
    const n = tierN() >= 3 ? 3 : 2;
    for (let i = 0; i < n; i++) { const a = r.sp[(r.si + i) % 3]; if (a) { a.currentTime = 0; a.play(); } }
    r.si = (r.si + 1) % 3;
  }
  function paintRow(r, v) {
    const f = r.f, span = f.max - f.min;
    const p = clamp((v - f.min) / span, 0, 1), z = f.mark != null ? clamp((f.mark - f.min) / span, 0, 1) : 0;
    const a = f.bi ? Math.min(p, z) : 0, b = f.bi ? Math.max(p, z) : p;
    r.rng.style.setProperty('--a', a.toFixed(4)); r.rng.style.setProperty('--b', b.toFixed(4)); r.rng.style.setProperty('--p', p.toFixed(4));
    trail(r, p);
    r.row.classList.toggle('bad', !!(f.dz && v >= f.dz[0] && v <= f.dz[1]));
    const txt = fmtV(f, v);
    if (r.out.textContent !== txt) { r.out.textContent = txt; r.bub.textContent = txt; r.input.setAttribute('aria-valuetext', txt); }
  }
  function setVal(r, v) { r.v = v; r.input.value = v; paintRow(r, v); }
  function poke(r, ms) { r.row.classList.add('drag'); clearTimeout(r.hold); r.hold = setTimeout(() => r.row.classList.remove('drag'), ms); }
  /* bubble while dragging / keyboard, shift = x10, double-click = reset to the initial value */
  function wire(r, onInput) {
    const inp = r.input, f = r.f;
    inp.addEventListener('pointerdown', () => { clearTimeout(r.hold); r.row.classList.add('drag'); });
    const rel = () => poke(r, 520);
    inp.addEventListener('pointerup', rel); inp.addEventListener('pointercancel', rel);
    inp.addEventListener('input', () => { r.v = r.goal = +inp.value; r.until = performance.now() + 4000; if (r.lq !== r.v) { r.lq = r.v; spark(r); } paintRow(r, r.v); onInput(r); });
    inp.addEventListener('keydown', (e) => {
      const dir = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
      if (!dir) return;
      if (e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        inp.value = clamp(snap(f, +inp.value + dir * f.step * 10), f.min, f.max); inp.dispatchEvent(new Event('input', { bubbles: true }));
      }
      poke(r, 900);
    });
    r.rng.addEventListener('dblclick', (e) => { e.preventDefault(); setVal(r, f.v); r.goal = f.v; r.until = 0; poke(r, 700); onInput(r); });
  }

  const el = root.querySelector('.lab-row'), r = buildRow(el, 'hr');
  const ks = root.querySelector('#lab-hr-ks'), kill = root.querySelector('.lab-kill'), why = root.querySelector('#lab-hr-why'), caps = root.querySelector('#lab-hr-caps');
  let last = null;
  const R = J.RULES || {};
  caps.innerHTML = '<span>daily loss cap <b>$' + J.fmt(R.lossCap || 2000, 0) + '</b></span><span>max position <b>' + (R.maxPos || 4) + '%</b></span>';
  function gate() {
    if (!last) return;
    const S = J.S, d = last; let dest = 'execute', reason = 'ok';
    if (d.action === 'hold') { dest = 'skip'; reason = 'hold'; }
    else if (S.killed) { dest = 'review'; reason = 'kill switch'; }
    else if (d.riskOk === false && d.action !== 'close' && d.action !== 'flatten') { dest = 'review'; reason = 'risk flag'; }
    else if (d.conf < S.floor) { dest = 'review'; reason = 'conf ' + d.conf.toFixed(2) + ' < ' + S.floor.toFixed(2); }
    const col = { execute: '#2ee6a6', review: '#ffc13d', skip: '#b8b2c2' }[dest];
    why.innerHTML = 'latest <b>' + d.action + '</b> conf ' + d.conf.toFixed(2) + ' &rarr; <u style="color:' + col + '">' + dest + '</u> &middot; ' + esc(reason);
  }
  function paintFloor(v) { v = +v; if (+r.input.value !== v) r.input.value = v; r.v = v; paintRow(r, v); gate(); }
  function paintKill(on) { kill.classList.toggle('on', on); kill.setAttribute('aria-checked', String(on)); setTxt(ks, on ? 'halted \u00b7 every order \u2192 review' : 'armed \u00b7 orders flow'); gate(); }
  wire(r, (x) => { if (x.v !== J.S.floor) J.setFloor(x.v); });
  r.rng.removeEventListener('dblclick', null);
  r.rng.addEventListener('dblclick', () => { J.setFloor(R.floor || 0.85); });
  kill.addEventListener('click', () => J.setKilled(!J.S.killed));
  J.bus.on('floor', paintFloor); J.bus.on('kill', (on) => paintKill(!!on));
  J.bus.on('decision', (d) => { last = d; gate(); });
  last = lastD();
  paintFloor(J.S.floor != null ? J.S.floor : (R.floor || 0.85)); paintKill(!!J.S.killed);
});
