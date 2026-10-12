/* desk/end-histogram — live histogram of the current equity of 140 simulated random walks (everything here is SIMULATED)
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot()
 * JEV.* used: JEV.mod $ S clamp gauss fit watch task onView reduce DPR tier; kill via JEV.S.killed (the walk halts)
 * Safe without the rest of the page: every DOM lookup is guarded. */
JEV.mod('desk-end-histogram', () => {
  const J = JEV, $ = J.$, C = J.C, S = J.S, clamp = J.clamp, fmt = J.fmt, gauss = J.gauss, TAU = J.TAU;
  const MONO = "'JetBrains Mono', ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, Consolas, monospace";
  const setT = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  const sgn = (v, d) => (v >= 0 ? '+' : '-') + Math.abs(v).toFixed(d == null ? 1 : d);
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  /** soft additive glow sprite (drawn with 'lighter'; replaces shadowBlur) */
  const sprite = (rgb) => {
    const c = document.createElement('canvas'); c.width = c.height = 48;
    const g = c.getContext('2d'), gr = g.createRadialGradient(24, 24, 0, 24, 24, 24);
    gr.addColorStop(0, 'rgba(' + rgb + ',1)'); gr.addColorStop(.28, 'rgba(' + rgb + ',.35)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, 48, 48); return c;
  };
  /** bake a pill label to a tiny sprite (text is the costly part of a canvas frame; re-baked only when the label changes) */
  const bake = (cv, txt, w, h, fill, stroke, color, font) => {
    cv.width = Math.round(w * J.DPR); cv.height = Math.round(h * J.DPR);
    const g = cv.getContext('2d'); g.setTransform(J.DPR, 0, 0, J.DPR, 0, 0);
    rr(g, 0.5, 0.5, w - 1, h - 1, 4); g.fillStyle = fill; g.fill(); g.strokeStyle = stroke; g.lineWidth = 1; g.stroke();
    g.font = font; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = color; g.fillText(txt, w / 2, h / 2 + 3.4);
  };
  const onFonts = []; // canvas text needs the web font loaded; redraw static layers once it is
  try { if (document.fonts && document.fonts.load) Promise.all([document.fonts.load("700 9px 'JetBrains Mono'"), document.fonts.load("9px 'JetBrains Mono'")]).then(() => onFonts.forEach((f) => f())).catch(() => {}); } catch (e) { /* ignore */ }
  const erf = (x) => { const sg = x < 0 ? -1 : 1, a = Math.abs(x), t = 1 / (1 + 0.3275911 * a); return sg * (1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) * Math.exp(-a * a)); };
  const TIER = () => (J.tier || 2);
  const FX_ON = () => TIER() >= 2 && !J.reduce;
  const DASH = [3, 4], DOT = [1.5, 3.5], NODASH = [], F_TAG = '700 9px ' + MONO;
  /** cards reveal with a small scale (.rv): re-fit once the reveal settles */
  const afterReveal = (card, fn) => { card.addEventListener('transitionend', (e) => { if (e.target === card && e.propertyName === 'transform') fn(); }); J.onView(card, () => setTimeout(fn, 1300), { threshold: 0.05 }); };
  /** 140 random walks with a small positive drift (mu per step) and noise sigma; the colour of a value goes hot pink (loss) -> violet -> blue -> cyan -> green -> amber (big win) */
  const STOPS = [[-150, 255, 46, 110], [-50, 166, 107, 255], [40, 77, 141, 255], [120, 92, 225, 255], [190, 46, 230, 166], [290, 255, 193, 61], [420, 255, 226, 170]];
  const ramp = (v) => {
    let i = 1; while (i < STOPS.length - 1 && v > STOPS[i][0]) i++;
    const a = STOPS[i - 1], b = STOPS[i], f = clamp((v - a[0]) / (b[0] - a[0]), 0, 1);
    return ((a[1] + (b[1] - a[1]) * f) | 0) + ',' + ((a[2] + (b[2] - a[2]) * f) | 0) + ',' + ((a[3] + (b[3] - a[3]) * f) | 0);
  };
  const N = 140, T = 220, MU0 = 0.8, SG0 = 8.6, RATE = T / 7.2, HOLD = 3.2, PRE = 44;
  /** the simulation: every path's current value in V; steps at RATE per second, holds HOLD s when finished, then rolls a new run (paused while the kill switch is thrown) */
  const makeSim = () => {
    const V = new Float32Array(N), VS = new Float32Array(N);
    const Q = { V, mu: MU0, sg: SG0, step: 0, phase: 0, phT: 0, acc: 0, poolW: 0, poolN: 0, runs: 0, fresh: false };
    const roll = (pre) => {
      Q.mu = MU0 * (0.94 + Math.random() * 0.12); Q.sg = SG0 * (0.97 + Math.random() * 0.06);
      for (let i = 0; i < N; i++) { VS[i] = Q.sg * (0.82 + Math.random() * 0.36); V[i] = 0; }
      Q.step = 0; Q.acc = 0; Q.phase = 0; Q.phT = 0; Q.fresh = true;
      for (let k = 0; k < pre; k++) tick1();
    };
    const tick1 = () => { for (let i = 0; i < N; i++) V[i] += Q.mu + VS[i] * gauss(); Q.step++; };
    Q.wins = () => { let w = 0; for (let i = 0; i < N; i++) if (V[i] > 0) w++; return w; };
    Q.mean = () => { let s = 0; for (let i = 0; i < N; i++) s += V[i]; return s / N; };
    Q.advance = (dt, killed) => {
      if (J.reduce) { while (Q.step < T) tick1(); if (Q.phase === 0) { Q.phase = 1; Q.poolW += Q.wins(); Q.poolN += N; Q.runs++; } return; }
      if (killed) return;
      if (Q.phase === 0) {
        Q.acc += dt * RATE; let n = Math.min(Math.floor(Q.acc), T - Q.step); if (n > 0) { Q.acc -= n; while (n--) tick1(); }
        if (Q.step >= T) { Q.phase = 1; Q.phT = 0; Q.poolW += Q.wins(); Q.poolN += N; Q.runs++; }
      } else { Q.phT += dt; if (Q.phT > HOLD) roll(PRE); }
    };
    // the first run is pre-resolved from the endpoint distribution so the pooled caption never starts empty
    { let w = 0; for (let i = 0; i < N; i++) if (MU0 * T + SG0 * Math.sqrt(T) * gauss() > 0) w++; Q.poolW = w; Q.poolN = N; Q.runs = 1; }
    roll(PRE);
    return Q;
  };
  const card = $('#dkeh'), wrap = $('#dkeh-w'), cs = $('#dkeh-s'), co = $('#dkeh-o'); if (!card || !wrap || !cs || !co) return;
  const eTr = $('#dkeh-tr'), ePP = $('#dkeh-pp');
  const sim = makeSim(), V = sim.V;
  const NBIN = 30, NB = 14, VMIN = -150, VSTEP = 600 / NB;
  const lo = MU0 * T - 3.1 * SG0 * Math.sqrt(T), hi = MU0 * T + 3.0 * SG0 * Math.sqrt(T), invR = 1 / (hi - lo);
  const HB = new Float32Array(NBIN), HC = new Uint16Array(NBIN), BAR = [];
  for (let q = 0; q < NB; q++) BAR[q] = 'rgba(' + ramp(VMIN + (q + 0.5) * VSTEP) + ',.85)';
  const bk = (v) => clamp(Math.floor((v - VMIN) / VSTEP), 0, NB - 1);
  let W = 0, H = 0, gs = null, go = null, ok = false, padL = 40, padR = 12, padT = 24, padB = 14, pw = 0, ph = 0, my = 0, snap = true, domT = 9, meanStr = '+0', meanW = 40;
  const meanCv = document.createElement('canvas'), haltCv = document.createElement('canvas');
  const PRD = { on: false, x: 0, y: 0, k: '', t: -9, w: 100, cv: document.createElement('canvas') };
  const pos = (e) => { PRD.on = true; PRD.x = e.offsetX; PRD.y = e.offsetY; };
  co.addEventListener('pointermove', pos); co.addEventListener('pointerdown', pos);
  co.addEventListener('pointerleave', () => { PRD.on = false; }); co.addEventListener('pointercancel', () => { PRD.on = false; });
  co.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') PRD.on = false; });
  co.addEventListener('blur', () => { PRD.on = false; });
  co.addEventListener('keydown', (e) => {
    const k = e.key, d = e.shiftKey ? 24 : 8;
    if (!PRD.on) { PRD.on = true; PRD.x = padL + pw * 0.5; PRD.y = my; }
    if (k === 'ArrowUp') PRD.y -= d; else if (k === 'ArrowDown') PRD.y += d; else if (k === 'Escape') PRD.on = false; else return;
    PRD.y = clamp(PRD.y, padT + 1, padT + ph - 1); e.preventDefault();
  });
  const yPx = (v) => padT + ph - (v - lo) * invR * ph;
  const bakeMean = () => { meanW = meanStr.length * 5.6 + 12; bake(meanCv, 'mean ' + meanStr, meanW + 28, 15, 'rgba(10,6,16,.88)', 'rgba(255,255,255,.55)', '#fff', F_TAG); };
  const bakeHalt = () => bake(haltCv, 'HALTED · NO ORDERS, NO WALK', 168, 22, 'rgba(40,6,12,.86)', 'rgba(255,77,94,.8)', '#ff9aa4', '700 9.5px ' + MONO);
  const drawStatic = () => {
    const g = gs; g.clearRect(0, 0, W, H); g.lineWidth = 1; g.font = '9px ' + MONO; g.textBaseline = 'alphabetic';
    const rng = hi - lo, p10 = Math.pow(10, Math.floor(Math.log10(rng / 4))), nn = rng / 4 / p10, stp = (nn < 1.5 ? 1 : nn < 3.5 ? 2 : nn < 7.5 ? 5 : 10) * p10;
    g.textAlign = 'right';
    for (let v = Math.ceil(lo / stp) * stp; v <= hi; v += stp) {
      const y = Math.round(yPx(v)) + 0.5, zero = Math.abs(v) < 1e-6;
      g.setLineDash(zero ? DASH : NODASH); g.strokeStyle = zero ? 'rgba(255,255,255,.3)' : 'rgba(255,255,255,.05)';
      g.beginPath(); g.moveTo(padL, y); g.lineTo(padL + pw, y); g.stroke(); g.setLineDash(NODASH);
      g.fillStyle = zero ? 'rgba(240,233,248,.95)' : 'rgba(181,172,196,.82)'; g.fillText(zero ? '0' : (v > 0 ? '+' : '') + Math.round(v), padL - 6, y + 3);
    }
    g.textAlign = 'left'; g.fillStyle = 'rgba(170,161,184,.9)'; g.font = '8.5px ' + MONO; g.fillText('equity · bps of capital · simulated', padL - 30, 12);
    g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(padL, padT, 1, ph);
  };
  const lay = () => {
    const a = J.fit(cs), b = J.fit(co); gs = a.g; go = b.g; W = a.W; H = a.H; ok = W > 150 && H > 150; if (!ok) return;
    padL = 40; padR = 12; pw = W - padL - padR; ph = H - padT - padB; drawStatic(); my = yPx(0); bakeMean(); bakeHalt(); snap = true;
  };
  J.watch(wrap, lay); afterReveal(card, lay);
  onFonts.push(() => { if (!ok) return; drawStatic(); bakeMean(); bakeHalt(); });
  J.task(card, (t, dt) => {
    sim.advance(dt, S.killed);
    if (!ok) return;
    const g = go, killed = S.killed, o = sim.step; g.clearRect(0, 0, W, H);
    HC.fill(0);
    for (let i = 0; i < N; i++) { const v = (V[i] - lo) * invR * NBIN; if (v >= 0 && v < NBIN) HC[v | 0]++; }
    const fxo = FX_ON(), sn = snap || J.reduce, binH = ph / NBIN, kb = sn ? 1 : 1 - Math.exp(-dt * 14);
    g.globalCompositeOperation = 'lighter';
    for (let b = 0; b < NBIN; b++) {
      HB[b] += (Math.min(1, HC[b] * (1 / (N * 0.1))) - HB[b]) * kb;
      const wob = fxo ? 1 + 0.07 * Math.sin(t * 2.6 + b * 0.55) + 0.04 * Math.sin(t * 4.3 - b * 0.9) : 1, w = Math.min(pw - 2, HB[b] * (pw - 2) * wob); if (w < 0.7) continue;
      const y = padT + ph - (b + 1) * binH + 0.6;
      g.fillStyle = BAR[bk(lo + ((b + 0.5) / NBIN) * (hi - lo))]; g.fillRect(padL + 1, y, w, Math.max(1, binH - 1.2));
      if (fxo && w > 4) { g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(padL + 1 + w - 2, y, 2, Math.max(1, binH - 1.2)); }
    }
    snap = false; g.globalCompositeOperation = 'source-over';
    // the sample mean rides along the axis
    const mv = sim.mean(); my += (yPx(mv) - my) * (sn ? 1 : 1 - Math.exp(-dt * 13));
    g.setLineDash(DOT); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1; g.beginPath(); g.moveTo(padL, my + 0.5); g.lineTo(padL + pw - meanW - 34, my + 0.5); g.stroke(); g.setLineDash(NODASH);
    g.drawImage(meanCv, padL + pw - meanW - 32, my - 7.5, meanW + 28, 15);
    // probe: a level line, the share of paths above it and the count in the bin under it
    if (PRD.on && PRD.y > padT && PRD.y < padT + ph) {
      const thr = lo + (1 - (PRD.y - padT) / ph) * (hi - lo), bin = clamp(Math.floor((1 - (PRD.y - padT) / ph) * NBIN), 0, NBIN - 1); let above = 0;
      for (let i = 0; i < N; i++) if (V[i] > thr) above++;
      g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(padL + 1, padT + ph - (bin + 1) * binH, pw - 2, binH);
      g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,.65)'; g.beginPath(); g.moveTo(padL, Math.round(PRD.y) + 0.5); g.lineTo(padL + pw, Math.round(PRD.y) + 0.5); g.stroke();
      if (t - PRD.t > 0.08) { PRD.t = t; const txt = sgn(thr, 0) + 'bp · ' + Math.round((above / N) * 100) + '% above · ' + HC[bin] + ' in bin'; if (txt !== PRD.k) { PRD.k = txt; PRD.w = txt.length * 5.6 + 12; bake(PRD.cv, txt, PRD.w, 15, 'rgba(10,6,16,.9)', 'rgba(255,255,255,.7)', '#fff', F_TAG); } }
      g.drawImage(PRD.cv, padL + 8, clamp(PRD.y - 19, padT + 2, padT + ph - 17), PRD.w, 15);
    }
    if (killed) { g.fillStyle = 'rgba(255,60,80,.07)'; g.fillRect(padL, padT, pw, ph); g.drawImage(haltCv, padL + pw / 2 - 84, padT + ph / 2 - 11, 168, 22); }
    domT += dt;
    if (domT >= 0.25 || J.reduce) {
      domT = 0; setT(eTr, String(o)); setT(ePP, ((sim.wins() / N) * 100).toFixed(1) + '%');
      const ms = sgn(mv, 0); if (ms !== meanStr) { meanStr = ms; bakeMean(); }
    }
  });
});
