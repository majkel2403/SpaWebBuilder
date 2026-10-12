/* desk/three-curves — prior x book likelihood = posterior, three densities with colour tags (everything here is SIMULATED)
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot()
 * JEV.* used: JEV.mod $ C S clamp fmt gauss TAU fit watch task onView animate reduce DPR tier; JEV.bus 'decision' (d.state.edge_bps, d.state.imbalance, d.conf), 'tick' ({price, dp}), kill via JEV.S.killed
 * Safe without the rest of the page: every DOM lookup is guarded. */
JEV.mod('desk-three-curves', () => {
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
  const card = $('#dkb3'), wrap = $('#dkb3-w'), cs = $('#dkb3-s'), cd = $('#dkb3-c');
  if (!card || !wrap || !cs || !cd) return;
  const lg = { pm: $('#dkb3-pm'), ps: $('#dkb3-ps'), lm: $('#dkb3-lm'), ls: $('#dkb3-ls'), om: $('#dkb3-om'), os: $('#dkb3-os') }, eN = $('#dkb3-n');
  const { B, dyn } = makeModel();
  const X0 = 0.2, X1 = 1.0, PEAK = 10.5, MAXP = 220;
  const YP = new Float32Array(MAXP), YL = new Float32Array(MAXP), YO = new Float32Array(MAXP), XS = new Float32Array(MAXP);
  const TAG = [
    { f: 'rgba(255,193,61,.15)', s: 'rgba(255,193,61,.7)', t: '#ffd47a', l: 'rgba(255,193,61,.5)' },
    { f: 'rgba(77,141,255,.17)', s: 'rgba(106,163,255,.75)', t: '#9cc2ff', l: 'rgba(106,163,255,.55)' },
    { f: 'rgba(46,230,166,.17)', s: 'rgba(46,230,166,.85)', t: '#9dffd9', l: 'rgba(200,255,235,.6)' },
  ];
  const ST = {
    ok: { rgb: '46,230,166', crgb: '141,255,208', coreS: '#8dffd0', fillTop: 'rgba(46,230,166,.6)', fillMid: 'rgba(46,230,166,.22)', fillBot: 'rgba(46,230,166,.02)' },
    kill: { rgb: '255,77,94', crgb: '255,143,154', coreS: '#ff8f9a', fillTop: 'rgba(255,77,94,.55)', fillMid: 'rgba(255,77,94,.2)', fillBot: 'rgba(255,77,94,.02)' },
  };
  let W = 0, H = 0, gs = null, gd = null, np = 0, L = 12, pw = 0, baseY = 0, curveH = 0, scale = 1, ok = false, domT = 9, lastN = 0;
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
    W = a.W; H = a.H; gs = a.g; gd = b.g; ok = W > 150 && H > 150;
    if (!ok) return;
    L = 12; pw = W - 24; baseY = H - 34; curveH = baseY - 58; scale = (curveH * 0.97) / PEAK;
    np = Math.min(MAXP, Math.max(60, Math.round(pw / 2.4)));
    for (let i = 0; i < np; i++) XS[i] = L + (pw * i) / (np - 1);
    for (const k of ['ok', 'kill']) {
      const s = ST[k], f = gd.createLinearGradient(0, baseY - curveH, 0, baseY); f.addColorStop(0, s.fillTop); f.addColorStop(0.55, s.fillMid); f.addColorStop(1, s.fillBot); s.fill = f;
      const fade = (rgb, a0, a1) => { const q = gd.createLinearGradient(0, baseY, 0, baseY - curveH * 0.6); q.addColorStop(0, 'rgba(' + rgb + ',' + a0 + ')'); q.addColorStop(1, 'rgba(' + rgb + ',' + a1 + ')'); return q; };
      s.g10 = fade(s.rgb, 0, 0.075); s.g4 = fade(s.rgb, 0, 0.2); s.core = fade(s.crgb, 0.1, 1);
    }
    drawStatic();
  };
  J.watch(wrap, lay); afterReveal(card, lay);
  onFonts.push(() => { TAGK[0] = TAGK[1] = TAGK[2] = ''; if (ok) drawStatic(); });
  const curveY = (m, s, out) => { const k = scale / (s * 2.5066), c = -0.5 / (s * s), dx = (X1 - X0) / (np - 1); for (let i = 0; i < np; i++) { const d = X0 + dx * i - m; out[i] = baseY - k * Math.exp(c * d * d); } };
  const trace = (g, ys) => { g.beginPath(); g.moveTo(XS[0], ys[0]); for (let i = 1; i < np; i++) g.lineTo(XS[i], ys[i]); };
  const closeDown = (g) => { g.lineTo(XS[np - 1], baseY); g.lineTo(XS[0], baseY); g.closePath(); };
  /** tags are baked to tiny sprites and only re-baked when the label changes (<= ~9 Hz) */
  const TCV = [document.createElement('canvas'), document.createElement('canvas'), document.createElement('canvas')], TAGK = ['', '', ''], TAGT = [-9, -9, -9], TAGW = [60, 60, 60];
  const TY = [5, 22, 39];
  const tag = (g, i, name, v, killed, t) => {
    const T = TAG[i], dead = i === 2 && killed;
    if (t - TAGT[i] > 0.11 || !TAGK[i]) {
      TAGT[i] = t; const txt = name + ' ' + (v * 100).toFixed(1), key = dead ? txt + '!' : txt;
      if (key !== TAGK[i]) { TAGK[i] = key; TAGW[i] = txt.length * 5.6 + 12; bake(TCV[i], txt, TAGW[i], 15, dead ? 'rgba(255,77,94,.2)' : T.f, dead ? 'rgba(255,77,94,.85)' : T.s, dead ? '#ffc3c9' : T.t, F_TAG); }
    }
    const w = TAGW[i], xm = px(v), x = clamp(xm - w / 2, 3, W - w - 3), y = TY[i];
    g.setLineDash(DASH); g.lineWidth = 1; g.strokeStyle = dead ? 'rgba(255,170,178,.6)' : T.l;
    g.beginPath(); g.moveTo(Math.round(xm) + 0.5, y + 16); g.lineTo(Math.round(xm) + 0.5, baseY); g.stroke(); g.setLineDash(NODASH);
    g.drawImage(TCV[i], x, y, w, 15);
    g.beginPath(); g.arc(Math.round(xm) + 0.5, baseY, 2.6, 0, TAU); g.fillStyle = T.t; g.fill();
  };
  /** tag lanes: each tag takes the first lane its neighbours do not touch; its y eases to the lane, so tags glide apart and re-merge */
  const lanes = (dt, vs) => {
    const o = [0, 1, 2].sort((a, b) => vs[a] - vs[b]), end = [-99, -99, -99], k = 1 - Math.exp(-dt * 13);
    for (let n = 0; n < 3; n++) { const i = o[n], w = TAGW[i], x = clamp(px(vs[i]) - w / 2, 3, W - w - 3); let l = 0; while (l < 2 && x < end[l] + 5) l++; end[l] = x + w; TY[i] += (5 + l * 17 - TY[i]) * k; }
  };
  J.task(card, (t, dt) => {
    if (!ok) return;
    dyn(t, dt);
    const g = gd, kill = S.killed, st = kill ? ST.kill : ST.ok;
    g.clearRect(0, 0, W, H);
    curveY(B.dmp, B.dsp, YP); curveY(B.dml, B.dsl, YL); curveY(B.post, B.ps, YO);
    g.lineJoin = 'round'; g.lineCap = 'round';
    trace(g, YP); g.lineWidth = 1.5; g.strokeStyle = 'rgba(255,193,61,.62)'; g.stroke(); closeDown(g); g.fillStyle = 'rgba(255,193,61,.075)'; g.fill();
    trace(g, YL); g.lineWidth = 1.5; g.strokeStyle = 'rgba(106,163,255,.7)'; g.stroke(); closeDown(g); g.fillStyle = 'rgba(77,141,255,.085)'; g.fill();
    g.globalCompositeOperation = 'lighter';
    trace(g, YO); g.lineWidth = 11; g.strokeStyle = st.g10; g.stroke(); g.lineWidth = 5; g.strokeStyle = st.g4; g.stroke();
    closeDown(g); g.fillStyle = st.fill; g.fill();
    g.globalCompositeOperation = 'source-over';
    trace(g, YO); g.lineWidth = 1.9; g.strokeStyle = st.core; g.stroke();
    if (B.ring < 1) { const pk = baseY - scale / (B.ps * 2.5066), r = 5 + B.ring * 40; g.globalCompositeOperation = 'lighter'; g.globalAlpha = (1 - B.ring) * 0.8; g.lineWidth = 1.5; g.strokeStyle = st.coreS; g.beginPath(); g.arc(px(B.post), pk, r, 0, TAU); g.stroke(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    lanes(dt, [B.dmp, B.dml, B.post]);
    tag(g, 0, 'prior', B.dmp, false, t); tag(g, 1, 'book', B.dml, false, t); tag(g, 2, 'post', B.post, kill, t);
    domT += dt;
    if (domT >= 0.25 || J.reduce) {
      domT = 0;
      setT(lg.pm, (B.dmp * 100).toFixed(1)); setT(lg.ps, (B.dsp * 100).toFixed(1)); setT(lg.lm, (B.dml * 100).toFixed(1)); setT(lg.ls, (B.dsl * 100).toFixed(1)); setT(lg.om, (B.post * 100).toFixed(1)); setT(lg.os, (B.ps * 100).toFixed(1));
      setT(eN, fmt(B.n));
    }
  });
});
