/* hour / build-trio — three mascot agents (Hermes pixel robot, Dots blue orb, Jev pink orb) joined by dotted arcs with travelling packets,
 * a live "last answer" chip on Jev, a looping 4-year candle replay (entries, exits, dashed stops) and the three hard-rule chips (loss cap, max position, kill switch).
 *
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod  J.$ J.$$ J.C J.S J.TAU J.clamp J.fmt J.rgba J.rng J.usd  J.fit J.watch J.task J.onView J.countTo  J.DPR J.reduce J.narrow J.tier J.time
 *            J.RULES (lossCap, maxPos)  J.setKilled  J.bus  'decision' (d.action d.symbol d.conf d.dest) · 'kill'(bool) · 'tier'.
 * Data: every JEV decision sends a comet along the Dots -> Jev arc and updates the "last answer" chip; the kill chip mirrors / toggles the global kill switch.
 * The candle tape is a seeded simulation (replace genCandle() with real OHLC to show real history). Everything is simulated.
 */
JEV.mod('hour-build-trio', () => {
  const J = JEV, $ = J.$, $$ = J.$$, C = J.C, S = J.S, TAU = J.TAU, clamp = J.clamp, fmt = J.fmt, rgba = J.rgba;
  const root = $('#hr-a');
  if (!root) return;
  const reduce = J.reduce;
  const MONO = (getComputedStyle(document.documentElement).getPropertyValue('--mono') || 'monospace').trim();
  const setT = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  const pad2 = (n) => (n < 10 ? '0' : '') + n;
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
  function roundPoly(V, R, n) {
    const out = [V[0].slice()];
    for (let i = 1; i < V.length - 1; i++) {
      const a = V[i - 1], b = V[i], c = V[i + 1], l1 = Math.hypot(b[0] - a[0], b[1] - a[1]), l2 = Math.hypot(c[0] - b[0], c[1] - b[1]), r = Math.min(R, l1 / 2, l2 / 2);
      const p1 = [b[0] + (a[0] - b[0]) / l1 * r, b[1] + (a[1] - b[1]) / l1 * r], p2 = [b[0] + (c[0] - b[0]) / l2 * r, b[1] + (c[1] - b[1]) / l2 * r];
      out.push(p1);
      for (let k = 1; k < n; k++) { const t = k / n, u = 1 - t; out.push([u * u * p1[0] + 2 * u * t * b[0] + t * t * p2[0], u * u * p1[1] + 2 * u * t * b[1] + t * t * p2[1]]); }
      out.push(p2);
    }
    out.push(V[V.length - 1].slice());
    return out;
  }
  let killed = !!S.killed;

  /* =====================================================================
   * A · the build
   * ===================================================================== */
  const stage = $('#hr-stage'), arcCv = $('#hr-arc'), trio = $('.hr-trio', stage);
  const avEls = [$('#hr-av0'), $('#hr-av1'), $('#hr-av2')];
  const lbl1 = $('#hr-l1'), lbl2 = $('#hr-l2');
  const jevOrb = $('#hr-jev-orb'), jevAv = avEls[2], lastEl = $('#hr-last'), lastT = $('#hr-last-t');
  const A = { g: null, W: 0, H: 0, off: null, arcs: [null, null], loop: null, nodes: [], pk: [], nextH: 1.2, ready: false, av: [], q: [], t: 0, lt: 0, intro: false };
  const tier = () => J.tier || 2;
  const shds = $$('.hr-shd', stage), hopN = [false, false, false], hopLast = [-9, -9, -9];
  /* pooled spark particles for the conduits + mascots (40 max, additive glow sprites) */
  const AS = Array.from({ length: 40 }, () => ({ x: 0, y: 0, vx: 0, vy: 0, l: 0, m: 1, c: C.pink, s: 4 }));
  function emitA(x, y, vx, vy, l, hex, s) { for (let i = 0; i < AS.length; i++) { const p = AS[i]; if (p.l <= 0) { p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.l = p.m = l; p.c = hex; p.s = s; return; } } }
  /** squash-and-stretch hop (class swap restarts the identical keyframes, no forced layout) + a dust puff on landing */
  function hop(i, delay) {
    if (reduce || tier() < 2) return;
    if (delay) { if (A.q.length < 8) A.q.push({ at: A.t + delay, i }); return; }
    if (A.t - hopLast[i] < 1.1) return; hopLast[i] = A.t; hopN[i] = !hopN[i];
    for (const el of [avEls[i], shds[i]]) { if (!el) continue; el.classList.toggle('hr-hop-a', hopN[i]); el.classList.toggle('hr-hop-b', !hopN[i]); }
    if (A.q.length < 8) A.q.push({ at: A.t + 0.5, i, land: true });
  }

  function layoutA() {
    const f = fitC(arcCv); A.g = f.g; A.W = f.W; A.H = f.H;
    const av = avEls.map((e) => { const o = offs(e, stage); return { x: o.x + o.w / 2, y: o.y + o.h / 2, r: o.w / 2 }; });
    const tr = offs(trio, stage);
    for (let k = 0; k < 2; k++) {
      const a = av[k], b = av[k + 1];
      const p0 = [a.x + a.r * 0.66, a.y - a.r * 0.76], p3 = [b.x - b.r * 0.66, b.y - b.r * 0.76];
      const gap = p3[0] - p0[0], bow = clamp(gap * 0.16, 22, 54), c1 = [p0[0] + gap * 0.3, p0[1] - bow * 1.35], c2 = [p3[0] - gap * 0.3, p3[1] - bow * 1.35];
      A.arcs[k] = makePath(bez(p0, c1, c2, p3, 72));
      const ym = (p0[1] + 3 * c1[1] + 3 * c2[1] + p3[1]) / 8, lb = k ? lbl2 : lbl1;
      lb.style.left = ((p0[0] + p3[0]) / 2).toFixed(1) + 'px'; lb.style.top = (ym - 8).toFixed(1) + 'px';
    }
    const x0 = tr.x + 4, x1 = tr.x + tr.w - 4, yb = A.H - 14, j = av[2], h = av[0];
    A.loop = makePath(roundPoly([[j.x + j.r, j.y], [x1, j.y], [x1, yb], [x0, yb], [x0, h.y], [h.x - h.r, h.y]], 22, 7));
    A.av = av; A.nodes = [[x1, (j.y + yb) / 2], [x0, (h.y + yb) / 2]];
    A.arrow = [h.x - h.r, h.y];
    A.ready = true;
    buildStaticA();
    if (reduce) drawA(J.time);
  }
  function buildStaticA() {
    if (!A.ready) return;
    const dpr = J.DPR, off = A.off || (A.off = document.createElement('canvas'));
    off.width = Math.round(A.W * dpr); off.height = Math.round(A.H * dpr);
    const g = off.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cols = killed ? [C.red, C.red] : [C.amber, C.blue], pc = killed ? C.red : C.pink;
    for (let a = 0; a < 2; a++) {
      const p = A.arcs[a];
      for (let d = 4; d < p.len - 3; d += 7.5) {
        at(p, d); const u = d / p.len;
        g.fillStyle = rgba(cols[a], 0.16 + 0.5 * Math.sin(u * Math.PI)); g.beginPath(); g.arc(PT.x, PT.y, 1.35, 0, TAU); g.fill();
      }
    }
    if (tier() >= 2) { /* energy conduits: a soft tube + hot core under each dotted arc */
      g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
      for (let a = 0; a < 2; a++) {
        const p = A.arcs[a];
        for (const [w, al] of tier() >= 3 ? [[14, 0.035], [6, 0.07], [1.1, 0.3]] : [[6, 0.07], [1.1, 0.26]]) {
          g.lineWidth = w; g.strokeStyle = rgba(cols[a], al); g.beginPath();
          for (let i = 0; i < p.n; i++) { if (i) g.lineTo(p.x[i], p.y[i]); else g.moveTo(p.x[i], p.y[i]); }
          g.stroke();
        }
      }
      g.globalCompositeOperation = 'source-over';
    }
    const L = A.loop;
    g.save(); g.setLineDash([5, 7]); g.lineWidth = 1.2; g.strokeStyle = rgba(pc, 0.45); g.beginPath();
    for (let i = 0; i < L.n; i++) { if (i) g.lineTo(L.x[i], L.y[i]); else g.moveTo(L.x[i], L.y[i]); }
    g.stroke(); g.restore();
    g.globalCompositeOperation = 'lighter';
    for (const n of A.nodes) { blit(g, pc, n[0], n[1], 9, 0.8); g.globalAlpha = 1; g.fillStyle = '#fff'; g.beginPath(); g.arc(n[0], n[1], 2.2, 0, TAU); g.fill(); }
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.fillStyle = rgba(pc, 0.9); g.beginPath(); g.moveTo(A.arrow[0] - 1, A.arrow[1]); g.lineTo(A.arrow[0] - 10, A.arrow[1] - 4.5); g.lineTo(A.arrow[0] - 10, A.arrow[1] + 4.5); g.closePath(); g.fill();
  }
  J.watch(stage, layoutA);

  function spawnPacket(arc, hex, dur, done) { if (A.pk.length < 6) A.pk.push({ arc, hex, dur, t0: J.time, done, sh: 0 }); }
  function drawA(t) {
    const g = A.g; if (!g || !A.ready) return;
    const W = A.W, H = A.H, sp = killed ? 0.3 : 1, tr = tier(), dt = clamp(t - A.lt, 0, 0.1); A.lt = A.t = t;
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.clearRect(0, 0, W, H); g.drawImage(A.off, 0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    for (let a = 0; a < 2; a++) {
      const p = A.arcs[a], hx = killed ? C.red : a ? C.blue : C.amber;
      for (let k = 0; k < 6; k++) {
        const u = (t * 0.1 * sp + k / 6 + a * 0.41) % 1, s = Math.sin(u * Math.PI);
        at(p, u * p.len); blit(g, hx, PT.x, PT.y, 8 + 5 * s, 0.3 + 0.7 * s); blit(g, '#ffffff', PT.x, PT.y, 2.6, s * 0.9);
        if (tr >= 2) for (let j = 1; j <= (tr >= 3 ? 3 : 2); j++) { const uu = u - j * 0.013; if (uu < 0) break; at(p, uu * p.len); blit(g, hx, PT.x, PT.y, (8 + 5 * s) * (1 - j * 0.2), (0.34 - j * 0.09) * (0.3 + 0.7 * s)); }
      }
    }
    const L = A.loop, ph = t * 64 * sp, pc = killed ? C.red : C.pink;
    for (let k = 0; k < 5; k++) { at(L, (ph + k * L.len / 5) % L.len); blit(g, pc, PT.x, PT.y, 8.5, 0.85); blit(g, '#ffffff', PT.x, PT.y, 2.4, 0.9); }
    for (let i = A.pk.length - 1; i >= 0; i--) {
      const q = A.pk[i], u = (t - q.t0) / q.dur;
      if (u < 0) continue;
      const p = A.arcs[q.arc];
      if (u >= 1) {
        if (tr >= 2) { at(p, p.len); for (let k = 0; k < (tr >= 3 ? 9 : 4); k++) { const a = Math.random() * TAU, v = 40 + Math.random() * 90; emitA(PT.x, PT.y, Math.cos(a) * v, Math.sin(a) * v - 20, 0.5 + Math.random() * 0.3, q.hex, 3 + Math.random() * 3); } }
        A.pk.splice(i, 1); if (q.done) q.done(); continue;
      }
      const e = u * u * (3 - 2 * u), tl = tr >= 3 ? 9 : 4, st = tr >= 3 ? 0.02 : 0.03;
      for (let k = 0; k < tl; k++) { at(p, clamp(e - k * st, 0, 1) * p.len); blit(g, q.hex, PT.x, PT.y, (15 - k * (tr >= 3 ? 1.4 : 2.8)) * (tr >= 3 ? 1.1 : 1), (1 - k / tl * 0.96) * 0.92); }
      at(p, e * p.len); blit(g, '#ffffff', PT.x, PT.y, 4.4, 1);
      if (tr >= 2) { /* bloom around the comet head + sparks shed along the way */
        blit(g, q.hex, PT.x, PT.y, tr >= 3 ? 38 : 26, 0.3);
        if (tr >= 3 && (q.sh += dt) > 0.035) { q.sh = 0; emitA(PT.x, PT.y, (Math.random() - 0.5) * 50, (Math.random() - 0.7) * 50, 0.45, q.hex, 3); }
      }
    }
    if (tr >= 2) {
      /* queued hops (stage intro stagger) + landing dust */
      for (let i = A.q.length - 1; i >= 0; i--) {
        const q = A.q[i]; if (t < q.at) continue; A.q.splice(i, 1);
        if (!q.land) { hop(q.i); continue; }
        const av = A.av[q.i]; if (!av) continue;
        for (let k = 0; k < 6; k++) { const d = k < 3 ? -1 : 1; emitA(av.x + d * av.r * 0.5, av.y + av.r * 0.92, d * (30 + Math.random() * 60), -(8 + Math.random() * 28), 0.5, q.i === 2 ? pc : q.i ? C.blue : C.orange, 3 + Math.random() * 2); }
      }
      /* orbiting sparks: a tilted ellipse around each head (two crossing rings at tier 3) */
      const n = tr >= 3 ? 4 : 2, hx = [C.orange, C.blue, pc];
      for (let i = 0; i < 3; i++) {
        const av = A.av[i]; if (!av) continue;
        for (let k = 0; k < n; k++) {
          const a = t * (1.1 + i * 0.22) * sp * (k & 1 ? -1 : 1) + k * TAU / n + i, tilt = k & 1 ? 0.5 : -0.35, R = av.r * (1.1 + 0.06 * (k & 1));
          const ex = Math.cos(a) * R, ey = Math.sin(a) * R * 0.34, ct = Math.cos(tilt), st2 = Math.sin(tilt), z = 0.65 + 0.35 * Math.sin(a);
          const x = av.x + ex * ct - ey * st2, y = av.y + ex * st2 + ey * ct;
          blit(g, hx[i], x, y, 5.5 * z + 1.5, 0.55 + 0.45 * z); blit(g, '#ffffff', x, y, 1.9 * z, 0.9 * z);
          if (tr >= 3) { const a2 = a - (k & 1 ? -0.22 : 0.22), ex2 = Math.cos(a2) * R, ey2 = Math.sin(a2) * R * 0.34; blit(g, hx[i], av.x + ex2 * ct - ey2 * st2, av.y + ex2 * st2 + ey2 * ct, 3.4 * z, 0.35 * z); }
        }
      }
      for (let i = 0; i < AS.length; i++) {
        const p = AS[i]; if (p.l <= 0) continue;
        p.l -= dt; if (p.l <= 0) continue;
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 180 * dt; const k = p.l / p.m;
        blit(g, p.c, p.x, p.y, p.s * (0.6 + k), k); blit(g, '#ffffff', p.x, p.y, 1.4, k);
      }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    if (t > A.nextH) { A.nextH = t + 3.4; hop(0); spawnPacket(0, killed ? C.red : C.amber, 1.5, () => hop(1)); }
  }
  J.task(stage, (t) => drawA(t));
  J.onView(stage, () => { if (reduce) return; A.q.push({ at: A.t + 0.15, i: 0 }, { at: A.t + 0.4, i: 1 }, { at: A.t + 0.65, i: 2 }); }, { threshold: 0.5 });

  /* live decisions: a packet rides dots -> jev, jev's head flashes and shows the typed answer */
  const DEST_HEX = { execute: C.green, review: C.amber, skip: '#b8b2c2' };
  let flip = false;
  function landDecision(d) {
    hop(2);
    const narrow = J.narrow();
    setT(lastT, narrow ? d.action + ' > ' + d.dest : d.action + ' ' + d.symbol.split('-')[0] + ' ' + d.conf.toFixed(2) + ' > ' + d.dest);
    lastEl.dataset.d = d.dest;
    /* restart the pulse by swapping between two classes that name identical keyframes (a new animation-name restarts it)
       — no `void el.offsetWidth` forced layout per decision */
    flip = !flip;
    lastEl.classList.toggle('hr-fl-a', flip); lastEl.classList.toggle('hr-fl-b', !flip);
    jevAv.classList.toggle('hr-flash-a', flip); jevAv.classList.toggle('hr-flash-b', !flip);
  }
  J.bus.on('decision', (d) => { if (reduce) { landDecision(d); return; } if (A.ready && A.g) spawnPacket(1, killed ? C.red : DEST_HEX[d.dest] || C.pink, 0.95, () => landDecision(d)); });

  /* ---------- candle replay tape (seeded, endless) ---------- */
  const tapeCv = $('#hr-tape');
  const T = { g: null, W: 0, H: 0, pitch: 10, bw: 6, playX: 0, pos: 0, hi: 106, lo: 94, bg: null, ok: false };
  const GREEN = C.green, RED = C.red; // declared before layoutT can run (reduced motion draws one frame from inside J.watch)
  const RN = 512, tO = new Float32Array(RN), tH = new Float32Array(RN), tL = new Float32Array(RN), tC = new Float32Array(RN);
  const tr = J.rng(4100), trades = [];
  const tg = () => { let u = 0, v = 0; while (!u) u = tr(); while (!v) v = tr(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };
  let gi = -1, tp = 100, tmu = 0.1, tleft = 0, tvol = 1, tOpen = null, tEnd = -9;
  function genCandle() {
    const i = ++gi, k = i & (RN - 1);
    if (--tleft <= 0) { tleft = 16 + ((tr() * 26) | 0); tmu = (tr() - 0.4) * 0.8; tvol = 1.15 + tr() * 1.25; }
    const o = tp, c = o + tmu + tg() * tvol, hi = Math.max(o, c) + Math.abs(tg()) * tvol * 0.55, lo = Math.min(o, c) - Math.abs(tg()) * tvol * 0.55;
    tp = c; tO[k] = o; tH[k] = hi; tL[k] = lo; tC[k] = c;
    if (tOpen) {
      const q = tOpen;
      if (lo <= q.stop) { q.i1 = i; q.exit = q.stop; q.win = false; q.why = 'stop'; }
      else if (hi >= q.tp) { q.i1 = i; q.exit = q.tp; q.win = true; q.why = 'tp'; }
      else if (i - q.i0 >= 13) { q.i1 = i; q.exit = c; q.win = c > q.entry; q.why = 'exit'; }
      if (q.i1 >= 0) { tOpen = null; tEnd = i; }
    } else if (i - tEnd > 4 && c > o && tr() < 0.4) {
      const rg = tvol * 1.15;
      tOpen = { i0: i, i1: -1, entry: c, stop: c - rg * 1.55, tp: c + rg * 2.5, exit: 0, win: false, why: '' };
      trades.push(tOpen);
    }
  }
  const ensure = (n) => { while (gi < n) genCandle(); };
  ensure(150); T.pos = 120;

  function layoutT() {
    const f = fitC(tapeCv); T.g = f.g; T.W = f.W; T.H = f.H;
    const narrow = f.W < 420;
    T.pitch = narrow ? 8 : 11; T.bw = narrow ? 4.5 : 7; T.playX = Math.round(f.W * (narrow ? 0.7 : 0.64)); T.pt = 18; T.pb = 22;
    const dpr = J.DPR, bg = T.bg || (T.bg = document.createElement('canvas'));
    bg.width = Math.round(f.W * dpr); bg.height = Math.round(f.H * dpr);
    const g = bg.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.strokeStyle = 'rgba(255,255,255,.055)'; g.lineWidth = 1; g.beginPath();
    for (let i = 1; i < 4; i++) { const y = Math.round(T.pt + (f.H - T.pt - T.pb) * i / 4) + 0.5; g.moveTo(0, y); g.lineTo(f.W, y); }
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,.05)';
    for (let x = T.playX + 12; x < f.W; x += 11) g.fillRect(x, T.pt, 1, f.H - T.pt - T.pb);
    g.fillStyle = 'rgba(180,170,200,.62)'; g.font = '600 9px ' + MONO; g.textAlign = 'right'; g.fillText('replaying >>', f.W - 8, 12);
    g.textAlign = 'left'; g.fillText('year 1', 8, 12);
    const lab = (txt, col) => { const c = document.createElement('canvas'); c.width = Math.round(34 * dpr); c.height = Math.round(14 * dpr); const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.font = '700 9px ' + MONO; x.textAlign = 'center'; x.fillStyle = col; x.fillText(txt, 17, 10); return c; };
    T.sBuy = lab('buy', '#7ff5cb'); T.sStop = lab('stop', 'rgba(255,128,140,.95)');
    const fg = g.createLinearGradient(0, 0, T.playX * 0.5, 0); fg.addColorStop(0, 'rgba(0,0,0,.82)'); fg.addColorStop(1, 'rgba(0,0,0,0)'); T.fade = fg;
    T.ok = true; if (reduce) drawT(J.time, 0);
  }
  J.watch(tapeCv, layoutT);

  function drawT(t, dt) {
    const g = T.g; if (!g || !T.ok) return;
    const W = T.W, H = T.H, pitch = T.pitch, px = T.playX;
    if (!reduce) T.pos += dt * (killed ? 0.4 : 1.1);
    const cur = Math.floor(T.pos); ensure(cur + 1);
    const first = cur - Math.ceil(px / pitch) - 2;
    let hi = -1e9, lo = 1e9;
    for (let i = Math.max(0, first); i <= cur; i++) { const k = i & (RN - 1); if (tH[k] > hi) hi = tH[k]; if (tL[k] < lo) lo = tL[k]; }
    for (let i = 0; i < trades.length; i++) { const q = trades[i]; if (q.i0 > cur || (q.i1 >= 0 && q.i1 < first)) continue; if (q.stop < lo) lo = q.stop; }
    const k1 = T.init ? 1 - Math.exp(-dt * 3.2) : 1; T.init = true;
    T.hi += (hi + (hi - lo) * 0.06 - T.hi) * k1; T.lo += (lo - (hi - lo) * 0.1 - T.lo) * k1;
    const top = T.pt, hh = H - T.pt - T.pb, sc = hh / (T.hi - T.lo || 1);
    const Y = (v) => top + (T.hi - v) * sc;
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.clearRect(0, 0, W, H);
    while (trades.length && trades[0].i1 >= 0 && trades[0].i1 < first - 8 && trades[0].i1 <= cur) trades.shift();
    // stop lines (only what the replay has already reached)
    g.lineWidth = 1.2; g.setLineDash([4, 4]); g.strokeStyle = 'rgba(255,77,94,.85)'; g.beginPath();
    for (let i = 0; i < trades.length; i++) {
      const q = trades[i]; if (q.i0 > cur) continue;
      const done = q.i1 >= 0 && q.i1 <= cur, x1 = done ? px - (T.pos - q.i1) * pitch : px;
      if (x1 < -30) continue;
      const ys = Y(q.stop); g.moveTo(px - (T.pos - q.i0) * pitch, ys); g.lineTo(x1 + 4, ys);
    }
    g.stroke(); g.setLineDash([]);
    // candles, batched by colour
    const bw = T.bw, hw = bw / 2;
    for (let pass = 0; pass < 2; pass++) {
      g.fillStyle = pass ? RED : GREEN; g.beginPath();
      for (let i = first; i <= cur; i++) {
        if (i < 0) continue;
        const k = i & (RN - 1), x = px - (T.pos - i) * pitch;
        if (x < -pitch || (tC[k] >= tO[k]) === (pass === 1)) continue;
        const yo = Y(tO[k]), yc = Y(tC[k]), yh = Y(tH[k]);
        g.rect(x - 0.5, yh, 1, Y(tL[k]) - yh); g.rect(x - hw, Math.min(yo, yc), bw, Math.max(1.6, Math.abs(yc - yo)));
      }
      g.fill();
    }
    // fade the old tape on the left, then slide the grid in behind everything
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = T.fade; g.fillRect(0, 0, px * 0.5, H);
    g.globalCompositeOperation = 'destination-over'; g.drawImage(T.bg, 0, 0, W, H);
    g.globalCompositeOperation = 'source-over';
    for (let i = 0; i < trades.length; i++) {
      const q = trades[i]; if (q.i0 > cur) continue;
      const x0 = px - (T.pos - q.i0) * pitch, done = q.i1 >= 0 && q.i1 <= cur, x1 = done ? px - (T.pos - q.i1) * pitch : px;
      if (x0 > -12) {
        const yl = Y(tL[q.i0 & (RN - 1)]) + 8;
        g.fillStyle = GREEN; g.beginPath(); g.moveTo(x0, yl - 5); g.lineTo(x0 - 4.5, yl + 3); g.lineTo(x0 + 4.5, yl + 3); g.closePath(); g.fill();
        g.drawImage(T.sBuy, x0 - 17, yl + 4, 34, 14);
      }
      if (!done || x1 > px - 44) g.drawImage(T.sStop, Math.min(x1 + 7, px - 26) - 3, Y(q.stop) - 14, 34, 14);
      if (done && x1 > -12) { const yh = Y(tH[q.i1 & (RN - 1)]) - 8; g.fillStyle = q.win ? GREEN : RED; g.beginPath(); g.moveTo(x1, yh + 5); g.lineTo(x1 - 4.5, yh - 3); g.lineTo(x1 + 4.5, yh - 3); g.closePath(); g.fill(); }
    }
    // playhead
    g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(px, top - 8, 1, hh + 14);
    g.globalCompositeOperation = 'lighter';
    const hy = Y(tC[cur & (RN - 1)]);
    blit(g, '#8fb4ff', px, hy, 14, 0.7); blit(g, '#ffffff', px, hy, 3.5, 0.9);
    g.drawImage(glow('#8fb4ff'), px - 9, top - 8, 18, hh + 14);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  J.task(tapeCv, drawT);

  /* ---------- chips (hard rules) ---------- */
  setT($('#hr-r-loss'), J.usd(J.RULES.lossCap)); setT($('#hr-r-pos'), J.RULES.maxPos + '%');
  const killBtn = $('#hr-kill'), killTxt = $('#hr-kill-t');
  function showKill(v) {
    killed = !!v;
    killBtn.setAttribute('aria-pressed', String(killed));
    killTxt.lastChild.nodeValue = killed ? 'halted' : 'armed';
    if (jevOrb) { jevOrb.classList.toggle('red', killed); jevOrb.classList.toggle('pink', !killed); }
    buildStaticA();
  }
  killBtn.addEventListener('click', () => J.setKilled(!S.killed));

  /* ---------- count-ups (stats) ---------- */
  const statFmt = {
    'hr-s-time': (v) => { const s = Math.round(v); return pad2((s / 60) | 0) + ':' + pad2(s % 60); },
    'hr-s-trades': (v) => fmt(Math.round(v)), 'hr-s-year': (v) => Math.round(v) + '%', 'hr-s-cost': (v) => '$' + v.toFixed(2),
  };
  /** count-up that settles with a one-off glow (bounded timers, started from onView only) */
  const countUp = (b, dur, delay, f) => setTimeout(() => {
    J.countTo(b, +b.dataset.to, { dur, fmt: f });
    if (!reduce) setTimeout(() => b.classList.add('hr-done'), dur + 60);
  }, delay);
  J.onView($('#hr-a-stats'), () => {
    $$('b', $('#hr-a-stats')).forEach((b, i) => countUp(b, 1500, i * 120, statFmt[b.id]));
  }, { threshold: 0.5 });

  /* ---------- bus: kill switch ---------- */
  J.bus.on('kill', (v) => showKill(v));
  J.bus.on('tier', () => buildStaticA());
  showKill(S.killed);
});
