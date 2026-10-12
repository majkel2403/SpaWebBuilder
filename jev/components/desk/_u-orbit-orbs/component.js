  /* ================================================================ orbiting DOM agents ================================================================ */
  const OB = J.$$('.dkw-ob', stage).map((el, i) => ({ el, i, key: el.dataset.k, act: 0, rx: 0, z: 0, d: 0, label: J.$('em', el), orb: J.$('.orb', el), ex: 99, ey: 99, x: 0, y: 0, tx: 1e9, ty: 0, ts: 0, to: -1 }));
  const JV = { el: J.$('#dkw-jv'), x: 0, y: 0, tx: 1e9, ty: 0, ts: 0, to: -1, vis: 0 };
  // transform / opacity are written only when they change at 0.5 px / 0.0025 scale / 0.01 opacity resolution (opacity changes ~once per 10 frames)
  function put(o, x, y, sc, op) {
    const tx = Math.round(x * 2), ty = Math.round(y * 2), ts = Math.round(sc * 400), to = Math.round(op * 100);
    if (tx !== o.tx || ty !== o.ty || ts !== o.ts) { o.tx = tx; o.ty = ty; o.ts = ts; o.el.style.transform = 'translate3d(' + tx / 2 + 'px,' + ty / 2 + 'px,0) scale(' + ts / 400 + ')'; }
    if (to !== o.to) { o.to = to; o.el.style.opacity = to / 100; }
  }
  const OBK = {}; OB.forEach((o) => (OBK[o.key] = o));
  function orbits(t, dt) {
    const a0 = t * 0.27, cr = Math.cos(OB_ROT), sr = Math.sin(OB_ROT), step = Math.min(1, dt * 6), on = activeKey();
    for (let i = 0; i < OB.length; i++) {
      const o = OB[i], a = a0 + i * (TAU / OB.length), ex = OB_RX * Math.cos(a), ey = OB_RY * Math.sin(a), d = Math.sin(a);
      const x = OB_X + ex * cr - ey * sr, y = OB_Y + ex * sr + ey * cr;
      o.act += ((o.key === on ? 1 : 0) - o.act) * step; o.x = x; o.y = y; o.d = d;
      if (o.rx > 0) o.rx = Math.max(0, o.rx - dt * 1.6);
      const pinned = ST.pin === o.key, sc = (0.66 + 0.34 * (d * 0.5 + 0.5)) * (1 + 0.26 * o.act + 0.2 * o.rx * o.rx), op = pinned ? 1 : 0.58 + 0.42 * (d * 0.5 + 0.5);
      put(o, x - SX, y - SY + Math.sin(t * 1.3 + i * 1.7) * 2.6 * (0.5 + 0.5 * o.act + 0.3), sc, op);
      const z = pinned ? 3 : d > 0 ? (o.act > 0.5 ? 3 : 2) : 0; if (z !== o.z) { o.z = z; o.el.style.zIndex = z; }
    }
    tipPlace(dt);
    // jev: every ~16 s a big white orb sweeps across the front of the globe
    const cyc = 16, ph = J.reduce ? 0.8 : (t % cyc) / 7.5, dirn = J.reduce ? 1 : Math.floor(t / cyc) % 2 ? -1 : 1;
    if (ph < 1) {
      const e = ph * ph * (3 - 2 * ph), s = Math.sin(Math.PI * ph), x = OB_X + dirn * lerp(-1.18, 1.08, e) * OB_RX * 0.86, y = OB_Y + R * (0.5 - 0.22 * s) + (dirn > 0 ? 0 : 6);
      put(JV, x - SX, y - SY, 0.5 + 1.0 * Math.pow(s, 0.8), clamp(s * 2.4, 0, 1)); JV.vis = 1;
    } else if (JV.vis) { JV.el.style.opacity = '0'; JV.to = 0; JV.vis = 0; }
  }
  /* venue tooltip: follows the marker of the hovered / faced venue, fades out behind the limb */
  const TIP = { el: J.$('#dkw-tip'), n: J.$('#dkw-tip-n'), c: J.$('#dkw-tip-c'), l: J.$('#dkw-tip-l'), s: J.$('#dkw-tip-s'), city: -1, a: 0, w: 150, h: 60, tx: 1e9, ty: 0, to: -1 };
  const FDC = {}; FD.forEach((f) => (FDC[f.city] = f));
  function tipText() {
    const f = FDC[TIP.city]; if (!f) return;
    txt(TIP.n, f.k); txt(TIP.c, CITIES[f.city].c.toLowerCase()); txt(TIP.l, Math.round(f.lat) + 'ms');
    const lc = f.lat < 40 ? '' : f.lat < 70 ? 'm' : 's'; if (TIP.l.className !== lc) TIP.l.className = lc;
    txt(TIP.s, J.sgn((f.price / J.market.price - 1) * 1e4, 1) + 'bp');
  }
  function tipPlace(dt) {
    const c = hoverCity >= 0 ? hoverCity : focusCity;
    if (c !== TIP.city) { TIP.city = c; if (c >= 0) { tipText(); TIP.w = TIP.el.offsetWidth || 150; TIP.h = TIP.el.offsetHeight || 60; } }
    const tgt = c >= 0 ? clamp((MZ[c] - 0.12) * 5, 0, 1) : 0;
    TIP.a += (tgt - TIP.a) * Math.min(1, dt * 12); if (Math.abs(tgt - TIP.a) < 0.01) TIP.a = tgt;
    const o = Math.round(TIP.a * 100);
    if (o !== TIP.to) { TIP.to = o; TIP.el.style.opacity = o / 100; }
    if (c < 0 || o === 0) return;
    let x = MX[c] - SX + 16, y = MY[c] - SY - TIP.h - 10;
    if (x + TIP.w > SW - 4) x = MX[c] - SX - 16 - TIP.w;
    if (y < 18) y = MY[c] - SY + 16;
    x = Math.max(2, x);
    const tx = Math.round(x * 2), ty = Math.round(y * 2);
    if (tx !== TIP.tx || ty !== TIP.ty) { TIP.tx = tx; TIP.ty = ty; TIP.el.style.transform = 'translate3d(' + tx / 2 + 'px,' + ty / 2 + 'px,0)'; }
  }
  // an agent's step lands: the orbit orb pops (scale via rx, brightness pulse) and the eyes of every copy of that agent widen
  const EYES = {};
  function react(k) {
    const o = OBK[k]; o.rx = 1;
    const ev = EYES[k] || (EYES[k] = [OBK[k].orb, TAB[k].el, ROW[k].el].map((e) => J.$$('.e', e)).flat());
    for (let i = 0; i < ev.length; i++) J.animate(ev[i], [{ scale: '1 1' }, { scale: '1.35 1.55', offset: 0.22 }, { scale: '1 1' }], { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)' });
    J.animate(o.orb, [{ filter: 'brightness(1.7) saturate(1.3)' }, { filter: 'none' }], { duration: 600, easing: 'ease-out' });
  }
  function slow() {
    if (TIP.city >= 0 && TIP.a > 0) tipText();
    // eyes follow the globe (≤4 Hz) + countdown text
    for (let i = 0; i < OB.length; i++) {
      const o = OB[i], dx = OB_X - o.x, dy = OB_Y - o.y, dl = Math.hypot(dx, dy) || 1, ex = Math.round((dx / dl) * 3) / 2, ey = Math.round((dy / dl) * 3) / 2;
      if (J.reduce && (ex !== o.ex || ey !== o.ey)) { o.ex = ex; o.ey = ey; o.orb.style.setProperty('--ex', ex + 'px'); o.orb.style.setProperty('--ey', ey + 'px'); }
    }
    tickCd();
  }

