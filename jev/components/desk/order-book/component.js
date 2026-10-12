/* desk-order-book — the live 10 x 10 depth ladder as its own canvas card: size bars, cumulative depth, spread row, imbalance meter and depth heat  (everything here is SIMULATED)
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* API relied on:
 *   JEV.mod(name, init)  JEV.task(el, fn(t,dt))  JEV.fit(canvas)  JEV.watch(el, cb)  JEV.animate(el, kf, opts)
 *   JEV.bus  events: 'tick' ({price, dp}, 4 Hz), 'decision' (d: action, symbol, size, sizeIdx, conf, net, dest, venue, build, state{edge_bps, imbalance, spread_bps})
 *   JEV.market {price, open}   JEV.S {killed, floor, cost, dest{execute,review,skip}}   JEV.C palette   JEV.RULES   JEV.tier   JEV.reduce
 *   JEV.rng(seed)  JEV.fmt  JEV.clamp  JEV.TAU  JEV.AGENTS  JEV.SIZES  JEV.narrow()
 * Safe without the rest of the page: optional DOM and optional JEV facilities are guarded. */
JEV.mod('desk-order-book', () => {
  const J = JEV, $ = J.$, $$ = J.$$, C = J.C, S = J.S, M = J.market, TAU = J.TAU, clamp = J.clamp, fmt = J.fmt;
  const card = $('#dkt-ob'), cv = $('#dkt-obc');
  if (!card || !cv) return;
  const reduce = J.reduce;
  const MONO = "'JetBrains Mono', ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, Consolas, monospace";
  const rgbOf = (h) => { const n = parseInt(h.slice(1), 16); return (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255); };
  const GRN = rgbOf(C.green), RED = rgbOf(C.red), AMB = rgbOf(C.amber), VIO = rgbOf(C.violet), PNK = rgbOf(C.pink);
  const cG = (a) => 'rgba(' + GRN + ',' + a + ')', cR = (a) => 'rgba(' + RED + ',' + a + ')';
  const sgnUsd = (v) => (v >= 0 ? '+$' : '-$') + fmt(Math.abs(Math.round(v)));
  /** soft additive glow sprite (drawn with 'lighter'; replaces shadowBlur) */
  const sprite = (rgb) => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(' + rgb + ',.9)'); gr.addColorStop(.3, 'rgba(' + rgb + ',.3)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c;
  };
  const SP = { g: sprite(GRN), r: sprite(RED), a: sprite(AMB), p: sprite(PNK) };
  const glow = (g, spr, x, y, r, a) => { g.globalAlpha = a; g.drawImage(spr, x - r, y - r, r * 2, r * 2); g.globalAlpha = 1; };
  /* ---- spectacle kit (tier-gated: tier 1 = the page as it always was; reduced motion = off) ---- */
  const tier = () => (reduce ? 1 : (J.tier || 2));
  const SPW = sprite('255,255,255'), SPR = [SP.g, SP.r, SP.a, SP.p, SPW];       // particle sprites: 0 green 1 red 2 amber 3 pink 4 white
  /** bounded particle pool (typed arrays, ring-reused: no allocation per spawn / frame). slot = x y vx vy life max size kind */
  const mkPool = (n) => ({ n, a: new Float32Array(n * 8), c: 0 });
  function spawn(p, x, y, vx, vy, life, size, kind) {
    const a = p.a, o = p.c * 8; p.c = (p.c + 1) % p.n;
    a[o] = x; a[o + 1] = y; a[o + 2] = vx; a[o + 3] = vy; a[o + 4] = life; a[o + 5] = life; a[o + 6] = size; a[o + 7] = kind;
  }
  /** burst of radial sparks; ay = vertical accel (px/s^2, negative rises) */
  function burst(p, x, y, n, kind, speed, life, size, ay) {
    for (let i = 0; i < n; i++) { const an = Math.random() * TAU, sp = speed * (0.35 + Math.random() * 0.75); spawn(p, x, y, Math.cos(an) * sp, Math.sin(an) * sp + (ay || 0) * 0.02, life * (0.6 + Math.random() * 0.6), size * (0.7 + Math.random() * 0.6), Math.random() < 0.25 ? 4 : kind); }
  }
  function drawPool(p, g, dt, ay, drag, flick) {
    const a = p.a, k = Math.exp(-dt * drag); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < p.n; i++) {
      const o = i * 8; let life = a[o + 4]; if (life <= 0) continue;
      life -= dt; a[o + 4] = life; if (life <= 0) continue;
      a[o + 2] *= k; a[o + 3] = a[o + 3] * k + ay * dt; a[o] += a[o + 2] * dt; a[o + 1] += a[o + 3] * dt;
      const f = life / a[o + 5], fl = flick ? 0.65 + 0.35 * Math.sin(life * 38 + i * 1.7) : 1;
      glow(g, SPR[a[o + 7]], a[o], a[o + 1], a[o + 6] * (0.35 + 0.65 * f), Math.min(1, f * 1.6) * fl);
    }
    g.globalCompositeOperation = 'source-over';
  }
  const NB = 10;
  const tfs = (w) => clamp(w / 110, 9.5, 10.5);
  const sim = { imbT: 0, spr: 1.1 };
  const pA = new Float32Array(NB), pB = new Float32Array(NB), sA = new Int8Array(NB), sB = new Int8Array(NB);
  const bkA = new Float32Array(NB), bkB = new Float32Array(NB), tA = new Float32Array(NB), tB = new Float32Array(NB), fA = new Float32Array(NB), fB = new Float32Array(NB);
  const lblA = new Array(NB).fill(''), lblB = new Array(NB).fill('');
  const book = { mid: '', spr: '', sprBps: 0, imb: 0, up: true, mx: 3, gap: 5 };
  const draw1 = (k, imb, bid) => (0.35 + Math.random() * 1.5) * (1 + k * 0.2) * (Math.random() < 0.05 ? 2.4 : 1) * Math.max(0.35, 1 + (bid ? 1 : -1) * 0.6 * imb);
  const retarget = (frac) => {
    for (let k = 0; k < NB; k++) {
      if (Math.random() < frac) { const v = draw1(k, sim.imbT, false); if (Math.abs(v - tA[k]) > 0.6 + 0.4 * tA[k]) { fA[k] = 1; sA[k] = v > tA[k] ? 1 : -1; pA[k] = bkA[k]; if (v < tA[k] * 0.42 && tA[k] > 1) eA[k] = 1; } tA[k] = v; }
      if (Math.random() < frac) { const v = draw1(k, sim.imbT, true); if (Math.abs(v - tB[k]) > 0.6 + 0.4 * tB[k]) { fB[k] = 1; sB[k] = v > tB[k] ? 1 : -1; pB[k] = bkB[k]; if (v < tB[k] * 0.42 && tB[k] > 1) eB[k] = 1; } tB[k] = v; }
    }
  };
  const bookLabels = (price) => {
    const half = Math.max(1, Math.round(price * sim.spr / 2e4)), bb = Math.round(price) - half, ba = Math.round(price) + half;
    for (let k = 0; k < NB; k++) { lblB[k] = fmt(bb - k * 2); lblA[k] = fmt(ba + k * 2); }
    book.mid = fmt(price, 1); book.spr = '$' + (half * 2) + ' · ' + sim.spr.toFixed(1) + 'bp'; book.sprBps = sim.spr; book.gap = half;
  };
  for (let k = 0; k < NB; k++) { tA[k] = bkA[k] = draw1(k, 0, false); tB[k] = bkB[k] = draw1(k, 0, true); }
  bookLabels(M.price);

  const eA = new Int8Array(NB), eB = new Int8Array(NB);              // 'level eaten' flags (a size collapsed): consumed by drawBook
  const fx = { birthT: -1e9, birthN: 0, tickT: -1e9, pool: mkPool(120) };
  let lastPx = M.price;

  J.bus.on('tick', (e) => { book.up = e.price >= lastPx; lastPx = e.price; retarget(0.3); bookLabels(e.price); });
  J.bus.on('decision', (d) => {
    sim.imbT += (clamp(d.state.imbalance, -0.8, 0.8) - sim.imbT) * 0.35;
    sim.spr += (clamp(d.state.spread_bps, 0.5, 3.5) - sim.spr) * 0.2;
  });

  /* the card is the whole canvas: no chart to its left, so the book starts 8 px from the edge */
  const tg = { g: null, W: 0, H: 0, cw: -2, bf: 1, bfMax: 1, nar: false, fs: 9.5 };
  J.watch(cv.parentNode, () => { const r = J.fit(cv); tg.g = r.g; tg.W = r.W; tg.H = r.H; tg.fs = tfs(r.W); tg.nar = r.W - 16 < 150; });

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

  J.task(card, (t, dt) => {
    const g = tg.g; if (!g) return;
    g.clearRect(0, 0, tg.W, tg.H);
    drawBook(t, dt);
    if (tier() >= 2) drawPool(fx.pool, g, Math.min(dt, 0.05), 60, 2.2, false);
  });
});
