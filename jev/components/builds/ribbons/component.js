/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod J.$ J.$$ J.C J.S J.BUILDS J.TAU J.clamp J.rng J.fit J.watch J.task J.onView J.animate J.pointer J.tier J.DPR J.reduce J.hidden J.recent J.makeDecision; J.bus 'decision' | 'kill'.
 * Data: decision fields d.build (which stream lights up), d.action, d.conf, d.size, d.venue, d.dest; the streams themselves are decoration: change SRC / DST rows and PERM in component.js.
 * Optional: body.killed class (set by core on kill). Everything is simulated.
 */
/* builds / ribbons: particle ribbon streams between two boxes. One canvas behind two DOM cards; each ribbon is a cubic bezier carrying wobbling additive particles with motion-blur
 * trails, hot heads, sparkle stars, travelling comets and decision bursts; hover a box to boost all streams; the kill switch turns them red and freezes them.
 * To reuse: keep the two boxes (#bld-rb-a / #bld-rb-b), give each row an anchor (.bld-rw) and call boostR(i, 1, 34) + pulse(i, 1, .52) whenever stream i should fire. */
JEV.mod('builds-ribbons', () => {
  const J = JEV, $ = J.$, $$ = J.$$, C = J.C, S = J.S, B = J.BUILDS, TAU = J.TAU, clamp = J.clamp;
  const stage = $('#bld-rb-stage'), cv = $('#bld-rb-cv'), boxA = $('#bld-rb-a'), boxB = $('#bld-rb-b');
  if (!stage || !cv || !boxA || !boxB) return;
  const rowsA = $$('.bld-rw', boxA), rowsB = $$('.bld-rw', boxB);
  const reduce = J.reduce, mq = window.matchMedia('(max-width: 759px)');
  const setT = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  const short = (s) => s.split('-')[0];
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  /* ---------- palette (index = tint id used by ribbons) ---------- */
  const TINT = ['#ff6fa6', '#c9c2d6', '#35e0a8', '#5a8cff', '#ffc53d'];
  const TIDX = { pink: 0, gray: 1, green: 2, blue: 3, yellow: 4 };
  const TRGB = TINT.map(hex), RED = [255, 77, 94], WHITE = [255, 255, 255];
  const PRIMS = ['choice', 'score', 'flag'];
  const PCOL = { choice: C.pink, score: C.amber, flag: C.green };
  const bIdx = {}; B.forEach((b, i) => (bIdx[b.key] = i));
  const mix = (a, b, k) => 'rgba(' + ((a[0] + (b[0] - a[0]) * k) | 0) + ',' + ((a[1] + (b[1] - a[1]) * k) | 0) + ',' + ((a[2] + (b[2] - a[2]) * k) | 0);
  const PERM = [2, 0, 4, 1, 3]; // source row i feeds sink row PERM[i] (crossing streams)
  const R_CORE = 99;            // (ribbons of the full hub that flow OUT of the core use this base; here all flow A -> B)

  const NS = 40, NR = 5, NB = 12;
  const LENS = new Float32Array(NS); for (let i = 0; i < NS; i++) LENS[i] = Math.pow(Math.sin(Math.PI * i / (NS - 1)), 0.72);
  const L = new Float32Array(NR * NS * 4), RLEN = new Float32Array(NR), RW = new Float32Array(NR), RN = new Int32Array(NR), RTINT = new Uint8Array(NR);
  const EX = new Float32Array(NR), EY = new Float32Array(NR);
  const boost = new Float32Array(NR), hovT = new Float32Array(NR), hov = new Float32Array(NR), hovUntil = new Float64Array(NR), SM = new Float32Array(NR), EFF = new Float32Array(NR);
  const SPH = new Float32Array(NR * 7), SK = new Float32Array(NR * 7), SA = new Float32Array(NR * 7), SOM = new Float32Array(NR * 7);
  const MAXP = 1800, MAXB = 200;
  const PR = new Uint8Array(MAXP), PU = new Float32Array(MAXP), PVU = new Float32Array(MAXP), PPH = new Float32Array(MAXP), PK = new Float32Array(MAXP), PA = new Float32Array(MAXP), POM = new Float32Array(MAXP), PJ = new Float32Array(MAXP), PX = new Float32Array(MAXP), PY = new Float32Array(MAXP);
  const PTX = new Float32Array(MAXP), PTY = new Float32Array(MAXP), PT = new Float32Array(MAXP), HOT1 = new Int32Array(MAXP), HOT2 = new Int32Array(MAXP);
  const bs = new Int32Array(NB + 1);
  let NP = 0, stars = new Int32Array(0), ridx = [];
  const BR = new Int16Array(MAXB).fill(-1), BU = new Float32Array(MAXB), BV = new Float32Array(MAXB), BL = new Float32Array(MAXB), BP = new Float32Array(MAXB);
  let ready = false, g = null, W = 0, H = 0, sx0 = 0, sy0 = 0, coreCx = 0, coreCy = 0;
  const hz = document.createElement('canvas');
  let kk = S.killed ? 1 : 0, kT = kk, kShown = -1;
  const bstyle = new Array(NB).fill('#fff'), hotS = ['#fff', '#fff'];
  const BALPHA = [0.5, 0.95];
  const bsz = [1.0, 1.55];
  const spr = TRGB.concat([WHITE, RED]).map((c) => {
    const s = document.createElement('canvas'); s.width = s.height = 32; const x = s.getContext('2d');
    const gr = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(0.18, 'rgba(' + c.join(',') + ',.75)'); gr.addColorStop(0.5, 'rgba(' + c.join(',') + ',.18)'); gr.addColorStop(1, 'rgba(' + c.join(',') + ',0)');
    x.fillStyle = gr; x.fillRect(0, 0, 32, 32); return s;
  });
  const anc = { x: 0, y: 0 };
  function addRibbon(slot, a, p1, p2, b, w, dens, tint) {
    const o = slot * NS * 4;
    let len = 0, px = a.x, py = a.y;
    for (let i = 0; i < NS; i++) {
      const s = i / (NS - 1), m = 1 - s;
      const x = m * m * m * a.x + 3 * m * m * s * p1.x + 3 * m * s * s * p2.x + s * s * s * b.x;
      const y = m * m * m * a.y + 3 * m * m * s * p1.y + 3 * m * s * s * p2.y + s * s * s * b.y;
      let dx = 3 * m * m * (p1.x - a.x) + 6 * m * s * (p2.x - p1.x) + 3 * s * s * (b.x - p2.x);
      let dy = 3 * m * m * (p1.y - a.y) + 6 * m * s * (p2.y - p1.y) + 3 * s * s * (b.y - p2.y);
      const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
      L[o + i * 4] = x; L[o + i * 4 + 1] = y; L[o + i * 4 + 2] = -dy; L[o + i * 4 + 3] = dx;
      if (i) len += Math.hypot(x - px, y - py); px = x; py = y;
    }
    RLEN[slot] = len; RW[slot] = w; RTINT[slot] = tint; EX[slot] = b.x; EY[slot] = b.y;
    RN[slot] = Math.min(520, Math.max(mq.matches ? 22 : 36, Math.round(len * dens * QF * (mq.matches ? 0.42 : 1))));
  }

  let lastSig = '', mTimer = 0, QF = 1; // QF: particle quality, lowered once if frames run slow
  function measure() {
    const f = J.fit(cv); g = f.g; W = f.W; H = f.H;
    const sr = cv.getBoundingClientRect();
    sY = window.scrollY; sx0 = sr.left; sy0 = sr.top + sY;
    let sig = W + 'x' + H + (mq.matches ? 'm' : 'd') + '/' + J.DPR;
    const rc = (el) => { const r = el.getBoundingClientRect(); const l = r.left - sr.left, t = r.top - sr.top; sig += '|' + (l | 0) + ',' + (t | 0) + ',' + (r.width | 0) + ',' + (r.height | 0); return { l, t, r: l + r.width, b: t + r.height, w: r.width, h: r.height, cx: l + r.width / 2, cy: t + r.height / 2 }; };
    const A = rc(boxA), Bx = rc(boxB), ra = rowsA.map(rc), rb = rowsB.map(rc);
    coreCx = Bx.cx; coreCy = Bx.cy;
    if (sig === lastSig && ready) return;
    lastSig = sig;
    RN.fill(0);
    const P = (x, y) => ({ x, y });
    for (let i = 0; i < NR; i++) {
      const a = P(A.r, ra[i].cy), b = P(Bx.l, rb[PERM[i]].cy), dx = b.x - a.x;
      addRibbon(i, a, P(a.x + dx * 0.5, a.y), P(b.x - dx * 0.5, b.y), b, mq.matches ? 8 : 15, mq.matches ? 0.9 : 0.72, i % 5);
    }
    buildParticles();
    paintHaze();
    ready = true;
    draw(performance.now() / 1000, 0.016, true);
  }
  let live = false;
  const measureSoon = () => { if (!live || mTimer) return; mTimer = setTimeout(() => { mTimer = 0; measure(); }, 60); };

  function buildParticles() {
    const rnd = J.rng(901), cnt = new Int32Array(NB), bk = new Uint8Array(MAXP), rr = new Uint8Array(MAXP);
    let n = 0, tot = 0; for (let ri = 0; ri < NR; ri++) tot += RN[ri];
    if (tot > MAXP) for (let ri = 0; ri < NR; ri++) RN[ri] = Math.floor(RN[ri] * MAXP / tot); // fair share when over budget
    for (let ri = 0; ri < NR; ri++) {
      for (let s = 0; s < 7; s++) { const q = ri * 7 + s; SPH[q] = rnd() * TAU; SK[q] = 2.2 + rnd() * 6.4; SA[q] = 0.35 + rnd() * 0.65; SOM[q] = (rnd() < 0.5 ? -1 : 1) * (0.3 + rnd() * 0.8); }
      for (let k = 0; k < RN[ri] && n < MAXP; k++, n++) {
        const white = rnd() < 0.36, bright = rnd() < (white ? 0.4 : 0.3);
        const b = white ? 10 + (bright ? 1 : 0) : RTINT[ri] * 2 + (bright ? 1 : 0);
        bk[n] = b; rr[n] = ri; cnt[b]++;
      }
    }
    NP = n; let p = 0; const pos = new Int32Array(NB);
    for (let b = 0; b < NB; b++) { bs[b] = p; pos[b] = p; p += cnt[b]; } bs[NB] = p;
    for (let i = 0; i < NP; i++) PR[pos[bk[i]]++] = rr[i];
    const cr = new Int32Array(NR), st = [];
    for (let i = 0; i < NP; i++) {
      const ri = PR[i]; cr[ri]++;
      PU[i] = rnd(); PVU[i] = (62 + rnd() * 70) / RLEN[ri];
      if (rnd() < 0.2) { PK[i] = 0; POM[i] = 0; PPH[i] = Math.PI / 2; PA[i] = (rnd() * 2 - 1) * 0.95; }
      else { const q = ri * 7 + ((rnd() * 7) | 0); PPH[i] = SPH[q] + (rnd() - 0.5) * 0.09; PK[i] = SK[q]; POM[i] = SOM[q]; PA[i] = SA[q]; }
      PJ[i] = (rnd() - 0.5) * 2.2; PT[i] = rnd();
    }
    ridx = []; for (let ri = 0; ri < NR; ri++) ridx.push(new Int32Array(cr[ri]));
    cr.fill(0);
    for (let i = 0; i < NP; i++) { const ri = PR[i]; ridx[ri][cr[ri]++] = i; }
    for (let i = bs[11]; i < NP; i += 9) st.push(i);
    stars = Int32Array.from(st);
  }

  const HS = 0.4; // haze is painted at 40% size and upscaled: free softness, tiny cost
  const HL = [1.4, 1.08, 0.8, 0.54, 0.3], HA = [0.016, 0.024, 0.032, 0.044, 0.06];
  function paintHaze() {
    hz.width = Math.max(2, Math.round(W * HS)); hz.height = Math.max(2, Math.round(H * HS));
    const h = hz.getContext('2d');
    h.setTransform(HS, 0, 0, HS, 0, 0); h.clearRect(0, 0, W, H);
    h.globalCompositeOperation = 'lighter';
    for (let ri = 0; ri < NR; ri++) {
      if (!RN[ri]) continue;
      const c = TRGB[RTINT[ri]].join(',');
      for (let s = 0; s < 5; s++) { h.fillStyle = 'rgba(' + c + ',' + HA[s] + ')'; lens(h, ri, HL[s]); h.fill(); }
      h.strokeStyle = 'rgba(' + c + ',.16)'; h.lineWidth = 2; h.beginPath();
      const o = ri * NS * 4; h.moveTo(L[o], L[o + 1]);
      for (let i = 1; i < NS; i++) h.lineTo(L[o + i * 4], L[o + i * 4 + 1]);
      h.stroke();
      // soft nodes where a ribbon leaves a card / enters the next one
      for (let e = 0; e < 2; e++) {
        const x = e ? EX[ri] : L[o], y = e ? EY[ri] : L[o + 1];
        h.fillStyle = 'rgba(' + c + ',.07)'; h.beginPath(); h.arc(x, y, 11, 0, TAU); h.fill();
        h.fillStyle = 'rgba(' + c + ',.2)'; h.beginPath(); h.arc(x, y, 5, 0, TAU); h.fill();
      }
    }
  }
  function lens(c, ri, sc) {
    const o = ri * NS * 4, w = RW[ri] * sc;
    c.beginPath();
    for (let i = 0; i < NS; i++) { const q = o + i * 4, d = w * LENS[i]; if (i) c.lineTo(L[q] + L[q + 2] * d, L[q + 1] + L[q + 3] * d); else c.moveTo(L[q] + L[q + 2] * d, L[q + 1] + L[q + 3] * d); }
    for (let i = NS - 1; i >= 0; i--) { const q = o + i * 4, d = w * LENS[i]; c.lineTo(L[q] - L[q + 2] * d, L[q + 1] - L[q + 3] * d); }
    c.closePath();
  }

  function recolor() {
    for (let b = 0; b < NB; b++) {
      const white = b >= 10, bright = b & 1, a = white ? (bright ? 0.95 : 0.45) : BALPHA[bright];
      bstyle[b] = mix(white ? WHITE : TRGB[b >> 1], white ? [255, 200, 205] : RED, kk) + ',' + a + ')';
    }
    hotS[0] = mix([255, 196, 140], [255, 150, 150], kk) + ',.8)'; hotS[1] = mix([255, 246, 225], [255, 215, 215], kk) + ',.95)';
    kShown = kk;
  }
  recolor();

  function spawn(ri, n) {
    if (!RN[ri] || reduce) return;
    for (let k = 0, i = 0; k < n && i < MAXB; i++) {
      if (BR[i] >= 0) continue;
      BR[i] = ri; BU[i] = -Math.random() * 0.22; BV[i] = 1.55 + Math.random() * 0.5; BL[i] = (Math.random() * 2 - 1) * 0.85; BP[i] = Math.random() * TAU; k++;
    }
  }
  function boostR(ri, a, n) { if (ri < 0 || ri >= NR || !RN[ri]) return; if (a > boost[ri]) boost[ri] = a; if (n) spawn(ri, n); }

  const NPUL = 16, PLR = new Int16Array(NPUL).fill(-1), PLU = new Float32Array(NPUL), PLV = new Float32Array(NPUL), PLS = new Float32Array(NPUL);
  let rpx = 0, rpy = 0;
  const ribPt = (ri, u) => { const fi = Math.min(NS - 1.001, u * (NS - 1)), j = fi | 0, tt = fi - j, o = ri * NS * 4 + j * 4; rpx = L[o] + (L[o + 4] - L[o]) * tt; rpy = L[o + 1] + (L[o + 5] - L[o + 1]) * tt; };
  const fancyNow = () => (J.tier || 2) >= 2 && !reduce;
  function pulse(ri, str, dur) {
    if (ri < 0 || ri >= NR || !RN[ri] || !fancyNow()) return;
    for (let i = 0; i < NPUL; i++) if (PLR[i] < 0) { PLR[i] = ri; PLU[i] = 0; PLV[i] = 1 / dur; PLS[i] = str; return; }
  }

  /* bloom: the finished frame is box-downsampled in x2 steps (/2 /4 /8) and added back soft; refreshed every other frame */
  let bl = null, blF = 0;
  function bloom() {
    const w = cv.width, h = cv.height;
    if (!bl || bl.w !== w || bl.h !== h) {
      bl = { w, h, c: [] };
      for (let k = 1; k <= 3; k++) { const c = document.createElement('canvas'); c.width = Math.max(2, w >> k); c.height = Math.max(2, h >> k); const x = c.getContext('2d'); x.globalCompositeOperation = 'copy'; bl.c.push([c, x]); }
    }
    if ((blF++ & 1) === 0) { let src = cv; for (let k = 0; k < 3; k++) { const c = bl.c[k]; c[1].drawImage(src, 0, 0, c[0].width, c[0].height); src = c[0]; } }
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.42; g.drawImage(bl.c[1][0], 0, 0, W, H);
    g.globalAlpha = 0.5; g.drawImage(bl.c[2][0], 0, 0, W, H);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }

  let dimV = 0, dimT = 0, tw = 0;
  let szk = 1, lastNow = performance.now(), sY = window.scrollY;
  window.addEventListener('scroll', () => { sY = window.scrollY; }, { passive: true });
  function draw(t, dt, still) {
    if (!ready) return;
    // ---- state ----
    const now = performance.now(), rdt = Math.min(0.4, (now - lastNow) / 1000); lastNow = now; // eased state follows wall-clock, motion follows dt
    const ek = 1 - Math.exp(-rdt * 3.2); kk += (kT - kk) * ek; if (Math.abs(kk - kT) < 0.003) kk = kT;
    if (Math.abs(kk - kShown) > 0.004) recolor();
    const tr = J.tier || 2, fancy = tr >= 2 && !reduce;
    tw += dt * (fancy ? 1 - 0.97 * kk : 1); const tws = fancy ? tw : t; // ribbon wobble clock: freezes under the kill switch
    const dec = Math.exp(-rdt * 1.55), hk = 1 - Math.exp(-rdt * 9);
    dimV += (dimT - dimV) * (1 - Math.exp(-rdt * 7)); if (Math.abs(dimV - dimT) < 0.004) dimV = dimT;
    const dA = 1 - 0.6 * dimV; // pinned / hovered build: every other stream recedes
    for (let i = 0; i < NR; i++) {
      boost[i] *= dec; if (boost[i] < 0.004) boost[i] = 0;
      hov[i] += ((hovT[i] || now < hovUntil[i] ? 1 : 0) - hov[i]) * hk;
      const e = boost[i] > hov[i] * 0.85 ? boost[i] : hov[i] * 0.85; EFF[i] = e;
      SM[i] = (1 + 2.4 * e) * (1 - (fancy ? 0.97 : 0.7) * kk);
    }
    // ---- pointer (stage space) ----
    const Pt = J.pointer, pxs = Pt.x - sx0, pys = Pt.y + sY - sy0, pOn = Pt.x > -5000 && pxs > -120 && pxs < W + 120 && pys > -120 && pys < H + 120;
    // ---- draw ----
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.clearRect(0, 0, W, H);
    g.globalAlpha = 1 - 0.5 * dimV; g.drawImage(hz, 0, 0, W, H); g.globalAlpha = 1;
    g.globalCompositeOperation = 'lighter';
    // boosted haze + end glows
    for (let ri = 0; ri < NR; ri++) {
      const e = EFF[ri]; if (e < 0.04 || !RN[ri]) continue;
      g.fillStyle = kk > 0.5 ? '#ff4d5e' : TINT[RTINT[ri]];
      g.globalAlpha = e * 0.1; lens(g, ri, 0.85); g.fill();
      g.globalAlpha = Math.min(1, e * 0.85); g.drawImage(spr[kk > 0.5 ? 6 : 5], EX[ri] - 26, EY[ri] - 26, 52, 52);
    }
    g.globalAlpha = 1;
    // particles, batched per colour bucket
    const px = still ? 0 : 1; let nh1 = 0, nh2 = 0;
    for (let b = 0; b < NB; b++) {
      const s0 = bs[b], s1 = bs[b + 1]; if (s0 === s1) continue;
      const sz = (b >= 10 ? (b & 1 ? 1.65 : 1.1) : bsz[b & 1]) * szk;
      g.fillStyle = bstyle[b]; g.globalAlpha = dA; g.beginPath();
      for (let i = s0; i < s1; i++) {
        const ri = PR[i];
        let u = PU[i] + dt * PVU[i] * SM[ri] * px; if (u >= 1) u -= 1; PU[i] = u;
        const fi = u * (NS - 1), j = fi | 0, tt = fi - j, o = ri * NS * 4 + j * 4;
        let x = L[o] + (L[o + 4] - L[o]) * tt, y = L[o + 1] + (L[o + 5] - L[o + 1]) * tt;
        const nx = L[o + 2] + (L[o + 6] - L[o + 2]) * tt, ny = L[o + 3] + (L[o + 7] - L[o + 3]) * tt;
        const ln = LENS[j] + (LENS[j + 1] - LENS[j]) * tt;
        const off = ln * (RW[ri] * PA[i] * Math.sin(PPH[i] + u * PK[i] + tws * POM[i]) + PJ[i]);
        x += nx * off; y += ny * off;
        if (pOn) { const dx = x - pxs, dy = y - pys, d2 = dx * dx + dy * dy; if (d2 < 7000) { const d = Math.sqrt(d2) + 0.01, f = (1 - d2 / 7000), s = f * f * 22 / d; x += dx * s; y += dy * s; } }
        PX[i] = x; PY[i] = y;
        g.rect(x, y, sz, sz);
        if (fancy) {
          PTX[i] = ny; PTY[i] = -nx; // travel direction (ribbon normal rotated)
          const h = (ri >= R_CORE ? 1 - u : u) * 0.75 + PT[i] * 0.35; // colour temperature: charging toward the core, cooling as it leaves
          if (h > 1.0) HOT2[nh2++] = i; else if (h > 0.8) HOT1[nh1++] = i;
        }
      }
      g.fill();
    }
    if (fancy) {
      // motion-blur trails (every other particle, length follows ribbon speed)
      const tm = tr >= 3 ? 0.085 : 0.06;
      g.lineWidth = 1; g.lineCap = 'round';
      for (let b = 0; b < NB; b++) {
        const s0 = bs[b], s1 = bs[b + 1]; if (s0 === s1) continue;
        g.strokeStyle = bstyle[b]; g.globalAlpha = dA * (tr >= 3 ? 0.4 : 0.28); g.beginPath();
        for (let i = s0; i < s1; i += 2) {
          const ri = PR[i], l = Math.min(30, tm * PVU[i] * RLEN[ri] * SM[ri]); if (l < 1.6) continue;
          g.moveTo(PX[i], PY[i]); g.lineTo(PX[i] - PTX[i] * l, PY[i] - PTY[i] * l);
        }
        g.stroke();
      }
      g.lineCap = 'butt';
      if (nh1) { g.fillStyle = hotS[0]; g.globalAlpha = dA; g.beginPath(); for (let k = 0; k < nh1; k++) { const i = HOT1[k]; g.rect(PX[i] - 0.3, PY[i] - 0.3, 2, 2); } g.fill(); }
      if (nh2) { g.fillStyle = hotS[1]; g.globalAlpha = dA; g.beginPath(); for (let k = 0; k < nh2; k++) { const i = HOT2[k]; g.rect(PX[i] - 0.6, PY[i] - 0.6, 2.8, 2.8); } g.fill(); }
    }
    g.globalAlpha = 1;
    // boosted ribbons: bright overlay on their own particles
    for (let ri = 0; ri < NR; ri++) {
      const e = EFF[ri]; if (e < 0.05) continue;
      const ix = ridx[ri]; g.globalAlpha = Math.min(0.9, e * 0.85); g.fillStyle = '#fff'; g.beginPath();
      for (let k = 0; k < ix.length; k++) g.rect(PX[ix[k]] - 0.4, PY[ix[k]] - 0.4, 2.3, 2.3);
      g.fill();
    }
    g.globalAlpha = 1;
    // bursts (decision packets)
    let any = false; for (let i = 0; i < MAXB; i++) if (BR[i] >= 0) { any = true; break; }
    if (any) {
      g.fillStyle = kk > 0.5 ? 'rgba(255,225,225,.95)' : 'rgba(255,255,255,.95)'; g.beginPath();
      for (let i = 0; i < MAXB; i++) {
        const ri = BR[i]; if (ri < 0) continue;
        BU[i] += dt * BV[i] * (1 - (fancy ? 0.95 : 0.55) * kk);
        const u = BU[i]; if (u >= 1) { BR[i] = -1; continue; } if (u < 0) continue;
        const fi = u * (NS - 1), j = fi | 0, tt = fi - j, o = ri * NS * 4 + j * 4, ln = LENS[j] + (LENS[j + 1] - LENS[j]) * tt;
        const off = ln * RW[ri] * BL[i] * Math.sin(BP[i] + u * 5 + t * 1.3);
        const x = L[o] + (L[o + 4] - L[o]) * tt + (L[o + 2] + (L[o + 6] - L[o + 2]) * tt) * off, y = L[o + 1] + (L[o + 5] - L[o + 1]) * tt + (L[o + 3] + (L[o + 7] - L[o + 3]) * tt) * off;
        g.rect(x - 0.5, y - 0.5, 2.6, 2.6);
      }
      g.fill();
    }
    // sparkle stars
    const sp = kk > 0.5 ? 6 : 0;
    for (let k = 0; k < stars.length; k++) {
      const i = stars[k], ri = PR[i];
      g.globalAlpha = (0.34 + 0.4 * Math.sin(t * 2.1 + k * 1.7)) * (0.7 + 0.5 * EFF[ri]) * (EFF[ri] > 0.5 ? 1 : dA);
      g.drawImage(spr[kk > 0.5 ? 6 : RTINT[ri]], PX[i] - 8, PY[i] - 8, 16, 16);
    }
    g.globalAlpha = 1;
    if (fancy) {
      // comets travelling a ribbon (a decision firing from a build runs toward the core)
      for (let i = 0; i < NPUL; i++) {
        const ri = PLR[i]; if (ri < 0) continue;
        const u = (PLU[i] += dt * PLV[i] * (1 - 0.95 * kk)); if (u > 1.2) { PLR[i] = -1; continue; }
        const si = kk > 0.5 ? 6 : RTINT[ri];
        for (let k = 8; k >= 0; k--) {
          const uu = u - k * 0.02; if (uu < 0 || uu > 1) continue;
          ribPt(ri, uu); const f = 1 - k / 9, r = 6 + 9 * f;
          g.globalAlpha = Math.min(1, PLS[i] * f * f * 0.95); g.drawImage(spr[si], rpx - r, rpy - r, r * 2, r * 2);
        }
        if (u <= 1) { ribPt(ri, u); g.globalAlpha = PLS[i]; g.drawImage(spr[kk > 0.5 ? 6 : 5], rpx - 11, rpy - 11, 22, 22); }
      }
      g.globalAlpha = 1;
      if (tr >= 3) bloom();
    }
  }

  /* ---------- a decision lights its stream: source row flashes, comet + burst run to the sink, which updates ---------- */
  const FL_LIT = [{ offset: 0, filter: 'brightness(1.4)' }], FL_DECAY = { duration: 1000, easing: 'cubic-bezier(.2,.7,.2,1)' };
  const SRC = B.slice(0, 5); // the five source rows show the first five builds
  const vals = (d) => [d.action, d.size + '%', d.venue, d.dest, d.conf.toFixed(2)];
  function fire(d) {
    const i = (B.findIndex((b) => b.key === d.build) + 5) % 5;
    setT($('.bld-v', rowsA[i]), d.conf.toFixed(2));
    if (!reduce) J.animate(rowsA[i], [{ offset: 0, background: 'rgba(255,111,166,.35)' }], { duration: 900, easing: 'ease-out' });
    boostR(i, 1, 34); pulse(i, 1, 0.52);
    const j = PERM[i];
    setTimeout(() => {
      if (J.hidden()) return;
      setT($('.bld-v', rowsB[j]), vals(d)[j]);
      if (!reduce) J.animate(rowsB[j], [{ offset: 0, background: 'rgba(46,230,166,.3)' }], { duration: 900, easing: 'ease-out' });
      boostR(i, 0.8, 8);
    }, reduce ? 0 : 520);
  }
  const seed = J.recent.slice(0, 5).reverse(); seed.forEach((d) => { const i = (B.findIndex((b) => b.key === d.build) + 5) % 5; setT($('.bld-v', rowsA[i]), d.conf.toFixed(2)); setT($('.bld-v', rowsB[PERM[i]]), vals(d)[PERM[i]]); });
  J.bus.on('decision', (d) => { if (visible) fire(d); });
  J.bus.on('kill', (k) => { kT = k ? 1 : 0; if (reduce) { kk = kT; recolor(); draw(performance.now() / 1000, 0.016, true); } });

  /* hover / press a box boosts every stream */
  [boxA, boxB].forEach((el) => {
    el.addEventListener('pointerenter', () => { for (let i = 0; i < NR; i++) hovT[i] = 1; el.classList.add('bld-hot'); });
    el.addEventListener('pointerleave', () => { for (let i = 0; i < NR; i++) hovT[i] = 0; el.classList.remove('bld-hot'); });
    el.addEventListener('pointerdown', () => { const u = performance.now() + 1500; for (let i = 0; i < NR; i++) { hovUntil[i] = u; if (!reduce) spawn(i, 12); } });
  });

  let visible = false;
  if ('IntersectionObserver' in window) new IntersectionObserver((es) => { visible = es[es.length - 1].isIntersecting; }, { rootMargin: '160px 0px' }).observe(stage); else visible = true;
  J.onView(stage, () => { live = true; measure(); }, { threshold: 0, rootMargin: '700px 0px' });
  J.onView(stage, () => { [250, 1500].forEach((ms) => setTimeout(measure, ms)); }, { threshold: 0.05 });
  let cost = 0, nf = 0;
  J.task(stage, (t, dt) => {
    const a = performance.now(); draw(t, dt, false); cost += performance.now() - a;
    if (++nf === 90) { if (cost / nf > 6.5 && QF > 0.5) { QF *= 0.75; lastSig = ''; measure(); } cost = 0; nf = 0; }
  });
  requestAnimationFrame(() => J.watch(stage, measureSoon));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureSoon);
  window.addEventListener('load', measureSoon, { once: true });
  if (mq.addEventListener) mq.addEventListener('change', measureSoon);
});
