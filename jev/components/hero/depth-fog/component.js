/* hero / depth-fog — the depth-of-field darkening of the main hero. One pre-rendered horizontal alpha ramp (clear in the middle, dark far away) is stretched to 2.4 x the stage and drawn
 * once per frame; its centre follows the layer the active wave is in, so the layers away from the decision sink into the dark and the layer being computed stays sharp.
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot()
 * Data: JEV.bus 'decision' (starts a wave, the fog follows its stage), 'kill' (red beams). Click the stage or the button to fire a simulated decision. */
JEV.mod('hero-depth-fog', () => {
  'use strict';
  const J = JEV, clamp = J.clamp, KEYS = J.STATE_KEYS, ACTS = J.ACTIONS;
  const FF = "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace";
  const tierOf = () => J.tier || 2;
  const ROW = ['buy', 'sell', 'hold', 'close', 'flatten', '0.5%', '1%', '2%', '4%', 'go', 'no-go'];
  const GFIRST = [0, 5, 9], GLAST = [4, 8, 10], DEST = { execute: 0, review: 1, skip: 2 };

  /* ---------- colour ramps + glow sprites (same pre-rendered assets as the main hero) ---------- */
  const T_PINK = 0, T_AMB = 1, T_RED = 2, T_WHT = 3, T_DIM = 4;
  const RGB = [[255, 46, 110], [255, 193, 61], [255, 77, 94], [255, 255, 255], [196, 150, 178]];
  const mkRamp = (cols) => cols.map((c) => { const a = []; for (let i = 0; i <= 32; i++) a.push('rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (i / 32).toFixed(3) + ')'); return a; });
  const RAMP = mkRamp(RGB);
  const BRAMP = mkRamp([[255, 148, 198], [255, 216, 128], [255, 132, 142], [255, 255, 255], [226, 196, 212]]);
  const SPR = RGB.map((c) => {
    const s = document.createElement('canvas'); s.width = s.height = 96;
    const x = s.getContext('2d'), gr = x.createRadialGradient(48, 48, 0, 48, 48, 48), hi = c.map((v) => Math.round(v + (255 - v) * 0.62)).join(',');
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.1, 'rgba(' + hi + ',.96)'); gr.addColorStop(0.28, 'rgba(' + c.join(',') + ',.55)');
    gr.addColorStop(0.6, 'rgba(' + c.join(',') + ',.13)'); gr.addColorStop(1, 'rgba(' + c.join(',') + ',0)');
    x.fillStyle = gr; x.fillRect(0, 0, 96, 96); return s;
  });
  const SPRH = [0.36, 0.43].map((k) => SPR.map((sp) => { // wave-beam head = tint glow + white-hot core baked into one sprite
    const s = document.createElement('canvas'); s.width = s.height = 96; const x = s.getContext('2d'), c = 96 * k;
    x.drawImage(sp, 0, 0); x.globalCompositeOperation = 'lighter'; x.drawImage(SPR[T_WHT], 48 - c / 2, 48 - c / 2, c, c); return s;
  }));
  const SOFT = RGB.map((c) => {
    const s = document.createElement('canvas'); s.width = s.height = 64; const x = s.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(' + c.join(',') + ',.7)'); gr.addColorStop(0.5, 'rgba(' + c.join(',') + ',.28)'); gr.addColorStop(1, 'rgba(' + c.join(',') + ',0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return s;
  });

  /* ---------- graph: 8 layers, one flat node array, one flat edge array (the hero's real topology) ---------- */
  const LC = [15, 12, 18, 24, 18, 3, 11, 3]; // state · encode · jev a/b/c · questions · answers · code
  const LS = [0]; for (let i = 0; i < 8; i++) LS.push(LS[i] + LC[i]);
  const NN = LS[8];
  const nx = new Float32Array(NN), ny = new Float32Array(NN), nfl = new Float32Array(NN), nL = new Uint8Array(NN);
  for (let l = 0; l < 8; l++) for (let i = LS[l]; i < LS[l + 1]; i++) nL[i] = l;
  const EMAX = 1500;
  const ex0 = new Float32Array(EMAX), ey0 = new Float32Array(EMAX), ex1 = new Float32Array(EMAX), ey1 = new Float32Array(EMAX);
  const e2 = new Float32Array(EMAX), elen = new Float32Array(EMAX), eA = new Float32Array(EMAX);
  const esrc = new Int16Array(EMAX), edst = new Int16Array(EMAX), ec = new Uint8Array(EMAX), eTr = new Uint8Array(EMAX);
  const nout0 = new Int16Array(NN), noutN = new Int16Array(NN), lES = new Int16Array(9);
  let EN = 0, topoMode = -1;
  function buildTopo(dens) {
    const R = J.rng(2718), seen = new Uint8Array(32); let n = 0;
    for (let tr = 0; tr < 7; tr++) {
      lES[tr] = n;
      const an = LC[tr], bn = LC[tr + 1], a0 = LS[tr], b0 = LS[tr + 1];
      const al = tr === 0 ? 0.4 : tr === 1 ? 0.3 : tr === 2 || tr === 3 ? [0.34, 0.27, 0.2][dens] : tr === 4 ? 0.46 : tr === 5 ? 0.7 : 0.3;
      const curve = tr === 2 || tr === 3 ? 0 : 1;
      for (let i = 0; i < an; i++) {
        nout0[a0 + i] = n; seen.fill(0);
        const pick = (j) => { if (j < 0 || j >= bn || seen[j]) return; seen[j] = 1; esrc[n] = a0 + i; edst[n] = b0 + j; eA[n] = al * (0.72 + R() * 0.56); ec[n] = curve; eTr[n] = tr; n++; };
        if (tr === 0) { const j = Math.round(i * (bn - 1) / (an - 1)); pick(j); pick(j - 1); pick(j + 1); pick(Math.floor(R() * bn)); }
        else if (tr === 1) { const c = Math.round(i * (bn - 1) / (an - 1)), k = [2, 3, 4][dens]; for (let d = -k; d <= k; d++) pick(c + d); }
        else if (tr === 2 || tr === 3) {
          if (dens === 2) for (let j = 0; j < bn; j++) pick(j);
          else { const k = dens === 1 ? 14 : 8, off = R() * bn; for (let t = 0; t < k; t++) pick(Math.floor((off + t * bn / k) % bn)); }
        } else if (tr === 5) { for (let j = GFIRST[i]; j <= GLAST[i]; j++) pick(j); }
        else for (let j = 0; j < 3; j++) pick(j); // tr 4 (c -> questions) and tr 6 (answers -> code)
        noutN[a0 + i] = n - nout0[a0 + i];
      }
    }
    lES[7] = n; EN = n; topoMode = dens;
  }
  /* point on edge i at u in 0..1 -> PX, PY (S-curve for panel-to-panel edges, straight inside jev) */
  let PX = 0, PY = 0;
  function ep(i, u) {
    const x0 = ex0[i], y0 = ey0[i], x1 = ex1[i], y1 = ey1[i];
    if (ec[i]) { const s = u * u * (3 - 2 * u), xs = u * (1.5 - 1.5 * u + u * u); PX = x0 + (x1 - x0) * xs; PY = y0 + (y1 - y0) * s; }
    else { PX = x0 + (x1 - x0) * u; PY = y0 + (y1 - y0) * u; }
  }

  /* ---------- layout (the hero's six panels, scaled to the demo stage; recomputed on resize only) ---------- */
  let W = 0, H = 0, M = false, gs = null, gl = null, qr = 12, pitch = 20, spitch = 20, jcx = 0, jcy = 0, FS = 9;
  const P = [0, 1, 2, 3, 4, 5].map(() => ({ x: 0, y: 0, w: 0, h: 0 })), CARDS = [0, 1, 2].map(() => ({ x: 0, y: 0, w: 0, h: 0 }));
  const rowY = new Float32Array(11), qy = new Float32Array(3), LX = new Float32Array(8);
  function layout() {
    const m = M, top = m ? 30 : 46, bot = H - (m ? 12 : 22), ah = bot - top, cyy = top + ah / 2, hdr = m ? 16 : 34;
    const px = [[.012, .135], [.15, .215], [.25, .565], [.585, .68], [.70, .825], [.85, .988]];
    for (let i = 0; i < 6; i++) { const p = P[i]; p.x = px[i][0] * W; p.w = (px[i][1] - px[i][0]) * W; p.y = top; p.h = ah; }
    FS = m ? 7 : W < 1000 ? 8.5 : 9.5;
    spitch = (ah - hdr - 8) / 15;
    for (let i = 0; i < 15; i++) { nx[i] = P[0].x + P[0].w - (m ? 4 : 8); ny[i] = top + hdr + (i + 0.5) * spitch; }
    for (let j = 0; j < 12; j++) { nx[15 + j] = P[1].x + P[1].w * (j % 2 ? 0.7 : 0.3); ny[15 + j] = top + hdr + (j + 0.5) * (ah - hdr - 8) / 12; }
    const hJ = m ? 24 : 40, iy0 = top + hJ, iy1 = bot - 8, ih = iy1 - iy0, LY = [[0.13, 0.04, 0.96], [0.5, 0.02, 0.98], [0.87, 0.04, 0.96]];
    for (let l = 0; l < 3; l++) { const n = LC[2 + l], b = LS[2 + l], c = LY[l]; for (let i = 0; i < n; i++) { nx[b + i] = P[2].x + P[2].w * c[0] + (i % 2 ? 1.5 : -1.5); ny[b + i] = iy0 + ih * (c[1] + (c[2] - c[1]) * i / (n - 1)); } }
    jcx = P[2].x + P[2].w / 2; jcy = top + ah / 2;
    qr = m ? 7.5 : 12; const qs = clamp(ah * 0.2, 40, 110);
    for (let i = 0; i < 3; i++) { qy[i] = cyy + (i - 1) * qs; nx[LS[5] + i] = P[3].x + P[3].w / 2; ny[LS[5] + i] = qy[i]; }
    pitch = (ah - hdr - 8) / 11;
    for (let r = 0; r < 11; r++) { rowY[r] = top + hdr + (r + 0.5) * pitch; nx[LS[6] + r] = P[4].x + (m ? 5 : 9); ny[LS[6] + r] = rowY[r]; }
    const ch = clamp(pitch * 2.3, 30, 64), fr = [0.17, 0.5, 0.83];
    for (let k = 0; k < 3; k++) { const c = CARDS[k]; c.w = P[5].w - (m ? 8 : 16); c.h = ch; c.x = P[5].x + (m ? 4 : 8); c.y = top + hdr + (ah - hdr - 8) * fr[k] - ch / 2; nx[LS[7] + k] = c.x; ny[LS[7] + k] = c.y + ch / 2; }
    for (let i = 0; i < EN; i++) {
      const s = esrc[i], d = edst[i]; ex0[i] = nx[s]; ey0[i] = ny[s]; ex1[i] = nx[d]; ey1[i] = ny[d];
      const dx = ex1[i] - ex0[i], dy = ey1[i] - ey0[i]; e2[i] = dx * dx + dy * dy + 1; elen[i] = Math.sqrt(e2[i]) * (ec[i] ? 1.06 : 1);
    }
    LX[0] = P[0].x + P[0].w / 2; LX[1] = P[1].x + P[1].w / 2; LX[2] = P[2].x + P[2].w * 0.13; LX[3] = jcx; LX[4] = P[2].x + P[2].w * 0.87; LX[5] = P[3].x + P[3].w / 2; LX[6] = P[4].x + P[4].w / 2; LX[7] = P[5].x + P[5].w / 2;
  }

  /* ---------- static layer: panels, additive mesh, nodes, labels, code cards ---------- */
  function rr(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function panel(g, p, title, hot) {
    rr(g, p.x, p.y, p.w, p.h, M ? 5 : 9);
    if (hot) { const gr = g.createLinearGradient(0, p.y, 0, p.y + p.h); gr.addColorStop(0, 'rgba(38,8,32,.9)'); gr.addColorStop(0.5, 'rgba(52,8,40,.84)'); gr.addColorStop(1, 'rgba(18,5,22,.9)'); g.fillStyle = gr; }
    else g.fillStyle = 'rgba(9,4,15,.84)';
    g.fill(); g.save(); if (hot) { g.shadowColor = 'rgba(255,46,110,.75)'; g.shadowBlur = 26; }
    g.lineWidth = 1; g.strokeStyle = hot ? 'rgba(255,96,152,.66)' : 'rgba(255,70,140,.26)'; g.stroke(); g.restore();
  }
  /* static text (panel titles, field names, answer rows, question names, card names): drawn into the static layer, or into its own 'near' layer when it floats in front for parallax */
  const PT = ['STATE', 'ENCODE', 'JEV · SYSTEM ONE', 'TYPED QUESTIONS', 'ANSWERS', 'CODE ACTS'], PM = ['STATE', '', 'JEV · SYSTEM ONE', 'QUESTIONS', 'ANSWERS', 'CODE ACTS'];
  function drawText(g) {
    g.textAlign = 'left';
    for (let i = 0; i < 6; i++) {
      const p = P[i], title = M ? PM[i] : PT[i]; g.textBaseline = 'alphabetic'; g.fillStyle = i === 2 ? '#ffd0e2' : '#e9dff0'; g.font = '700 ' + (M ? 6.5 : 8.5) + 'px ' + FF;
      if (M) g.fillText(title, p.x + 3, p.y + 11); else { g.letterSpacing = '1.4px'; g.fillText(title, p.x + 10, p.y + 17); g.letterSpacing = '0px'; }
    }
    g.textBaseline = 'middle';
    if (!M) {
      g.textAlign = 'right'; g.font = '500 ' + FS + 'px ' + FF; g.fillStyle = '#b0a5bb'; for (let i = 0; i < 15; i++) g.fillText(KEYS[i], nx[i] - 10, ny[i] + 0.5);
      g.textAlign = 'left'; for (let r = 0; r < 11; r++) g.fillText(ROW[r], P[4].x + 22, rowY[r] + 0.5);
      g.font = '600 ' + FS + 'px ' + FF; g.fillStyle = '#f4eef6'; const QN = ['which action?', 'how much?', 'risk ok?']; for (let i = 0; i < 3; i++) g.fillText(QN[i], P[3].x + 4, qy[i] + qr + 11);
    }
    const CN = ['execute', 'review', 'skip']; g.textBaseline = 'alphabetic'; g.fillStyle = '#fff'; g.font = '700 ' + (M ? 7 : 9.5) + 'px ' + FF;
    for (let k = 0; k < 3; k++) g.fillText(CN[k], CARDS[k].x + (M ? 5 : 10), CARDS[k].y + (M ? 12 : 17));
    g.textBaseline = 'middle';
  }
  function strokeEdge(g, i) {
    g.beginPath(); g.moveTo(ex0[i], ey0[i]);
    if (ec[i]) { const mx = (ex0[i] + ex1[i]) / 2; g.bezierCurveTo(mx, ey0[i], mx, ey1[i], ex1[i], ey1[i]); } else g.lineTo(ex1[i], ey1[i]);
    g.stroke();
  }
  function drawStatic(opts) {
    opts = opts || {}; const g = gs; g.setTransform(J.DPR, 0, 0, J.DPR, 0, 0); g.clearRect(0, 0, W, H);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; const jp = P[2];
    g.save(); g.translate(jcx, jcy + jp.h * 0.04); g.scale(1, jp.h / (jp.w * 1.25));
    let gr = g.createRadialGradient(0, 0, 0, 0, 0, jp.w * 1.2); gr.addColorStop(0, 'rgba(255,36,110,.34)'); gr.addColorStop(0.4, 'rgba(255,36,110,.12)'); gr.addColorStop(1, 'rgba(255,36,110,0)');
    g.fillStyle = gr; g.fillRect(-jp.w * 1.3, -jp.w * 1.3, jp.w * 2.6, jp.w * 2.6); g.restore();
    for (let i = 0; i < 6; i++) panel(g, P[i], '', i === 2);
    { const lg = g.createLinearGradient(jp.x + jp.w * 0.25, 0, jp.x + jp.w * 0.75, 0); lg.addColorStop(0, 'rgba(255,60,130,0)'); lg.addColorStop(0.5, 'rgba(255,90,160,.12)'); lg.addColorStop(1, 'rgba(255,60,130,0)');
      g.globalCompositeOperation = 'lighter'; g.fillStyle = lg; g.fillRect(jp.x + jp.w * 0.25, jp.y + 40, jp.w * 0.5, jp.h - 50); }
    g.globalCompositeOperation = 'lighter'; g.lineWidth = M ? 0.8 : 0.75;
    for (let i = 0; i < EN; i++) { g.strokeStyle = 'rgba(255,62,134,' + eA[i].toFixed(3) + ')'; strokeEdge(g, i); }
    g.globalCompositeOperation = 'source-over';
    for (let i = 0; i < NN; i++) {
      const l = nL[i]; if (l === 6 || l === 7) continue; g.beginPath();
      if (l === 0) { g.arc(nx[i], ny[i], M ? 2.6 : 3.4, 0, J.TAU); g.fillStyle = '#0b0610'; g.fill(); g.strokeStyle = 'rgba(255,110,170,.85)'; g.lineWidth = 1; g.stroke(); }
      else if (l === 5) { g.arc(nx[i], ny[i], qr, 0, J.TAU); const rg = g.createRadialGradient(nx[i], ny[i], 0, nx[i], ny[i], qr); rg.addColorStop(0, 'rgba(255,60,130,.55)'); rg.addColorStop(1, 'rgba(60,8,36,.9)'); g.fillStyle = rg; g.fill(); g.strokeStyle = 'rgba(255,120,176,.95)'; g.lineWidth = M ? 1.2 : 1.8; g.stroke(); g.beginPath(); g.arc(nx[i], ny[i], qr * 0.38, 0, J.TAU); g.fillStyle = 'rgba(255,214,230,.9)'; g.fill(); }
      else { const r = l === 1 ? (M ? 1.8 : 2.4) : (M ? 1.5 : 2); g.arc(nx[i], ny[i], r, 0, J.TAU); g.fillStyle = l === 1 ? '#ffa2c6' : '#ff8fbb'; g.fill(); }
    }
    for (let r = 0; r < 11; r++) {
      const y = rowY[r], gx = nx[LS[6] + r];
      g.beginPath(); g.arc(gx, y, M ? 2.4 : 3.2, 0, J.TAU); g.fillStyle = '#0b0610'; g.fill(); g.strokeStyle = 'rgba(255,110,170,.85)'; g.lineWidth = 1; g.stroke();
      g.fillStyle = 'rgba(255,255,255,.075)'; g.fillRect(P[4].x + (M ? 14 : 62), M ? y + 2.5 : y - 2, P[4].w - (M ? 20 : 98), M ? 3 : 4);
    }
    for (let k = 0; k < 3; k++) {
      const c = CARDS[k]; g.save(); g.shadowColor = 'rgba(255,46,110,.7)'; g.shadowBlur = 24; rr(g, c.x, c.y, c.w, c.h, M ? 5 : 8);
      const cg = g.createLinearGradient(0, c.y, 0, c.y + c.h); cg.addColorStop(0, k === 2 ? '#5a1238' : '#8a1146'); cg.addColorStop(1, k === 2 ? '#2f0a22' : '#4a0b2b'); g.fillStyle = cg; g.fill(); g.restore();
      const hg = g.createLinearGradient(0, c.y, 0, c.y + c.h * 0.5); hg.addColorStop(0, 'rgba(255,255,255,.2)'); hg.addColorStop(1, 'rgba(255,255,255,0)'); rr(g, c.x + 1, c.y + 1, c.w - 2, c.h * 0.5, M ? 4 : 7); g.fillStyle = hg; g.fill();
      rr(g, c.x, c.y, c.w, c.h, M ? 5 : 8); g.strokeStyle = k === 2 ? 'rgba(255,140,185,.55)' : 'rgba(255,140,185,.95)'; g.lineWidth = 1.2; g.stroke();
      g.beginPath(); g.arc(c.x, c.y + c.h / 2, M ? 2.8 : 3.6, 0, J.TAU); g.fillStyle = '#ffd0e2'; g.fill();
    }
    if (!opts.noText) drawText(gs);
  }

  /* ---------- live state: beams (ring buffer, struct-of-arrays) + waves, as in the hero ---------- */
  let killed = J.S.killed, PK = killed ? T_RED : T_PINK, now = 0, ambK = 1, ambAcc = 0;
  const cPulse = new Float32Array(3), cTint = [T_PINK, T_AMB, T_DIM], qFl = new Float32Array(3);
  const hooks = { land: null, stage: null }; // land(w, dk, tint, ts): a decision reached its code act · stage(w, k): a wave stage started
  const BN = 520, bE = new Int16Array(BN), bT0 = new Float32Array(BN), bDur = new Float32Array(BN), bW = new Float32Array(BN), bTint = new Uint8Array(BN), bAmb = new Uint8Array(BN), bDone = new Uint8Array(BN);
  let bi = 0, nAmb = 0; const AMB_CAP = () => Math.round((M ? 22 : 40) * ambK);
  function beam(e, t0, dur, w, tint, amb) { const b = bi; bi = (bi + 1) % BN; if (bDur[b] !== 0 && bAmb[b]) nAmb--; if (amb) nAmb++; bE[b] = e; bT0[b] = t0; bDur[b] = dur; bW[b] = w > 1 ? 1 : w; bTint[b] = tint; bAmb[b] = amb; bDone[b] = 0; }
  function arrive(b, e) {
    const d = edst[e]; nfl[d] = Math.min(1, nfl[d] + (bAmb[b] ? 0.32 : 0.55 + 0.45 * bW[b]));
    if (bAmb[b] && eTr[e] < 4 && noutN[d] > 0 && nAmb < AMB_CAP() && Math.random() < 0.72) beam(nout0[d] + ((Math.random() * noutN[d]) | 0), now, bDur[b] * 0.92, bW[b] * 0.92, bTint[b], 1);
  }
  const ST = [0, 0.125, 0.25, 0.375, 0.5, 0.68, 0.84, 1.08];
  const WV = []; for (let i = 0; i < 6; i++) WV.push({ on: false, t0: 0, st: 0, d: null, dk: 0, lit: new Uint8Array(15), sal: new Float32Array(15), tg: new Int16Array(5 * 40), tn: new Uint8Array(5) });
  const SAL = [null, null,
    (s) => Math.abs(s.vwap_dist_bps) / 14, (s) => s.spread_bps / 10, (s) => Math.abs(s.imbalance) / 0.55, (s) => Math.abs(s.funding_bps) / 6, (s) => s.vol_1h / 140,
    (s) => Math.abs(s.edge_bps) / 26, (s) => Math.abs(s.position_pct) / 2.5, (s) => -s.daily_pnl / 1600 + 0.15, (s) => s.drawdown_pct / 8, (s) => s.latency_ms / 260, (s) => s.signal_age_s / 50];
  function pushT(w, l, n) { const o = l * 40; for (let i = 0; i < w.tn[l]; i++) if (w.tg[o + i] === n) return; if (w.tn[l] < 40) w.tg[o + w.tn[l]++] = n; }
  function startWave(d) {
    let w = null; for (let i = 0; i < WV.length; i++) if (!WV[i].on) { w = WV[i]; break; }
    if (!w) { w = WV[0]; for (let i = 1; i < WV.length; i++) if (WV[i].t0 < w.t0) w = WV[i]; while (w.st < 8) runStage(w, w.st++); }
    w.on = true; w.t0 = performance.now() / 1000; w.st = 0; w.d = d; w.tn.fill(0); w.lit.fill(0);
    const s = d.state; w.sal.fill(0.1); w.sal[0] = 0.5; w.sal[1] = 0.35; w.sal[13] = 0.3; w.sal[14] = 0.3; // which state fields matter: top salience (+ always the symbol)
    for (let i = 2; i < 13; i++) w.sal[i] = clamp(SAL[i](s), 0, 1.2);
    for (let n = 0; n < 5; n++) { let bi2 = -1, bv = 0.25; for (let i = 2; i < 13; i++) if (!w.lit[i] && w.sal[i] > bv) { bv = w.sal[i]; bi2 = i; } if (bi2 < 0) break; w.lit[bi2] = 1; }
    w.lit[0] = 1;
    return w;
  }
  const lessM = () => (M ? 0.6 : 1);
  function runStage(w, k) {
    const d = w.d, t0 = w.t0 + ST[k], R = Math.random, dm = lessM();
    if (hooks.stage) hooks.stage(w, k);
    if (k === 0) {
      for (let i = 0; i < 15; i++) if (w.lit[i]) {
        nfl[i] = 1;
        for (let q = 0; q < 2; q++) { const e = nout0[i] + ((R() * noutN[i]) | 0); beam(e, t0 + q * 0.03 + R() * 0.02, 0.18, 0.62 + 0.38 * Math.min(1, w.sal[i]), PK, 0); pushT(w, 1, edst[e] - LS[1]); }
      }
    } else if (k <= 3) {
      const l = k, o = l * 40, n = w.tn[l], per = k === 1 ? 2 : 3;
      for (let a = 0; a < n; a++) { const src = LS[l] + w.tg[o + a]; for (let q = 0; q < per; q++) { if (R() > dm) continue; const e = nout0[src] + ((R() * noutN[src]) | 0); beam(e, t0 + R() * 0.035, 0.17, 0.5 + R() * 0.45, PK, 0); pushT(w, l + 1, edst[e] - LS[l + 1]); } }
      if (k === 3) { for (let q = 0; q < 6; q++) pushT(w, 4, (R() * 18) | 0); }
    } else if (k === 4) {
      const o = 4 * 40, n = w.tn[4];
      for (let a = 0; a < n; a++) { const src = LS[4] + w.tg[o + a]; for (let q = 0; q < 3; q++) if (R() < 0.62 * dm + 0.2) beam(nout0[src] + q, t0 + R() * 0.04, 0.17, 0.5 + R() * 0.5, PK, 0); }
    } else if (k === 5) {
      const q0 = LS[5]; for (let q = 0; q < 3; q++) { qFl[q] = 1; nfl[q0 + q] = 1; }
      const pr = [d.p.buy, d.p.sell, d.p.hold, d.p.close, d.p.flatten, d.sizes[0], d.sizes[1], d.sizes[2], d.sizes[3], d.pRisk, 1 - d.pRisk];
      for (let q = 0; q < 3; q++) for (let r = GFIRST[q]; r <= GLAST[q]; r++) beam(nout0[q0 + q] + (r - GFIRST[q]), t0, 0.17, 0.3 + 0.7 * Math.min(1, pr[r] * 1.3), PK, 0);
    } else if (k === 6) {
      const rA = ACTS.indexOf(d.action), rS = 5 + d.sizeIdx, rK = d.riskOk ? 9 : 10;
      const dk = DEST[d.dest], tint = d.dest === 'skip' ? T_DIM : d.dest === 'review' ? (killed ? T_RED : T_AMB) : PK, bw = d.dest === 'skip' ? 0.5 : 1;
      w.dk = dk; [rA, rS, rK].forEach((r, i) => beam(nout0[LS[6] + r] + dk, w.t0 + 0.86 + i * 0.02, 0.22, bw, tint, 0));
    } else {
      const dk = w.dk, tint = dk === 2 ? T_DIM : dk === 1 ? (killed ? T_RED : T_AMB) : PK;
      cPulse[dk] = 1; cTint[dk] = tint; nfl[LS[7] + dk] = 1;
      if (hooks.land) hooks.land(w, dk, tint, w.t0 + ST[7]);
      w.on = false;
    }
  }
  function stepWaves(t) { for (let i = 0; i < WV.length; i++) { const w = WV[i]; if (!w.on) continue; while (w.st < 8 && t >= w.t0 + ST[w.st]) runStage(w, w.st++); } }
  function ambient(t, dk) { ambAcc += dk * (M ? 8 : 15) * ambK; const cap = AMB_CAP(); while (ambAcc >= 1) { ambAcc -= 1; if (nAmb >= cap) continue; const e = lES[1] + ((Math.random() * (lES[5] - lES[1])) | 0); beam(e, t, 0.8 + Math.random() * 0.8, 0.22 + Math.random() * 0.2, PK, 1); } }
  function spr(g, t, x, y, s, a) { g.globalAlpha = a > 1 ? 1 : a; g.drawImage(SPR[t], x - s / 2, y - s / 2, s, s); }
  function sprh(g, t, x, y, s, a) { g.globalAlpha = a > 1 ? 1 : a; g.drawImage(SPRH[M ? 1 : 0][t], x - s / 2, y - s / 2, s, s); }
  /* idle shimmer + wave beams; ambient beams are stroked in batches (one path per colour step) */
  const aX0 = new Float32Array(BN), aY0 = new Float32Array(BN), aX1 = new Float32Array(BN), aY1 = new Float32Array(BN), aKey = new Uint8Array(BN), aPres = new Uint8Array(40);
  function drawBeams(g, t, stut, stutM) {
    let aN = 0;
    for (let b = 0; b < BN; b++) {
      const dur = bDur[b]; if (dur === 0) continue;
      const u = (t - bT0[b]) / dur; if (u < 0) continue;
      const e = bE[b], amb = bAmb[b], span = Math.min(0.75, Math.max(0.16, (amb ? 56 : 120) / (elen[e] + 1)));
      if (u >= 1 && !bDone[b]) { bDone[b] = 1; arrive(b, e); }
      if (u >= 1 + span) { bDur[b] = 0; if (amb) nAmb--; continue; }
      if (stut && ((b + ((t * 22) | 0)) & stutM) === 0) continue; // kill state: beams stutter
      const hu = u > 1 ? 1 : u, tu = u - span < 0 ? 0 : u - span, w = bW[b] * (u > 1 ? 1 - (u - 1) / span : 1), R = BRAMP[bTint[b]];
      ep(e, tu); const x0 = PX, y0 = PY; ep(e, hu); const x3 = PX, y3 = PY;
      if (amb) { const ri = (w * 0.55 * 32) | 0; if (ri > 0) { aX0[aN] = x0; aY0[aN] = y0; aX1[aN] = x3; aY1[aN] = y3; aKey[aN++] = bTint[b] * 8 + (ri > 7 ? 7 : ri); } if (w > 0.1) spr(g, bTint[b], x3, y3, 7, w * 0.8); continue; }
      const sp = hu - tu; ep(e, tu + sp * 0.45); const x1 = PX, y1 = PY; ep(e, tu + sp * 0.78); const x2 = PX, y2 = PY;
      g.lineWidth = M ? 1.3 : 1.6; g.strokeStyle = R[(w * 0.34 * 32) | 0]; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      g.lineWidth = M ? 1.7 : 2.1; g.strokeStyle = R[(w * 0.7 * 32) | 0]; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      g.lineWidth = M ? 2.1 : 2.8; g.strokeStyle = R[(w * 32) | 0]; g.beginPath(); g.moveTo(x2, y2); g.lineTo(x3, y3); g.stroke();
      sprh(g, bTint[b], x3, y3, (M ? 11 : 15) + 14 * w, w);
    }
    if (aN) {
      g.lineWidth = 1; g.globalAlpha = 1; aPres.fill(0); for (let j = 0; j < aN; j++) aPres[aKey[j]] = 1;
      for (let k = 0; k < 40; k++) if (aPres[k]) { g.strokeStyle = BRAMP[k >> 3][k & 7]; g.beginPath(); for (let j = 0; j < aN; j++) if (aKey[j] === k) { g.moveTo(aX0[j], aY0[j]); g.lineTo(aX1[j], aY1[j]); } g.stroke(); }
    }
  }
  const dB0 = 3.4;
  function drawFlashes(g, dk) {
    const dB = Math.exp(-dk * dB0);
    for (let i = 0; i < NN; i++) {
      const f = nfl[i]; if (f < 0.03) continue; nfl[i] = f * dB; const l = nL[i];
      if (l === 7 || l === 6) { if (l === 6) spr(g, PK, nx[i], ny[i], 16 + 14 * f, f); continue; }
      spr(g, PK, nx[i], ny[i], l === 5 ? (M ? 18 + 18 * f : 34 + 40 * f) : l === 0 ? 18 + 16 * f : (M ? 9 : 11) + 14 * f, f);
    }
    for (let k = 0; k < 3; k++) {
      const p = cPulse[k], c = CARDS[k]; if (p < 0.02) continue; cPulse[k] = p * Math.exp(-dk * 2.1);
      g.globalAlpha = Math.min(1, p * 0.95); g.drawImage(SOFT[cTint[k]], c.x - c.w * 0.45, c.y - c.h * 0.9, c.w * 1.9, c.h * 2.8); g.globalAlpha = 1; g.fillStyle = RAMP[cTint[k]][(p * 0.3 * 32) | 0]; rr(g, c.x, c.y, c.w, c.h, M ? 5 : 8); g.fill();
    }
    g.globalAlpha = 1;
  }
  const fire = () => { const t = performance.now(); if (t - (fire.t || 0) > 160) { fire.t = t; J.fire(); } };
  /* data in: decisions start a wave (reduced motion: the whole wave resolves at once), the kill switch recolours new beams */
  J.bus.on('decision', (d) => { const w = startWave(d); if (J.reduce) while (w.st < 8) runStage(w, w.st++); });
  J.bus.on('kill', (k) => { killed = !!k; PK = killed ? T_RED : T_PINK; });
  /* the two-canvas diagram: #static (cached mesh) under #live (per frame); rebuild() runs on resize */
  let lastRun = 0, onLayout = null, frameFn = null;
  function rebuild(cs, cl) {
    const a = J.fit(cs), b = J.fit(cl); gs = a.g; gl = b.g; W = a.W; H = a.H; M = W < 700;
    const dens = M ? 0 : W < 1000 ? 1 : 2; if (dens !== topoMode) buildTopo(dens);
    layout(); if (onLayout) onLayout(); drawStatic(rebuild.opts); if (frameFn) frameFn(lastRun || performance.now() / 1000, 0.016);
  }
  const net = J.$('#hdfNet'), cs = J.$('#hdfStatic'), cl = J.$('#hdfLive');
  if (!net || !cs || !cl) return;
  const btnFog = J.$('#hdfFog'), btnFire = J.$('#hdfFire'), lab = J.$('#hdfFocus');
  const LN = ['state', 'encode', 'jev layer a', 'jev layer b', 'jev layer c', 'typed questions', 'answers', 'code acts'];
  /* depth fog profile (pre-rendered once): horizontal alpha ramp, clear at the centre (the focus), dark far away; stretched over 2.4 x stage width so it always covers the stage */
  const FOGS = (() => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 2; const x = c.getContext('2d'), id = x.createImageData(256, 2);
    for (let i = 0; i < 256; i++) { const u = Math.abs(i - 127.5) / 127.5, a = Math.min(1, Math.pow(u * 2.4, 1.7)); for (let r = 0; r < 2; r++) { const o = (r * 256 + i) * 4; id.data[o] = 6; id.data[o + 1] = 3; id.data[o + 2] = 11; id.data[o + 3] = Math.round(a * 255); } }
    x.putImageData(id, 0, 0); return c;
  })();
  let fcx = 0, fAmt = 0.5, fogOn = true, labI = -1;
  function draw(t, dt) {
    const g = gl; if (!g || !W) return;
    now = t; lastRun = t; const dk = dt || 0.016;
    stepWaves(t); ambient(t, dk);
    g.setTransform(J.DPR, 0, 0, J.DPR, 0, 0); g.clearRect(0, 0, W, H); g.lineCap = 'round';
    /* depth of field: the layers away from the active wave sink into the dark, the layer the wave is in stays sharp (one pre-rendered ramp, one draw) */
    let nw = null; for (let i = 0; i < WV.length; i++) { const w = WV[i]; if (w.on && (!nw || w.t0 > nw.t0)) nw = w; }
    const li = nw ? Math.max(0, Math.min(7, nw.st - 1)) : -1, tgt = nw ? LX[li] : jcx;
    fcx += (tgt - fcx) * Math.min(1, dk * 5); fAmt += ((nw ? 1 : 0.55) - fAmt) * Math.min(1, dk * 3);
    if (fogOn) { g.globalAlpha = (tierOf() >= 3 ? 0.3 : 0.2) * fAmt; const fw = W * 2.4; g.drawImage(FOGS, fcx - fw / 2, 0, fw, H); g.globalAlpha = 1; }
    if (lab && li !== labI) { labI = li; lab.textContent = li < 0 ? 'idle: focus rests on the jev tower' : 'focus: ' + LN[li]; }
    g.globalCompositeOperation = 'lighter';
    drawBeams(g, t, false, 3); drawFlashes(g, dk);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  frameFn = draw; onLayout = () => { if (!fcx) fcx = jcx; };
  J.watch(net, () => rebuild(cs, cl));
  if (document.fonts) document.fonts.ready.then(() => W && rebuild(cs, cl)).catch(() => {});
  if (btnFog) btnFog.addEventListener('click', () => { fogOn = !fogOn; btnFog.setAttribute('aria-pressed', fogOn); btnFog.textContent = fogOn ? 'depth fog: on' : 'depth fog: off'; });
  if (btnFire) btnFire.addEventListener('click', fire);
  cl.addEventListener('click', fire);
  const d0 = J.recent[0] || J.makeDecision(); if (d0) startWave(d0);
  J.task(net, draw);
});
