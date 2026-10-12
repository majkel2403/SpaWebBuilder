  /* =====================================================================
   * 4b. handoff packets: every "Saved handoff" line sends a burst of light into its queue/ counter (additive sprites on a small canvas)
   * ===================================================================== */
  const fxc = $('#code-fx'), qEls = { execute: $('.code-q-x', win), review: $('.code-q-r', win), skip: $('.code-q-s', win) };
  const SPR = {}, SC = { execute: ['#ff9cc4', '#ff2e6e'], review: ['#ffe08a', '#ffa21a'], skip: ['#e4dff0', '#9b92a8'] };
  for (const k in SC) { // pre-rendered glow sprites (no shadowBlur in the frame loop)
    const c = doc.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'), r = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    r.addColorStop(0, '#fff'); r.addColorStop(0.1, '#fff'); r.addColorStop(0.2, SC[k][0]); r.addColorStop(0.5, SC[k][1] + 'cc'); r.addColorStop(1, SC[k][1] + '00'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); SPR[k] = c;
  }
  let fg = null, fW = 0, fH = 0, geoDirty = true;
  if (fxc) J.watch(fxc, () => { const f = J.fit(fxc); fg = f.g; fW = f.W; fH = f.H; geoDirty = true; });
  const PN = 40, pts = [];
  for (let i = 0; i < PN; i++) pts.push({ on: false, k: 'execute', t: 0, sp: 1, x0: 0, y0: 0, cx: 0, cy: 0, x1: 0, y1: 0, s: 1, hit: false });
  const ring = { execute: 0, review: 0, skip: 0, x: { execute: 0, review: 0, skip: 0 }, y: { execute: 0, review: 0, skip: 0 } };
  let alive = 0;
  const geo = { x0: 0, y0: 0 }; // landing geometry relative to the fx canvas, cached: measured on resize, never inside a decision's DOM writes
  function measure() {
    geoDirty = false;
    const cr = fxc.getBoundingClientRect(), br = zbody.getBoundingClientRect();
    geo.x0 = br.left - cr.left; geo.y0 = br.bottom - cr.top;
    for (const k in qEls) { const i = qEls[k] && $('i', qEls[k]); if (!i) continue; const tr = i.getBoundingClientRect(); geo[k] = { x: tr.left - cr.left + tr.width / 2, y: tr.top - cr.top + tr.height / 2 }; }
  }
  if (fxc) { J.watch(zbody, () => { geoDirty = true; }); J.watch(win, () => { geoDirty = true; }); }
  function land(dest) {
    rBoost = 1; ripple(dest, J.time);
    if (!fg || !qEls[dest]) return;
    if (geoDirty) measure();
    const g = geo[dest]; if (!g || fW < 2) return;
    const cw = Z.cw || 7.2;
    const x0 = geo.x0 + 14 + 38 * cw + 4, y0 = geo.y0 - 17, x1 = g.x, y1 = g.y;
    ring.x[dest] = x1; ring.y[dest] = y1;
    const n = J.narrow() ? 7 : 11; let made = 0;
    for (const p of pts) {
      if (p.on) continue;
      p.on = true; p.hit = false; p.k = dest; p.t = -Math.random() * 0.18; p.sp = 1 / (0.55 + Math.random() * 0.35); p.s = 0.55 + Math.random() * 0.7;
      p.x0 = x0 + (Math.random() - 0.5) * 6; p.y0 = y0 + (Math.random() - 0.5) * 6; p.x1 = x1 + (Math.random() - 0.5) * 3; p.y1 = y1 + (Math.random() - 0.5) * 2;
      p.cx = p.x0 - 14 - Math.random() * 46; p.cy = Math.min(y1 + 5 + Math.random() * 8, fH - 5); // drops out of the log line, then runs along the bottom gutter into the counter
      alive++; if (++made >= n) break;
    }
  }
  function drawFx(dt) {
    if (!fg) return;
    if (!alive && !ring.execute && !ring.review && !ring.skip) return;
    fg.clearRect(0, 0, fW, fH);
    fg.globalCompositeOperation = 'lighter';
    for (const p of pts) {
      if (!p.on) continue;
      p.t += dt * p.sp;
      if (p.t >= 1) {
        p.on = false; alive--;
        if (!p.hit) { p.hit = true; ring[p.k] = 1; const el = qEls[p.k]; if (el && el.animate && !reduce) el.animate([{ transform: 'translateY(-2px) scale(1.12)' }, { transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.2,.8,.2,1)' }); }
        continue;
      }
      if (p.t < 0) continue;
      const spr = SPR[p.k];
      for (let j = 0; j < 4; j++) { // comet: head + 3 trail samples
        const u = Math.max(0, p.t - j * 0.035), e = u * u * (3 - 2 * u), a = 1 - e * 0.15, m = 1 - e;
        const x = m * m * p.x0 + 2 * m * e * p.cx + e * e * p.x1, y = m * m * p.y0 + 2 * m * e * p.cy + e * e * p.y1;
        const sz = (11 - j * 2.2) * p.s;
        fg.globalAlpha = (1 - j * 0.24) * a; fg.drawImage(spr, x - sz, y - sz, sz * 2, sz * 2);
      }
    }
    for (const k in SPR) { // arrival flare
      if (ring[k] <= 0.01) { ring[k] = 0; continue; }
      const r = ring[k], sz = 30 * (1.4 - r * 0.7);
      fg.globalAlpha = r * 0.9; fg.drawImage(SPR[k], ring.x[k] - sz, ring.y[k] - sz, sz * 2, sz * 2);
      ring[k] *= Math.exp(-dt * 6);
    }
    fg.globalAlpha = 1; fg.globalCompositeOperation = 'source-over';
    if (!alive && !ring.execute && !ring.review && !ring.skip) fg.clearRect(0, 0, fW, fH);
  }

