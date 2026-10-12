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

