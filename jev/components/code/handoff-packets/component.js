/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* used: JEV.mod, $, task, watch, fit, narrow, animate, reduce, S.dest, bus.on. Data: bus 'decision' (d.dest d.id). Geometry is measured on resize, never per frame.
 * Everything is simulated. */
JEV.mod('code-handoff-packets', () => {
  const J = JEV, $ = J.$, doc = document, reduce = J.reduce;
  const root = $('#cx-hp'), fxc = root && $('.code-fx', root); if (!fxc) return;
  const win = $('.code-win', root), saveEl = $('.cx-hp-save', root), dEl = $('.cx-hp-d', root), idEl = $('.cx-hp-id', root);
  const qEls = { execute: $('.code-q-x', root), review: $('.code-q-r', root), skip: $('.code-q-s', root) };
  const cnt = { execute: J.S.dest.execute, review: J.S.dest.review, skip: J.S.dest.skip };
  const show = (k) => { $('b', qEls[k]).textContent = cnt[k]; };
  for (const k in qEls) show(k);
  const SPR = {}, SC = { execute: ['#ff9cc4', '#ff2e6e'], review: ['#ffe08a', '#ffa21a'], skip: ['#e4dff0', '#9b92a8'] };
  for (const k in SC) { // pre-rendered glow sprites (no shadowBlur in the frame loop)
    const c = doc.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'), r = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    r.addColorStop(0, '#fff'); r.addColorStop(0.1, '#fff'); r.addColorStop(0.2, SC[k][0]); r.addColorStop(0.5, SC[k][1] + 'cc'); r.addColorStop(1, SC[k][1] + '00'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); SPR[k] = c;
  }
  let fg = null, fW = 0, fH = 0, dirty = true; const geo = { x0: 0, y0: 0 };
  J.watch(fxc, () => { const f = J.fit(fxc); fg = f.g; fW = f.W; fH = f.H; dirty = true; });
  J.watch(win, () => { dirty = true; });
  function measure() {
    dirty = false; const cr = fxc.getBoundingClientRect(), sr = saveEl.getBoundingClientRect(), dr = dEl.getBoundingClientRect();
    geo.x0 = Math.min(sr.right, cr.right) - cr.left - 6; geo.y0 = dr.top + dr.height / 2 - cr.top;
    for (const k in qEls) { const i = qEls[k].querySelector('i'), tr = i.getBoundingClientRect(); geo[k] = { x: tr.left - cr.left + tr.width / 2, y: tr.top - cr.top + tr.height / 2 }; }
  }
  const pts = []; for (let i = 0; i < 40; i++) pts.push({ on: false, k: 'execute', t: 0, sp: 1, x0: 0, y0: 0, cx: 0, cy: 0, x1: 0, y1: 0, s: 1, hit: false });
  const ring = { execute: 0, review: 0, skip: 0, x: { execute: 0, review: 0, skip: 0 }, y: { execute: 0, review: 0, skip: 0 } };
  let alive = 0;
  function land(dest) {
    if (!fg || fW < 2 || J.hidden()) { cnt[dest]++; show(dest); return; }
    if (dirty) measure();
    const g = geo[dest], x0 = geo.x0, y0 = geo.y0, x1 = g.x, y1 = g.y; ring.x[dest] = x1; ring.y[dest] = y1;
    const n = J.narrow() ? 7 : 11; let made = 0;
    for (const p of pts) {
      if (p.on) continue;
      p.on = true; p.hit = false; p.k = dest; p.t = -Math.random() * 0.18; p.sp = 1 / (0.55 + Math.random() * 0.35); p.s = 0.55 + Math.random() * 0.7;
      p.x0 = x0 + (Math.random() - 0.5) * 6; p.y0 = y0 + (Math.random() - 0.5) * 6; p.x1 = x1 + (Math.random() - 0.5) * 3; p.y1 = y1 + (Math.random() - 0.5) * 2;
      p.cx = p.x0 + (Math.random() - 0.5) * 60; p.cy = Math.min(y1 + 6 + Math.random() * 10, fH - 4);
      alive++; if (++made >= n) break;
    }
  }
  function frame(dt) {
    if (!fg || (!alive && !ring.execute && !ring.review && !ring.skip)) return;
    fg.clearRect(0, 0, fW, fH); fg.globalCompositeOperation = 'lighter';
    for (const p of pts) {
      if (!p.on) continue;
      p.t += dt * p.sp;
      if (p.t >= 1) {
        p.on = false; alive--;
        if (!p.hit) { p.hit = true; ring[p.k] = 1; cnt[p.k]++; show(p.k); J.animate(qEls[p.k], [{ transform: 'translateY(-2px) scale(1.12)' }, { transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.2,.8,.2,1)' }); }
        continue;
      }
      if (p.t < 0) continue;
      for (let j = 0; j < 4; j++) { // comet: head + 3 trail samples
        const u = Math.max(0, p.t - j * 0.035), e = u * u * (3 - 2 * u), m = 1 - e;
        const x = m * m * p.x0 + 2 * m * e * p.cx + e * e * p.x1, y = m * m * p.y0 + 2 * m * e * p.cy + e * e * p.y1, sz = (11 - j * 2.2) * p.s;
        fg.globalAlpha = (1 - j * 0.24) * (1 - e * 0.15); fg.drawImage(SPR[p.k], x - sz, y - sz, sz * 2, sz * 2);
      }
    }
    for (const k in SPR) { if (ring[k] <= 0.01) { ring[k] = 0; continue; } const r = ring[k], sz = 30 * (1.4 - r * 0.7); fg.globalAlpha = r * 0.9; fg.drawImage(SPR[k], ring.x[k] - sz, ring.y[k] - sz, sz * 2, sz * 2); ring[k] *= Math.exp(-dt * 6); }
    fg.globalAlpha = 1; fg.globalCompositeOperation = 'source-over';
    if (!alive && !ring.execute && !ring.review && !ring.skip) fg.clearRect(0, 0, fW, fH);
  }
  let last = 0; J.task(root, (t) => { const dt = Math.min(0.1, t - last || 0.016); last = t; frame(dt); });
  J.bus.on('decision', (d) => {
    dEl.textContent = d.dest; dEl.className = 'code-t-dest code-chip-' + d.dest + ' cx-hp-d'; idEl.textContent = d.id + '.json'; dirty = true;
    if (reduce) { cnt[d.dest]++; show(d.dest); return; }
    setTimeout(() => land(d.dest), 60);
  });
});
