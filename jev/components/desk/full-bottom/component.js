/* desk/full-bottom — bayesian update + activity log + drift vs noise, all three cards (prefix dkb-). Everything is SIMULATED.
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot() (the shared main.js does it).
 * JEV.* API relied on:
 *   JEV.mod, JEV.$, JEV.C, JEV.S, JEV.AGENTS[6], JEV.market.price, JEV.recent, JEV.makeDecision(), JEV.clamp/fmt/gauss/pick/rnd/ri/TAU
 *   JEV.fit, JEV.watch, JEV.task, JEV.onView, JEV.animate, JEV.reduce, JEV.DPR, JEV.tier
 *   JEV.bus: 'decision', 'tick', 'kill', 'agentstep' (optional), 'pulse' (optional)
 * Everything else in the file is local to the closure. Missing optional DOM / bus events never throw. */
/* desk-bottom — bayesian update · activity log · drift vs noise (prefix dkb-). Everything here is SIMULATED.
 * bayes : conjugate-gaussian prior x book likelihood -> posterior, re-centred on every 'decision' (edge_bps nudges the book)
 * log   : DOM list, newest on top, rows slide by transform only; fed by bus 'agentstep' + 'decision' (self-synthesised if absent)
 * drift : 140 random walks with a small positive drift, drawn incrementally on a persistent canvas (+ live end-value histogram) */
JEV.mod('desk-full-bottom', () => {
  const J = JEV, $ = J.$, C = J.C, S = J.S, clamp = J.clamp, fmt = J.fmt, gauss = J.gauss, TAU = J.TAU;
  const bay = $('#dkb-bayes'), lgc = $('#dkb-log'), drc = $('#dkb-drift');
  if (!bay || !lgc || !drc) return;
  const MONO = "'JetBrains Mono', ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, Consolas, monospace";
  const rgbOf = (h) => { const n = parseInt(h.slice(1), 16); return (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255); };
  const setT = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  /** odometer: per-digit cells; a changed digit rolls in from below (up) or above (down) while the old one leaves — transform/opacity only, no clipping so the glow survives */
  const odo = (el) => {
    let cells = [], cur = '';
    return (s) => {
      if (s === cur) return;
      const up = parseFloat(s) >= parseFloat(cur || s);
      if (s.length !== cur.length) {
        el.textContent = ''; cells = [];
        for (let i = 0; i < s.length; i++) { const c = document.createElement('span'), t = document.createElement('i'); c.className = 'dkb-dg'; c.setAttribute('aria-hidden', 'true'); t.textContent = s[i]; c.appendChild(t); el.appendChild(c); cells.push(c); }
      } else {
        for (let i = 0; i < s.length; i++) {
          if (s[i] === cur[i]) continue;
          const c = cells[i], t = c.firstChild, old = t.textContent; t.textContent = s[i];
          if (J.reduce || s[i] === '.' || old === '.') continue;
          const gh = document.createElement('i'); gh.className = 'dkb-gh'; gh.textContent = old; c.appendChild(gh);
          const d = up ? 1 : -1;
          const a1 = J.animate(gh, [{ transform: 'translateY(0)', opacity: 0.9 }, { transform: 'translateY(' + -0.42 * d + 'em)', opacity: 0 }], { duration: 360, easing: 'cubic-bezier(.3,.7,.2,1)' });
          if (a1) a1.onfinish = () => gh.remove(); else gh.remove();
          J.animate(t, [{ transform: 'translateY(' + 0.42 * d + 'em)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,.9,.25,1)' });
        }
      }
      cur = s; el.setAttribute('role', 'img'); el.setAttribute('aria-label', s);
    };
  };
  const sgn = (v, d) => (v >= 0 ? '+' : '-') + Math.abs(v).toFixed(d == null ? 1 : d);
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  /** soft additive glow sprite (drawn with 'lighter'; replaces shadowBlur) */
  const sprite = (rgb) => {
    const c = document.createElement('canvas'); c.width = c.height = 48;
    const g = c.getContext('2d'), gr = g.createRadialGradient(24, 24, 0, 24, 24, 24);
    gr.addColorStop(0, 'rgba(' + rgb + ',1)'); gr.addColorStop(.28, 'rgba(' + rgb + ',.35)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, 48, 48); return c;
  };
  /** cards reveal with a small scale/translate (.rv) — JEV.fit measures the transformed rect, so re-fit once the reveal settles */
  const afterReveal = (card, fn) => {
    card.addEventListener('transitionend', (e) => { if (e.target === card && e.propertyName === 'transform') fn(); });
    J.onView(card, () => setTimeout(fn, 1300), { threshold: 0.05 });
  };
  /** bake a pill label to a tiny sprite (text is the costly part of a canvas frame; sprites are re-baked only when the label changes) */
  const bake = (cv, txt, w, h, fill, stroke, color, font) => {
    cv.width = Math.round(w * J.DPR); cv.height = Math.round(h * J.DPR);
    const g = cv.getContext('2d'); g.setTransform(J.DPR, 0, 0, J.DPR, 0, 0);
    rr(g, 0.5, 0.5, w - 1, h - 1, 4); g.fillStyle = fill; g.fill(); g.strokeStyle = stroke; g.lineWidth = 1; g.stroke();
    g.font = font; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = color; g.fillText(txt, w / 2, h / 2 + 3.4);
  };
  const onFonts = []; // canvas text needs the web font loaded; redraw static layers once it is
  try { if (document.fonts && document.fonts.load) Promise.all([document.fonts.load("700 9px 'JetBrains Mono'"), document.fonts.load("9px 'JetBrains Mono'")]).then(() => onFonts.forEach((f) => f())).catch(() => {}); } catch (e) { /* ignore */ }
  /** Abramowitz-Stegun erf, enough for a tail-probability label */
  const erf = (x) => { const sg = x < 0 ? -1 : 1, a = Math.abs(x), t = 1 / (1 + 0.3275911 * a); return sg * (1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) * Math.exp(-a * a)); };
  const TIER = () => (J.tier || 2);
  const FX_ON = () => TIER() >= 2 && !J.reduce;
  /** polyline segment a..b (indices, fractional ok) of ys over XS, used for travelling highlights */
  const seg = (g, xs, ys, np, a, b, w, style) => {
    a = Math.max(0, Math.floor(a)); b = Math.min(np - 1, Math.ceil(b)); if (b <= a) return;
    g.beginPath(); g.moveTo(xs[a], ys[a]); for (let i = a + 1; i <= b; i++) g.lineTo(xs[i], ys[i]);
    g.lineWidth = w; g.strokeStyle = style; g.stroke();
  };
  const DASH = [3, 4], DOT = [1.5, 3.5], NODASH = [], F_TAG = '700 9px ' + MONO, F_HALT = '700 9.5px ' + MONO;

  /* =====================================================================================================
   * 1) BAYESIAN UPDATE
   * ===================================================================================================== */
  const initBayes = () => {
    const wrap = $('#dkb-bw'), cs = $('#dkb-bs'), cd = $('#dkb-bc');
    if (!wrap || !cs || !cd) return;
    const eRg = $('#dkb-rg'), eRgv = $('#dkb-rgv'), eBig = $('#dkb-bp'), eV = $('#dkb-bv'), eK1 = $('#dkb-bk1'), eK2 = $('#dkb-bk2'), eN = $('#dkb-bn');
    const lg = { pm: $('#dkb-pm'), ps: $('#dkb-ps'), lm: $('#dkb-lm'), ls: $('#dkb-ls'), om: $('#dkb-om'), os: $('#dkb-os') };
    const oV = odo(eV);
    const X0 = 0.2, X1 = 1.0, PEAK = 9.0, MAXP = 220, NSP = 120, NE = 56;
    const YP = new Float32Array(MAXP), YL = new Float32Array(MAXP), YO = new Float32Array(MAXP), XS = new Float32Array(MAXP), SPK = new Float32Array(NSP);
    const EX = new Float32Array(NE), EY = new Float32Array(NE), EV = new Float32Array(NE), EA = new Float32Array(NE), EM = new Float32Array(NE), EZ = new Float32Array(NE);
    const B = { mp: 0.54, sp: 0.095, ml: 0.676, sl: 0.072, tmp: 0.54, tml: 0.676, tsl: 0.072, bias: 0.1, flash: 0, ring: 1, n: 1204, spT: 0, si: 0, domT: 9, vp: 0, vl: 0, pinP: 0, pinL: 0, hb: 0, post: 0.627, ps: 0.057, dmp: 0.54, dsp: 0.095, dml: 0.676, dsl: 0.072, up: true };
    const TAG = [
      { f: 'rgba(255,193,61,.15)', s: 'rgba(255,193,61,.7)', t: '#ffd47a', l: 'rgba(255,193,61,.5)' },
      { f: 'rgba(77,141,255,.17)', s: 'rgba(106,163,255,.75)', t: '#9cc2ff', l: 'rgba(106,163,255,.55)' },
      { f: 'rgba(46,230,166,.17)', s: 'rgba(46,230,166,.85)', t: '#9dffd9', l: 'rgba(200,255,235,.6)' },
    ];
    const SPR = { ok: sprite('46,230,166'), kill: sprite('255,77,94') };
    // pointer probe: hover/drag along the axis to read P(up > x) — the posterior's upper tail lights up
    const PRB = { on: false, x: 0, k: '', t: -9, w: 90, cv: document.createElement('canvas') };
    const DEN = { k: '', t: -9, w: 100, h: 44, cv: document.createElement('canvas') };
    // drag handles: grab the prior or book mean and pull it (sim only) — the posterior re-solves live while the means ride a spring
    const DR = { k: -1, near: -1, kb: 0, focus: false, hv: [0, 0] };
    const vOf = (x) => X0 + ((clamp(x, L, L + pw) - L) / pw) * (X1 - X0);
    const hit = (x) => { const R = matchMedia('(pointer: coarse)').matches ? 24 : 14, a = Math.abs(x - px(B.dmp)), b = Math.abs(x - px(B.dml)); if (a > R && b > R) return -1; return a <= b ? 0 : 1; };
    const setMean = (k, v) => { if (k === 0) { B.tmp = clamp(v, 0.34, 0.7); B.pinP = 99; } else { B.tml = clamp(v, 0.26, 0.82); B.pinL = 99; } B.flash = Math.max(B.flash, 0.4); };
    const release = (k) => { if (k === 0) B.pinP = 7; else B.pinL = 7; };
    const resetPins = () => { B.pinP = B.pinL = 0; B.flash = 0.6; };
    const cur = (c) => { if (cd.style.cursor !== c) cd.style.cursor = c; };
    cd.addEventListener('pointerdown', (e) => {
      PRB.on = true; PRB.x = e.offsetX;
      const k = hit(e.offsetX);
      if (k >= 0) { DR.k = k; DR.kb = k; try { cd.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } setMean(k, vOf(e.offsetX)); cur('grabbing'); }
    });
    cd.addEventListener('pointermove', (e) => {
      PRB.on = true; PRB.x = e.offsetX;
      if (DR.k >= 0) setMean(DR.k, vOf(e.offsetX));
      else { DR.near = e.pointerType === 'mouse' ? hit(e.offsetX) : -1; cur(DR.near >= 0 ? 'grab' : 'crosshair'); }
    });
    const up = (e) => { if (DR.k >= 0) { release(DR.k); DR.k = -1; try { cd.releasePointerCapture(e.pointerId); } catch (x) { /* ignore */ } cur('crosshair'); } if (e.pointerType !== 'mouse') PRB.on = false; };
    cd.addEventListener('pointerup', up);
    cd.addEventListener('pointerleave', () => { if (DR.k < 0) { PRB.on = false; DR.near = -1; } });
    cd.addEventListener('pointercancel', (e) => { PRB.on = false; up(e); });
    cd.addEventListener('dblclick', resetPins);
    cd.addEventListener('focus', () => { DR.focus = true; });
    cd.addEventListener('blur', () => { DR.focus = false; });
    cd.addEventListener('keydown', (e) => {
      const k = e.key;
      if (k === 'ArrowLeft' || k === 'ArrowRight') { const d = (k === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 0.02 : 0.005); setMean(DR.kb, (DR.kb ? B.tml : B.tmp) + d); release(DR.kb); }
      else if (k === 'Enter' || k === ' ') DR.kb ^= 1;
      else if (k === 'Escape' || k === 'Home') resetPins();
      else return;
      e.preventDefault();
    });
    const ST = {
      ok: { g10: null, g4: null, core: null, hot: null, crgb: '141,255,208', coreS: '#8dffd0', hrgb: '212,255,238', rgb: '46,230,166', tail: 'rgba(141,255,208,.24)', fillTop: 'rgba(46,230,166,.6)', fillMid: 'rgba(46,230,166,.22)', fillBot: 'rgba(46,230,166,.02)', fill: null, spark: null, shm: null, wh: 'rgba(212,255,238,', },
      kill: { g10: null, g4: null, core: null, hot: null, crgb: '255,143,154', coreS: '#ff8f9a', hrgb: '255,214,218', rgb: '255,77,94', tail: 'rgba(255,143,154,.24)', fillTop: 'rgba(255,77,94,.55)', fillMid: 'rgba(255,77,94,.2)', fillBot: 'rgba(255,77,94,.02)', fill: null, spark: null, shm: null, wh: 'rgba(255,214,218,', },
    };
    let W = 0, H = 0, gs = null, gd = null, np = 0, L = 12, pw = 0, baseY = 0, curveH = 0, scale = 1, sy0 = 0, sy1 = 0, ok = false;
    const px = (p) => L + ((p - X0) / (X1 - X0)) * pw;
    const yS = (v) => sy1 - clamp((v - 0.3) / 0.5, 0, 1) * (sy1 - sy0 - 4) - 2;

    const solve = () => { const a = 1 / (B.dsp * B.dsp), b = 1 / (B.dsl * B.dsl), s2 = 1 / (a + b); B.post = (B.dmp * a + B.dml * b) * s2; B.ps = Math.sqrt(s2); };
    B.dmp = B.mp; B.dsp = B.sp; B.dml = B.ml; B.dsl = B.sl; solve();
    { let v = B.post; for (let i = NSP - 1; i >= 0; i--) { SPK[i] = v; v += (0.52 - v) * 0.03 + (Math.random() - 0.5) * 0.022; } SPK[NSP - 1] = B.post; }
    for (let i = 0; i < NE; i++) { EM[i] = 1; EA[i] = 1; EZ[i] = 1; }

    const drawStatic = () => {
      const g = gs; g.clearRect(0, 0, W, H);
      g.font = '9px ' + MONO; g.textBaseline = 'alphabetic'; g.lineWidth = 1;
      for (let k = 1; k <= 3; k++) { const y = Math.round(baseY - (curveH * k) / 4) + 0.5; g.strokeStyle = 'rgba(255,255,255,.04)'; g.beginPath(); g.moveTo(L, y); g.lineTo(L + pw, y); g.stroke(); }
      g.textAlign = 'center';
      for (let p = 0.3; p < 0.9001; p += 0.1) {
        const x = Math.round(px(p)) + 0.5, half = Math.abs(p - 0.5) < 0.01;
        g.setLineDash(half ? DASH : NODASH);
        g.strokeStyle = half ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.055)';
        g.beginPath(); g.moveTo(x, half ? 6 : baseY - curveH); g.lineTo(x, baseY + 4); g.stroke();
        g.setLineDash(NODASH);
        g.fillStyle = half ? 'rgba(240,233,248,.95)' : 'rgba(181,172,196,.82)';
        g.fillText(String(Math.round(p * 100)), x, baseY + 15);
      }
      g.strokeStyle = 'rgba(255,255,255,.26)'; g.beginPath(); g.moveTo(L, baseY + 0.5); g.lineTo(L + pw, baseY + 0.5); g.stroke();
      g.textAlign = 'left'; g.fillStyle = 'rgba(170,161,184,.9)'; g.font = '8.5px ' + MONO;
      g.fillText('P(up 5m) % · simulated', L, baseY + 26);
      g.textAlign = 'right'; g.fillText('50 = coin flip', L + pw, baseY + 26);
      // posterior history strip
      g.strokeStyle = 'rgba(255,255,255,.07)'; g.beginPath(); g.moveTo(L, sy0 - 0.5); g.lineTo(L + pw, sy0 - 0.5); g.stroke();
      const y50 = Math.round(yS(0.5)) + 0.5;
      g.setLineDash(DOT); g.strokeStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(L, y50); g.lineTo(L + pw, y50); g.stroke(); g.setLineDash(NODASH);
      g.textAlign = 'left'; g.fillStyle = 'rgba(170,161,184,.85)'; g.fillText('posterior · last 30 s', L, sy0 + 10);
      g.textAlign = 'right'; g.fillText('50', L + pw, y50 + 9);
    };

    const lay = () => {
      const a = J.fit(cs), b = J.fit(cd);
      W = a.W; H = a.H; gs = a.g; gd = b.g;
      ok = W > 150 && H > 150;
      if (!ok) return;
      L = 12; pw = W - 24;
      const stripH = H < 250 ? 28 : 40;
      sy1 = H - 6; sy0 = sy1 - stripH; baseY = sy0 - 32;
      curveH = baseY - 58; scale = (curveH * 0.97) / PEAK;
      np = Math.min(MAXP, Math.max(60, Math.round(pw / 2.4)));
      for (let i = 0; i < np; i++) XS[i] = L + (pw * i) / (np - 1);
      for (const k of ['ok', 'kill']) {
        const s = ST[k];
        const f = gd.createLinearGradient(0, baseY - curveH, 0, baseY); f.addColorStop(0, s.fillTop); f.addColorStop(0.55, s.fillMid); f.addColorStop(1, s.fillBot); s.fill = f;
        const p = gd.createLinearGradient(0, sy0, 0, sy1); p.addColorStop(0, 'rgba(' + s.rgb + ',.34)'); p.addColorStop(1, 'rgba(' + s.rgb + ',0)'); s.spark = p;
        // glow + core fade out toward the baseline so the flat tails never smear into the axis
        const fade = (rgb, a0, a1) => { const q = gd.createLinearGradient(0, baseY, 0, baseY - curveH * 0.6); q.addColorStop(0, 'rgba(' + rgb + ',' + a0 + ')'); q.addColorStop(1, 'rgba(' + rgb + ',' + a1 + ')'); return q; };
        const sh = gd.createLinearGradient(0, 0, 170, 0); sh.addColorStop(0, 'rgba(' + s.hrgb + ',0)'); sh.addColorStop(.5, 'rgba(' + s.hrgb + ',.2)'); sh.addColorStop(1, 'rgba(' + s.hrgb + ',0)'); s.shm = sh;
        s.g10 = fade(s.rgb, 0, 0.075); s.g4 = fade(s.rgb, 0, 0.2); s.core = fade(s.crgb, 0.1, 1); s.hot = fade(s.hrgb, 0, 1);
      }
      drawStatic();
    };
    J.watch(wrap, lay); afterReveal(bay, lay);
    onFonts.push(() => { TAGK[0] = TAGK[1] = TAGK[2] = ''; if (ok) drawStatic(); });

    /* ---- dynamics: means drift with noise, re-centre on each decision ---- */
    const dyn = (t, dt) => {
      const sq = Math.sqrt(dt);
      B.bias *= Math.exp(-dt / 10);
      if (B.pinL > 0) B.pinL -= dt; if (B.pinP > 0) B.pinP -= dt;
      if (B.pinL <= 0) B.tml += (0.5 + B.bias - B.tml) * (1 - Math.exp(-dt * 0.5)) + gauss() * 0.075 * sq;
      if (B.pinP <= 0) B.tmp += (0.535 - B.tmp) * (1 - Math.exp(-dt * 0.05)) + gauss() * 0.03 * sq;
      B.tml = clamp(B.tml, 0.26, 0.82); B.tmp = clamp(B.tmp, 0.34, 0.7);
      const k4 = 1 - Math.exp(-dt * 3.2);
      // the two means ride a damped spring (slight overshoot) so a drag, a decision or a release all settle physically
      const h = Math.min(dt, 0.04);
      B.vp += ((B.tmp - B.mp) * 150 - B.vp * 15) * h; B.mp += B.vp * h;
      B.vl += ((B.tml - B.ml) * 150 - B.vl * 15) * h; B.ml += B.vl * h;
      for (let i = 0; i < 2; i++) DR.hv[i] += (((DR.k === i || DR.near === i || (DR.focus && DR.kb === i)) ? 1 : 0) - DR.hv[i]) * (1 - Math.exp(-dt * 14));
      B.sl += ((S.killed ? 0.15 : B.tsl) - B.sl) * k4; B.sp += (0.095 - B.sp) * k4;
      B.dmp = B.mp; B.dml = B.ml;
      B.dsp = B.sp * (1 + 0.1 * Math.sin(t * 0.7)); B.dsl = B.sl * (1 + 0.12 * Math.sin(t * 1.1 + 1.3));
      solve();
      B.flash *= Math.exp(-dt * 2.4);
      if (B.ring < 1) B.ring += dt * 1.5;
      B.spT += dt;
      if (B.spT >= 0.25) { B.spT -= 0.25; SPK[B.si] = B.post; B.si = (B.si + 1) % NSP; }
    };
    const nudge = (d) => {
      const st = d.state || {}, e = +st.edge_bps || 0, im = +st.imbalance || 0;
      B.bias = clamp(e / 60, -1, 1) * 0.2 + im * 0.06;
      if (B.pinP <= 0) B.tmp += (B.post - B.tmp) * 0.25;     // yesterday's posterior leaks into today's prior
      if (B.pinL <= 0) {
        B.tml = 0.5 + B.bias;                                // the book re-centres on the new evidence
        if (Math.abs(B.tml - B.tmp) < 0.045) B.tml = B.tmp + (B.tml >= B.tmp ? 0.045 : -0.045);   // keep the two curves readable
      }
      B.tsl = clamp(0.1 - (d.conf || 0.7) * 0.05, 0.045, 0.09);
      B.flash = 1; B.ring = 0; B.n++;
      setT(eN, fmt(B.n));
    };
    J.bus.on('decision', nudge);
    J.bus.on('tick', (k) => { if (k && k.price) B.bias = clamp(B.bias + clamp((k.dp / k.price) * 250, -0.008, 0.008), -0.3, 0.3); });

    /* ---- drawing ---- */
    const curveY = (m, s, out) => {
      const k = scale / (s * 2.5066), c = -0.5 / (s * s), x0 = X0, dx = (X1 - X0) / (np - 1);
      for (let i = 0; i < np; i++) { const d = x0 + dx * i - m; out[i] = baseY - k * Math.exp(c * d * d); }
    };
    const trace = (g, ys) => { g.beginPath(); g.moveTo(XS[0], ys[0]); for (let i = 1; i < np; i++) g.lineTo(XS[i], ys[i]); };
    const closeDown = (g) => { g.lineTo(XS[np - 1], baseY); g.lineTo(XS[0], baseY); g.closePath(); };
    /** tags are baked to tiny sprites (text is the costly part of a canvas frame) and only re-baked when the label changes, <= ~9 Hz */
    const NF = 32, FXp = new Float32Array(NF), FYp = new Float32Array(NF), FVx = new Float32Array(NF), FVy = new Float32Array(NF), FL = new Float32Array(NF), FM = new Float32Array(NF), FR = new Float32Array(NF);
    for (let i = 0; i < NF; i++) { FL[i] = -Math.random() * 2; FM[i] = 1; }
    const fount = (g, dt, spr, kill) => {
      const n = TIER() >= 3 ? NF : 14, boost = 1 + B.flash * 1.6;
      for (let i = 0; i < n; i++) {
        if (FL[i] < 0) { FL[i] += dt; if (FL[i] < 0) continue; // spawn on the ribbon near the peak
          const x = clamp(B.post + B.ps * 0.7 * gauss(), X0 + 0.02, X1 - 0.02), d = x - B.post, h = (scale / (B.ps * 2.5066)) * Math.exp((-0.5 * d * d) / (B.ps * B.ps));
          FXp[i] = px(x); FYp[i] = baseY - h; FVx[i] = (Math.random() - 0.5) * 16; FVy[i] = -(24 + Math.random() * 46) * boost; FM[i] = 0.9 + Math.random() * 1.3; FL[i] = FM[i] * 0.999; FR[i] = 3 + Math.random() * 4; }
        FL[i] -= dt; if (FL[i] <= 0) { FL[i] = -Math.random() * 0.6; continue; }
        FXp[i] += FVx[i] * dt; FYp[i] += FVy[i] * dt; FVy[i] *= 1 - dt * 0.5;
        const a = Math.sin((1 - FL[i] / FM[i]) * Math.PI), r = FR[i] * (0.6 + 0.6 * (FL[i] / FM[i]));
        g.globalAlpha = a * 0.85; g.drawImage(spr, FXp[i] - r, FYp[i] - r, r * 2, r * 2);
      }
      g.globalAlpha = 1;
    };
    const TCV = [document.createElement('canvas'), document.createElement('canvas'), document.createElement('canvas')], TAGK = ['', '', ''], TAGT = [-9, -9, -9], TAGW = [60, 60, 60];
    const TY = [5, 22, 39], LANE = [0, 1, 2], TXR = [0, 0, 0];
    const tag = (g, i, name, v, killed, t) => {
      const T = TAG[i], dead = i === 2 && killed, pin = (i === 0 && B.pinP > 0) || (i === 1 && B.pinL > 0);
      if (t - TAGT[i] > 0.11 || !TAGK[i]) {
        TAGT[i] = t;
        const txt = name + ' ' + (v * 100).toFixed(1) + (pin ? ' ◆' : ''), key = dead ? txt + '!' : txt;
        if (key !== TAGK[i]) { TAGK[i] = key; TAGW[i] = txt.length * 5.6 + 12; bake(TCV[i], txt, TAGW[i], 15, dead ? 'rgba(255,77,94,.2)' : T.f, dead ? 'rgba(255,77,94,.85)' : T.s, dead ? '#ffc3c9' : T.t, F_TAG); }
      }
      const w = TAGW[i], xm = px(v), x = clamp(xm - w / 2, 3, W - w - 3), y = TY[i], hv = i < 2 ? DR.hv[i] : 0;
      g.setLineDash(DASH); g.lineWidth = 1; g.strokeStyle = dead ? 'rgba(255,170,178,.6)' : T.l;
      if (hv > 0.02) { g.globalAlpha = 0.5 + hv * 0.5; g.lineWidth = 1 + hv * 0.8; }
      g.beginPath(); g.moveTo(Math.round(xm) + 0.5, y + 16); g.lineTo(Math.round(xm) + 0.5, baseY); g.stroke(); g.setLineDash(NODASH); g.globalAlpha = 1;
      g.drawImage(TCV[i], x, y, w, 15);
      if (i < 2) { // grip on the axis: grows when the mean can be grabbed
        const r = 2.6 + hv * 2.8;
        g.beginPath(); g.arc(Math.round(xm) + 0.5, baseY, r, 0, TAU); g.fillStyle = T.t; g.fill();
        if (hv > 0.02) { g.globalAlpha = hv * 0.6; g.lineWidth = 1; g.strokeStyle = T.t; g.beginPath(); g.arc(Math.round(xm) + 0.5, baseY, r + 4, 0, TAU); g.stroke(); g.globalAlpha = 1; }
      }
    };
    /** tag lanes: left to right, each tag takes the first lane whose neighbours it does not touch; the y of every tag eases to its lane, so tags glide apart and re-merge */
    const lanes = (dt, vs) => {
      const o = [0, 1, 2].sort((a, b) => vs[a] - vs[b]), end = [-99, -99, -99], k = 1 - Math.exp(-dt * 13);
      for (let n = 0; n < 3; n++) {
        const i = o[n], w = TAGW[i], x = clamp(px(vs[i]) - w / 2, 3, W - w - 3);
        let l = 0; while (l < 2 && x < end[l] + 5) l++;
        end[l] = x + w; LANE[i] = l; TY[i] += (5 + l * 17 - TY[i]) * k;
      }
    };
    /** density readout panel: three rows, label left and value right, baked to a sprite (re-baked <= ~12 Hz and only when the numbers change) */
    const bakeDen = (rows) => {
      const w = DEN.w, h = DEN.h, cv = DEN.cv; cv.width = Math.round(w * J.DPR); cv.height = Math.round(h * J.DPR);
      const g = cv.getContext('2d'); g.setTransform(J.DPR, 0, 0, J.DPR, 0, 0);
      rr(g, 0.5, 0.5, w - 1, h - 1, 5); g.fillStyle = 'rgba(10,6,16,.9)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.28)'; g.stroke();
      g.font = F_TAG; g.textBaseline = 'alphabetic';
      for (let i = 0; i < 3; i++) { const y = 14 + i * 12; g.fillStyle = TAG[i].t; g.textAlign = 'left'; g.fillText(rows[i][0], 9, y); g.textAlign = 'right'; g.fillText(rows[i][1], w - 9, y); }
    };
    const spawn = (i) => {
      const x = clamp(B.post + B.ps * gauss(), X0 + 0.02, X1 - 0.02), d = x - B.post;
      const h = (scale / (B.ps * 2.5066)) * Math.exp((-0.5 * d * d) / (B.ps * B.ps));
      EX[i] = px(x); EY[i] = baseY - h * J.rnd(0.04, 0.98); EV[i] = J.rnd(9, 24); EM[i] = J.rnd(1.1, 2.5); EA[i] = 0; EZ[i] = J.rnd(4, 9);
    };
    for (let i = 0; i < NE; i++) { EM[i] = J.rnd(1.1, 2.5); EA[i] = -J.rnd(0, 2.5); EV[i] = 12; EX[i] = -50; EY[i] = 0; EZ[i] = 5; }

    const frame = (t, dt) => {
      if (!ok) return;
      dyn(t, dt);
      const g = gd, kill = S.killed, st = kill ? ST.kill : ST.ok;
      g.clearRect(0, 0, W, H);
      curveY(B.dmp, B.dsp, YP); curveY(B.dml, B.dsl, YL); curveY(B.post, B.ps, YO);
      g.lineJoin = 'round'; g.lineCap = 'round';
      // prior (amber, dim)
      trace(g, YP); g.lineWidth = 1.5; g.strokeStyle = 'rgba(255,193,61,.62)'; g.stroke(); closeDown(g); g.fillStyle = 'rgba(255,193,61,.075)'; g.fill();
      // book likelihood (blue, dim)
      trace(g, YL); g.lineWidth = 1.5; g.strokeStyle = 'rgba(106,163,255,.7)'; g.stroke(); closeDown(g); g.fillStyle = 'rgba(77,141,255,.085)'; g.fill();
      // posterior (green, bright, glow)
      g.globalCompositeOperation = 'lighter';
      trace(g, YO);
      g.lineWidth = 11; g.strokeStyle = st.g10; g.stroke();
      g.lineWidth = 5; g.strokeStyle = st.g4; g.stroke();
      if (B.flash > 0.03) { g.globalAlpha = Math.min(1, B.flash * 0.6); g.lineWidth = 6; g.strokeStyle = st.hot; g.stroke(); g.globalAlpha = 1; }
      closeDown(g); g.fillStyle = st.fill; g.fill();
      if (FX_ON()) { // animated gradient: a soft light band sweeps through the fill (clipped to the posterior area)
        g.save(); g.clip(); g.translate(((t * 0.16) % 1) * (W + 190) - 180, 0); g.fillStyle = st.shm; g.fillRect(0, baseY - curveH - 4, 170, curveH + 6); g.restore();
      }
      g.globalCompositeOperation = 'source-over';
      trace(g, YO); g.lineWidth = 1.9; g.strokeStyle = st.core; g.stroke();
      // embers: samples drawn from the posterior
      g.globalCompositeOperation = 'lighter';
      const spr = kill ? SPR.kill : SPR.ok;
      for (let i = 0; i < NE; i++) {
        const was = EA[i]; EA[i] += dt;
        if (EA[i] >= EM[i] || (was < 0 && EA[i] >= 0)) spawn(i);
        if (EA[i] < 0) continue;
        EY[i] -= EV[i] * dt;
        const a = Math.sin((EA[i] / EM[i]) * Math.PI), r = EZ[i];
        g.globalAlpha = a; g.drawImage(spr, EX[i] - r, EY[i] - r, r * 2, r * 2);
      }
      g.globalAlpha = 1;
      if (FX_ON()) {
        fount(g, dt, spr, kill);
        // plasma ribbon: travelling highlights ride the posterior (a second one counter-rotates at tier 3)
        const sw = np + 40, h1 = ((t * 0.32) % 1) * sw - 20;
        seg(g, XS, YO, np, h1 - 22, h1 - 11, 2.2, st.wh + '.35)'); seg(g, XS, YO, np, h1 - 11, h1 - 4, 2.8, st.wh + '.7)'); seg(g, XS, YO, np, h1 - 4, h1, 3.4, st.wh + '1)');
        if (TIER() >= 3) { const h2 = (1 - ((t * 0.21 + 0.4) % 1)) * sw - 20; seg(g, XS, YO, np, h2, h2 + 10, 2.4, st.wh + '.55)'); seg(g, XS, YO, np, h2 + 10, h2 + 18, 1.8, st.wh + '.25)'); }
        // on a posterior update a shock travels outward from the peak along the ribbon
        if (B.ring < 1) {
          const pi = (B.post - X0) / (X1 - X0) * (np - 1), hw = B.ring * np * 0.55, al = (1 - B.ring);
          g.globalAlpha = al; seg(g, XS, YO, np, pi + hw - 9, pi + hw, 4.2, st.wh + '.95)'); seg(g, XS, YO, np, pi - hw, pi - hw + 9, 4.2, st.wh + '.95)'); g.globalAlpha = 1;
        }
      }
      // ripple at the posterior peak on every decision
      if (B.ring < 1) {
        const pk = baseY - scale / (B.ps * 2.5066), r = 5 + B.ring * 40;
        g.globalAlpha = (1 - B.ring) * 0.8; g.lineWidth = 1.5; g.strokeStyle = st.coreS;
        g.beginPath(); g.arc(px(B.post), pk, r, 0, TAU); g.stroke(); g.globalAlpha = 1;
      }
      g.globalCompositeOperation = 'source-over';
      // probe: P(up > x) for the pointer's x
      if (PRB.on) {
        const xp = clamp(PRB.x, L, L + pw), pv = X0 + ((xp - L) / pw) * (X1 - X0), tail = 0.5 * (1 - erf((pv - B.post) / (B.ps * 1.41421)));
        let i0 = 0; while (i0 < np - 1 && XS[i0] < xp) i0++;
        g.globalCompositeOperation = 'lighter'; g.beginPath(); g.moveTo(xp, baseY); g.lineTo(xp, YO[i0]);
        for (let i = i0; i < np; i++) g.lineTo(XS[i], YO[i]);
        g.lineTo(XS[np - 1], baseY); g.closePath(); g.fillStyle = st.tail; g.fill(); g.globalCompositeOperation = 'source-over';
        g.setLineDash(NODASH); g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(Math.round(xp) + 0.5, 58); g.lineTo(Math.round(xp) + 0.5, baseY); g.stroke();
        if (t - PRB.t > 0.08) {
          PRB.t = t; const txt = 'P(up > ' + (pv * 100).toFixed(0) + ') = ' + (tail * 100).toFixed(0) + '%';
          if (txt !== PRB.k) { PRB.k = txt; PRB.w = txt.length * 5.6 + 12; bake(PRB.cv, txt, PRB.w, 15, 'rgba(10,6,16,.9)', 'rgba(255,255,255,.7)', '#fff', F_TAG); }
        }
        g.drawImage(PRB.cv, clamp(xp + 8 + PRB.w > W - 3 ? xp - 8 - PRB.w : xp + 8, 3, W - PRB.w - 3), baseY - 24, PRB.w, 15);
        // each density at the pointer: a dot on every curve + a three-row readout (probability density, per unit of P)
        const den = (m, sd) => { const z = (pv - m) / sd; return Math.exp(-0.5 * z * z) / (sd * 2.5066); }, dv = [den(B.dmp, B.dsp), den(B.dml, B.dsl), den(B.post, B.ps)];
        for (let i = 0; i < 3; i++) { const y = baseY - scale * dv[i], r = 3.2; g.beginPath(); g.arc(xp, y, r, 0, TAU); g.fillStyle = i === 2 && kill ? '#ffc3c9' : TAG[i].t; g.fill(); g.lineWidth = 1; g.strokeStyle = 'rgba(10,6,16,.9)'; g.stroke(); }
        if (t - DEN.t > 0.08) {
          DEN.t = t; const rows = [['prior', dv[0].toFixed(1)], ['book', dv[1].toFixed(1)], ['post', dv[2].toFixed(1)]], key = rows.join('|');
          if (key !== DEN.k) { DEN.k = key; bakeDen(rows); }
        }
        g.drawImage(DEN.cv, clamp(xp + 10 + DEN.w > W - 3 ? xp - 10 - DEN.w : xp + 10, 3, W - DEN.w - 3), 60, DEN.w, DEN.h);
      }
      // mean ticks + tags (three rows, so they never collide)
      lanes(dt, [B.dmp, B.dml, B.post]);
      tag(g, 0, 'prior', B.dmp, false, t); tag(g, 1, 'book', B.dml, false, t); tag(g, 2, 'post', B.post, kill, t);
      // posterior history strip
      g.beginPath();
      for (let i = 0; i < NSP; i++) { const v = SPK[(B.si + i) % NSP], x = L + (pw * i) / (NSP - 1), y = yS(v); if (i) g.lineTo(x, y); else g.moveTo(x, y); }
      g.lineWidth = 1.4; g.strokeStyle = st.coreS; g.stroke();
      g.lineTo(L + pw, sy1); g.lineTo(L, sy1); g.closePath(); g.fillStyle = st.spark; g.fill();
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.9; g.drawImage(spr, L + pw - 9, yS(B.post) - 9, 18, 18); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';

      // DOM at 4 Hz
      B.domT += dt;
      if (B.domT >= 0.25 || J.reduce) {
        B.domT = 0;
        const p = B.post, up = p >= 0.5;
        oV((p * 100).toFixed(1));
        if (up !== B.up) { B.up = up; eBig.classList.toggle('dn', !up); }
        setT(eK1, sgn((p - 0.5) * 100) + 'pp'); setT(eK2, sgn((p - B.dmp) * 100) + 'pp');
        eK1.classList.toggle('neg', p < 0.5); eK2.classList.toggle('neg', p < B.dmp);
        setT(lg.pm, (B.dmp * 100).toFixed(1)); setT(lg.ps, (B.dsp * 100).toFixed(1));
        setT(lg.lm, (B.dml * 100).toFixed(1)); setT(lg.ls, (B.dsl * 100).toFixed(1));
        setT(lg.om, (p * 100).toFixed(1)); setT(lg.os, (B.ps * 100).toFixed(1));
        const pa = 1 / (B.dsp * B.dsp), pb = 1 / (B.dsl * B.dsl), wb = (100 * pb) / (pa + pb);
        if (eRg) { eRg.style.setProperty('--dkb-w', wb.toFixed(1)); setT(eRgv, String(Math.round(wb))); }
      }
    };
    J.task(bay, frame);
  };

  /* =====================================================================================================
   * 2) ACTIVITY LOG
   * ===================================================================================================== */
  const initLog = () => {
    const list = $('#dkb-rl'), holder = $('#dkb-rows'), chipsEl = $('#dkb-chips'), cnt = $('#dkb-cnt'), liveB = $('#dkb-live'), lv = $('#dkb-lv');
    if (!list || !holder || !chipsEl) return;
    const META = {}, ORDER = [];
    J.AGENTS.forEach((a) => { const m = { key: a.key, name: a.name, col: a.col, rgb: rgbOf(a.col), n: 0, muted: false, chip: null, nEl: null }; META[a.key] = m; META[a.name.toLowerCase()] = m; ORDER.push(m); });
    const JEVM = { key: 'jev', name: 'JEV', col: C.pink, rgb: rgbOf(C.pink) };
    const GRAY = { key: 'x', name: '?', col: '#b8b2c2', rgb: '184,178,194' };
    const more = $('#dkb-more'), tip = $('#dkb-tip'), tph = $('#dkb-tph'), tpt = $('#dkb-tpt'), rw = $('#dkb-rw') || holder.parentElement;
    let rows = [], q = [], rh = 27, rn = 12, anim = null, resolved = 27, lastReal = -1e9, lastIns = 0, nextSyn = 0, hover = false, hold = false, kbOn = false, kbIdx = 0, missed = 0, tipLi = null;
    const VENUES = ['binance', 'okx', 'bybit', 'hyperliquid', 'coinbase', 'kraken'];
    const px = () => J.pick(['btc', 'btc', 'eth', 'sol']);
    const money = (v) => (v >= 0 ? '+$' : '-$') + Math.abs(v).toFixed(2);

    // ---- chips (mute / unmute an agent) ----
    ORDER.forEach((m) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'dkb-ch'; b.setAttribute('aria-pressed', 'true'); b.title = m.name.toLowerCase() + ' · ' + (J.AGENTS.find((a) => a.key === m.key) || {}).role;
      b.style.setProperty('--a', m.col); b.style.setProperty('--ar', m.rgb);
      const i = document.createElement('i'), n = document.createElement('b'), u = document.createElement('u');
      n.textContent = m.name; u.textContent = '0'; b.append(i, n, u); m.dot = i;
      b.title += ' · click to mute · double-click to solo';
      b.addEventListener('click', () => { m.muted = !m.muted; applyMute(); });
      b.addEventListener('dblclick', () => { const solo = ORDER.every((o) => o === m ? !o.muted : o.muted); ORDER.forEach((o) => { o.muted = solo ? false : o !== m; }); applyMute(); });
      chipsEl.appendChild(b); m.chip = b; m.nEl = u;
    });

    /** filter: muted agents stop producing rows AND the rows already on screen dim out (the list never reflows) */
    const applyMute = () => {
      ORDER.forEach((m) => m.chip.setAttribute('aria-pressed', String(!m.muted)));
      rows.forEach((li) => { const m = META[li.dataset.ag]; li.classList.toggle('mute', !!(m && m.muted)); });
      q = q.filter((it) => !(it.m && it.m.muted));
    };

    // ---- synthesiser (only used while no 'agentstep' arrives) ----
    const mkt = () => Math.round(J.market.price);
    const lastD = () => J.recent[0] || null;
    const GEN = {
      spotter: [
        () => ['scan', null, 'cross-checked three feeds · ' + J.pick(VENUES) + ' leads'],
        () => ['scan', null, 'spread ' + J.rnd(0.5, 3.2).toFixed(1) + 'bps on ' + px() + ' · book ok'],
        () => ['feed', null, 'heartbeat ok · latency ' + J.ri(12, 88) + 'ms'],
        () => ['scan', null, 'imbalance ' + sgn(J.rnd(-0.6, 0.6), 2) + ' on ' + J.pick(VENUES)],
      ],
      prior: [
        () => ['prior', null, 'updated on ' + fmt(1204 + J.ri(0, 90)) + ' passes'],
        () => ['update', null, 'p(up 5m) ' + J.rnd(48, 66).toFixed(1) + '% · n=' + fmt(1204 + J.ri(0, 90))],
        () => ['prior', null, 'implied drift flat · carry does not clear fees'],
        () => ['scan', Math.random() < 0.5 ? J.rnd(8, 60) : null, 'prediction-book check · fair ' + fmt(mkt() + J.ri(-9, 14))],
      ],
      edge: [
        () => ['edge', null, sgn(J.rnd(0.5, 6), 1) + 'bps over threshold · pass to kelly'],
        () => ['fair', null, 'fair ' + fmt(mkt() + J.ri(-6, 14)) + ' vs market ' + fmt(mkt())],
        () => ['edge', null, 'net of costs ' + sgn(J.rnd(-1, 4), 1) + 'bps · thin, wait'],
        () => { const d = lastD(); return ['edge', null, d ? 'jev asked · edge ' + sgn(d.state.edge_bps, 1) + 'bps on ' + d.symbol.split('-')[0].toLowerCase() : 'no edge above the floor']; },
      ],
      kelly: [
        () => ['size', null, 'kelly ' + J.pick(['0.5', '1', '2', '1']) + '% · capped by 4% max position'],
        () => ['size', null, 'drawdown guard ' + J.rnd(0.1, 1.8).toFixed(1) + '/10 · ok'],
        () => ['size', null, 'vol ' + J.ri(48, 118) + ' · size cut to 0.5%'],
      ],
      taker: [
        () => ['cross', J.rnd(-30, 80), 'crossed spread · ' + J.pick(['bought', 'sold']) + ' ' + J.rnd(0.04, 0.4).toFixed(2) + ' btc'],
        () => ['fill', J.rnd(-20, 55), 'filled on ' + J.pick(VENUES) + ' · slip ' + J.rnd(0.1, 0.9).toFixed(1) + 'bps'],
        () => ['queue', null, 'waiting for jev to clear the ticket'],
      ],
      closer: [
        () => ['close', J.rnd(10, 90), 'target hit · closed +' + J.rnd(3, 14).toFixed(1) + 'bps'],
        () => ['stop', -J.rnd(8, 60), 'stop hit · closed -' + J.rnd(3, 11).toFixed(1) + 'bps · rule held'],
        () => ['trail', null, 'trail moved to ' + fmt(mkt() - J.ri(5, 40))],
      ],
    };
    const WGT = ['spotter', 'spotter', 'prior', 'prior', 'edge', 'edge', 'kelly', 'taker', 'taker', 'closer'];
    const synth = () => { const k = J.pick(WGT), g = J.pick(GEN[k])(); return step(META[k], g[0], g[1], g[2]); };

    // ---- items ----
    const step = (m, verb, pnl, text) => {
      m = m || GRAY; const has = typeof pnl === 'number' && isFinite(pnl) && Math.abs(pnl) >= 0.005;
      return { m, name: m.name, col: m.col, rgb: m.rgb, verb: String(verb || 'step'), val: has ? money(pnl) : '—', tone: has ? (pnl >= 0 ? 'up' : 'dn') : '', text: String(text == null ? '' : text), cls: '' };
    };
    const decItem = (d) => {
      const dest = d.dest, tone = dest === 'execute' ? 'up' : dest === 'review' ? 'am' : 'gy';
      const act = d.action, sz = act === 'hold' ? '' : ' ' + d.size + '%';
      return { m: JEVM, name: 'JEV', col: C.pink, rgb: JEVM.rgb, verb: 'choice', val: '→ ' + dest, tone, cls: 'dkb-j',
        text: act + ' ' + d.symbol.split('-')[0].toLowerCase() + sz + ' · conf ' + d.conf.toFixed(2).replace(/^0/, '') + (dest === 'execute' || act === 'hold' ? '' : ' · ' + d.reason) };
    };
    const kill = (on) => ({ m: JEVM, name: 'JEV', col: on ? C.red : C.green, rgb: on ? rgbOf(C.red) : rgbOf(C.green), verb: on ? 'kill' : 'armed', val: on ? '■ halted' : '● armed', tone: on ? 'dn' : 'up', cls: on ? 'dkb-j dkb-rk' : 'dkb-j',
      text: on ? 'kill switch thrown · every order routes to review' : 'kill switch released · gate open at ' + S.floor.toFixed(2) });

    const mk = (it) => {
      const li = document.createElement('li');
      li.className = 'dkb-r' + (it.cls ? ' ' + it.cls : '');
      li.style.setProperty('--a', it.col); li.style.setProperty('--ar', it.rgb);
      const d = document.createElement('i'); d.className = 'dkb-d';
      const b = document.createElement('b'); b.className = 'dkb-ag'; b.textContent = it.name;
      const v = document.createElement('span'); v.className = 'dkb-vb'; v.textContent = it.verb;
      const p = document.createElement('span'); p.className = 'dkb-v' + (it.tone ? ' ' + it.tone : ''); p.textContent = it.val;
      const m = document.createElement('span'); m.className = 'dkb-ms'; m.textContent = it.text;
      li.dataset.ag = it.m.key; li._it = it;
      if (it.m.muted) li.classList.add('mute');
      li.append(d, b, v, p, m);
      return li;
    };
    const count = (it, flash) => {
      const m = it.m;
      if (m && m.nEl) { m.n++; setT(m.nEl, String(m.n)); if (flash && m.dot.animate && !J.reduce) m.dot.animate([{ transform: 'scale(2.4)', opacity: 1 }, { transform: 'scale(1)', opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)' }); }
      resolved++; setT(cnt, fmt(resolved));
    };
    const trim = (extra) => { while (rows.length > rn + extra) rows.pop().remove(); };
    /** the whole list is ONE moving layer: it jumps up by one row and eases back, so rows can never overlap or tear */
    const shift = () => {
      if (J.reduce || !list.animate) return;
      if (anim) anim.cancel();
      // 520 ms with a fast-out curve: the leftover offset of the previous shift (<1px at our 400 ms spacing) is negligible, and a starved frame loop can never stack offsets
      anim = list.animate([{ transform: 'translateY(' + -rh + 'px)' }, { transform: 'translateY(0px)' }], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' });
      anim.onfinish = () => { anim = null; trim(0); };
    };
    const push = (it) => {
      const li = mk(it);
      if (!J.reduce) { li.classList.add('new'); li.addEventListener('animationend', (e) => { if (e.target === li && !e.pseudoElement) li.classList.remove('new'); }); }
      list.prepend(li); rows.unshift(li);
      shift(); trim(1); count(it, true);
    };
    const fillTo = (n) => { while (rows.length < n) { const it = synth(); const li = mk(it); list.appendChild(li); rows.push(li); count(it, false); } };
    const enqueue = (it) => {
      if (it.m && it.m.muted) return;
      q.push(it); if (q.length > 14) q.shift();
      if (paused()) { missed++; pill(); }
    };
    /** '+N' pill while the log is held: N steps arrived meanwhile, click to catch up */
    const pill = () => {
      const n = paused() ? Math.min(missed, 99) : 0, s = n ? '+' + n : '';
      if (more.hidden === !n && more.textContent === s) return;
      more.hidden = !n; setT(more, s);
    };
    const flush = () => {
      const items = q.splice(0); missed = 0;
      hideTip(); items.slice(-3).forEach(push); pill();
    };
    more.addEventListener('click', flush);
    // ---- full message card (rows stay one line; the card shows everything) ----
    const hideTip = () => { tipLi = null; tip.classList.remove('on'); tip.setAttribute('aria-hidden', 'true'); rows.forEach((r) => r.classList.remove('sel')); };
    const placeTip = () => {
      if (!tipLi || !tipLi.isConnected) return hideTip();
      const a = tipLi.getBoundingClientRect(), b = rw.getBoundingClientRect(), th = tip.offsetHeight, top = a.bottom - b.top + 4;
      tip.style.transform = ''; tip.style.top = (top + th > b.height - 2 ? a.top - b.top - th - 4 : top) + 'px';
    };
    const showTip = (li) => {
      const it = li && li._it; if (!it) return hideTip();
      const ms = li.querySelector('.dkb-ms');
      if (!kbOn && ms && ms.scrollWidth <= ms.clientWidth + 1) return hideTip();
      rows.forEach((r) => r.classList.toggle('sel', r === li));
      tip.style.setProperty('--ar', it.rgb); tph.style.color = it.col;
      setT(tph, it.name.toLowerCase() + ' · ' + it.verb + (it.val !== '—' ? ' · ' + it.val : '') + '  '); setT(tpt, it.text);
      tipLi = li; tip.classList.add('on'); tip.setAttribute('aria-hidden', 'false'); placeTip();
    };
    list.addEventListener('pointerover', (e) => { if (e.pointerType === 'mouse') showTip(e.target.closest('.dkb-r')); });
    rw.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !hold && !kbOn) hideTip(); });
    list.addEventListener('pointerup', (e) => { if (e.pointerType === 'mouse') return; const li = e.target.closest('.dkb-r'); if (li) { hold = true; sync(); showTip(li); } });
    holder.addEventListener('focus', () => { kbOn = true; kbIdx = 0; sync(); showTip(rows[0]); });
    holder.addEventListener('blur', () => { kbOn = false; hideTip(); sync(); if (!paused()) resume(); });
    holder.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { kbIdx = clamp(kbIdx + (e.key === 'ArrowDown' ? 1 : -1), 0, rows.length - 1); showTip(rows[kbIdx]); }
      else if (e.key === 'Home') { kbIdx = 0; showTip(rows[0]); } else if (e.key === 'End') { kbIdx = rows.length - 1; showTip(rows[kbIdx]); }
      else if (e.key === 'Escape') holder.blur(); else return;
      e.preventDefault();
    });

    // ---- layout vars from css (--rh / --rn change with the container width) ----
    let seeded = false;
    const readVars = () => {
      const cs = getComputedStyle(holder);
      rh = parseFloat(cs.getPropertyValue('--rh')) || 27; rn = parseInt(cs.getPropertyValue('--rn'), 10) || 12;
      trim(0); fillTo(rn);
      if (!seeded) { // a few real-looking JEV rows among the agent rows
        seeded = true;
        for (let i = 0; i < 3; i++) { const at = 1 + i * 4; if (at >= rows.length) break; const nu = mk(decItem(J.makeDecision())); rows[at].replaceWith(nu); rows[at] = nu; }
      }
    };
    J.watch(holder, readVars); J.watch(lgc, readVars);

    // ---- sources ----
    J.bus.on('agentstep', (s) => {
      if (!s) return; lastReal = performance.now();
      enqueue(step(META[String(s.agent == null ? '' : s.agent).toLowerCase()] || (s.agent ? { key: 'x', name: String(s.agent).toUpperCase().slice(0, 7), col: GRAY.col, rgb: GRAY.rgb } : GRAY), s.verb, s.pnl, s.text));
    });
    J.bus.on('decision', (d) => { if (d && d.state) enqueue(decItem(d)); });
    J.bus.on('kill', (on) => { q.length = 0; push(kill(!!on)); });

    // ---- hover / tap pauses ----
    const paused = () => hover || hold || kbOn;
    const sync = () => { const p = paused(); liveB.setAttribute('aria-pressed', String(p)); setT(lv, p ? 'paused' : 'live'); if (!p) missed = 0; pill(); };
    const resume = () => { if (q.length > 4) q.splice(0, q.length - 4); lastIns = 0; missed = 0; pill(); };
    rw.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { hover = true; sync(); } });
    rw.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { hover = false; sync(); if (!paused()) resume(); } });
    liveB.addEventListener('click', () => { hold = !hold; if (!hold) hideTip(); sync(); if (!paused()) resume(); });

    // data rain: faint falling streaks behind the rows (tier >= 2, low opacity, own gated task, DPR 1)
    const rain = $('#dkb-rain');
    if (rain) {
      const NC = 18, RX = new Float32Array(NC), RY = new Float32Array(NC), RV = new Float32Array(NC), RS = new Float32Array(NC);
      const rs = document.createElement('canvas'); rs.width = 4; rs.height = 64; { const g = rs.getContext('2d'); for (let y = 0; y < 64; y += 4) { g.fillStyle = 'rgba(255,120,170,' + ((y / 64) * (y / 64) * 0.9).toFixed(3) + ')'; g.fillRect(1, y, 2, 2.4); } g.fillStyle = 'rgba(255,220,235,.95)'; g.fillRect(0, 60, 4, 4); }
      let rw2 = 0, rh2 = 0, rg = null;
      const relay = () => { const f = J.fit(rain, 1); rg = f.g; rw2 = f.W; rh2 = f.H; for (let i = 0; i < NC; i++) { RX[i] = Math.round(((i + Math.random() * 0.8) / NC) * rw2); RY[i] = Math.random() * rh2; RV[i] = 18 + Math.random() * 40; RS[i] = 0.5 + Math.random() * 0.8; } };
      J.watch(holder, relay);
      J.task(rain, (t, dt) => {
        if (!rg || !rw2) return;
        if (TIER() < 2 || J.reduce) { rain.style.display = 'none'; return; }
        rain.style.display = '';
        rg.clearRect(0, 0, rw2, rh2); const n = TIER() >= 3 ? NC : 10;
        for (let i = 0; i < n; i++) { RY[i] += RV[i] * dt; if (RY[i] - 64 * RS[i] > rh2) { RY[i] = 0; RV[i] = 18 + Math.random() * 40; } rg.drawImage(rs, RX[i], RY[i] - 64 * RS[i], 4, 64 * RS[i]); }
      });
    }
    J.task(list, (t) => {
      const now = t * 1000;
      if (paused()) { if (tipLi) placeTip(); return; }
      if (performance.now() - lastReal > 2600 && now >= nextSyn) { enqueue(synth()); nextSyn = now + 1000 + Math.random() * 500; }
      if (q.length && now - lastIns > 400) { push(q.shift()); lastIns = now; }
    });
  };

  /* =====================================================================================================
   * 3) DRIFT VS NOISE
   * ===================================================================================================== */
  const initDrift = () => {
    const wrap = $('#dkb-dw'), cs = $('#dkb-ds'), cA = $('#dkb-dp'), cB = $('#dkb-dq'), co = $('#dkb-do');
    if (!wrap || !cs || !cA || !cB || !co) return;
    const ePP = $('#dkb-pp'), eTr = $('#dkb-tr'), ePool = $('#dkb-pool'), eRuns = $('#dkb-runs');
    const oP = odo(ePP);
    const N = 140, T = 220, S1 = T + 1, NB = 14, NBIN = 30, RATE = T / 7.2, HOLD = 3.2, XF = 0.9, PRE = 44, MU0 = 0.8, SG0 = 8.6, VMIN = -150, VSTEP = 600 / NB;
    // the whole run is drawn up front (PX = equity of path i at step k), so a path can be coloured by where it ENDS and a resize re-draws the same run instead of re-rolling it
    const PX = new Float32Array(N * S1), MN = new Float32Array(S1), BKI = new Uint8Array(N), BKS = new Uint16Array(NB + 1), BKP = new Uint16Array(NB);
    const HB = new Float32Array(NBIN), HC = new Uint16Array(NBIN), CV = [cA, cB], CG = [null, null];
    // colour = where a path ENDS (bps): hot pink (loss) -> violet -> blue -> cyan -> green -> amber (big win); bucketed so a whole bucket strokes in one call
    const STOPS = [[-150, 255, 46, 110], [-50, 166, 107, 255], [40, 77, 141, 255], [120, 92, 225, 255], [190, 46, 230, 166], [290, 255, 193, 61], [420, 255, 226, 170]];
    const ramp = (v) => {
      let i = 1; while (i < STOPS.length - 1 && v > STOPS[i][0]) i++;
      const a = STOPS[i - 1], b = STOPS[i], f = clamp((v - a[0]) / (b[0] - a[0]), 0, 1);
      return ((a[1] + (b[1] - a[1]) * f) | 0) + ',' + ((a[2] + (b[2] - a[2]) * f) | 0) + ',' + ((a[3] + (b[3] - a[3]) * f) | 0);
    };
    const CORE = [], HALO = [], BAR = [], HEAD = [], RGB = [], SPB = [];
    for (let q = 0; q < NB; q++) { const s = ramp(VMIN + (q + 0.5) * VSTEP); RGB[q] = s; CORE[q] = 'rgba(' + s + ',.34)'; HALO[q] = 'rgba(' + s + ',.035)'; BAR[q] = 'rgba(' + s + ',.85)'; HEAD[q] = 'rgba(' + s + ',.9)'; }
    const bk = (v) => clamp(Math.floor((v - VMIN) / VSTEP), 0, NB - 1);
    let W = 0, H = 0, gs = null, go = null, ok = false, lw = 0, lh = 0, have = false, snap = true;
    let RAD = null, padL = 36, padT = 24, padB = 22, hx0 = 0, hx1 = 0, histW = 52, px0 = 0, px1 = 0, pw = 0, ph = 0, dx = 1, lo = 0, hi = 1, invR = 1;
    const STR = new Int16Array(8); let mu = MU0, sg = SG0, step = 0, phase = 0, phT = 0, acc = 0, cur = 0, xf = XF, poolW = 0, poolN = 0, runs = 0, domT = 9, my = 0, meanStr = '+0';
    const yPx = (v) => padT + ph - (v - lo) * invR * ph;
    const meanCv = document.createElement('canvas'), haltCv = document.createElement('canvas'); let meanW = 40;
    // pointer probe: a horizontal threshold line — the label says what share of the 140 paths sits above it
    const PRD = { on: false, x: 0, y: 0, a: 0, idx: 0, k: '', t: -9, w: 100, cv: document.createElement('canvas'), pk: '', pt: -9, pw: 120, pc: document.createElement('canvas') };
    const pos = (e) => { PRD.on = true; PRD.x = e.offsetX; PRD.y = e.offsetY; };
    co.addEventListener('pointermove', pos);
    co.addEventListener('pointerdown', pos);
    co.addEventListener('pointerleave', () => { PRD.on = false; });
    co.addEventListener('pointercancel', () => { PRD.on = false; });
    co.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') PRD.on = false; });
    co.addEventListener('blur', () => { PRD.on = false; });
    co.addEventListener('keydown', (e) => {
      const k = e.key, d = e.shiftKey ? 24 : 8;
      if (!PRD.on) { PRD.on = true; PRD.x = px0 + Math.min(step, T) * dx * 0.6; PRD.y = my; }
      if (k === 'ArrowLeft') PRD.x -= d; else if (k === 'ArrowRight') PRD.x += d; else if (k === 'ArrowUp') PRD.y -= d; else if (k === 'ArrowDown') PRD.y += d;
      else if (k === 'Escape') PRD.on = false; else return;
      PRD.x = clamp(PRD.x, px0, W - 2); PRD.y = clamp(PRD.y, padT + 1, padT + ph - 1); e.preventDefault();
    });
    const bakeMean = () => { meanW = meanStr.length * 5.6 + 12; bake(meanCv, meanStr, meanW, 15, 'rgba(10,6,16,.88)', 'rgba(255,255,255,.55)', '#fff', F_TAG); };
    const bakeHalt = () => bake(haltCv, 'HALTED · NO ORDERS, NO WALK', 168, 22, 'rgba(40,6,12,.86)', 'rgba(255,77,94,.8)', '#ff9aa4', F_HALT);

    // the first run is pre-resolved from the endpoint distribution so the caption never starts empty
    { let w = 0; for (let i = 0; i < N; i++) if (MU0 * T + SG0 * Math.sqrt(T) * gauss() > 0) w++; poolW = w; poolN = N; runs = 1; }

    const drawStatic = () => {
      const g = gs; g.clearRect(0, 0, W, H); g.lineWidth = 1; g.font = '9px ' + MONO; g.textBaseline = 'alphabetic';
      // y grid + labels (bps)
      const rng = hi - lo, p10 = Math.pow(10, Math.floor(Math.log10(rng / 4))), nn = rng / 4 / p10, stp = (nn < 1.5 ? 1 : nn < 3.5 ? 2 : nn < 7.5 ? 5 : 10) * p10;
      g.textAlign = 'right';
      for (let v = Math.ceil(lo / stp) * stp; v <= hi; v += stp) {
        const y = Math.round(yPx(v)) + 0.5, zero = Math.abs(v) < 1e-6;
        g.setLineDash(zero ? DASH : NODASH); g.strokeStyle = zero ? 'rgba(255,255,255,.26)' : 'rgba(255,255,255,.05)';
        g.beginPath(); g.moveTo(px0, y); g.lineTo(px1 + 4, y); g.stroke(); g.setLineDash(NODASH);
        g.fillStyle = zero ? 'rgba(240,233,248,.95)' : 'rgba(181,172,196,.82)'; g.fillText(zero ? '0' : (v > 0 ? '+' : '') + Math.round(v), padL - 6, y + 3);
      }
      // ±2σ noise cone (dotted) and the drift line (dashed)
      g.setLineDash(DOT); g.strokeStyle = 'rgba(255,255,255,.2)';
      for (const sd of [2, -2]) { g.beginPath(); for (let k = 0; k <= T; k += 4) { const x = px0 + k * dx, y = yPx(MU0 * k + sd * SG0 * Math.sqrt(k)); if (k) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); }
      g.setLineDash(DASH); g.strokeStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.moveTo(px0, yPx(0)); g.lineTo(px1, yPx(MU0 * T)); g.stroke(); g.setLineDash(NODASH);
      // x axis
      g.fillStyle = 'rgba(181,172,196,.85)'; g.textAlign = 'left'; g.fillText('trade 1', px0, H - 7); g.textAlign = 'center'; g.fillText(String(T >> 1), px0 + pw / 2, H - 7); g.textAlign = 'right'; g.fillText(String(T), px1, H - 7);
      // caption + histogram well
      g.textAlign = 'left'; g.fillStyle = 'rgba(170,161,184,.9)'; g.font = '8.5px ' + MONO; g.fillText('equity · bps of capital · simulated', padL, 12);
      rr(g, hx0, padT, histW, ph, 5); g.fillStyle = 'rgba(255,255,255,.03)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.07)'; g.stroke();
      g.textAlign = 'right'; g.fillStyle = 'rgba(170,161,184,.9)'; g.fillText('end values', hx1, 12);
    };

    /** roll a whole run (140 walks) once, sort the paths into colour buckets by their end value, and cache the sample mean per step */
    const gen = () => {
      mu = MU0 * (0.94 + Math.random() * 0.12); sg = SG0 * (0.97 + Math.random() * 0.06);
      MN.fill(0);
      for (let i = 0; i < N; i++) {
        const o = i * S1, vs = sg * (0.82 + Math.random() * 0.36); let x = 0; PX[o] = 0;
        for (let k = 1; k < S1; k++) { x += mu + vs * gauss(); PX[o + k] = x; MN[k] += x; }
      }
      for (let k = 1; k < S1; k++) MN[k] /= N;
      { const bv = new Float32Array(8).fill(-1e9); STR.fill(0); // the 8 strongest paths (by end value) wear comets
        for (let i = 0; i < N; i++) { let v = PX[i * S1 + T], j = 7; if (v <= bv[7]) continue; while (j > 0 && v > bv[j - 1]) { bv[j] = bv[j - 1]; STR[j] = STR[j - 1]; j--; } bv[j] = v; STR[j] = i; } }
      BKS.fill(0);
      for (let i = 0; i < N; i++) BKS[bk(PX[i * S1 + T]) + 1]++;
      for (let q = 0; q < NB; q++) BKS[q + 1] += BKS[q];
      BKP.set(BKS.subarray(0, NB));
      for (let i = 0; i < N; i++) BKI[BKP[bk(PX[i * S1 + T])]++] = i;
    };
    /** draw steps a..b of the current run: ONE stroke per colour bucket per layer, however many steps (a frame, the head start, or a whole re-draw after a resize) */
    const paint = (g, a, b) => {
      if (b <= a) return;
      const xa = px0 + a * dx;
      g.globalCompositeOperation = 'lighter'; g.lineJoin = 'round'; g.lineCap = 'butt';
      for (let pass = 0; pass < 2; pass++) {
        g.lineWidth = pass ? 1 : 3.2;
        for (let q = 0; q < NB; q++) {
          const s0 = BKS[q], s1 = BKS[q + 1]; if (s0 === s1) continue;
          g.strokeStyle = pass ? CORE[q] : HALO[q]; g.beginPath();
          for (let j = s0; j < s1; j++) { const o = BKI[j] * S1; g.moveTo(xa, yPx(PX[o + a])); for (let k = a + 1; k <= b; k++) g.lineTo(px0 + k * dx, yPx(PX[o + k])); }
          g.stroke();
        }
      }
      // the sample mean: the bright spine of the cloud
      g.beginPath(); g.moveTo(xa, yPx(MN[a])); for (let k = a + 1; k <= b; k++) g.lineTo(px0 + k * dx, yPx(MN[k]));
      g.lineWidth = 4; g.strokeStyle = 'rgba(255,255,255,.09)'; g.stroke();
      g.lineWidth = 1.5; g.strokeStyle = 'rgba(255,255,255,.92)'; g.stroke();
      g.globalCompositeOperation = 'source-over';
    };
    /** a fresh run on the active layer, already `pre` steps in — the cloud is never empty */
    const newRun = (pre) => {
      gen(); const g = CG[cur]; g.clearRect(0, 0, W, H);
      step = 0; acc = 0; paint(g, 0, pre); step = pre;
    };
    /** crossfade: the finished run dissolves out on its layer while the new one dissolves in on the other */
    const fade = () => {
      const k = Math.min(1, xf / XF), e = k * k * (3 - 2 * k);
      CV[cur].style.opacity = e >= 1 ? '1' : e.toFixed(3); CV[cur ^ 1].style.opacity = e >= 1 ? '0' : (1 - e).toFixed(3);
    };

    const lay = () => {
      const a = J.fit(cs), b = J.fit(cA), b2 = J.fit(cB), c = J.fit(co);
      CG[0] = b.g; CG[1] = b2.g; gs = a.g; go = c.g;
      RAD = go.createLinearGradient(-80, 0, 0, 0); RAD.addColorStop(0, 'rgba(120,210,255,0)'); RAD.addColorStop(.75, 'rgba(120,210,255,.07)'); RAD.addColorStop(1, 'rgba(190,235,255,.22)');
      if (a.W === lw && a.H === lh && ok) return;
      W = a.W; H = a.H; lw = W; lh = H;
      ok = W > 150 && H > 150;
      if (!ok) return;
      histW = W < 340 ? 36 : 52; padL = 36; padT = 24; padB = 22;
      hx1 = W - 6; hx0 = hx1 - histW; px0 = padL; pw = hx0 - 12 - px0; px1 = px0 + pw; ph = H - padT - padB; dx = pw / T;
      const m = MU0 * T, s = SG0 * Math.sqrt(T); lo = m - 3.1 * s; hi = m + 3.0 * s; invR = 1 / (hi - lo);
      drawStatic(); my = yPx(0); bakeMean(); bakeHalt();
      if (!have) { have = true; newRun(J.reduce ? T : PRE); if (J.reduce) { phase = 1; xf = XF; } }
      else { // same run, new geometry (the resize cleared the layers)
        CG[cur ^ 1].clearRect(0, 0, W, H); CG[cur].clearRect(0, 0, W, H); paint(CG[cur], 0, step);
        xf = XF; fade();
      }
      snap = true; if (J.reduce) overlay(0, 0.016, S.killed);
    };
    onFonts.push(() => { if (!ok) return; drawStatic(); bakeMean(); bakeHalt(); });

    const wins = () => { let w = 0; for (let i = 0; i < N; i++) if (PX[i * S1 + step] > 0) w++; return w; };
    const finish = () => { poolW += wins(); poolN += N; runs++; };
    let mv = 0;

    /** overlay layer: histogram of the current values, run heads, sample-mean tag, probe, kill banner */
    const overlay = (t, dt, killed) => {
      const g = go; g.clearRect(0, 0, W, H);
      const xh = px0 + step * dx, o = step;
      HC.fill(0);
      for (let i = 0; i < N; i++) { const v = (PX[i * S1 + o] - lo) * invR * NBIN; if (v >= 0 && v < NBIN) HC[v | 0]++; }
      const fxo = FX_ON(), sn = snap || J.reduce, binH = ph / NBIN, kb = sn ? 1 : 1 - Math.exp(-dt * 14);
      g.globalCompositeOperation = 'lighter';
      for (let b = 0; b < NBIN; b++) {
        HB[b] += (Math.min(1, HC[b] * (1 / (N * 0.1))) - HB[b]) * kb;
        const wob = fxo ? 1 + 0.07 * Math.sin(t * 2.6 + b * 0.55) + 0.04 * Math.sin(t * 4.3 - b * 0.9) : 1, w = Math.min(histW - 5, HB[b] * (histW - 5) * wob); if (w < 0.7) continue;
        g.fillStyle = BAR[bk(lo + ((b + 0.5) / NBIN) * (hi - lo))]; g.fillRect(hx1 - 1 - w, padT + ph - (b + 1) * binH + 0.6, w, Math.max(1, binH - 1.2));
        if (fxo && w > 4) { g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(hx1 - 1 - w, padT + ph - (b + 1) * binH + 0.6, 2, Math.max(1, binH - 1.2)); }
      }
      snap = false;
      g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(hx1 - 1, padT, 1, ph);
      // frontier line + heads (each head wears its path's colour)
      if (step > 0 && step < T) { g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(xh - 0.5, padT, 1, ph); }
      for (let q = 0; q < NB; q++) { const s0 = BKS[q], s1 = BKS[q + 1]; if (s0 === s1) continue; g.fillStyle = HEAD[q]; for (let j = s0; j < s1; j++) g.fillRect(xh - 1, yPx(PX[BKI[j] * S1 + o]) - 1, 2, 2); }
      if (fxo && !killed) {
        const nc = TIER() >= 3 ? 8 : 4, grow = step < T;
        for (let c = 0; c < nc && o > 4; c++) {
          const base = STR[c] * S1, q = bk(PX[base + T]), spr = SPB[q] || (SPB[q] = sprite(RGB[q])), hp = grow ? o : ((t * 0.4 + c * 0.11) % 1) * o, h0 = hp | 0;
          const t3 = Math.max(0, h0 - 16), t2 = Math.max(0, h0 - 8), t1 = Math.max(0, h0 - 3);
          for (let z = 0; z < 3; z++) {
            const a0 = z === 0 ? t3 : z === 1 ? t2 : t1, b0 = z === 0 ? t2 : z === 1 ? t1 : h0;
            g.beginPath(); g.moveTo(px0 + a0 * dx, yPx(PX[base + a0])); for (let k = a0 + 1; k <= b0; k++) g.lineTo(px0 + k * dx, yPx(PX[base + k]));
            g.lineWidth = 1.2 + z * 0.8; g.strokeStyle = 'rgba(' + RGB[q] + ',' + (0.25 + z * 0.3) + ')'; g.stroke();
          }
          g.globalAlpha = 0.95; g.drawImage(spr, px0 + h0 * dx - 11, yPx(PX[base + h0]) - 11, 22, 22); g.globalAlpha = 1;
        }
        // radar sweep: a scan line crosses the cloud, light trailing behind it
        const sx = px0 + ((t / 7) % 1) * Math.max(40, Math.min(step, T) * dx);
        g.save(); g.translate(sx, 0); g.fillStyle = RAD; g.fillRect(-80, padT, 80, ph); g.fillStyle = 'rgba(200,238,255,.45)'; g.fillRect(0, padT, 1, ph); g.restore();
      }
      g.globalCompositeOperation = 'source-over';
      // mean tag riding the histogram
      mv = MN[o];
      my += (yPx(mv) - my) * (sn ? 1 : 1 - Math.exp(-dt * 13));
      g.setLineDash(DOT); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1; g.beginPath(); g.moveTo(xh, my + 0.5); g.lineTo(hx0 - 2, my + 0.5); g.stroke(); g.setLineDash(NODASH);
      g.drawImage(meanCv, hx0 - 4 - meanW, my - 7.5, meanW, 15);
      // pointer over the plot: the nearest path lights up (full trace + a faint comet running along it + a readout);
      // pointer over the histogram well: a level line, the share of paths above it and the count in the bin under it
      PRD.a += ((PRD.on ? 1 : 0) - PRD.a) * (sn ? 1 : 1 - Math.exp(-dt * (PRD.on ? 16 : 7)));
      const inY = PRD.y > padT && PRD.y < padT + ph;
      if (PRD.on && inY && PRD.x >= hx0 - 2) {
        const thr = lo + (1 - (PRD.y - padT) / ph) * (hi - lo), bin = clamp(Math.floor((1 - (PRD.y - padT) / ph) * NBIN), 0, NBIN - 1); let above = 0;
        for (let i = 0; i < N; i++) if (PX[i * S1 + o] > thr) above++;
        g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(hx0 + 1, padT, histW - 2, PRD.y - padT);
        g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(hx0 + 1, padT + ph - (bin + 1) * binH, histW - 2, binH);
        g.setLineDash(NODASH); g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,.65)'; g.beginPath(); g.moveTo(px0, Math.round(PRD.y) + 0.5); g.lineTo(hx1, Math.round(PRD.y) + 0.5); g.stroke();
        if (t - PRD.t > 0.08) {
          PRD.t = t; const txt = sgn(thr, 0) + 'bp · ' + Math.round((above / N) * 100) + '% above · ' + HC[bin] + ' in bin';
          if (txt !== PRD.k) { PRD.k = txt; PRD.w = txt.length * 5.6 + 12; bake(PRD.cv, txt, PRD.w, 15, 'rgba(10,6,16,.9)', 'rgba(255,255,255,.7)', '#fff', F_TAG); }
        }
        g.drawImage(PRD.cv, px0 + 6, clamp(PRD.y - 19, padT + 2, padT + ph - 17), PRD.w, 15);
      } else if (PRD.a > 0.02 && o > 0) {
        if (PRD.on && inY && PRD.x >= px0 - 2) { // pick the path whose value at the pointer's step is closest to the pointer's level
          const kk = clamp(Math.round((PRD.x - px0) / dx), 0, o), lv = lo + (1 - (PRD.y - padT) / ph) * (hi - lo); let bd = 1e9;
          for (let i = 0; i < N; i++) { const d = Math.abs(PX[i * S1 + kk] - lv); if (d < bd) { bd = d; PRD.idx = i; } }
          PRD.kk = kk;
        }
        const i = PRD.idx, base = i * S1, kk = Math.min(PRD.kk | 0, o), q = bk(PX[base + T]), a = PRD.a, rgb = RGB[q], spr = SPB[q] || (SPB[q] = sprite(rgb));
        g.globalCompositeOperation = 'lighter'; g.lineJoin = 'round'; g.lineCap = 'round';
        g.beginPath(); g.moveTo(px0, yPx(PX[base])); for (let k = 1; k <= o; k++) g.lineTo(px0 + k * dx, yPx(PX[base + k]));
        g.lineWidth = 4; g.strokeStyle = 'rgba(' + rgb + ',' + (0.12 * a).toFixed(3) + ')'; g.stroke();
        g.lineWidth = 1.8; g.strokeStyle = 'rgba(' + rgb + ',' + (0.95 * a).toFixed(3) + ')'; g.stroke();
        g.lineWidth = 0.7; g.strokeStyle = 'rgba(255,255,255,' + (0.55 * a).toFixed(3) + ')'; g.stroke();
        // comet: a faint head that runs the path from trade 1 to the frontier, with a fading tail
        if (!J.reduce) {
          const hp = ((t * 0.5) % 1) * o, h0 = hp | 0, tl = 22; g.lineWidth = 2;
          for (let k = Math.max(1, h0 - tl); k <= h0 && k <= o; k++) { const f = (k - (h0 - tl)) / tl; g.strokeStyle = 'rgba(255,255,255,' + (0.5 * f * f * a).toFixed(3) + ')'; g.beginPath(); g.moveTo(px0 + (k - 1) * dx, yPx(PX[base + k - 1])); g.lineTo(px0 + k * dx, yPx(PX[base + k])); g.stroke(); }
          g.globalAlpha = 0.8 * a; g.drawImage(spr, px0 + h0 * dx - 9, yPx(PX[base + h0]) - 9, 18, 18); g.globalAlpha = 1;
        }
        g.globalCompositeOperation = 'source-over';
        // marker + vertical hairline at the hovered step
        const mx = px0 + kk * dx, my2 = yPx(PX[base + kk]), val = PX[base + kk];
        g.globalAlpha = a; g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(Math.round(mx), padT, 1, ph);
        g.beginPath(); g.arc(mx, my2, 3.4, 0, TAU); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = 'rgba(' + rgb + ',1)'; g.stroke();
        if (t - PRD.pt > 0.07) {
          PRD.pt = t; const txt = '#' + String(i + 1).padStart(3, '0') + ' · ' + sgn(val, 0) + 'bp @ ' + kk + ' · ends ' + sgn(PX[base + o], 0);
          if (txt !== PRD.pk) { PRD.pk = txt; PRD.pw = txt.length * 5.6 + 12; bake(PRD.pc, txt, PRD.pw, 15, 'rgba(10,6,16,.92)', 'rgba(' + rgb + ',.85)', '#fff', F_TAG); }
        }
        g.drawImage(PRD.pc, clamp(mx + 10 + PRD.pw > px1 + 4 ? mx - 10 - PRD.pw : mx + 10, px0, px1 + 4 - PRD.pw), clamp(my2 - 24 < padT + 2 ? my2 + 10 : my2 - 24, padT + 2, padT + ph - 17), PRD.pw, 15);
        g.globalAlpha = 1;
      }
      if (killed) {
        g.fillStyle = 'rgba(255,60,80,.07)'; g.fillRect(px0, padT, hx1 - px0, ph);
        g.drawImage(haltCv, px0 + pw / 2 - 84, padT + ph / 2 - 11, 168, 22);
      }
    };

    const frame = (t, dt) => {
      if (!ok) return;
      const killed = S.killed;
      if (J.reduce) { if (step < T) { paint(CG[cur], step, T); step = T; finish(); phase = 1; xf = XF; fade(); } }
      else if (!killed) {
        if (phase === 0) {
          acc += dt * RATE; const n = Math.min(Math.floor(acc), T - step);
          if (n > 0) { acc -= n; paint(CG[cur], step, step + n); step += n; }
          if (step >= T) { phase = 1; phT = 0; finish(); }
        } else { phT += dt; if (phT > HOLD) { cur ^= 1; newRun(PRE); phase = 0; xf = 0; fade(); } }
        if (xf < XF) { xf = Math.min(XF, xf + dt); fade(); }
      }
      overlay(t, dt, killed);

      // ---- DOM at 4 Hz ----
      domT += dt;
      if (domT >= 0.25 || J.reduce) {
        domT = 0;
        oP(((wins() / N) * 100).toFixed(1)); setT(eTr, String(step));
        const ms = sgn(mv, 0); if (ms !== meanStr) { meanStr = ms; bakeMean(); }
        setT(ePool, ((poolW / poolN) * 100).toFixed(1) + '%'); setT(eRuns, runs + (runs === 1 ? ' run' : ' runs'));
      }
    };
    J.watch(wrap, lay); afterReveal(drc, lay);
    J.task(drc, frame);
  };

  /* heartbeat: the three cards breathe a synchronized glow on every decision / JEV.pulse (bus 'pulse' when core emits it) */
  let lastBeat = -1e9;
  const beat = (str) => {
    if (!FX_ON() || J.hidden()) return;
    const n = performance.now(); if (n - lastBeat < 260) return; lastBeat = n;
    const a = 0.12 + 0.3 * clamp(str, 0, 1), k = S.killed ? '255,77,94' : '255,46,110';
    [bay, lgc, drc].forEach((c) => J.animate(c, [{ boxShadow: '0 0 0 0 rgba(' + k + ',0), inset 0 0 0 rgba(' + k + ',0)' }, { boxShadow: '0 0 34px -6px rgba(' + k + ',' + a.toFixed(2) + '), inset 0 0 38px rgba(' + k + ',' + (a * 0.35).toFixed(2) + ')', offset: 0.2 }, { boxShadow: '0 0 12px -6px rgba(' + k + ',' + (a * 0.3).toFixed(2) + '), inset 0 0 14px rgba(' + k + ',' + (a * 0.1).toFixed(2) + ')', offset: 0.42 }, { boxShadow: '0 0 0 0 rgba(' + k + ',0), inset 0 0 0 rgba(' + k + ',0)' }], { duration: 1100, easing: 'ease-out' }));
  };
  J.bus.on('decision', (d) => beat(d && d.dest === 'execute' ? 0.8 : 0.4));
  J.bus.on('pulse', (s) => beat(+s || 0.5));
  initBayes();
  initLog();
  initDrift();
});
