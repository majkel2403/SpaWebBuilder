/* hero / answers-panel — the right half of the "JEV DECIDES" diagram, extracted from src/js/hero.js.
 * Typed questions (3 nodes) -> answers (11 rows, 3 groups, probability bars, floor marker, confidence tick) -> code acts (3 cards, odometer counters).
 * Own small layout + own wave driver: a synthetic input edge (5 ports on the left) sends beams into the 3 question nodes, then to the answers, then to the destination card.
 * Reuse: copy this folder + engine.js, core.js, base.css; call JEV.boot().  Relies on: JEV.mod $ clamp rng fit watch task animate reduce DPR fmt bus S recent makeDecision fire ACTIONS.
 * Data: bus 'decision' (d.p d.sizes d.pRisk d.dest d.conf d.action d.size d.sizeIdx d.riskOk d.reason d.floor) · 'floor' (number) · 'kill' (bool). Everything is simulated. */
JEV.mod('answers-panel', () => {
  'use strict';
  const J = JEV, clamp = J.clamp;
  const root = J.$('#aps'), stage = J.$('#apsStage'), cs = J.$('#aps-static'), cl = J.$('#aps-live');
  if (!root || !stage || !cs || !cl) return;
  const FF = "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace";
  const SF = "'Fraunces', 'Playfair Display', 'Iowan Old Style', Georgia, serif";
  const hasLS = 'letterSpacing' in CanvasRenderingContext2D.prototype;
  const ACTS = J.ACTIONS;
  const ROW = ['buy', 'sell', 'hold', 'close', 'flatten', '0.5%', '1%', '2%', '4%', 'go', 'no-go'];
  const GFIRST = [0, 5, 9], GLAST = [4, 8, 10];
  const DEST = { execute: 0, review: 1, skip: 2 };
  const DSUB = ['send the order', 'human queue', 'no order'], CN = ['execute', 'review', 'skip'];
  const QN = ['which action?', 'how much?', 'risk ok?'], QT = ['choice', 'score', 'flag'], QM = [['which', 'action?'], ['how', 'much?'], ['risk', 'ok?']];
  const DASH = [2, 3], NODASH = [];
  const HALO = 'rgba(8,4,13,.88)';

  /* ---------- colour ramps + glow sprites (pre-rendered; no shadowBlur per frame) ---------- */
  const T_PINK = 0, T_AMB = 1, T_RED = 2, T_WHT = 3, T_DIM = 4;
  const RGB = [[255, 46, 110], [255, 193, 61], [255, 77, 94], [255, 255, 255], [196, 150, 178]];
  const ramp = (cols) => cols.map((c) => { const a = []; for (let i = 0; i <= 32; i++) a.push('rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (i / 32).toFixed(3) + ')'); return a; });
  const RAMP = ramp(RGB);
  const BRAMP = ramp([[255, 148, 198], [255, 216, 128], [255, 132, 142], [255, 255, 255], [226, 196, 212]]); // lighter ramps for beam trails
  const SPR = RGB.map((c) => {
    const s = document.createElement('canvas'); s.width = s.height = 96;
    const x = s.getContext('2d'), gr = x.createRadialGradient(48, 48, 0, 48, 48, 48), hi = c.map((v) => Math.round(v + (255 - v) * 0.62)).join(',');
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.1, 'rgba(' + hi + ',.96)'); gr.addColorStop(0.28, 'rgba(' + c.join(',') + ',.55)');
    gr.addColorStop(0.6, 'rgba(' + c.join(',') + ',.13)'); gr.addColorStop(1, 'rgba(' + c.join(',') + ',0)');
    x.fillStyle = gr; x.fillRect(0, 0, 96, 96); return s;
  });
  const SPRH = [0.36, 0.43].map((k) => SPR.map((sp) => { // beam head = tint glow + white-hot core in one sprite
    const s = document.createElement('canvas'); s.width = s.height = 96; const x = s.getContext('2d'), c = 96 * k;
    x.drawImage(sp, 0, 0); x.globalCompositeOperation = 'lighter'; x.drawImage(SPR[T_WHT], 48 - c / 2, 48 - c / 2, c, c); return s;
  }));
  const SOFT = RGB.map((c) => {
    const s = document.createElement('canvas'); s.width = s.height = 64; const x = s.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(' + c.join(',') + ',.7)'); gr.addColorStop(0.5, 'rgba(' + c.join(',') + ',.28)'); gr.addColorStop(1, 'rgba(' + c.join(',') + ',0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return s;
  });
  const BND = RGB.map((c) => { // horizontal glow band for a selected answer row
    const s = document.createElement('canvas'); s.width = 128; s.height = 32; const x = s.getContext('2d'); let gr = x.createLinearGradient(0, 0, 0, 32);
    gr.addColorStop(0, 'rgba(' + c.join(',') + ',0)'); gr.addColorStop(0.5, 'rgba(' + c.join(',') + ',.85)'); gr.addColorStop(1, 'rgba(' + c.join(',') + ',0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 32);
    x.globalCompositeOperation = 'destination-in'; gr = x.createLinearGradient(0, 0, 128, 0); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,.25)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 32); return s;
  });
  const SWEEP = RGB.map((c) => { // light sweep over answers + cards when a decision executes
    const s = document.createElement('canvas'); s.width = 64; s.height = 2; const x = s.getContext('2d'), gr = x.createLinearGradient(0, 0, 64, 0), hi = c.map((v) => Math.round(v + (255 - v) * 0.7)).join(',');
    gr.addColorStop(0, 'rgba(' + c.join(',') + ',0)'); gr.addColorStop(0.55, 'rgba(' + c.join(',') + ',.35)'); gr.addColorStop(0.86, 'rgba(' + hi + ',.95)'); gr.addColorStop(1, 'rgba(' + c.join(',') + ',0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 2); return s;
  });

  /* ---------- graph: 4 layers (input edge · questions · answers · code acts), one flat node array, one flat edge array ---------- */
  const LC = [5, 3, 11, 3], LS = [0, 5, 8, 19, 22], NN = 22, NIN = 5;
  const nx = new Float32Array(NN), ny = new Float32Array(NN), nfl = new Float32Array(NN), nL = new Uint8Array(NN);
  for (let l = 0; l < 4; l++) for (let i = LS[l]; i < LS[l + 1]; i++) nL[i] = l;
  const EMAX = 64, esrc = new Int16Array(EMAX), edst = new Int16Array(EMAX), eTr = new Uint8Array(EMAX), eA = new Float32Array(EMAX);
  const ex0 = new Float32Array(EMAX), ey0 = new Float32Array(EMAX), ex1 = new Float32Array(EMAX), ey1 = new Float32Array(EMAX), elen = new Float32Array(EMAX);
  const nout0 = new Int16Array(NN), noutN = new Int16Array(NN);
  let EN = 0;
  { // tr0: input port i -> question q  (edge i*3+q) · tr1: question q -> its group's rows (edge 15+row) · tr2: row r -> card k (edge 26+r*3+k)
    const R = J.rng(31415);
    const add = (s, d, tr, a) => { esrc[EN] = s; edst[EN] = d; eTr[EN] = tr; eA[EN] = a * (0.72 + R() * 0.56); EN++; };
    for (let i = 0; i < NIN; i++) { nout0[i] = EN; for (let q = 0; q < 3; q++) add(i, LS[1] + q, 0, 0.3); noutN[i] = 3; }
    for (let q = 0; q < 3; q++) { nout0[LS[1] + q] = EN; for (let r = GFIRST[q]; r <= GLAST[q]; r++) add(LS[1] + q, LS[2] + r, 1, 0.62); noutN[LS[1] + q] = GLAST[q] - GFIRST[q] + 1; }
    for (let r = 0; r < 11; r++) { nout0[LS[2] + r] = EN; for (let k = 0; k < 3; k++) add(LS[2] + r, LS[3] + k, 2, 0.3); noutN[LS[2] + r] = 3; }
  }
  /* point on edge i at u in 0..1 -> PX, PY (S-curve between columns) */
  let PX = 0, PY = 0;
  function ep(i, u) {
    const x0 = ex0[i], y0 = ey0[i], x1 = ex1[i], y1 = ey1[i], s = u * u * (3 - 2 * u), xs = u * (1.5 - 1.5 * u + u * u);
    PX = x0 + (x1 - x0) * xs; PY = y0 + (y1 - y0) * s;
  }

  /* ---------- layout (recomputed on resize only) ---------- */
  let W = 0, H = 0, M = false, dpr = 1, gs = null, gl = null, FS = 9, FS2 = 9, FSS = 9, QX = 0, qFS = 9, qFS2 = 9, cFS = 9, cFS2 = 9, fFS = 9, kFS = 8, confW = 26;
  const P = [0, 1, 2].map(() => ({ x: 0, y: 0, w: 0, h: 0 })); // 0 questions · 1 answers · 2 code acts
  const CARDS = [0, 1, 2].map(() => ({ x: 0, y: 0, w: 0, h: 0 })), QP = [0, 1, 2].map(() => ({ x: 0, y: 0, w: 0, h: 0 }));
  const rowY = new Float32Array(11), grpY = new Float32Array(3), qy = new Float32Array(3);
  let pitch = 28, bx0 = 0, bx1 = 0, barH = 5, qr = 14, hdrH = 40, inX = 0;

  function rr(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function T(g, s, x, y, ls) { if (ls && hasLS) { g.letterSpacing = ls + 'px'; g.fillText(s, x, y); g.letterSpacing = '0px'; } else g.fillText(s, x, y); }
  function TH(g, s, x, y, lw) { g.lineJoin = 'round'; g.lineWidth = lw || 3; g.strokeStyle = HALO; g.strokeText(s, x, y); g.fillText(s, x, y); }
  function fitSz(g, str, wt, sz, ls, maxW, min) { // largest font size <= sz whose text fits maxW; sets g.font
    const sp = hasLS && ls ? ls * str.length : 0; let s = sz;
    for (;;) { g.font = wt + ' ' + s + 'px ' + FF; if (s <= min || g.measureText(str).width + sp <= maxW) return s; s = Math.max(min, s - 0.25); }
  }

  function layout() {
    const m = M, top = m ? 22 : 34, bot = H - (m ? 18 : 26), ah = bot - top;
    let pad, w, gp;
    if (m) { const k = W / 390; pad = 6 * k; w = [8, 62, 150, 88].map((v) => v * k); }
    else { pad = clamp(W * 0.02, 14, 28); w = [14, clamp(W * 0.15, 150, 190), clamp(W * 0.26, 214, 300), clamp(W * 0.17, 124, 210)]; }
    const g3 = Math.max(m ? 12 : 22, (W - 2 * pad - w.reduce((a, b) => a + b, 0)) / 3); gp = [g3 * 1.1, g3 * 0.95, g3 * 0.95];
    const X = []; let x = pad; for (let i = 0; i < 4; i++) { X.push(x); x += w[i] + (gp[i] || 0); }
    FS = m ? 8 : W < 1000 ? 9 : clamp(Math.round(W / 75) / 2, 9, 12); FS2 = m ? 7 : W < 1000 ? 8.5 : Math.max(9, FS - 0.5); FSS = m ? 7 : W < 1000 ? 8.5 : Math.max(9, FS2 - 1); hdrH = m ? 24 : 40;
    // ANSWERS (11 rows, 3 groups)
    const gh = m ? 12 : 16, gg = m ? 6 : 11;
    pitch = clamp((ah - 6 - hdrH - 3 * gh - 2 * gg - 12) / 11, 16, m ? 24 : 31);
    const spanH = hdrH + 3 * gh + 2 * gg + 11 * pitch + 12;
    let p = P[1]; p.x = X[2]; p.w = w[2]; p.h = spanH; p.y = top + (ah - spanH) / 2;
    { let y = p.y + hdrH;
      for (let gI = 0; gI < 3; gI++) { grpY[gI] = y + gh * 0.62; y += gh; for (let r = GFIRST[gI]; r <= GLAST[gI]; r++) { rowY[r] = y + pitch / 2; y += pitch; } y += gg; }
      for (let r = 0; r < 11; r++) { nx[LS[2] + r] = p.x + (m ? 6 : 10); ny[LS[2] + r] = rowY[r]; } }
    barH = m ? 3.5 : 5;
    bx0 = m ? p.x + 14 : p.x + 22 + Math.ceil(4.2 * FS) + 8; bx1 = m ? p.x + p.w - 5 : p.x + p.w - 9 - Math.ceil(1.8 * FS) - 4; // bar track: after "flatten", before a 2-digit %
    confW = Math.ceil(2.4 * FS2) + 10;
    // TYPED QUESTIONS: each node sits level with the middle of its answer group
    qr = m ? 7.5 : 15; p = P[0]; p.x = X[1]; p.w = w[1]; p.y = P[1].y; p.h = spanH;
    for (let q = 0; q < 3; q++) { qy[q] = (rowY[GFIRST[q]] + rowY[GLAST[q]]) / 2 - (m ? 16 : 0); nx[LS[1] + q] = p.x + (m ? p.w / 2 : 26); ny[LS[1] + q] = qy[q]; }
    if (!m) {
      QX = p.x + 26 + qr + 8; qFS = fitSz(gs, 'which action?', 700, Math.min(FS, 11), 0, p.x + p.w - 6 - QX, 7.5); qFS2 = Math.min(FSS, qFS);
      const pw = Math.min(p.x + p.w - 4 - (QX - 6), Math.ceil(13 * 0.6 * qFS) + 12);
      for (let q = 0; q < 3; q++) { const r = QP[q]; r.x = QX - 6; r.y = qy[q] - 15; r.w = pw; r.h = 42; }
    }
    // INPUT EDGE: 5 ports on the left, vertically spread over the questions panel
    inX = X[0] + w[0] / 2;
    { const y0 = P[0].y + hdrH + 6, y1 = P[0].y + P[0].h - 18; for (let i = 0; i < NIN; i++) { nx[i] = inX; ny[i] = y0 + (y1 - y0) * i / (NIN - 1); } }
    // CODE ACTS
    p = P[2]; p.x = X[3]; p.w = w[3]; p.h = spanH; p.y = P[1].y;
    const ch = m ? 48 : clamp(pitch * 2.3, 56, 76), fr = [0.17, 0.5, 0.83];
    for (let k = 0; k < 3; k++) { const c = CARDS[k]; c.w = p.w - (m ? 9 : 16); c.h = ch; c.x = p.x + (m ? 4.5 : 8); c.y = p.y + hdrH + (spanH - hdrH - 8) * fr[k] - ch / 2; nx[LS[3] + k] = c.x; ny[LS[3] + k] = c.y + ch / 2; }
    cFS = m ? 7 : fitSz(gs, 'orders/execute', 700, Math.min(FS, 11), 0.6, CARDS[0].w - 16, 7); cFS2 = m ? 7 : fitSz(gs, 'send the order', 500, FSS, 0, CARDS[0].w - 16, 7);
    fFS = m ? 7 : FS2; kFS = m ? 7 : fitSz(gs, 'halted · all to review', 700, FS2, 0, P[2].w - 14, 7.5);
    for (let i = 0; i < EN; i++) {
      const s = esrc[i], d = edst[i]; ex0[i] = nx[s]; ey0[i] = ny[s]; ex1[i] = nx[d]; ey1[i] = ny[d];
      elen[i] = Math.sqrt((ex1[i] - ex0[i]) ** 2 + (ey1[i] - ey0[i]) ** 2 + 1) * 1.06;
    }
  }

  /* ---------- static layer: bloom, panels, additive mesh, nodes, labels, cards ---------- */
  function panel(g, p, title, sub) {
    rr(g, p.x, p.y, p.w, p.h, M ? 5 : 9); g.fillStyle = 'rgba(9,4,15,.84)'; g.fill();
    g.lineWidth = 1; g.strokeStyle = 'rgba(255,70,140,.26)'; g.stroke();
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    const ts = M ? 7 : FS2, tl = M ? 0.5 : 1.6; g.fillStyle = '#e9dff0'; if (M) g.font = '700 7px ' + FF; else fitSz(g, title, 700, ts, tl, p.w - 18, 7); T(g, title, p.x + (M ? 3 : 10), p.y + (M ? 12 : 17), tl);
    if (sub && !M) { g.fillStyle = '#a095ac'; fitSz(g, sub, 500, FSS, 0.4, p.w - 13, 7); T(g, sub, p.x + 10, p.y + 29, 0.4); }
  }
  function strokeEdge(g, i) { const mx = (ex0[i] + ex1[i]) / 2; g.beginPath(); g.moveTo(ex0[i], ey0[i]); g.bezierCurveTo(mx, ey0[i], mx, ey1[i], ex1[i], ey1[i]); g.stroke(); }
  function drawStatic() {
    const g = gs; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    { const p = P[2]; const gr = g.createRadialGradient(p.x + p.w * 0.5, p.y + p.h * 0.5, 0, p.x + p.w * 0.5, p.y + p.h * 0.5, Math.max(p.h * 0.7, 120));
      gr.addColorStop(0, 'rgba(255,36,110,.2)'); gr.addColorStop(1, 'rgba(255,36,110,0)'); g.fillStyle = gr; g.fillRect(p.x - 120, p.y - 60, p.w + 240, p.h + 120); }
    panel(g, P[0], M ? 'QUESTIONS' : 'TYPED QUESTIONS', 'choice · score · flag'); panel(g, P[1], 'ANSWERS', 'real probabilities'); panel(g, P[2], 'CODE ACTS', 'plain code sends');
    // input edge: stubs from the left border into the five ports + a faint rail
    g.globalCompositeOperation = 'lighter'; g.lineWidth = 1;
    const sg = g.createLinearGradient(0, 0, inX, 0); sg.addColorStop(0, 'rgba(255,62,134,0)'); sg.addColorStop(1, 'rgba(255,62,134,.34)'); g.strokeStyle = sg;
    for (let i = 0; i < NIN; i++) { g.beginPath(); g.moveTo(0, ny[i]); g.lineTo(inX, ny[i]); g.stroke(); }
    g.strokeStyle = 'rgba(255,100,170,.22)'; g.beginPath(); g.moveTo(inX, ny[0] - 6); g.lineTo(inX, ny[NIN - 1] + 6); g.stroke();
    // mesh
    g.lineWidth = M ? 0.8 : 0.75;
    for (let i = 0; i < EN; i++) { g.strokeStyle = 'rgba(255,62,134,' + eA[i].toFixed(3) + ')'; strokeEdge(g, i); }
    g.globalCompositeOperation = 'source-over';
    // nodes
    for (let i = 0; i < NIN; i++) { g.beginPath(); g.arc(nx[i], ny[i], M ? 2.4 : 3.2, 0, J.TAU); g.fillStyle = '#0b0610'; g.fill(); g.strokeStyle = 'rgba(255,110,170,.85)'; g.lineWidth = 1; g.stroke(); }
    for (let q = 0; q < 3; q++) {
      const i = LS[1] + q; g.beginPath(); g.arc(nx[i], ny[i], qr, 0, J.TAU); const rg = g.createRadialGradient(nx[i], ny[i], 0, nx[i], ny[i], qr);
      rg.addColorStop(0, 'rgba(255,60,130,.55)'); rg.addColorStop(1, 'rgba(60,8,36,.9)'); g.fillStyle = rg; g.fill(); g.strokeStyle = 'rgba(255,120,176,.95)'; g.lineWidth = M ? 1.2 : 1.8; g.stroke();
      g.beginPath(); g.arc(nx[i], ny[i], qr * 0.38, 0, J.TAU); g.fillStyle = 'rgba(255,214,230,.9)'; g.fill();
    }
    if (!M) { g.font = '600 ' + Math.max(8, FSS - 1) + 'px ' + FF; g.fillStyle = '#8d8499'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; T(g, 'FROM JEV', Math.max(4, inX - 14), P[0].y + 17, 1.2); }
    // answer rows
    g.textBaseline = 'middle'; const pa = P[1];
    for (let r = 0; r < 11; r++) {
      const y = rowY[r], gx = nx[LS[2] + r];
      g.beginPath(); g.arc(gx, y, M ? 2.4 : 3.2, 0, J.TAU); g.fillStyle = '#0b0610'; g.fill(); g.strokeStyle = 'rgba(255,110,170,.85)'; g.lineWidth = 1; g.stroke();
      g.textAlign = 'left'; g.fillStyle = '#b0a5bb'; g.font = '500 ' + FS + 'px ' + FF; TH(g, ROW[r], pa.x + (M ? 14 : 22), M ? y - 3.5 : y + 0.5, M ? 2 : 3);
      g.fillStyle = 'rgba(255,255,255,.075)'; g.fillRect(bx0, M ? y + 2.5 : y - barH / 2, bx1 - bx0, barH);
    }
    g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    const GN = ['choice', 'score', 'flag'], GR = ['', 'of capital', 'risk_ok'];
    for (let q = 0; q < 3; q++) {
      g.font = '600 ' + (M ? 7 : FS2) + 'px ' + FF; g.textAlign = 'left'; g.fillStyle = '#ff9cc4'; T(g, GN[q], pa.x + (M ? 5 : 10), grpY[q] + 3, 0.8);
      if (GR[q] && !M) { g.fillStyle = '#a095ac'; g.textAlign = 'right'; g.font = '500 ' + FS2 + 'px ' + FF; g.fillText(GR[q], pa.x + pa.w - 8, grpY[q] + 3); g.textAlign = 'left'; }
      g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 1; g.beginPath(); g.moveTo(pa.x + 5, grpY[q] + (M ? 6 : 8)); g.lineTo(pa.x + pa.w - 5, grpY[q] + (M ? 6 : 8)); g.stroke();
    }
    if (!M) for (let q = 0; q < 3; q++) { const r = QP[q]; rr(g, r.x, r.y, r.w, r.h, 7); g.fillStyle = 'rgba(8,4,13,.9)'; g.fill(); g.lineWidth = 1; g.strokeStyle = 'rgba(255,90,150,.2)'; g.stroke(); }
    // code cards
    for (let k = 0; k < 3; k++) {
      const c = CARDS[k]; g.save(); g.shadowColor = 'rgba(255,46,110,.7)'; g.shadowBlur = 24; rr(g, c.x, c.y, c.w, c.h, M ? 5 : 8);
      const cg = g.createLinearGradient(0, c.y, 0, c.y + c.h); cg.addColorStop(0, k === 2 ? '#5a1238' : '#8a1146'); cg.addColorStop(1, k === 2 ? '#2f0a22' : '#4a0b2b'); g.fillStyle = cg; g.fill(); g.restore();
      const hg = g.createLinearGradient(0, c.y, 0, c.y + c.h * 0.5); hg.addColorStop(0, 'rgba(255,255,255,.2)'); hg.addColorStop(1, 'rgba(255,255,255,0)'); rr(g, c.x + 1, c.y + 1, c.w - 2, c.h * 0.5, M ? 4 : 7); g.fillStyle = hg; g.fill();
      rr(g, c.x, c.y, c.w, c.h, M ? 5 : 8); g.strokeStyle = k === 2 ? 'rgba(255,140,185,.55)' : 'rgba(255,140,185,.95)'; g.lineWidth = 1.2; g.stroke();
      g.beginPath(); g.arc(c.x, c.y + c.h / 2, M ? 2.8 : 3.6, 0, J.TAU); g.fillStyle = '#ffd0e2'; g.fill();
    }
  }

  /* ---------- live state ---------- */
  const aVal = new Float32Array(11), aTg = new Float32Array(11), aSel = new Float32Array(11), aSelT = new Float32Array(11), aHot = new Float32Array(11);
  const aTxt = new Array(11).fill('0%');
  const qFl = new Float32Array(3), qOn = new Float32Array(3), qLab = ['', '', ''];
  const cPulse = new Float32Array(3), cCount = [J.S.dest.execute, J.S.dest.review, J.S.dest.skip], cTint = [T_PINK, T_AMB, T_DIM], cTxt = ['0', '0', '0'], cCV = [-1, -1, -1];
  const fFl = new Float32Array(3), cPrevT = ['', '', ''], cRoll = new Float32Array(3).fill(1);
  let confA = 0, confOk = true, confRow = 0, confSp = 1, confVl = 0;
  let floorV = J.S.floor, floorTxt = 'floor ' + floorV.toFixed(2), killed = J.S.killed, PK = killed ? T_RED : T_PINK, killFl = 0, killT0 = -9;
  let fDisp = J.S.floor, fVel = 0, fFlash = 0, now = 0, prevT = 0, ambAcc = 0, ambK = 1, gCost = 0, gN = 0;
  const pct = (v) => Math.min(99, Math.round(v * 100));
  const eBack = (r) => { const q = r - 1; return 1 + 2.1 * q * q * q + 1.1 * q * q; };
  const RIPN = 8, ripT = new Float32Array(RIPN).fill(-9), ripK = new Uint8Array(RIPN), ripC = new Uint8Array(RIPN); let ripI = 0;
  const NR = 14, nrX = new Float64Array(NR), nrY = new Float64Array(NR), nrT = new Float64Array(NR).fill(-9), nrS = new Float32Array(NR), nrC = new Uint8Array(NR); let nrI = 0;
  const SHN = 4, shT = new Float32Array(SHN).fill(-9), shK = new Uint8Array(SHN), shC = new Uint8Array(SHN); let shI = 0, swT = -9, swC = 0, swS = 0;

  /* beams: ring buffer, struct-of-arrays */
  const BN = 160, bE = new Int16Array(BN), bT0 = new Float32Array(BN), bDur = new Float32Array(BN), bW = new Float32Array(BN), bTint = new Uint8Array(BN), bAmb = new Uint8Array(BN), bDone = new Uint8Array(BN);
  let bi = 0, nAmb = 0; const AMB_CAP = () => Math.round((M ? 9 : 16) * ambK);
  function beam(e, t0, dur, w, tint, amb) { const b = bi; bi = (bi + 1) % BN; if (bDur[b] !== 0 && bAmb[b]) nAmb--; if (amb) nAmb++; bE[b] = e; bT0[b] = t0; bDur[b] = dur; bW[b] = w > 1 ? 1 : w; bTint[b] = tint; bAmb[b] = amb; bDone[b] = 0; }
  function arrive(b, e) {
    const d = edst[e]; nfl[d] = Math.min(1, nfl[d] + (bAmb[b] ? 0.32 : 0.55 + 0.45 * bW[b]));
    if (!bAmb[b]) { const i = nrI; nrI = (nrI + 1) % NR; nrX[i] = nx[d]; nrY[i] = ny[d]; nrT[i] = now; nrC[i] = bTint[b]; nrS[i] = nL[d] === 1 ? qr : nL[d] === 2 ? 3 : 4; }
    else if (eTr[e] < 2 && nAmb < AMB_CAP() && Math.random() < 0.72) beam(nout0[d] + ((Math.random() * noutN[d]) | 0), now, bDur[b] * 0.92, bW[b] * 0.92, bTint[b], 1);
  }

  /* ---------- wave driver: input edge -> 3 questions -> 11 answers -> destination card (~1.2 s, overlapping) ---------- */
  const ST = [0, 0.26, 0.52, 0.92];
  const WV = []; for (let i = 0; i < 5; i++) WV.push({ on: false, t0: 0, st: 0, d: null, demo: false, dk: 0 });
  function confShown(d) { const pa = d.p[d.action]; return d.reason.indexOf('conf') === 0 && pa >= d.floor ? Math.min(pa, d.conf) : pa; } // one number everywhere: bar, tick, percentage
  function startWave(d, demo) {
    let w = null; for (let i = 0; i < WV.length; i++) if (!WV[i].on) { w = WV[i]; break; }
    if (!w) { w = WV[0]; for (let i = 1; i < WV.length; i++) if (WV[i].t0 < w.t0) w = WV[i]; while (w.st < 4) runStage(w, w.st++); }
    w.on = true; w.t0 = performance.now() / 1000; w.st = 0; w.d = d; w.demo = demo; return w;
  }
  function runStage(w, k) {
    const d = w.d, t0 = w.t0 + ST[k], R = Math.random, dm = M ? 0.6 : 1;
    if (k === 0) { // beams from the synthetic input edge into the three question nodes
      for (let q = 0; q < 3; q++) for (let n = 0; n < 2; n++) { if (n && R() > dm) continue; const i = (R() * NIN) | 0; beam(i * 3 + q, t0 + q * 0.04 + n * 0.035 + R() * 0.02, 0.2, 0.6 + 0.4 * R(), PK, 0); }
    } else if (k === 1) { // questions answer: labels + beams to every row of their group
      for (let q = 0; q < 3; q++) { qFl[q] = 1; qOn[q] = 1; nfl[LS[1] + q] = 1; }
      qLab[0] = '= ' + d.action; qLab[1] = '= ' + (d.size < 1 ? '0.5' : d.size) + '%'; qLab[2] = '= ' + (d.riskOk ? 'go' : 'no-go');
      const pr = [d.p.buy, d.p.sell, d.p.hold, d.p.close, d.p.flatten, d.sizes[0], d.sizes[1], d.sizes[2], d.sizes[3], d.pRisk, 1 - d.pRisk];
      for (let q = 0; q < 3; q++) for (let r = GFIRST[q]; r <= GLAST[q]; r++) beam(15 + r, t0, 0.17, 0.3 + 0.7 * Math.min(1, pr[r] * 1.3), PK, 0);
    } else if (k === 2) { // bars ease to the probabilities; chosen rows light; they send the order to the destination card
      const rA = ACTS.indexOf(d.action), rS = 5 + d.sizeIdx, rK = d.riskOk ? 9 : 10, cs = confShown(d), dk = DEST[d.dest];
      aTg[0] = d.p.buy; aTg[1] = d.p.sell; aTg[2] = d.p.hold; aTg[3] = d.p.close; aTg[4] = d.p.flatten;
      for (let i = 0; i < 4; i++) aTg[5 + i] = d.sizes[i]; aTg[9] = d.pRisk; aTg[10] = 1 - d.pRisk; aTg[rA] = cs;
      aSelT.fill(0); aSelT[rA] = 1; aSelT[rS] = 1; aSelT[rK] = 1; aHot[rA] = 1; aHot[rS] = 1; aHot[rK] = 1;
      confOk = cs >= d.floor; confRow = rA; confA = 0; confSp = 0; confVl = 0; w.dk = dk;
      const tint = d.dest === 'skip' ? T_DIM : d.dest === 'review' ? (killed ? T_RED : T_AMB) : PK, bw = d.dest === 'skip' ? 0.5 : 1;
      [rA, rS, rK].forEach((r, i) => beam(26 + r * 3 + dk, w.t0 + 0.62 + i * 0.02, 0.22, bw, tint, 0));
    } else { // the card is hit: pulse, ripple, lens flare, energy rings, light sweep, counter roll
      const dk = w.dk, tint = dk === 2 ? T_DIM : dk === 1 ? (killed ? T_RED : T_AMB) : PK, ts = w.t0 + ST[3];
      cPulse[dk] = 1; fFl[dk] = 1; cTint[dk] = tint; nfl[LS[3] + dk] = 1; ripT[ripI] = ts; ripK[ripI] = dk; ripC[ripI] = tint; ripI = (ripI + 1) % RIPN;
      if (!w.demo) cCount[dk]++;
      if (!w.demo && !J.reduce) { shT[shI] = ts; shK[shI] = dk; shC[shI] = tint; shI = (shI + 1) % SHN; if (dk < 2) { swT = ts; swC = tint; swS = dk === 0 ? 1 : 0.55; } }
      w.on = false;
    }
  }

  /* ---------- per-frame ---------- */
  function spr(t, x, y, s, a) { gl.globalAlpha = a > 1 ? 1 : a; gl.drawImage(SPR[t], x - s / 2, y - s / 2, s, s); }
  function sprh(t, x, y, s, a) { gl.globalAlpha = a > 1 ? 1 : a; gl.drawImage(SPRH[M ? 1 : 0][t], x - s / 2, y - s / 2, s, s); }
  function counter(g, k, x, y, fs) { // odometer: changed glyphs roll up (old out, new in) with a little overshoot
    const sN = cTxt[k], sO = cPrevT[k], r = cRoll[k];
    if (r >= 1 || !sO || sO === sN) { g.fillText(sN, x, y); return; }
    const e = eBack(r), off = fs * 0.95, dl = sN.length - sO.length; g.save(); g.beginPath(); g.rect(x - 2, y - fs * 0.98, fs * 0.75 * sN.length + 6, fs * 1.28); g.clip();
    for (let i = 0; i < sN.length; i++) {
      const ch = sN[i], oc = sO[i - dl], cx = x + (i ? g.measureText(sN.slice(0, i)).width : 0);
      if (ch === oc) { g.globalAlpha = 1; g.fillText(ch, cx, y); continue; }
      g.globalAlpha = Math.min(1, r * 2.2); g.fillText(ch, cx, y + (1 - e) * off);
      if (oc) { g.globalAlpha = Math.max(0, 1 - r * 2.2); g.fillText(oc, cx, y - e * off); }
    }
    g.restore();
  }
  function frame(t, dt) {
    const a0 = performance.now(); draw(t, dt); gCost += performance.now() - a0; // cost governor: thin the ambient shimmer on slow devices
    if (++gN === 90) { const avg = gCost / gN; if (avg > 4.5 && ambK > 0.4) ambK = Math.max(0.4, ambK * 0.8); else if (avg < 2.2 && ambK < 1) ambK = Math.min(1, ambK * 1.15); gCost = 0; gN = 0; }
  }
  function draw(t, dt) {
    const g = gl; if (!g || !W) return;
    now = t; const dk = dt || 0.016;
    for (let i = 0; i < WV.length; i++) { const w = WV[i]; if (!w.on) continue; while (w.st < 4 && t >= w.t0 + ST[w.st]) runStage(w, w.st++); }
    ambAcc += dk * (M ? 7 : 11) * ambK; const cap = AMB_CAP(); while (ambAcc >= 1) { ambAcc -= 1; if (nAmb >= cap) continue; beam((Math.random() * 15) | 0, t, 0.8 + Math.random() * 0.8, 0.22 + Math.random() * 0.2, PK, 1); }
    const dB = Math.exp(-dk * 3.4), dC = Math.exp(-dk * 2.2), kE = Math.min(1, Math.max(dk, Math.min(0.3, t - prevT)) * 8); prevT = t;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H); g.lineCap = 'round'; g.globalCompositeOperation = 'lighter';
    const jcx = P[1].x + P[1].w / 2, jcy = P[1].y + P[1].h / 2;
    if (killFl > 0.01) { spr(T_RED, jcx, jcy, Math.max(W, H) * 1.1, killFl * 0.35 * (0.55 + 0.45 * Math.sin(t * 83) * Math.sin(t * 29))); killFl *= Math.exp(-dk * 1.8); }
    if (killed) spr(T_RED, jcx, jcy, Math.max(W, H) * 0.8, 0.05 + 0.03 * Math.sin(t * 2));
    /* idle shimmer + wave beams */
    const stut = killed, stutM = t - killT0 < 1.6 ? 1 : 3;
    for (let b = 0; b < BN; b++) {
      const dur = bDur[b]; if (dur === 0) continue;
      const u = (t - bT0[b]) / dur; if (u < 0) continue;
      const e = bE[b], amb = bAmb[b], span = Math.min(0.75, Math.max(0.16, (amb ? 56 : 120) / (elen[e] + 1)));
      if (u >= 1 && !bDone[b]) { bDone[b] = 1; arrive(b, e); }
      if (u >= 1 + span) { bDur[b] = 0; if (amb) nAmb--; continue; }
      if (stut && ((b + ((t * 22) | 0)) & stutM) === 0) continue; // kill state: beams stutter
      const hu = u > 1 ? 1 : u, tu = u - span < 0 ? 0 : u - span, w = bW[b] * (u > 1 ? 1 - (u - 1) / span : 1), R = BRAMP[bTint[b]];
      ep(e, tu); const x0 = PX, y0 = PY; ep(e, hu); const x3 = PX, y3 = PY;
      if (amb) { g.lineWidth = 1; g.strokeStyle = R[Math.min(32, (w * 0.55 * 32) | 0)]; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x3, y3); g.stroke(); if (w > 0.1) spr(bTint[b], x3, y3, 7, w * 0.8); continue; }
      const sp = hu - tu; ep(e, tu + sp * 0.45); const x1 = PX, y1 = PY; ep(e, tu + sp * 0.78); const x2 = PX, y2 = PY;
      g.lineWidth = M ? 1.3 : 1.6; g.strokeStyle = R[(w * 0.34 * 32) | 0]; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      g.lineWidth = M ? 1.7 : 2.1; g.strokeStyle = R[(w * 0.7 * 32) | 0]; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      g.lineWidth = M ? 2.1 : 2.8; g.strokeStyle = R[(w * 32) | 0]; g.beginPath(); g.moveTo(x2, y2); g.lineTo(x3, y3); g.stroke();
      sprh(bTint[b], x3, y3, (M ? 11 : 15) + 14 * w, w);
    }
    /* node flashes */
    for (let i = 0; i < NN; i++) {
      const f = nfl[i]; if (f < 0.03) continue; nfl[i] = f * dB; const l = nL[i]; if (l === 3) continue;
      spr(PK, nx[i], ny[i], l === 1 ? (M ? 18 + 18 * f : 34 + 40 * f) : l === 2 ? 16 + 14 * f : 14 + 14 * f, f);
    }
    /* questions: steady glow once answered */
    for (let q = 0; q < 3; q++) { const f = qFl[q], o = qOn[q]; if (o > 0.01) { spr(PK, nx[LS[1] + q], ny[LS[1] + q], M ? qr * 2 + 8 + 16 * f : qr * 2 + 22 + 40 * f, 0.34 * o + 0.6 * f); qFl[q] = f * dB; } }
    /* answers: row glow band */
    const pa = P[1]; g.globalAlpha = 1;
    for (let r = 0; r < 11; r++) {
      aSel[r] += (aSelT[r] - aSel[r]) * kE; const s = aSel[r], h = aHot[r]; if (h > 0.01) aHot[r] = h * dC;
      if (s > 0.02 || h > 0.02) { g.globalAlpha = Math.min(1, s * 0.5 + h * 0.6); g.drawImage(BND[PK], pa.x + 3, rowY[r] - pitch * 0.62, pa.w - 6, pitch * 1.24); }
    }
    /* code acts: pulse + ripples */
    for (let k = 0; k < 3; k++) {
      const p = cPulse[k], c = CARDS[k]; if (p < 0.02) continue; cPulse[k] = p * Math.exp(-dk * 2.1);
      g.globalAlpha = Math.min(1, p * 0.95); g.drawImage(SOFT[cTint[k]], c.x - c.w * 0.45, c.y - c.h * 0.9, c.w * 1.9, c.h * 2.8); g.globalAlpha = 1; g.fillStyle = RAMP[cTint[k]][(p * 0.3 * 32) | 0]; rr(g, c.x, c.y, c.w, c.h, M ? 5 : 8); g.fill();
    }
    g.lineWidth = 1.5;
    for (let i = 0; i < RIPN; i++) {
      const age = t - ripT[i]; if (age < 0 || age > 0.85) continue; const k = age / 0.85, c = CARDS[ripK[i]], e = 1 - (1 - k) * (1 - k), gx = (M ? 12 : 22) * e, gy = (M ? 8 : 16) * e;
      g.strokeStyle = RAMP[ripC[i]][((1 - k) * 0.85 * 32) | 0]; rr(g, c.x - gx, c.y - gy, c.w + gx * 2, c.h + gy * 2, (M ? 5 : 8) + gx * 0.6); g.stroke();
    }
    /* impact ripples at every node a wave beam lands on */
    g.lineWidth = 1.2;
    for (let i = 0; i < NR; i++) {
      const age = t - nrT[i]; if (age < 0 || age > 0.6) continue; const k = age / 0.6, r = nrS[i] + (M ? 12 : 20) * (1 - (1 - k) * (1 - k));
      g.strokeStyle = RAMP[nrC[i]][((1 - k) * 0.8 * 32) | 0]; g.beginPath(); g.arc(nrX[i], nrY[i], r, 0, J.TAU); g.stroke();
    }
    /* lens flare on the card that was hit: anamorphic streak + cross + ghosts along the axis */
    for (let k = 0; k < 3; k++) {
      const f = fFl[k]; if (f < 0.02) continue; fFl[k] = f * Math.exp(-dk * 3.2);
      const c = CARDS[k], cx = c.x, cy = c.y + c.h / 2, tn = cTint[k], L = c.w * (0.9 + 0.9 * f);
      g.globalAlpha = Math.min(1, f * 0.9); g.drawImage(SPR[T_WHT], cx - L / 2, cy - 2.5, L, 5);
      g.globalAlpha = f * 0.5; g.drawImage(SPR[tn], cx - L * 0.8, cy - 8, L * 1.6, 16);
      g.globalAlpha = f * 0.38; g.drawImage(SPR[tn], cx - 3.5, cy - c.h * 0.65, 7, c.h * 1.3);
      for (let j = 0; j < 3; j++) { const sz = (M ? 7 : 11) * (1 + j * 0.55); g.globalAlpha = f * 0.26; g.drawImage(SPR[tn], cx + c.w * (0.2 + 0.28 * j) - sz / 2, cy - sz / 2, sz, sz); }
    }
    /* energy rings at the hit + rolling light sweep across answers and cards */
    for (let i = 0; i < SHN; i++) {
      const age = t - shT[i]; if (age < 0 || age > 1.1) continue; const k = age / 1.1, c = CARDS[shK[i]], cx = c.x + c.w * 0.5, cy = c.y + c.h * 0.5, RR = M ? 60 : 130, R = RAMP[shC[i]];
      spr(shC[i], c.x, cy, (M ? 40 : 70) * (1 - k * 0.5), (1 - k) * (1 - k));
      for (let j = 0; j < 3; j++) { const kj = k - j * 0.09; if (kj <= 0) continue; const e = 1 - (1 - kj) * (1 - kj), a = Math.pow(1 - kj, 1.4); g.lineWidth = 0.8 + 3.2 * (1 - kj); g.strokeStyle = R[(a * 0.8 * 32) | 0]; g.beginPath(); g.ellipse(cx, cy, 14 + e * RR, 8 + e * RR * 0.55, 0, 0, J.TAU); g.stroke(); }
    }
    { const sa = (t - swT) / 0.85;
      if (sa >= 0 && sa < 1) {
        const pc = P[2], x0 = pa.x, x1 = pc.x + pc.w, bw2 = M ? 60 : 130, e = sa * sa * (3 - 2 * sa), bx = x0 - bw2 + (x1 - x0 + bw2 * 1.6) * e, cy = pa.y + pa.h / 2;
        g.save(); g.beginPath(); g.rect(pa.x, pa.y, pa.w, pa.h); g.rect(pc.x, pc.y, pc.w, pc.h); g.clip(); g.translate(0, cy); g.transform(1, 0, -0.42, 1, 0, 0);
        g.globalAlpha = swS * Math.sin(Math.PI * sa) * 0.8; g.drawImage(SWEEP[swC], bx, -pa.h / 2 - 4, bw2, pa.h + 8); g.restore(); g.globalAlpha = 1;
      } }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.textBaseline = 'middle';
    /* ---- bars ---- */
    const bw = bx1 - bx0, ptx = pa.x + pa.w - (M ? 4 : 9), lw = M ? 2 : 3;
    for (let r = 0; r < 11; r++) {
      let v = aVal[r]; const tg = aTg[r]; v += (tg - v) * kE; if (v - tg < 0.002 && tg - v < 0.002) v = tg; aVal[r] = v;
      const s = aSel[r], y = rowY[r], by = M ? y + 2.5 : y - barH / 2, w = Math.max(0, v * bw);
      g.fillStyle = RAMP[PK][((0.42 + 0.58 * s) * 32) | 0]; g.fillRect(bx0, by, w, barH);
      if (s > 0.04) { g.globalAlpha = s; g.fillStyle = '#fff'; g.fillRect(bx0 + w - 2, by - 1, 2, barH + 2); g.globalAlpha = 1; }
      aTxt[r] = pct(v) + '%';
    }
    /* percentages (+ selected row names) carry a halo: wires to the cards run through this column */
    g.font = '500 ' + FS + 'px ' + FF; g.lineJoin = 'round'; g.lineWidth = lw; g.strokeStyle = HALO;
    for (let r = 0; r < 11; r++) {
      const sel = aSelT[r] > 0.5, ty = M ? rowY[r] - 3.5 : rowY[r] + 0.5;
      g.textAlign = 'right'; g.fillStyle = sel ? '#fff' : '#a89db3'; g.strokeText(aTxt[r], ptx, ty); g.fillText(aTxt[r], ptx, ty);
      if (sel) { g.textAlign = 'left'; g.fillStyle = '#fff'; g.strokeText(ROW[r], pa.x + (M ? 14 : 22), ty); g.fillText(ROW[r], pa.x + (M ? 14 : 22), ty); }
    }
    for (let r = 0; r < 11; r++) { const s = aSel[r]; if (s < 0.04) continue; g.fillStyle = RAMP[PK][(s * 32) | 0]; g.fillRect(pa.x + 2, rowY[r] - pitch * 0.38, 2, pitch * 0.76); }
    /* floor marker: springs to a new floor, dashes crawl and the line breathes; a flash marks a change */
    { const sdt = Math.min(dk, 0.033); fVel += ((floorV - fDisp) * 240 - fVel * 15) * sdt; fDisp += fVel * sdt; if (J.reduce || (Math.abs(fVel) < 0.002 && Math.abs(floorV - fDisp) < 0.0005)) { fDisp = floorV; fVel = 0; }
      const fx = bx0 + fDisp * bw, y0 = rowY[0] - pitch * 0.5, y1 = rowY[4] + pitch * 0.5, br = 0.5 + 0.5 * Math.sin(t * 2.2); fFlash *= Math.exp(-dk * 2.6);
      g.setLineDash(NODASH); g.strokeStyle = 'rgba(255,193,61,' + (0.07 + 0.06 * br + 0.3 * fFlash).toFixed(3) + ')'; g.lineWidth = 4; g.beginPath(); g.moveTo(fx, y0); g.lineTo(fx, y1); g.stroke();
      g.strokeStyle = 'rgba(255,193,61,' + Math.min(1, 0.68 + 0.26 * br + 0.3 * fFlash).toFixed(3) + ')'; g.lineWidth = 1 + 0.35 * br; g.setLineDash(DASH); g.lineDashOffset = -t * 5; g.beginPath(); g.moveTo(fx, y0); g.lineTo(fx, y1); g.stroke(); g.setLineDash(NODASH); g.lineDashOffset = 0;
      g.fillStyle = '#ffc13d'; g.beginPath(); g.moveTo(fx - 3, y0 - 0.5); g.lineTo(fx + 3, y0 - 0.5); g.lineTo(fx, y0 + 4); g.closePath(); g.fill(); }
    /* floor + confidence tick on the choice group: sits on the tip of the chosen bar (same eased value as bar and %); its label lives on a dark plate in the row gap */
    g.textAlign = 'right'; g.font = '700 ' + fFS + 'px ' + FF; g.fillStyle = '#ffc13d'; g.fillText(floorTxt, pa.x + pa.w - (M ? 4 : 8), grpY[0] + 3);
    confA += (1 - confA) * Math.min(1, dk * 9);
    { const sdt = Math.min(dk, 0.033); confVl += ((1 - confSp) * 320 - confVl * 13) * sdt; confSp += confVl * sdt; if (J.reduce) { confSp = 1; confVl = 0; } }
    if (confA > 0.02) {
      const cx = bx0 + aVal[confRow] * bw, ry = rowY[confRow], hh = Math.max(0.5, (M ? pitch * 0.5 : Math.min(9, pitch * 0.3)) * confSp), col = confOk ? '#2ee6a6' : '#ffc13d', yy = M ? ry + 2.5 : ry, dn = confRow === 0 ? -1 : 1;
      g.globalAlpha = confA; g.fillStyle = col; g.beginPath();
      if (M) {
        if (confRow === 0) { g.fillRect(cx - 1, yy - hh * 0.55, 2, hh * 1.55); g.moveTo(cx - 3.5, yy + hh + 4.5); g.lineTo(cx + 3.5, yy + hh + 4.5); g.lineTo(cx, yy + hh - 0.5); }
        else { g.fillRect(cx - 1, yy - hh, 2, hh * 2); g.moveTo(cx - 3.5, yy - hh - 4.5); g.lineTo(cx + 3.5, yy - hh - 4.5); g.lineTo(cx, yy - hh + 0.5); }
        g.closePath(); g.fill();
      } else {
        g.fillRect(cx - 1, yy - hh, 2, hh * 2); const ty = yy - dn * hh; g.moveTo(cx - 3.5, ty - dn * 4.5); g.lineTo(cx + 3.5, ty - dn * 4.5); g.lineTo(cx, ty + dn * 0.5); g.closePath(); g.fill();
        const ph = fFS + 3, pcy = ty - dn * (4.5 + 1 + ph / 2), plx = clamp(cx, bx0 + confW / 2, pa.x + pa.w - 6 - confW / 2);
        rr(g, plx - confW / 2, pcy - ph / 2, confW, ph, 4); g.fillStyle = 'rgba(8,4,13,.94)'; g.fill(); g.lineWidth = 1; g.strokeStyle = col; g.globalAlpha = confA * 0.55; g.stroke(); g.globalAlpha = confA;
        g.fillStyle = col; g.textAlign = 'center'; g.font = '700 ' + fFS + 'px ' + FF; g.fillText((pct(aVal[confRow]) / 100).toFixed(2), plx, pcy + 0.5);
      }
      g.globalAlpha = 1;
    }
    /* typed-question labels: name · primitive · "= answer" (desktop: right of the node; phone: centred under it) */
    { const pq = P[0];
      for (let i = 0; i < 3; i++) {
        if (M) {
          const cx = pq.x + pq.w / 2; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = '#f4eef6'; g.font = '600 7px ' + FF; g.fillText(QM[i][0], cx, qy[i] + qr + 9); g.fillText(QM[i][1], cx, qy[i] + qr + 17);
          g.fillStyle = '#ff9cc4'; g.font = '500 7px ' + FF; g.fillText(QT[i], cx, qy[i] + qr + 25);
          if (qLab[i]) { g.textBaseline = 'middle'; g.font = '700 7px ' + FF; g.fillText(qLab[i], cx, qy[i] + qr + 34); }
        } else {
          g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = '#f4eef6'; g.font = '700 ' + qFS + 'px ' + FF; g.fillText(QN[i], QX, qy[i] - 4.5);
          g.fillStyle = '#ff9cc4'; g.font = '500 ' + qFS2 + 'px ' + FF; T(g, QT[i], QX, qy[i] + 7, 0.8);
          if (qLab[i]) { g.textBaseline = 'middle'; g.font = '700 ' + qFS + 'px ' + FF; g.fillText(qLab[i], QX, qy[i] + 20); }
        }
      }
    }
    /* code cards: names, sub-lines and odometer counters */
    g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    for (let k = 0; k < 3; k++) {
      if (cCV[k] !== cCount[k]) { cPrevT[k] = cTxt[k]; cTxt[k] = J.fmt(cCount[k]); cRoll[k] = cCV[k] < 0 || J.reduce ? 1 : 0; cCV[k] = cCount[k]; }
      if (cRoll[k] < 1) cRoll[k] = Math.min(1, cRoll[k] + dk / 0.55);
      const c = CARDS[k]; g.font = '700 ' + cFS + 'px ' + FF; g.fillStyle = '#fff'; T(g, c.w < 100 ? CN[k] : 'orders/' + CN[k], c.x + (M ? 5 : 10), c.y + (M ? 12 : 17), M ? 0.2 : 0.6);
      if (!M) { g.font = '500 ' + cFS2 + 'px ' + FF; g.fillStyle = '#ffc7dc'; g.fillText(DSUB[k], c.x + 10, c.y + 29); }
      g.font = '700 ' + (M ? 16 : 25) + 'px ' + SF; g.fillStyle = '#fff'; counter(g, k, c.x + (M ? 5 : 10), c.y + c.h - (M ? 7 : 11), M ? 16 : 25); g.globalAlpha = 1;
    }
    if (killed) {
      const p = P[2]; g.fillStyle = 'rgba(9,4,15,.96)'; g.fillRect(p.x + 2, p.y + (M ? 14 : 21), p.w - 4, M ? 8 : 11);
      g.globalAlpha = 0.65 + 0.35 * Math.sin(t * 7); g.fillStyle = '#ff4d5e'; g.font = '700 ' + kFS + 'px ' + FF; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText(M ? 'halted' : 'halted · all to review', p.x + (M ? 3 : 10), p.y + (M ? 18 : 27)); g.globalAlpha = 1;
    }
    g.textBaseline = 'middle';
  }

  /* ---------- build / resize ---------- */
  let lastRun = 0;
  function rebuild() {
    const a = J.fit(cs), b = J.fit(cl); gs = a.g; gl = b.g; W = a.W; H = a.H; dpr = a.dpr; M = W < 700;
    layout(); drawStatic(); frame(lastRun || performance.now() / 1000, 0.016);
  }
  const frameT = (t, dt) => { lastRun = t; frame(t, dt); };
  J.watch(stage, rebuild);
  if (document.fonts) { document.fonts.ready.then(() => W && rebuild()).catch(() => {}); if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', () => W && rebuild()); }

  /* ---------- events ---------- */
  function snap(d, demo) { // jump straight to the settled state of a decision (reduced motion, first paint)
    const w = startWave(d, demo); while (w.st < 4) runStage(w, w.st++);
    aVal.set(aTg); aSel.set(aSelT); qFl.fill(0); aHot.fill(0); cPulse.fill(0); nfl.fill(0); bDur.fill(0); nAmb = 0; confA = 1; confSp = 1; confVl = 0; fFl.fill(0); nrT.fill(-9); cRoll.fill(1); fDisp = floorV;
  }
  J.bus.on('decision', (d) => { if (J.reduce) { snap(d, false); frame(performance.now() / 1000, 0.016); } else startWave(d, false); });
  J.bus.on('kill', (k) => { killed = !!k; PK = killed ? T_RED : T_PINK; killFl = 1; killT0 = performance.now() / 1000; root.classList.toggle('is-killed', killed); });
  J.bus.on('floor', (f) => { floorV = f; fFlash = 1; floorTxt = 'floor ' + f.toFixed(2); });
  root.classList.toggle('is-killed', killed);
  let lastFire = 0;
  cl.addEventListener('click', () => { const t = performance.now(); if (t - lastFire > 160) { lastFire = t; J.fire(); } });

  /* seed with the latest decision so the panel is populated from the first frame */
  { const d0 = J.recent[0] || J.makeDecision(); snap(d0, true); }
  J.task(stage, frameT);
});
