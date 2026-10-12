  /* =====================================================================================
   * the tape — canvas
   * ===================================================================================== */
  const tcv = $('#dkt-cv'), twrap = $('#dkt-tc');
  const L = { vwap: true, bands: true, book: true };
  const hv = { on: false, x: 0, y: 0, touch: false, t: 0, key: false };
  const hits = [];                                              // marker hit boxes of the last frame {x,y,m}
  const tg = { gArea: null, g: null, W: 0, H: 0, bf: 0.225, bfT: 0.225, bfMax: 0.225, px: M.price, yMin: 0, yMax: 1, ys: 1, init: false, slide: 0, n: 0, nar: false,
    x0: 8, x1: 100, y0: 12, y1: 100, cw: 100, bw: 0, axW: 60, slot: 8, nVis: 70, volH: 40, timeH: 16, fs: 9.5 };
  function layout() {
    const W = tg.W, H = tg.H, nar = W < 520;
    tg.nar = nar; tg.fs = tfs(W); tg.bfMax = nar ? 0.285 : 0.225; if (L.book) tg.bfT = tg.bfMax; else tg.bfT = 0;
    tg.bw = Math.round(W * tg.bf); tg.cw = W - tg.bw; tg.axW = nar ? 46 : 62;
    tg.x0 = 8; tg.x1 = tg.cw - tg.axW; tg.y0 = 14; tg.timeH = 16;
    tg.volH = Math.round((H - tg.y0 - tg.timeH) * 0.14); tg.y1 = H - tg.timeH - tg.volH - 8;
    if (tg.g) { tg.gArea = tg.g.createLinearGradient(0, tg.y0, 0, tg.y1); tg.gArea.addColorStop(0, 'rgba(' + PNK + ',.13)'); tg.gArea.addColorStop(1, 'rgba(77,141,255,0)'); }
    tg.slot = clamp((tg.x1 - tg.x0) / (nar ? 42 : 74), 5.4, 13); tg.nVis = Math.max(20, Math.floor((tg.x1 - tg.x0 - 6) / tg.slot));
  }
  J.watch(twrap, () => { const r = J.fit(tcv); tg.g = r.g; tg.W = r.W; tg.H = r.H; tg.bf = L.book ? (r.W < 520 ? 0.285 : 0.225) : 0; layout(); });
  $$('.dkt-chip[data-l]', tape).forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.l; L[k] = !L[k]; b.classList.toggle('on', L[k]); b.setAttribute('aria-pressed', String(L[k]));
    if (k === 'book') layout();
  }));
  const setHover = (e) => { hv.on = true; hv.key = false; hv.touch = e.pointerType === 'touch'; hv.x = e.offsetX; hv.y = e.offsetY; hv.t = nowMs(); };
  tcv.addEventListener('pointermove', setHover, { passive: true });
  tcv.addEventListener('pointerdown', setHover, { passive: true });
  tcv.addEventListener('pointerleave', () => { if (!hv.touch) hv.on = false; });   // touch: the read-out stays ~4 s after lifting, then fades (see drawTape)
  tcv.addEventListener('pointercancel', () => { if (!hv.touch) hv.on = false; });
  /* keyboard parity: focus the canvas, arrows walk the candles, home/end jump, esc clears */
  tcv.tabIndex = 0; tcv.setAttribute('role', 'img');
  tcv.addEventListener('keydown', (e) => {
    const k = e.key; if (k !== 'ArrowLeft' && k !== 'ArrowRight' && k !== 'Home' && k !== 'End' && k !== 'Escape') return;
    e.preventDefault(); if (k === 'Escape') { hv.on = false; return; }
    const n = tg.n || 1; let i = hv.on && hv.key ? hv.i : n - 1;
    i = k === 'ArrowLeft' ? i - 1 : k === 'ArrowRight' ? i + 1 : k === 'Home' ? 0 : n - 1; i = clamp(i, 0, n - 1);
    hv.on = true; hv.key = true; hv.touch = false; hv.i = i; hv.x = X(i); hv.y = tg.y0 + (tg.y1 - tg.y0) * 0.5; hv.t = nowMs();
  });
  tcv.addEventListener('blur', () => { if (hv.key) hv.on = false; });
  const X = (i) => tg.x1 - 4 - tg.slot * (tg.n - 1 - i) - tg.slot * 0.5 + tg.slide;
  const Y = (p) => tg.y1 - (p - tg.yMin) * tg.ys;
  const f0 = (n) => fmt(Math.round(n));

  function drawBook(t, dt) {
    const g = tg.g, W = tg.W, H = tg.H, cw = tg.cw, al = clamp(tg.bf / tg.bfMax, 0, 1);
    const k = 1 - Math.exp(-dt * 7); let sa = 0, sb = 0, mx = 0.5;
    for (let i = 0; i < NB; i++) {
      bkA[i] += (tA[i] - bkA[i]) * k; bkB[i] += (tB[i] - bkB[i]) * k; fA[i] = Math.max(0, fA[i] - dt * 1.7); fB[i] = Math.max(0, fB[i] - dt * 1.7);
      sa += bkA[i]; sb += bkB[i]; if (bkA[i] > mx) mx = bkA[i]; if (bkB[i] > mx) mx = bkB[i];
    }
    book.mx += (mx - book.mx) * k * 0.6; book.imb = (sb - sa) / (sb + sa || 1);
    if (al < 0.03) return;
    const nar = tg.nar, bx0 = cw + 10, bx1 = W - 8, bwid = bx1 - bx0, headH = 24, spH = 30, imbH = 44;
    const rh = (H - headH - spH - imbH - 4) / (NB * 2), yS = headH + NB * rh, cmx = Math.max(sa, sb, 1);
    g.save(); g.globalAlpha = al;
    g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(cw + 1, 0, 1, H);
    const fs = tg.fs;
    g.font = '700 ' + fs + 'px ' + MONO; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = '#d6cde2';
    g.fillText(nar ? 'BOOK' : 'ORDER BOOK', bx0, 12);
    g.textAlign = 'right'; g.fillStyle = '#b4abc2'; g.font = '500 ' + fs + 'px ' + MONO; g.fillText('10 × 10', bx1 - (nar ? 0 : 12), 12);
    if (!nar) { g.fillStyle = C.green; g.beginPath(); g.arc(bx1 - 2, 12, 2 + 0.6 * Math.sin(t * 5), 0, TAU); g.fill(); }
    const fz = fs, tr = tier(), shY = headH + (((t * 0.32) % 1.5) - 0.25) * (H - headH - imbH);   // tier>=2: size glow at each bar tip, waterfall shimmer, eaten-level sparks
    for (let side = 0; side < 2; side++) {
      const ask = side === 0, eat = ask ? eA : eB, bk = ask ? bkA : bkB, fl = ask ? fA : fB, sg = ask ? sA : sB, pv = ask ? pA : pB, lb = ask ? lblA : lblB; let cum = 0;
      for (let kk = 0; kk < NB; kk++) {
        cum += bk[kk];
        const y = ask ? headH + (NB - 1 - kk) * rh : yS + spH + kk * rh, h = rh - 1.2;
        g.fillStyle = ask ? cR(0.085) : cG(0.08); g.fillRect(bx1 - cum / cmx * bwid, y, cum / cmx * bwid, h);
        const w = Math.max(2, Math.min(1, bk[kk] / book.mx) * (nar ? bwid * 0.94 : bwid - 46));
        g.fillStyle = ask ? cR(kk === 0 ? 0.78 : 0.52) : cG(kk === 0 ? 0.72 : 0.46); g.fillRect(bx1 - w, y, w, h);
        g.fillStyle = ask ? cR(0.95) : cG(0.95); g.fillRect(bx1 - w, y, 1.5, h);
        if (tr >= 2) {
          const sz = Math.min(1, bk[kk] / book.mx), yc = y + h / 2, sh = Math.exp(-Math.pow((yc - shY) / (rh * 2.4), 2));
          g.globalCompositeOperation = 'lighter';
          glow(g, ask ? SP.r : SP.g, bx1 - w, yc, 8 + sz * 14, (0.12 + 0.4 * sz * sz) * al); g.globalAlpha = al;
          if (sh > 0.03) { g.fillStyle = 'rgba(255,255,255,' + (0.13 * sh).toFixed(3) + ')'; g.fillRect(bx1 - w, y, w, h); }
          g.globalCompositeOperation = 'source-over';
          if (eat[kk]) { eat[kk] = 0; if (al > 0.6) burst(fx.pool, cw + 10 + (bwid - w), yc, tr >= 3 ? 12 : 7, ask ? 1 : 0, 90, 0.7, 7, 0); }
        } else if (eat[kk]) eat[kk] = 0;
        if (fl[kk] > 0.02) {                                  // size change: green = grew, red = shrank; the old edge fades as a trail
          const f = fl[kk], bwm = nar ? bwid * 0.94 : bwid - 46, wp = Math.max(2, Math.min(1, pv[kk] / book.mx) * bwm), grew = sg[kk] > 0;
          g.fillStyle = grew ? cG(f * 0.5) : cR(f * 0.5); g.fillRect(bx1 - w, y, w, h);
          if (Math.abs(wp - w) > 1) { g.fillStyle = grew ? cG(f * 0.3) : 'rgba(255,255,255,' + (f * 0.22).toFixed(3) + ')'; g.fillRect(bx1 - Math.max(w, wp), y, Math.abs(wp - w), h); }
          g.fillStyle = 'rgba(255,255,255,' + (f * f * 0.6).toFixed(3) + ')'; g.fillRect(bx1 - w, y, 1.5, h);
        }
        g.font = '600 ' + fz + 'px ' + MONO; g.textAlign = 'right'; g.fillStyle = '#fff'; g.fillText(bk[kk].toFixed(2), bx1 - 3, y + h / 2 + 0.5);
        if (!nar) { g.font = '500 ' + fz + 'px ' + MONO; g.textAlign = 'left'; g.fillStyle = ask ? '#ff9ca6' : '#7af3cb'; g.fillText(lb[kk], bx0 + 1, y + h / 2 + 0.5); }
      }
    }
    // spread row
    g.fillStyle = 'rgba(255,255,255,.045)'; g.fillRect(bx0 - 6, yS, bwid + 14, spH);
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(bx0 - 6, yS, bwid + 14, 1); g.fillRect(bx0 - 6, yS + spH - 1, bwid + 14, 1);
    g.textAlign = 'left'; g.fillStyle = book.up ? C.green : C.red; g.font = '700 ' + (nar ? 10.5 : 12) + 'px ' + MONO;
    g.fillText((book.up ? '▲ ' : '▼ ') + book.mid, bx0, yS + 10);
    g.fillStyle = '#cfc6dc'; g.font = '500 ' + fs + 'px ' + MONO; g.fillText(nar ? 'spr ' + book.sprBps.toFixed(1) + 'bp' : 'spread ' + book.spr, bx0, yS + 22);
    // imbalance meter
    const yi = H - imbH + 5, share = sb / (sa + sb || 1);
    g.textAlign = 'left'; g.fillStyle = '#cfc6dc'; g.font = '500 ' + fs + 'px ' + MONO; g.fillText(bwid < 92 ? 'imb' : 'imbalance', bx0, yi + 3);                  // 'imbalance' + the value need ~80 px at 9.5 px mono
    g.textAlign = 'right'; g.fillStyle = book.imb >= 0 ? C.green : C.red; g.font = '700 ' + fs + 'px ' + MONO; g.fillText((book.imb >= 0 ? '+' : '-') + Math.abs(book.imb).toFixed(2), bx1, yi + 3);
    const bw1 = Math.round(bwid * share);
    g.fillStyle = cG(0.9); g.fillRect(bx0, yi + 11, bw1 - 1, 6); g.fillStyle = cR(0.9); g.fillRect(bx0 + bw1 + 1, yi + 11, bwid - bw1 - 1, 6);
    g.globalCompositeOperation = 'lighter'; g.fillStyle = cG(0.16); g.fillRect(bx0, yi + 8, bw1, 12); g.fillStyle = cR(0.16); g.fillRect(bx0 + bw1, yi + 8, bwid - bw1, 12); g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#fff'; g.fillRect(bx0 + bwid / 2 - 0.5, yi + 9, 1, 10);
    // depth heat: cumulative size per level, bids grow left of centre (green), asks right (red); brighter = deeper, centre = touch
    const hy = yi + 23, hw = bwid / 2 - 1, cw1 = hw / NB; let cb = 0, ca = 0;
    for (let kk = 0; kk < NB; kk++) {
      cb += bkB[kk]; ca += bkA[kk];
      g.fillStyle = cG(0.12 + 0.78 * cb / cmx); g.fillRect(bx0 + hw - (kk + 1) * cw1 + 0.5, hy, cw1 - 1, 6);
      g.fillStyle = cR(0.12 + 0.78 * ca / cmx); g.fillRect(bx0 + hw + 2 + kk * cw1 + 0.5, hy, cw1 - 1, 6);
    }
    g.restore();
  }

  function drawTape(t, dt) {
    const g = tg.g; if (!g) return;
    if (Math.abs(tg.bf - tg.bfT) > 0.0008) { tg.bf += (tg.bfT - tg.bf) * (1 - Math.exp(-dt * 9)); layout(); } else if (tg.bf !== tg.bfT) { tg.bf = tg.bfT; layout(); }
    const W = tg.W, H = tg.H, x0 = tg.x0, x1 = tg.x1, y0 = tg.y0, y1 = tg.y1, cw = tg.cw, slot = tg.slot, nar = tg.nar;
    g.clearRect(0, 0, W, H);
    const cur = cands[cands.length - 1], n = Math.min(tg.nVis, cands.length), st = cands.length - n;
    tg.n = n; tg.slide *= Math.exp(-dt * 8); if (tg.slide < 0.05) tg.slide = 0;
    tg.px = reduce ? M.price : tg.px + (M.price - tg.px) * (1 - Math.exp(-dt * 14)); const px = tg.px;
    // visible range
    let lo = px, hi = px, iHi = -1, iLo = -1;
    for (let i = 0; i < n; i++) { const c = cands[st + i], ch = i === n - 1 ? Math.max(c.h, px) : c.h, cl = i === n - 1 ? Math.min(c.l, px) : c.l; if (ch >= hi) { hi = ch; iHi = i; } if (cl <= lo) { lo = cl; iLo = i; } }
    const pad = Math.max((hi - lo) * 0.13, 10), tMin = lo - pad * 1.25, tMax = hi + pad;
    if (!tg.init) { tg.yMin = tMin; tg.yMax = tMax; tg.init = true; } else { const k = 1 - Math.exp(-dt * 3.2); tg.yMin += (tMin - tg.yMin) * k; tg.yMax += (tMax - tg.yMax) * k; }
    tg.ys = (y1 - y0) / (tg.yMax - tg.yMin);
    const yMin = tg.yMin, yMax = tg.yMax, tr = tier();

    // grid + price axis
    const raw = (yMax - yMin) / (nar ? 4 : 5), mag = Math.pow(10, Math.floor(Math.log10(raw))), rm = raw / mag, step = (rm <= 1 ? 1 : rm <= 2 ? 2 : rm <= 5 ? 5 : 10) * mag;
    const gx1 = cw - 2;
    g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,.055)'; g.beginPath();
    for (let p = Math.ceil(yMin / step) * step; p < yMax; p += step) { const y = Math.round(Y(p)) + 0.5; if (y < y0 - 2 || y > y1 + 2) continue; g.moveTo(x0, y); g.lineTo(gx1 - tg.axW + 6, y); }
    const every = nar ? 10 : 12, lastCid = cur.cid;
    for (let i = 0; i < n; i++) { const c = cands[st + i]; if (c.cid % every !== 0) continue; const x = Math.round(X(i)) + 0.5; g.moveTo(x, y0); g.lineTo(x, H - tg.timeH); }
    g.stroke();
    const fs = tg.fs;
    g.font = '500 ' + fs + 'px ' + MONO; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = '#bdb4cb';
    for (let p = Math.ceil(yMin / step) * step; p < yMax; p += step) { const y = Y(p); if (y < y0 + 2 || y > y1 - 2) continue; g.fillText(f0(p), x1 + 10, y); }
    g.textAlign = 'center'; g.fillStyle = '#a79eb6';
    for (let i = 0; i < n; i++) { const c = cands[st + i]; if (c.cid % every !== 0) continue; const x = X(i); if (x < x0 + 14 || x > x1 - 10) continue; g.fillText(lastCid === c.cid ? 'now' : '-' + (lastCid - c.cid) + 'm', x, H - 7); }

    // everything below is clipped to the plot
    g.save(); g.beginPath(); g.rect(x0 - 2, 0, x1 - x0 + 8, H); g.clip();
    if (tg.gArea) {
      g.beginPath();
      for (let i = 0; i < n; i++) { const c = cands[st + i], x = X(i), y = Y(i === n - 1 ? px : c.c); i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.lineTo(X(n - 1), y1 + 4); g.lineTo(X(0), y1 + 4); g.closePath(); g.fillStyle = tg.gArea; g.fill();
    }
    if (L.bands) {
      g.beginPath();
      for (let i = 0; i < n; i++) { const c = cands[st + i], x = X(i), y = Y(c.vw + c.sd); i ? g.lineTo(x, y) : g.moveTo(x, y); }
      for (let i = n - 1; i >= 0; i--) { const c = cands[st + i]; g.lineTo(X(i), Y(c.vw - c.sd)); }
      g.closePath(); g.fillStyle = 'rgba(' + VIO + ',.11)'; g.fill();
      g.setLineDash([3, 4]); g.lineWidth = 1; g.strokeStyle = 'rgba(' + VIO + ',.55)'; g.lineDashOffset = tr >= 2 ? -t * 9 : 0;      // tier>=2: the band edges flow
      for (let s = 0; s < 2; s++) { g.beginPath(); for (let i = 0; i < n; i++) { const c = cands[st + i], x = X(i), y = Y(c.vw + (s ? -c.sd : c.sd)); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
      g.setLineDash([]); g.lineDashOffset = 0;
    }
    // volume
    let vmax = 1; for (let i = 0; i < n; i++) if (cands[st + i].v > vmax) vmax = cands[st + i].v;
    const vb = H - tg.timeH - 2, bw = Math.max(1.6, slot * 0.64);
    for (let pass = 0; pass < 2; pass++) {
      g.fillStyle = pass === 0 ? cG(0.4) : cR(0.4);
      for (let i = 0; i < n; i++) { const c = cands[st + i], cc = i === n - 1 ? px : c.c; if ((cc >= c.o) !== (pass === 0)) continue; const h = Math.max(1, c.v / vmax * tg.volH); g.fillRect(X(i) - bw / 2, vb - h, bw, h); }
    }
    if (tr >= 2) {                                                // volume glow: soft additive halo under every bar, hot cap on the busy ones
      g.globalCompositeOperation = 'lighter';
      for (let pass = 0; pass < 2; pass++) {
        g.fillStyle = pass === 0 ? cG(0.1) : cR(0.1);
        for (let i = 0; i < n; i++) { const c = cands[st + i], cc = i === n - 1 ? px : c.c; if ((cc >= c.o) !== (pass === 0)) continue; const h = Math.max(1, c.v / vmax * tg.volH); g.fillRect(X(i) - bw / 2 - 2, vb - h - 2, bw + 4, h + 2); }
        g.fillStyle = pass === 0 ? cG(0.6) : cR(0.6);
        for (let i = 0; i < n; i++) { const c = cands[st + i], cc = i === n - 1 ? px : c.c; if ((cc >= c.o) !== (pass === 0) || c.v < vmax * 0.6) continue; const h = Math.max(1, c.v / vmax * tg.volH); g.fillRect(X(i) - bw / 2, vb - h, bw, 1.5); }
      }
      g.globalCompositeOperation = 'source-over';
    }
    // candles — halo, wicks, bodies
    g.globalCompositeOperation = 'lighter';
    for (let pass = 0; pass < 2; pass++) {
      g.fillStyle = pass === 0 ? cG(0.07) : cR(0.07);
      for (let i = 0; i < n; i++) {
        const c = cands[st + i], cc = i === n - 1 ? px : c.c; if ((cc >= c.o) !== (pass === 0)) continue;
        const yt = Y(Math.max(c.o, cc)), yb = Y(Math.min(c.o, cc)); g.fillRect(X(i) - bw / 2 - 2, yt - 2, bw + 4, yb - yt + 4);
      }
    }
    {                                                           // the live candle breathes: a slow additive halo around its body + wick (static when reduced motion)
      const c = cur, cc = px, br = reduce ? 0.5 : 0.5 + 0.5 * Math.sin(t * 2.4), bx = X(n - 1), yt = Y(Math.max(c.o, cc, c.h)), yb = Y(Math.min(c.o, cc, c.l));
      g.fillStyle = cc >= c.o ? cG(0.05 + 0.1 * br) : cR(0.05 + 0.1 * br); g.fillRect(bx - bw / 2 - 3 - br * 2, yt - 2, bw + 6 + br * 4, yb - yt + 4);
    }
    g.globalCompositeOperation = 'source-over';
    for (let pass = 0; pass < 2; pass++) {
      const col = pass === 0 ? C.green : C.red; g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 1; g.beginPath();
      for (let i = 0; i < n; i++) {
        const c = cands[st + i], last = i === n - 1, cc = last ? px : c.c; if ((cc >= c.o) !== (pass === 0)) continue;
        const x = Math.round(X(i)) + 0.5; g.moveTo(x, Y(last ? Math.max(c.h, px) : c.h)); g.lineTo(x, Y(last ? Math.min(c.l, px) : c.l));
      }
      g.stroke();
      for (let i = 0; i < n; i++) {
        const c = cands[st + i], cc = i === n - 1 ? px : c.c; if ((cc >= c.o) !== (pass === 0)) continue;
        const yt = Y(Math.max(c.o, cc)), yb = Y(Math.min(c.o, cc)); g.fillRect(X(i) - bw / 2, yt, bw, Math.max(1.2, yb - yt));
      }
    }
    if (L.vwap) {
      g.lineJoin = 'round'; g.globalCompositeOperation = 'lighter';
      for (let s = 0; s < 2; s++) {
        g.lineWidth = s ? 1.6 : 5; g.strokeStyle = 'rgba(' + AMB + ',' + (s ? 0.95 : 0.14) + ')'; g.beginPath();
        for (let i = 0; i < n; i++) { const x = X(i), y = Y(cands[st + i].vw); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
      }
      g.globalCompositeOperation = 'source-over';
      if (tr >= 2) {                                              // vwap flow: a travelling highlight rides the line
        g.globalCompositeOperation = 'lighter'; g.setLineDash([16, 120]); g.lineDashOffset = -t * 70; g.lineWidth = 2.6; g.strokeStyle = 'rgba(255,238,190,.75)'; g.beginPath();
        for (let i = 0; i < n; i++) { const x = X(i), y = Y(cands[st + i].vw); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
        g.setLineDash([]); g.lineDashOffset = 0; g.globalCompositeOperation = 'source-over';
      }
    }
    // high / low flags
    g.font = '500 ' + fs + 'px ' + MONO; g.textAlign = 'center'; g.fillStyle = '#d6cde2';
    if (iHi >= 0 && iHi < n - 1) g.fillText(f0(hi), clamp(X(iHi), x0 + 22, x1 - 22), Y(hi) - 8);
    if (iLo >= 0 && iLo < n - 1) g.fillText(f0(lo), clamp(X(iLo), x0 + 22, x1 - 22), Y(lo) + 9);
    if (tr >= 2) {                                                // candle birth: a pink light column + a spark burst at the new open
      const bx = X(n - 1), age = (nowMs() - fx.birthT) / 1000;
      if (fx.birthN) { fx.birthN = 0; burst(fx.pool, bx, Y(cur.o), tr >= 3 ? 16 : 9, 3, 120, 0.9, 7, 60); }
      if (age < 0.8) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = (1 - age / 0.8) * 0.5; g.drawImage(BM.p, bx - bw - 3, y0, bw * 2 + 6, y1 - y0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    }
    // fired tickets
    const first = cands[st].cid, r = nar ? 4.5 : 5.5, tnow = nowMs(); hits.length = 0;
    for (let pass = 0; pass < 2; pass++) {
      for (let j = 0; j < marks.length; j++) {
        const m = marks[j], i = m.cid - first; if (i < 0 || i >= n) continue;
        const isB = m.kind === 'buy', isS = m.kind === 'sell'; if ((pass === 0) !== (isB || isS)) continue;
        const x = X(i), y = isB ? Y(m.price) + 12 : isS ? Y(m.price) - 12 : Y(m.price), age = (tnow - m.t) / 1000;
        hits.push({ x, y, m });
        if (pass === 0) {
          g.beginPath();
          if (isB) { g.moveTo(x, y - r); g.lineTo(x + r, y + r * 0.8); g.lineTo(x - r, y + r * 0.8); } else { g.moveTo(x, y + r); g.lineTo(x + r, y - r * 0.8); g.lineTo(x - r, y - r * 0.8); }
          g.closePath(); g.fillStyle = isB ? C.green : C.red; g.fill(); g.lineWidth = 1.2; g.strokeStyle = 'rgba(5,3,10,.9)'; g.stroke();
        } else {
          g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r, y); g.lineTo(x, y + r); g.lineTo(x - r, y); g.closePath(); g.fillStyle = C.amber; g.fill(); g.lineWidth = 1.2; g.strokeStyle = 'rgba(5,3,10,.9)'; g.stroke();
        }
        if (age < 3.2) {
          g.globalCompositeOperation = 'lighter';
          glow(g, isB ? SP.g : isS ? SP.r : SP.a, x, y, 12 + age * 12, 0.9 * (1 - age / 3.2));
          g.strokeStyle = isB ? cG(1 - age / 1.4) : isS ? cR(1 - age / 1.4) : 'rgba(' + AMB + ',' + (1 - age / 1.4) + ')'; if (age < 1.4) { g.lineWidth = 1.4; g.beginPath(); g.arc(x, y, r + age * 16, 0, TAU); g.stroke(); }
          if (tr >= 2) {
            const bs = isB ? BM.g : isS ? BM.r : BM.a, fall = Math.min(1, age / 0.45);
            for (let q = 1; q <= 2; q++) { const a2 = age - q * 0.22; if (a2 > 0 && a2 < 1.6) { g.globalAlpha = (1 - a2 / 1.6) * 0.6; g.lineWidth = 1.1; g.strokeStyle = isB ? C.green : isS ? C.red : C.amber; g.beginPath(); g.arc(x, y, r + a2 * 24, 0, TAU); g.stroke(); } }
            const hy = y0 + (y - y0) * (1 - Math.pow(1 - fall, 3));
            g.globalAlpha = age < 0.45 ? 0.7 : 0.7 * Math.max(0, 1 - (age - 0.45) / 1.7);
            if (g.globalAlpha > 0.01 && hy > y0 + 2) g.drawImage(bs, x - 4, y0, 8, hy - y0);
            g.globalAlpha = 1;
            if (age < 0.45) glow(g, SPW, x, hy, 9, 0.9);
            else if (!m.fx) { m.fx = 1; burst(fx.pool, x, y, tr >= 3 ? 14 : 8, isB ? 0 : isS ? 1 : 2, 105, 0.85, 7, 40); }
          }
          g.globalCompositeOperation = 'source-over';
          if (m.txt && !nar) { g.globalAlpha = Math.min(1, (3.2 - age) / 1.2); g.font = '700 ' + fs + 'px ' + MONO; g.textAlign = 'right'; g.fillStyle = isB ? '#7ff5cf' : isS ? '#ff9aa4' : '#ffd77a'; g.fillText(m.txt, x - r - 5, y + 0.5); g.globalAlpha = 1; }
        }
      }
    }
    // last price: marching dashed line, pulse
    const up = px >= cur.o, lcol = up ? C.green : C.red, ly = Y(px), lx = X(n - 1);
    g.setLineDash([5, 4]); g.lineDashOffset = -t * 18; g.lineWidth = 1; g.strokeStyle = 'rgba(' + (up ? GRN : RED) + ',' + (0.55 + 0.3 * Math.sin(t * 5)).toFixed(2) + ')';
    g.beginPath(); g.moveTo(lx, ly + 0.5); g.lineTo(x1 + 8, ly + 0.5); g.stroke(); g.setLineDash([]);
    g.globalCompositeOperation = 'lighter'; glow(g, up ? SP.g : SP.r, lx, ly, 13 + 4 * Math.sin(t * 5), 0.95);
    if (tr >= 2) {                                                // every tick: a ring leaves the last price and a light runs down the price line to the tag
      const pa = (tnow - fx.tickT) / 1000;
      if (pa < 0.9) { g.lineWidth = 1.3; g.strokeStyle = up ? cG(0.8 * (1 - pa / 0.9)) : cR(0.8 * (1 - pa / 0.9)); g.beginPath(); g.arc(lx, ly, 4 + pa * 26, 0, TAU); g.stroke(); }
      if (pa < 0.55) glow(g, SPW, lx + (x1 + 8 - lx) * (pa / 0.55), ly, 6, 0.8 * (1 - pa / 0.55));
    }
    g.globalCompositeOperation = 'source-over';
    g.restore();
    // price tag
    const tw = tg.axW - 4; rr(g, x1 + 5, ly - 8.5, tw, 17, 4); g.fillStyle = lcol; g.fill();
    g.fillStyle = '#0a0710'; g.font = '700 9.5px ' + MONO; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(nar ? f0(px) : fmt(px, 1), x1 + 9, ly + 0.5);

    // crosshair + tooltip (mouse hover, touch hold or keyboard)
    if (hv.on && hv.touch && tnow - hv.t > 4200) hv.on = false;
    if (hv.on && hv.x >= x0 && hv.x <= x1 + 4 && hv.y >= y0 && hv.y <= H - tg.timeH) {
      let i = hv.key ? hv.i : Math.round((hv.x - X(0)) / slot); i = clamp(i, 0, n - 1); const c = cands[st + i], cx = Math.round(X(i)) + 0.5, py = hv.y, last = i === n - 1;
      let hm = null, hd = 15;                                    // nearest fired-ticket marker within reach (bigger reach for touch)
      for (let j = 0; j < hits.length; j++) { const h = hits[j], d2 = Math.hypot(h.x - hv.x, h.y - hv.y); if (d2 < hd + (hv.touch ? 10 : 0) && (!hm || d2 < hd)) { hm = h; hd = d2; } }
      if (hm) i = clamp(hm.m.cid - first, 0, n - 1);
      const cc = hm ? cands[st + i] : c, cxx = hm ? Math.round(X(i)) + 0.5 : cx;
      g.setLineDash([3, 3]); g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.moveTo(cxx, y0); g.lineTo(cxx, H - tg.timeH); g.moveTo(x0, Math.round(py) + 0.5); g.lineTo(x1 + 4, Math.round(py) + 0.5); g.stroke(); g.setLineDash([]);
      g.font = '700 9.5px ' + MONO; g.textBaseline = 'middle';
      if (py <= y1) { const pv = yMin + (y1 - py) / tg.ys; rr(g, x1 + 5, py - 8.5, tw, 17, 4); g.fillStyle = '#f4eef6'; g.fill(); g.fillStyle = '#0a0710'; g.textAlign = 'left'; g.fillText(nar ? f0(pv) : fmt(pv, 1), x1 + 9, py + 0.5); }
      const ci = i === n - 1 ? px : cc.c, hi2 = i === n - 1 ? Math.max(cc.h, px) : cc.h, lo2 = i === n - 1 ? Math.min(cc.l, px) : cc.l, upc = ci >= cc.o;
      // time chip on the axis
      const tl = i === n - 1 ? 'now' : '-' + (lastCid - cc.cid) + 'm', tlw = g.measureText(tl).width + 12; rr(g, clamp(cxx - tlw / 2, x0, x1 - tlw + 6), H - tg.timeH + 1, tlw, 14, 4); g.fillStyle = '#f4eef6'; g.fill();
      g.fillStyle = '#0a0710'; g.textAlign = 'center'; g.fillText(tl, clamp(cxx, x0 + tlw / 2, x1 - tlw / 2 + 6), H - tg.timeH + 8.5);
      // ohlc / vwap / volume card (flips to the free side of the cursor)
      const rows = nar ? [['o', f0(cc.o)], ['h', f0(hi2)], ['l', f0(lo2)], ['c', f0(ci)], ['vwap', f0(cc.vw)], ['vol', cc.v.toFixed(1)]]
        : [['open', f0(cc.o)], ['high', f0(hi2)], ['low', f0(lo2)], ['close', f0(ci)], ['vwap', f0(cc.vw) + (cc.sd > 0 ? ' ±' + cc.sd.toFixed(1) : '')], ['volume', cc.v.toFixed(1) + ' btc']];
      const rh2 = 13, cwd = nar ? 104 : 148, chh = rows.length * rh2 + 22;
      let bx = cxx + 14; if (bx + cwd > x1 + 2) bx = cxx - 14 - cwd; bx = Math.max(x0 + 2, bx);
      let by = clamp(py - chh / 2, y0 - 6, y1 - chh + 6);
      if (!hm) {
        rr(g, Math.round(bx), Math.round(by), cwd, chh, 6); g.fillStyle = 'rgba(10,6,16,.92)'; g.fill(); g.strokeStyle = upc ? cG(0.5) : cR(0.5); g.lineWidth = 1; g.stroke();
        g.font = '700 9.5px ' + MONO; g.textAlign = 'left'; g.fillStyle = upc ? '#7ff5cf' : '#ff9aa4'; g.fillText(tl + ' · ' + (upc ? 'up' : 'down') + ' ' + sgnPct((ci / cc.o - 1) * 100), Math.round(bx) + 8, Math.round(by) + 10);
        g.font = '500 9.5px ' + MONO;
        for (let r2 = 0; r2 < rows.length; r2++) { const yy = Math.round(by) + 24 + r2 * rh2; g.textAlign = 'left'; g.fillStyle = '#a79eb6'; g.fillText(rows[r2][0], Math.round(bx) + 8, yy); g.textAlign = 'right'; g.fillStyle = r2 === 4 ? '#ffd77a' : '#f1eaf7'; g.fillText(rows[r2][1], Math.round(bx) + cwd - 8, yy); }
      }
      if (hm) {                                                  // fired-ticket card: action · size · confidence · destination
        const m = hm.m, col = m.kind === 'buy' ? C.green : m.kind === 'sell' ? C.red : C.amber, ln = [(m.act || m.kind) + (m.kind === 'close' ? '' : ' ' + m.size + '%'), 'conf .' + String(Math.round(m.conf * 100)).padStart(2, '0') + ' ≥ floor', 'dest ' + m.dest + ' · ' + (m.venue || 'sim')];
        const mw = 150, mh = 54, mx = clamp(hm.x - mw / 2, x0 + 2, x1 - mw + 4), my = hm.y - 14 - mh < y0 ? hm.y + 14 : hm.y - 14 - mh;
        g.globalCompositeOperation = 'lighter'; glow(g, m.kind === 'buy' ? SP.g : m.kind === 'sell' ? SP.r : SP.a, hm.x, hm.y, 17, 0.8); g.globalCompositeOperation = 'source-over';
        rr(g, Math.round(mx), Math.round(my), mw, mh, 6); g.fillStyle = 'rgba(10,6,16,.95)'; g.fill(); g.strokeStyle = col; g.stroke();
        g.textAlign = 'left'; g.font = '700 10px ' + MONO; g.fillStyle = col; g.fillText('◆ ' + ln[0], Math.round(mx) + 8, Math.round(my) + 11);
        g.font = '500 9.5px ' + MONO; g.fillStyle = '#e9e1f1'; g.fillText(ln[1], Math.round(mx) + 8, Math.round(my) + 26); g.fillStyle = '#b4abc2'; g.fillText(ln[2], Math.round(mx) + 8, Math.round(my) + 40);
      }
    }
    drawBook(t, dt);
    if (tr >= 2) drawPool(fx.pool, g, Math.min(dt, 0.05), 60, 2.2, false);
    if (S.killed) {
      const m = 'KILL SWITCH · NEW ORDERS GO TO REVIEW'; g.font = '700 9.5px ' + MONO;
      const bx = (x1 + x0) / 2 - 150, by = y0 + 8; rr(g, bx, by, 300, 20, 5); g.fillStyle = 'rgba(255,77,94,.16)'; g.fill(); g.strokeStyle = cR(0.7); g.stroke();
      g.fillStyle = C.red; g.textAlign = 'center'; g.fillText(m, bx + 150, by + 10.5);
    }
  }

  /* tape header readouts (4 Hz) */
  const pxEl = $('#dkt-px'), pxdEl = $('#dkt-px-d'), pxpEl = $('#dkt-pxp'), pxcEl = $('#dkt-pxc'), hiEl = $('#dkt-hi'), loEl = $('#dkt-lo'), volEl = $('#dkt-vol');
  function flushTape() {
    const p = M.price, ch = (p / M.open - 1) * 100, up = ch >= 0;
    const ip = Math.floor(p), fr = String(Math.round((p - ip) * 10) % 10);
    setT(pxEl, fmt(ip)); setT(pxdEl, '.' + fr);
    setT(pxcEl, sgnPct(ch)); const ar = pxpEl.firstElementChild; setT(ar, up ? '▲' : '▼'); if (pxpEl.classList.contains('dn') === up) pxpEl.classList.toggle('dn', !up);
    let hi = -1e9, lo = 1e9, v = 0; const n = Math.min(tg.nVis || 70, cands.length);
    for (let i = cands.length - n; i < cands.length; i++) { const c = cands[i]; if (c.h > hi) hi = c.h; if (c.l < lo) lo = c.l; v += c.v; }
    setT(hiEl, f0(hi)); setT(loEl, f0(lo)); setT(volEl, fmt(v, 0) + ' btc');
  }
  let acT = 0;
  J.task(tape, (t, dt) => { drawTape(t, dt); acT += dt; if (acT < 0.25) return; acT = 0; flushTape(); });

