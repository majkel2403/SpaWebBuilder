/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Markup: <div class="lab-row" data-c="pink" data-label="edge_bps" data-min="-40" data-max="40" data-step="0.5" data-value="9" data-dec="1" data-sign data-bi data-mark="0"></div>
 *   (data-dz="8,20" = red risk band, data-usd, data-unit="ms", data-follow="net" = glide to the latest decision's net edge). data-c = pink|green|blue|yellow|violet|orange|cyan|red|gray.
 * Emits: JEV.bus 'lab-slider' {key, value}. Consumes: bus 'decision' (d.net) for rows with data-follow.
 */
JEV.mod('lab-range-slider', () => {
  'use strict';
  const J = JEV, C = J.C, clamp = J.clamp, lerp = J.lerp;
  const HAS_WA = typeof Element.prototype.animate === 'function';
  const anim = (el, kf, o) => { if (!el || !HAS_WA || J.reduce) return null; try { return el.animate(kf, o); } catch (e) { return null; } };
  const fxa = (el, kf, o) => (J.hidden() ? null : anim(el, kf, o));
  const setTxt = (el, t) => { if (el && el.textContent !== t) el.textContent = t; };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const tierN = () => J.tier || 2;
  const lastD = () => { let d = J.recent && J.recent[0]; if (!d) { try { d = J.makeDecision(); } catch (e) { d = null; } } return d; };
  const root = J.$('#lab-rs'); if (!root) return;
  const log = root.querySelector('#lab-rs-log');

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

  const rows = Array.from(root.querySelectorAll('.lab-row')).map((el, i) => buildRow(el, 'rs' + i));
  rows.forEach((r) => {
    paintRow(r, r.f.v);
    wire(r, (x) => {
      J.bus.emit('lab-slider', { key: x.f.k, value: x.v });
      log.innerHTML = '<b>' + esc(x.f.k) + '</b> = ' + esc(fmtV(x.f, x.v)) + (x.row.classList.contains('bad') ? ' &middot; <u style="color:#ff7a88;text-decoration:none">inside the risk band</u>' : '');
    });
  });
  const follow = rows.filter((r) => r.f.follow === 'net');
  const feed = (d) => { follow.forEach((r) => { if (performance.now() > r.until && d && isFinite(d.net)) r.goal = clamp(snap(r.f, d.net), r.f.min, r.f.max); }); };
  J.bus.on('decision', feed);
  feed(lastD());
  J.task(root, () => {
    follow.forEach((r) => {
      if (performance.now() < r.until || Math.abs(r.goal - r.v) < r.f.step / 3) return;
      setVal(r, snap(r.f, lerp(r.v, r.goal, 0.14)));
    });
  });
});
