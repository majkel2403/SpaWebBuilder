/* hour / honest-bars — two bars from one strategy (x2.9 backtest vs x1.9 after costs) and the red leak ribbons that fall into "the venue" bin with splashes.
 *
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod  J.$ J.C J.TAU J.clamp  J.fit J.watch J.task J.onView  J.DPR J.reduce J.tier.
 * Data: static figures in the markup (x2.9, x1.9, 0.19% edge, 0.07% bill). Bar heights are CSS (see .hr-bar-g / .hr-bar-a in component.css).
 * Everything is simulated.
 */
JEV.mod('hour-honest-bars', () => {
  const J = JEV, $ = J.$, C = J.C, TAU = J.TAU, clamp = J.clamp;
  const root = $('#hr-e');
  if (!root) return;
  const reduce = J.reduce;
  /* ---------- shared helpers ---------- */
  /** J.fit, corrected for ancestors that are mid-transform (.rv reveal scales the box, which would make getBoundingClientRect lie) */
  function fitC(c) {
    const f = J.fit(c), cw = c.clientWidth, ch = c.clientHeight;
    if (cw > 0 && ch > 0 && (cw !== f.W || ch !== f.H)) {
      const w = Math.round(cw * J.DPR), h = Math.round(ch * J.DPR);
      if (c.width !== w) c.width = w;
      if (c.height !== h) c.height = h;
      f.g.setTransform(J.DPR, 0, 0, J.DPR, 0, 0); f.W = cw; f.H = ch;
    }
    return f;
  }
  /** layout-space box of el inside the positioned ancestor `top` (transform-proof, unlike getBoundingClientRect) */
  function offs(el, top) {
    let x = 0, y = 0, e = el;
    const w = el.offsetWidth, h = el.offsetHeight;
    while (e && e !== top) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    return { x, y, w, h };
  }
  const SPR = {};
  /** pre-rendered additive glow sprite (white core -> colour -> transparent) */
  function glow(hex) {
    if (SPR[hex]) return SPR[hex];
    const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.16, 'rgba(' + r + ',' + g + ',' + b + ',.95)');
    gr.addColorStop(0.5, 'rgba(' + r + ',' + g + ',' + b + ',.26)'); gr.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    return (SPR[hex] = c);
  }
  const blit = (g, hex, x, y, r, a) => { g.globalAlpha = a; g.drawImage(glow(hex), x - r, y - r, r * 2, r * 2); };
  /* polylines with cumulative length so dots can travel at constant speed */
  function makePath(pts) {
    const n = pts.length, x = new Float32Array(n), y = new Float32Array(n), s = new Float32Array(n);
    let L = 0;
    for (let i = 0; i < n; i++) { x[i] = pts[i][0]; y[i] = pts[i][1]; if (i) L += Math.hypot(x[i] - x[i - 1], y[i] - y[i - 1]); s[i] = L; }
    return { x, y, s, n, len: L };
  }
  const PT = { x: 0, y: 0 };
  function at(p, d) {
    d = d < 0 ? 0 : d > p.len ? p.len : d;
    let lo = 0, hi = p.n - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (p.s[m] > d) hi = m; else lo = m; }
    const k = (d - p.s[lo]) / (p.s[hi] - p.s[lo] || 1);
    PT.x = p.x[lo] + (p.x[hi] - p.x[lo]) * k; PT.y = p.y[lo] + (p.y[hi] - p.y[lo]) * k;
    return PT;
  }
  function bez(p0, p1, p2, p3, n) {
    const a = [];
    for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; a.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]); }
    return a;
  }

  /* =====================================================================
   * E · the honest part — bars grow in, the red leak falls into the venue
   * ===================================================================== */
  const ecEl = $('#hr-ec'), leakCv = $('#hr-leak'), binEl = $('#hr-bin');
  const E = { g: null, W: 0, H: 0, on: false, ok: false, rib: [null, null], off: null, fade: 0, t: 0 };
  const RP = Array.from({ length: 10 }, () => ({ x: 0, y: 0, t: 1 })), PU = new Float32Array(40), NP = 18;
  /* splash droplets thrown up where a leak lands in the venue, then falling back (pooled, 24 max) */
  const DR = Array.from({ length: 48 }, () => ({ x: 0, y: 0, vx: 0, vy: 0, l: 0, m: 0.55 })), tierE = () => J.tier || 2;
  let hitN = false, hitT = 0;
  function splash(x, y) {
    const tr = tierE(), want = tr >= 3 ? 9 : tr >= 2 ? 5 : 3;
    for (let q = 0, n = 0; q < DR.length && n < want; q++) if (DR[q].l <= 0) {
      const d = DR[q]; d.x = x; d.y = y; d.m = d.l = 0.55;
      if (tr >= 2) { const a = -Math.PI * (0.12 + 0.76 * Math.random()), v = 60 + Math.random() * 120; d.vx = Math.cos(a) * v; d.vy = Math.sin(a) * v; d.m = d.l = 0.5 + Math.random() * 0.35; } /* crown: a fan of droplets thrown up and out */
      else { d.vx = (Math.random() - 0.5) * 90; d.vy = -(50 + Math.random() * 80); }
      n++;
    }
    if (E.t - hitT > 0.35) { hitT = E.t; hitN = !hitN; binEl.classList.toggle('hr-hit-a', hitN); binEl.classList.toggle('hr-hit-b', !hitN); }
  }
  function layoutE() {
    const f = fitC(leakCv); E.g = f.g; E.W = f.W; E.H = f.H;
    const a = offs($('.hr-col-a .hr-barbox', ecEl), ecEl), b = offs($('.hr-col-b .hr-barbox', ecEl), ecEl), bn = offs(binEl, ecEl);
    const ax = a.x + a.w - 2, ay = a.y + a.h * 0.4, bx = b.x + 2, by = b.y + b.h * 0.17, by2 = bn.y + 3, t1 = bn.x + bn.w * 0.3, t2 = bn.x + bn.w * 0.7;
    E.rib[0] = makePath(bez([ax, ay], [ax + (t1 - ax) * 0.75, ay], [t1, by2 - 70], [t1, by2], 48));
    E.rib[1] = makePath(bez([bx, by], [bx - (bx - t2) * 0.75, by], [t2, by2 - 70], [t2, by2], 48));
    const dpr = J.DPR, off = E.off || (E.off = document.createElement('canvas')); off.width = Math.round(f.W * dpr); off.height = Math.round(f.H * dpr);
    const g = off.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.lineCap = 'round'; g.lineJoin = 'round';
    for (const p of E.rib) {
      for (const [w, al] of [[18, 0.09], [9, 0.17], [3, 0.4]]) { g.lineWidth = w; g.strokeStyle = 'rgba(255,77,94,' + al + ')'; g.beginPath(); for (let i = 0; i < p.n; i++) { if (i) g.lineTo(p.x[i], p.y[i]); else g.moveTo(p.x[i], p.y[i]); } g.stroke(); }
    }
    E.ok = true; if (reduce) stepE(0);
  }
  J.watch(ecEl, layoutE);
  function stepE(dt) {
    const g = E.g; if (!g || !E.ok) return;
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, E.W, E.H);
    if (!E.on) return;
    E.t += dt; E.fade = Math.min(1, E.fade + dt * 0.9);
    g.globalAlpha = E.fade; g.drawImage(E.off, 0, 0, E.W, E.H);
    g.globalCompositeOperation = 'lighter';
    for (let r = 0; r < 2; r++) {
      const p = E.rib[r];
      for (let k = 0; k < NP; k++) {
        const j = r * NP + k, u = (E.t * 0.3 + k / NP + r * 0.31) % 1;
        if (u < PU[j]) { for (let q = 0; q < RP.length; q++) if (RP[q].t >= 1) { at(p, p.len); RP[q].x = PT.x; RP[q].y = PT.y; RP[q].t = 0; splash(PT.x, PT.y); break; } }
        PU[j] = u;
        at(p, Math.pow(u, 1.35) * p.len); const s = Math.sin(Math.min(1, u * 1.15) * Math.PI);
        blit(g, C.red, PT.x, PT.y, 6.5 + 5 * s, E.fade * (0.4 + 0.6 * s)); blit(g, '#ffffff', PT.x, PT.y, 2.3, E.fade * s);
        if (tierE() >= 3 && u > 0.12 && u < 0.7 && Math.random() < dt * 0.35) { /* a droplet breaks off the ribbon and falls on its own */
          for (let q = 0; q < DR.length; q++) if (DR[q].l <= 0) { const d = DR[q]; d.x = PT.x; d.y = PT.y; d.vx = (Math.random() - 0.5) * 24; d.vy = 10 + Math.random() * 20; d.m = d.l = 0.9; break; }
        }
      }
    }
    g.lineWidth = 1.2;
    for (let k = 0; k < RP.length; k++) {
      const r = RP[k]; if (r.t >= 1) continue;
      r.t += dt / 0.65; const u = Math.min(1, r.t);
      g.globalAlpha = (1 - u) * 0.85; g.strokeStyle = '#ff7f8b'; g.beginPath(); g.ellipse(r.x, r.y, 3 + 12 * u, 1.2 + 3.4 * u, 0, 0, TAU); g.stroke();
    }
    for (let k = 0; k < DR.length; k++) {
      const d = DR[k]; if (d.l <= 0) continue;
      d.l -= dt; if (d.l <= 0) continue;
      d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 300 * dt;
      blit(g, C.red, d.x, d.y, 4.5, Math.min(1, d.l / 0.3)); blit(g, '#ffffff', d.x, d.y, 1.6, d.l / d.m);
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  J.task(ecEl, (t, dt) => stepE(dt));
  J.onView(ecEl, () => {
    ecEl.classList.add('hr-go');
    const start = () => { E.on = true; if (reduce) { E.fade = 1; E.t = 1.4; stepE(0.016); } };
    if (reduce) start(); else setTimeout(start, 1500);
  }, { threshold: 0.3 });
  if (reduce) { ecEl.classList.add('hr-go'); }
});
