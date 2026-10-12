/* desk/posterior-curve — one posterior density, re-centred on every 'decision' (everything here is SIMULATED)
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* used: JEV.mod $ C S clamp fmt gauss TAU rnd fit watch task onView animate reduce DPR tier; JEV.bus 'decision' (d.state.edge_bps, d.state.imbalance, d.conf), 'tick' ({price, dp}), kill via JEV.S.killed
 * Safe without the rest of the page: every DOM lookup is guarded. */
JEV.mod('desk-posterior-curve', () => {
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
  /** the bayes model: prior N(mp, sp) x book likelihood N(ml, sl) -> posterior; means ride a damped spring, the book re-centres on every decision */
  const makeModel = () => {
    const NSP = 120, SPK = new Float32Array(NSP);
    const B = { mp: 0.54, sp: 0.095, ml: 0.676, sl: 0.072, tmp: 0.54, tml: 0.676, tsl: 0.072, bias: 0.1, flash: 0, ring: 1, n: 1204, spT: 0, si: 0, vp: 0, vl: 0, post: 0.627, ps: 0.057, dmp: 0.54, dsp: 0.095, dml: 0.676, dsl: 0.072 };
    const solve = () => { const a = 1 / (B.dsp * B.dsp), b = 1 / (B.dsl * B.dsl), s2 = 1 / (a + b); B.post = (B.dmp * a + B.dml * b) * s2; B.ps = Math.sqrt(s2); };
    solve();
    { let v = B.post; for (let i = NSP - 1; i >= 0; i--) { SPK[i] = v; v += (0.52 - v) * 0.03 + (Math.random() - 0.5) * 0.022; } SPK[NSP - 1] = B.post; }
    const dyn = (t, dt) => {
      const sq = Math.sqrt(dt), k4 = 1 - Math.exp(-dt * 3.2), h = Math.min(dt, 0.04);
      B.bias *= Math.exp(-dt / 10);
      B.tml += (0.5 + B.bias - B.tml) * (1 - Math.exp(-dt * 0.5)) + gauss() * 0.075 * sq;
      B.tmp += (0.535 - B.tmp) * (1 - Math.exp(-dt * 0.05)) + gauss() * 0.03 * sq;
      B.tml = clamp(B.tml, 0.26, 0.82); B.tmp = clamp(B.tmp, 0.34, 0.7);
      B.vp += ((B.tmp - B.mp) * 150 - B.vp * 15) * h; B.mp += B.vp * h;
      B.vl += ((B.tml - B.ml) * 150 - B.vl * 15) * h; B.ml += B.vl * h;
      B.sl += ((S.killed ? 0.15 : B.tsl) - B.sl) * k4; B.sp += (0.095 - B.sp) * k4;
      B.dmp = B.mp; B.dml = B.ml; B.dsp = B.sp * (1 + 0.1 * Math.sin(t * 0.7)); B.dsl = B.sl * (1 + 0.12 * Math.sin(t * 1.1 + 1.3));
      solve();
      B.flash *= Math.exp(-dt * 2.4); if (B.ring < 1) B.ring += dt * 1.5;
      B.spT += dt; if (B.spT >= 0.25) { B.spT -= 0.25; SPK[B.si] = B.post; B.si = (B.si + 1) % NSP; }
    };
    const nudge = (d) => {
      const st = (d && d.state) || {}, e = +st.edge_bps || 0, im = +st.imbalance || 0;
      B.bias = clamp(e / 60, -1, 1) * 0.2 + im * 0.06;
      B.tmp += (B.post - B.tmp) * 0.25;
      B.tml = 0.5 + B.bias; if (Math.abs(B.tml - B.tmp) < 0.045) B.tml = B.tmp + (B.tml >= B.tmp ? 0.045 : -0.045);
      B.tsl = clamp(0.1 - ((d && d.conf) || 0.7) * 0.05, 0.045, 0.09);
      B.flash = 1; B.ring = 0; B.n++;
    };
    J.bus.on('decision', nudge);
    J.bus.on('tick', (k) => { if (k && k.price) B.bias = clamp(B.bias + clamp((k.dp / k.price) * 250, -0.008, 0.008), -0.3, 0.3); });
    return { B, SPK, NSP, dyn };
  };
  const card = $('#dkpc'), wrap = $('#dkpc-w'), cs = $('#dkpc-s'), cd = $('#dkpc-c');
  if (!card || !wrap || !cs || !cd) return;
  const eMu = $('#dkpc-mu'), eSd = $('#dkpc-sd');
  const { B, dyn } = makeModel();
  const X0 = 0.2, X1 = 1.0, PEAK = 10.5, MAXP = 220, NE = 44;
  const YO = new Float32Array(MAXP), XS = new Float32Array(MAXP);
  const EX = new Float32Array(NE), EY = new Float32Array(NE), EV = new Float32Array(NE), EA = new Float32Array(NE), EM = new Float32Array(NE), EZ = new Float32Array(NE);
  const SPR = { ok: sprite('46,230,166'), kill: sprite('255,77,94') };
  const ST = {
    ok: { rgb: '46,230,166', crgb: '141,255,208', coreS: '#8dffd0', hrgb: '212,255,238', tail: 'rgba(141,255,208,.24)', fillTop: 'rgba(46,230,166,.6)', fillMid: 'rgba(46,230,166,.22)', fillBot: 'rgba(46,230,166,.02)', wh: 'rgba(212,255,238,' },
    kill: { rgb: '255,77,94', crgb: '255,143,154', coreS: '#ff8f9a', hrgb: '255,214,218', tail: 'rgba(255,143,154,.24)', fillTop: 'rgba(255,77,94,.55)', fillMid: 'rgba(255,77,94,.2)', fillBot: 'rgba(255,77,94,.02)', wh: 'rgba(255,214,218,' },
  };
  const PRB = { on: false, x: 0, k: '', t: -9, w: 90, cv: document.createElement('canvas') };
  cd.addEventListener('pointerdown', (e) => { PRB.on = true; PRB.x = e.offsetX; });
  cd.addEventListener('pointermove', (e) => { PRB.on = true; PRB.x = e.offsetX; });
  cd.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') PRB.on = false; });
  cd.addEventListener('pointerleave', () => { PRB.on = false; });
  cd.addEventListener('pointercancel', () => { PRB.on = false; });
  cd.addEventListener('blur', () => { PRB.on = false; });
  cd.addEventListener('keydown', (e) => {
    const k = e.key, d = e.shiftKey ? 30 : 10;
    if (!PRB.on) { PRB.on = true; PRB.x = L + pw * ((B.post - X0) / (X1 - X0)); }
    if (k === 'ArrowLeft') PRB.x -= d; else if (k === 'ArrowRight') PRB.x += d; else if (k === 'Escape') PRB.on = false; else return;
    PRB.x = clamp(PRB.x, L, L + pw); e.preventDefault();
  });
  let W = 0, H = 0, gs = null, gd = null, np = 0, L = 12, pw = 0, baseY = 0, curveH = 0, scale = 1, ok = false, domT = 9;
  const px = (p) => L + ((p - X0) / (X1 - X0)) * pw;
  const drawStatic = () => {
    const g = gs; g.clearRect(0, 0, W, H);
    g.font = '9px ' + MONO; g.textBaseline = 'alphabetic'; g.lineWidth = 1;
    for (let k = 1; k <= 3; k++) { const y = Math.round(baseY - (curveH * k) / 4) + 0.5; g.strokeStyle = 'rgba(255,255,255,.04)'; g.beginPath(); g.moveTo(L, y); g.lineTo(L + pw, y); g.stroke(); }
    g.textAlign = 'center';
    for (let p = 0.3; p < 0.9001; p += 0.1) {
      const x = Math.round(px(p)) + 0.5, half = Math.abs(p - 0.5) < 0.01;
      g.setLineDash(half ? DASH : NODASH); g.strokeStyle = half ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.055)';
      g.beginPath(); g.moveTo(x, half ? 6 : baseY - curveH); g.lineTo(x, baseY + 4); g.stroke(); g.setLineDash(NODASH);
      g.fillStyle = half ? 'rgba(240,233,248,.95)' : 'rgba(181,172,196,.82)'; g.fillText(String(Math.round(p * 100)), x, baseY + 15);
    }
    g.strokeStyle = 'rgba(255,255,255,.26)'; g.beginPath(); g.moveTo(L, baseY + 0.5); g.lineTo(L + pw, baseY + 0.5); g.stroke();
    g.textAlign = 'left'; g.fillStyle = 'rgba(170,161,184,.9)'; g.font = '8.5px ' + MONO; g.fillText('P(up 5m) % · simulated', L, H - 3);
    g.textAlign = 'right'; g.fillText('50 = coin flip', L + pw, H - 3);
  };
  const lay = () => {
    const a = J.fit(cs), b = J.fit(cd);
    W = a.W; H = a.H; gs = a.g; gd = b.g; ok = W > 150 && H > 120;
    if (!ok) return;
    L = 12; pw = W - 24; baseY = H - 34; curveH = baseY - 34; scale = (curveH * 0.97) / PEAK;
    np = Math.min(MAXP, Math.max(60, Math.round(pw / 2.4)));
    for (let i = 0; i < np; i++) XS[i] = L + (pw * i) / (np - 1);
    for (const k of ['ok', 'kill']) {
      const s = ST[k];
      const f = gd.createLinearGradient(0, baseY - curveH, 0, baseY); f.addColorStop(0, s.fillTop); f.addColorStop(0.55, s.fillMid); f.addColorStop(1, s.fillBot); s.fill = f;
      const fade = (rgb, a0, a1) => { const q = gd.createLinearGradient(0, baseY, 0, baseY - curveH * 0.6); q.addColorStop(0, 'rgba(' + rgb + ',' + a0 + ')'); q.addColorStop(1, 'rgba(' + rgb + ',' + a1 + ')'); return q; };
      s.g10 = fade(s.rgb, 0, 0.075); s.g4 = fade(s.rgb, 0, 0.2); s.core = fade(s.crgb, 0.1, 1); s.hot = fade(s.hrgb, 0, 1);
    }
    drawStatic();
  };
  J.watch(wrap, lay); afterReveal(card, lay);
  onFonts.push(() => { if (ok) drawStatic(); });
  const curveY = (m, s, out) => { const k = scale / (s * 2.5066), c = -0.5 / (s * s), dx = (X1 - X0) / (np - 1); for (let i = 0; i < np; i++) { const d = X0 + dx * i - m; out[i] = baseY - k * Math.exp(c * d * d); } };
  const trace = (g, ys) => { g.beginPath(); g.moveTo(XS[0], ys[0]); for (let i = 1; i < np; i++) g.lineTo(XS[i], ys[i]); };
  const seg = (g, a, b, w, style) => { a = Math.max(0, Math.floor(a)); b = Math.min(np - 1, Math.ceil(b)); if (b <= a) return; g.beginPath(); g.moveTo(XS[a], YO[a]); for (let i = a + 1; i <= b; i++) g.lineTo(XS[i], YO[i]); g.lineWidth = w; g.strokeStyle = style; g.stroke(); };
  const spawn = (i) => {
    const x = clamp(B.post + B.ps * gauss(), X0 + 0.02, X1 - 0.02), d = x - B.post, h = (scale / (B.ps * 2.5066)) * Math.exp((-0.5 * d * d) / (B.ps * B.ps));
    EX[i] = px(x); EY[i] = baseY - h * J.rnd(0.04, 0.98); EV[i] = J.rnd(9, 24); EM[i] = J.rnd(1.1, 2.5); EA[i] = 0; EZ[i] = J.rnd(4, 9);
  };
  for (let i = 0; i < NE; i++) { EM[i] = J.rnd(1.1, 2.5); EA[i] = -J.rnd(0, 2.5); EV[i] = 12; EX[i] = -50; EY[i] = 0; EZ[i] = 5; }
  J.task(card, (t, dt) => {
    if (!ok) return;
    dyn(t, dt);
    const g = gd, kill = S.killed, st = kill ? ST.kill : ST.ok;
    g.clearRect(0, 0, W, H); curveY(B.post, B.ps, YO);
    g.lineJoin = 'round'; g.lineCap = 'round'; g.globalCompositeOperation = 'lighter';
    trace(g, YO); g.lineWidth = 11; g.strokeStyle = st.g10; g.stroke(); g.lineWidth = 5; g.strokeStyle = st.g4; g.stroke();
    if (B.flash > 0.03) { g.globalAlpha = Math.min(1, B.flash * 0.6); g.lineWidth = 6; g.strokeStyle = st.hot; g.stroke(); g.globalAlpha = 1; }
    g.lineTo(XS[np - 1], baseY); g.lineTo(XS[0], baseY); g.closePath(); g.fillStyle = st.fill; g.fill();
    g.globalCompositeOperation = 'source-over';
    trace(g, YO); g.lineWidth = 1.9; g.strokeStyle = st.core; g.stroke();
    // embers: samples drawn from the posterior
    g.globalCompositeOperation = 'lighter';
    const spr = kill ? SPR.kill : SPR.ok;
    for (let i = 0; i < NE; i++) {
      const was = EA[i]; EA[i] += dt;
      if (EA[i] >= EM[i] || (was < 0 && EA[i] >= 0)) spawn(i);
      if (EA[i] < 0) continue;
      EY[i] -= EV[i] * dt; const a = Math.sin((EA[i] / EM[i]) * Math.PI), r = EZ[i];
      g.globalAlpha = a; g.drawImage(spr, EX[i] - r, EY[i] - r, r * 2, r * 2);
    }
    g.globalAlpha = 1;
    if (FX_ON()) { // plasma ribbon: a travelling highlight rides the curve
      const sw = np + 40, h1 = ((t * 0.32) % 1) * sw - 20;
      seg(g, h1 - 22, h1 - 11, 2.2, st.wh + '.35)'); seg(g, h1 - 11, h1 - 4, 2.8, st.wh + '.7)'); seg(g, h1 - 4, h1, 3.4, st.wh + '1)');
      if (B.ring < 1) { const pi = (B.post - X0) / (X1 - X0) * (np - 1), hw = B.ring * np * 0.55; g.globalAlpha = 1 - B.ring; seg(g, pi + hw - 9, pi + hw, 4.2, st.wh + '.95)'); seg(g, pi - hw, pi - hw + 9, 4.2, st.wh + '.95)'); g.globalAlpha = 1; }
    }
    if (B.ring < 1) { const pk = baseY - scale / (B.ps * 2.5066), r = 5 + B.ring * 40; g.globalAlpha = (1 - B.ring) * 0.8; g.lineWidth = 1.5; g.strokeStyle = st.coreS; g.beginPath(); g.arc(px(B.post), pk, r, 0, TAU); g.stroke(); g.globalAlpha = 1; }
    g.globalCompositeOperation = 'source-over';
    // mean tick
    const xm = Math.round(px(B.post)) + 0.5;
    g.setLineDash(DASH); g.lineWidth = 1; g.strokeStyle = 'rgba(' + st.crgb + ',.45)'; g.beginPath(); g.moveTo(xm, 8); g.lineTo(xm, baseY); g.stroke(); g.setLineDash(NODASH);
    // probe: P(up > x) for the pointer's x, the upper tail lights up
    if (PRB.on) {
      const xp = clamp(PRB.x, L, L + pw), pv = X0 + ((xp - L) / pw) * (X1 - X0), tail = 0.5 * (1 - erf((pv - B.post) / (B.ps * 1.41421)));
      let i0 = 0; while (i0 < np - 1 && XS[i0] < xp) i0++;
      g.globalCompositeOperation = 'lighter'; g.beginPath(); g.moveTo(xp, baseY); g.lineTo(xp, YO[i0]);
      for (let i = i0; i < np; i++) g.lineTo(XS[i], YO[i]);
      g.lineTo(XS[np - 1], baseY); g.closePath(); g.fillStyle = st.tail; g.fill(); g.globalCompositeOperation = 'source-over';
      g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(Math.round(xp) + 0.5, 20); g.lineTo(Math.round(xp) + 0.5, baseY); g.stroke();
      if (t - PRB.t > 0.08) { PRB.t = t; const txt = 'P(up > ' + (pv * 100).toFixed(0) + ') = ' + (tail * 100).toFixed(0) + '%'; if (txt !== PRB.k) { PRB.k = txt; PRB.w = txt.length * 5.6 + 12; bake(PRB.cv, txt, PRB.w, 15, 'rgba(10,6,16,.9)', 'rgba(255,255,255,.7)', '#fff', F_TAG); } }
      g.drawImage(PRB.cv, clamp(xp + 8 + PRB.w > W - 3 ? xp - 8 - PRB.w : xp + 8, 3, W - PRB.w - 3), 22, PRB.w, 15);
      const z = (pv - B.post) / B.ps, y = baseY - (scale / (B.ps * 2.5066)) * Math.exp(-0.5 * z * z);
      g.beginPath(); g.arc(xp, y, 3.2, 0, TAU); g.fillStyle = kill ? '#ffc3c9' : '#9dffd9'; g.fill(); g.lineWidth = 1; g.strokeStyle = 'rgba(10,6,16,.9)'; g.stroke();
    }
    domT += dt;
    if (domT >= 0.25 || J.reduce) { domT = 0; setT(eMu, (B.post * 100).toFixed(1)); setT(eSd, (B.ps * 100).toFixed(1)); }
  });
});
