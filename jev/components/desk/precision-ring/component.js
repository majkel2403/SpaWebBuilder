/* desk/precision-ring — the live ring follows the precision weights of a simulated prior x book update (everything here is SIMULATED)
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot()
 * JEV.* used: JEV.mod $ S clamp gauss task reduce; JEV.bus 'decision' (d.state.edge_bps, d.state.imbalance, d.conf), 'tick' ({price, dp})
 * Safe without the rest of the page: every DOM lookup is guarded. */
JEV.mod('desk-precision-ring', () => {
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
  const card = $('#dkprg'), ring = $('#dkprg-live'), eV = $('#dkprg-v'); if (!card || !ring) return;
  const { B, dyn } = makeModel(); let domT = 9;
  J.task(card, (t, dt) => {
    dyn(t, dt); domT += dt;
    if (domT < 0.25 && !J.reduce) return;
    domT = 0;
    const pa = 1 / (B.dsp * B.dsp), pb = 1 / (B.dsl * B.dsl), wb = (100 * pb) / (pa + pb);
    ring.style.setProperty('--dkb-w', wb.toFixed(1)); setT(eV, String(Math.round(wb)));
  });
});
