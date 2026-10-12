  /* ------------------------------------------------------------------ slider rows ------------------------------------------------------------------ */
  function buildRow(f, host) {
    const id = 'lab-in-' + f.k, span = f.max - f.min;
    const row = document.createElement('div');
    row.className = 'lab-row'; row.setAttribute('data-c', f.cc); row.setAttribute('data-k', f.k);
    let dz = '';
    if (f.dz) dz = '<i class="lab-dz' + (f.dz[0] <= f.min ? ' lo' : '') + '"></i>';
    const mark = f.mark != null ? '<i class="lab-zero"></i>' : '';
    row.innerHTML = '<label for="' + id + '">' + f.label + '</label><output id="' + id + '-o" for="' + id + '"></output>' +
      '<div class="lab-rng"><i class="lab-tr"></i>' + dz + mark + '<i class="lab-trl"></i><i class="lab-fill"></i><b class="lab-bub" aria-hidden="true"></b>' +
      '<input id="' + id + '" type="range" min="' + f.min + '" max="' + f.max + '" step="' + f.step + '" value="' + f.v + '"></div>';
    host.appendChild(row);
    const rng = $('.lab-rng', row);
    if (f.dz) { rng.style.setProperty('--za', clamp((f.dz[0] - f.min) / span, 0, 1).toFixed(4)); rng.style.setProperty('--zb', clamp((f.dz[1] - f.min) / span, 0, 1).toFixed(4)); }
    if (f.mark != null) rng.style.setProperty('--zp', clamp((f.mark - f.min) / span, 0, 1).toFixed(4));
    const r = { f, row, rng, input: $('input', row), out: $('output', row), bub: $('.lab-bub', row), trl: $('.lab-trl', row), hold: 0, lp: null, tail: null, tra: null, sp: null, sk: 0, si: 0, lq: null };
    paintRow(r, f.v);
    return r;
  }
  /* glowing trail behind the thumb: a pooled element + ONE reusable WAAPI fade per row (no per-input allocation) */
  function trail(r, p) {
    const lp = r.lp; r.lp = p;
    if (lp == null || J.reduce || !HAS_WA || tierN() < 2 || J.hidden() || Math.abs(p - lp) < 0.0012) return;
    if (r.tail == null) r.tail = lp;
    r.tail = lerp(r.tail, p, 0.1);
    const lo = Math.min(r.tail, p), hi = Math.max(r.tail, p), dir = p >= r.tail ? '90deg' : '270deg';
    const st = r.trl.style;
    st.setProperty('--t0', lo.toFixed(4)); st.setProperty('--t1', hi.toFixed(4));
    if (r.td !== dir) { r.td = dir; st.setProperty('--td', dir); }
    if (!r.tra) {
      try { r.tra = r.trl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 720, easing: 'ease-out', fill: 'both' }); r.tra.onfinish = () => { r.tail = null; }; } catch (e) { r.tra = null; return; }
    } else { r.tra.currentTime = 0; r.tra.play(); }
  }
  /* tick sparks when the value snaps to a new step (3 pooled dots per row, replayed WAAPI) */
  const SPK = [[-11, -15], [1, -20], [12, -14]];
  function spark(r) {
    if (J.reduce || !HAS_WA || tierN() < 2 || J.hidden()) return;
    const t = now(); if (t - r.sk < 55) return; r.sk = t;
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
    const txt = fmtV(f, v);
    if (r.out.textContent !== txt) { r.out.textContent = txt; r.bub.textContent = txt; r.input.setAttribute('aria-valuetext', txt); }
  }
  const rows = {};
  const slHost = $('#lab-sliders');
  FIELDS.forEach((f) => (rows[f.k] = buildRow(f, slHost)));
