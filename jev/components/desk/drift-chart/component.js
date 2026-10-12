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

