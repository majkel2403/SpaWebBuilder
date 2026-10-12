/* hour / energy-arc — two orbs joined by a dotted arc; additive canvas beads, comet packets per decision, spark bursts, kill switch turns it red.
 *
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod  J.$ J.C J.TAU J.clamp J.rgba J.fit J.watch J.task J.tier J.time J.DPR J.reduce  J.bus 'decision'(d.dest) · 'kill'(bool).
 * Everything is simulated.
 */
JEV.mod('hour-energy-arc', () => {
  const J = JEV, $ = J.$, $$ = J.$$, C = J.C, S = J.S, TAU = J.TAU, clamp = J.clamp, fmt = J.fmt, rgba = J.rgba;
  const reduce = J.reduce;
  const MONO = (getComputedStyle(document.documentElement).getPropertyValue('--mono') || 'monospace').trim();
  const setT = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  const pad2 = (n) => (n < 10 ? '0' : '') + n;
  /** J.fit, corrected for ancestors that are mid-transform */
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
  /** layout-space box of el inside the positioned ancestor `top` (transform-proof) */
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
  const tier = () => J.tier || 2;
  let killed = !!S.killed;
  const stage = $('#hr-ea'), cv = $('#hr-ea-cv'); if (!stage || !cv) return;
  const trio = $('.hr-trio', stage), lbl = $('#hr-ea-l'), orb = $('#hr-ea-orb');
  const avs = [$('#hr-ea0'), $('#hr-ea1')], shds = $$('.hr-shd', stage);
  const A = { g: null, W: 0, H: 0, off: null, arc: null, av: [], pk: [], ready: false, lt: 0 };
  const DEST_HEX = { execute: C.green, review: C.amber, skip: '#b8b2c2' };
  /* pooled sparks shed by packets on arrival */
  const AS = Array.from({ length: 36 }, () => ({ x: 0, y: 0, vx: 0, vy: 0, l: 0, m: 1, c: C.pink, s: 4 }));
  function emit(x, y, vx, vy, l, hex, s) { for (let i = 0; i < AS.length; i++) { const p = AS[i]; if (p.l <= 0) { p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.l = p.m = l; p.c = hex; p.s = s; return; } } }
  const arcHex = () => (killed ? C.red : C.blue);
  function layout() {
    const f = fitC(cv); A.g = f.g; A.W = f.W; A.H = f.H;
    A.av = avs.map((e) => { const o = offs(e, stage); return { x: o.x + o.w / 2, y: o.y + o.h / 2, r: o.w / 2 }; });
    const a = A.av[0], b = A.av[1];
    const p0 = [a.x + a.r * 0.66, a.y - a.r * 0.76], p3 = [b.x - b.r * 0.66, b.y - b.r * 0.76];
    const gap = p3[0] - p0[0], bow = clamp(gap * 0.16, 22, 54), c1 = [p0[0] + gap * 0.3, p0[1] - bow * 1.35], c2 = [p3[0] - gap * 0.3, p3[1] - bow * 1.35];
    A.arc = makePath(bez(p0, c1, c2, p3, 72));
    lbl.style.left = ((p0[0] + p3[0]) / 2).toFixed(1) + 'px'; lbl.style.top = ((p0[1] + 3 * c1[1] + 3 * c2[1] + p3[1]) / 8 - 8).toFixed(1) + 'px';
    A.ready = true; buildStatic();
    if (reduce) draw(J.time || 0);
  }
  /** static layer: dotted arc + soft conduit tube (re-built when the kill switch changes the colour) */
  function buildStatic() {
    if (!A.ready) return;
    const dpr = J.DPR, off = A.off || (A.off = document.createElement('canvas'));
    off.width = Math.round(A.W * dpr); off.height = Math.round(A.H * dpr);
    const g = off.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const p = A.arc, col = arcHex();
    for (let d = 4; d < p.len - 3; d += 7.5) { at(p, d); const u = d / p.len; g.fillStyle = rgba(col, 0.16 + 0.5 * Math.sin(u * Math.PI)); g.beginPath(); g.arc(PT.x, PT.y, 1.35, 0, TAU); g.fill(); }
    if (tier() >= 2) {
      g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
      for (const [w, al] of tier() >= 3 ? [[14, 0.035], [6, 0.07], [1.1, 0.3]] : [[6, 0.07], [1.1, 0.26]]) {
        g.lineWidth = w; g.strokeStyle = rgba(col, al); g.beginPath();
        for (let i = 0; i < p.n; i++) { if (i) g.lineTo(p.x[i], p.y[i]); else g.moveTo(p.x[i], p.y[i]); }
        g.stroke();
      }
    }
  }
  J.watch(stage, layout);
  let flip = false;
  function land(d) {
    const el = avs[1]; flip = !flip;
    el.classList.toggle('hr-flash-a', flip); el.classList.toggle('hr-flash-b', !flip);
  }
  function spawn(hex, dur, done) { if (A.pk.length < 6) A.pk.push({ hex, dur, t0: J.time || 0, done, sh: 0 }); }
  function draw(t) {
    const g = A.g; if (!g || !A.ready) return;
    const W = A.W, H = A.H, sp = killed ? 0.3 : 1, tr = tier(), dt = clamp(t - A.lt, 0, 0.1); A.lt = t;
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.clearRect(0, 0, W, H); g.drawImage(A.off, 0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    const p = A.arc, hx = arcHex();
    for (let k = 0; k < 6; k++) { /* ambient beads drifting along the arc */
      const u = (t * 0.1 * sp + k / 6) % 1, s = Math.sin(u * Math.PI);
      at(p, u * p.len); blit(g, hx, PT.x, PT.y, 8 + 5 * s, 0.3 + 0.7 * s); blit(g, '#ffffff', PT.x, PT.y, 2.6, s * 0.9);
      if (tr >= 2) for (let j = 1; j <= (tr >= 3 ? 3 : 2); j++) { const uu = u - j * 0.013; if (uu < 0) break; at(p, uu * p.len); blit(g, hx, PT.x, PT.y, (8 + 5 * s) * (1 - j * 0.2), (0.34 - j * 0.09) * (0.3 + 0.7 * s)); }
    }
    for (let i = A.pk.length - 1; i >= 0; i--) { /* decision comets */
      const q = A.pk[i], u = (t - q.t0) / q.dur;
      if (u < 0) continue;
      if (u >= 1) {
        if (tr >= 2) { at(p, p.len); for (let k = 0; k < (tr >= 3 ? 9 : 4); k++) { const a = Math.random() * TAU, v = 40 + Math.random() * 90; emit(PT.x, PT.y, Math.cos(a) * v, Math.sin(a) * v - 20, 0.5 + Math.random() * 0.3, q.hex, 3 + Math.random() * 3); } }
        A.pk.splice(i, 1); if (q.done) q.done(); continue;
      }
      const e = u * u * (3 - 2 * u), tl = tr >= 3 ? 9 : 4, st = tr >= 3 ? 0.02 : 0.03;
      for (let k = 0; k < tl; k++) { at(p, clamp(e - k * st, 0, 1) * p.len); blit(g, q.hex, PT.x, PT.y, (15 - k * (tr >= 3 ? 1.4 : 2.8)) * (tr >= 3 ? 1.1 : 1), (1 - k / tl * 0.96) * 0.92); }
      at(p, e * p.len); blit(g, '#ffffff', PT.x, PT.y, 4.4, 1);
      if (tr >= 2) blit(g, q.hex, PT.x, PT.y, tr >= 3 ? 38 : 26, 0.3);
    }
    if (tr >= 2) { /* orbiting sparks around each orb */
      const hxs = [C.blue, killed ? C.red : C.pink];
      for (let i = 0; i < 2; i++) {
        const av = A.av[i]; if (!av) continue;
        for (let k = 0; k < 2; k++) {
          const a = t * (1.1 + i * 0.22) * sp * (k & 1 ? -1 : 1) + k * Math.PI + i, tilt = k & 1 ? 0.5 : -0.35, R = av.r * (1.1 + 0.06 * (k & 1));
          const ex = Math.cos(a) * R, ey = Math.sin(a) * R * 0.34, ct = Math.cos(tilt), st2 = Math.sin(tilt), z = 0.65 + 0.35 * Math.sin(a);
          const x = av.x + ex * ct - ey * st2, y = av.y + ex * st2 + ey * ct;
          blit(g, hxs[i], x, y, 5.5 * z + 1.5, 0.55 + 0.45 * z); blit(g, '#ffffff', x, y, 1.9 * z, 0.9 * z);
        }
      }
      for (let i = 0; i < AS.length; i++) {
        const s = AS[i]; if (s.l <= 0) continue;
        s.l -= dt; if (s.l <= 0) continue;
        s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 180 * dt; const k = s.l / s.m;
        blit(g, s.c, s.x, s.y, s.s * (0.6 + k), k); blit(g, '#ffffff', s.x, s.y, 1.4, k);
      }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  J.task(stage, (t) => draw(t));
  /* a comet carries every simulated decision from Dots to Jev; the colour is the gate result */
  J.bus.on('decision', (d) => {
    if (reduce) { land(d); return; }
    if (A.ready) spawn(killed ? C.red : DEST_HEX[d.dest] || C.pink, 0.95, () => land(d));
  });
  J.bus.on('kill', (v) => { killed = !!v; if (orb) { orb.classList.toggle('red', killed); orb.classList.toggle('pink', !killed); } buildStatic(); });
  if (killed && orb) { orb.classList.add('red'); orb.classList.remove('pink'); }

});
