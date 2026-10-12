/* hour — "three agents, sixty minutes, one bot" (prefix hr-)
 * A  the build       three heads joined by travelling-dot arcs · live decision packets · candle replay with entries + stops · live kill chip
 * B  the hour        amber 60:00 ring · six spring switches · accelerated loop -> ARMED + particle burst
 * C  the backtest    1,840 seeded trades as thin up/down bars · running total · -22% drawdown block · scrub it
 * D  the arithmetic  270deg log gauge (drag the needle) · capital = 1,200,000 / return
 * E  the honest part x2.9 vs x1.9 · the red leak falls into the venue
 * Everything here is an illustrative simulation: no order is sent and no figure is a result. */
/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: the whole JEV.* runtime (see README) — decision / kill / floor / tier bus events and J.RULES.
 */
JEV.mod('hour-full-section', () => {
  const J = JEV, $ = J.$, $$ = J.$$, C = J.C, S = J.S, TAU = J.TAU, clamp = J.clamp, fmt = J.fmt, rgba = J.rgba;
  const root = $('#hour');
  if (!root) return;
  const reduce = J.reduce;
  const MONO = (getComputedStyle(document.documentElement).getPropertyValue('--mono') || 'monospace').trim();
  const setT = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  const pad2 = (n) => (n < 10 ? '0' : '') + n;
  const NS = 'http://www.w3.org/2000/svg';
  const svg = (tag, at, par) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); if (par) par.appendChild(e); return e; };

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
    buildStaticA(); armText();
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

  /* =====================================================================
   * B · the hour
   * ===================================================================== */
  const panB = $('#hr-b'), sws = $$('.hr-sw', panB), cells = $$('.hr-cells s', panB), armEl = $('#hr-arm');
  const clockEl = $('#hr-clock'), clockL = $('#hr-clock-l'), badgeB = $('#hr-b-badge'), armWt = $('#hr-arm-wt'), armB = $('#hr-arm-b'), armS = $('#hr-arm-s');
  const ticksG = $('#hr-ticks'), rprog = $('#hr-rprog'), rglow = $('#hr-rglow'), rhead = $('#hr-rhead'), burstCv = $('#hr-burst');
  const PHS = [0, 8, 26, 41, 52, 58, 60], PCOL = [C.orange, C.blue, C.amber, C.green, C.cyan, C.pink], RC = TAU * 84;
  const on = [1, 1, 1, 1, 1, 1], barS = sws.map((b) => b.querySelector('u s'));
  const phaseOf = (m) => { let i = 0; while (i < 5 && m >= PHS[i + 1]) i++; return i; };
  const gRows = $$('.hr-g-r', panB), gPh = $('#hr-g-ph'), GR = [[0, 8], [6, 26], [24, 41], [41, 52], [52, 58], [58, 60]], gF = [1, 1, 1, 1, 1, 1];
  let gW = 0;
  const ticks = [];
  for (let m = 0; m < 60; m++) {
    const a = m / 60 * TAU - Math.PI / 2, major = m % 5 === 0, r0 = major ? 92.5 : 95.5, r1 = 102;
    ticks.push(svg('line', { x1: (110 + r0 * Math.cos(a)).toFixed(2), y1: (110 + r0 * Math.sin(a)).toFixed(2), x2: (110 + r1 * Math.cos(a)).toFixed(2), y2: (110 + r1 * Math.sin(a)).toFixed(2), 'stroke-width': major ? 2.2 : 1.4, 'stroke-linecap': 'round', stroke: PCOL[phaseOf(m)] }, ticksG));
  }
  const paintTick = (m, lit) => ticks[m].setAttribute('stroke', lit ? PCOL[phaseOf(m)] : 'rgba(255,255,255,.16)');
  const gAx = $$('.hr-g-axis span', panB);
  let headT = -1, axN = -1;
  /** the freshest lit minute flares white + thick, then relaxes into its phase colour when the next one lights */
  function setHead(h) {
    if (h === headT) return;
    if (headT >= 0) { const o = ticks[headT]; o.setAttribute('stroke-width', headT % 5 === 0 ? 2.2 : 1.4); if (headT < lit) paintTick(headT, true); }
    headT = h;
    if (h >= 0) { const o = ticks[h]; o.setAttribute('stroke', '#fff'); o.setAttribute('stroke-width', h % 5 === 0 ? 3.4 : 2.6); if (mode === 'play') tickSpark(h); }
  }
  let lit = 60, dm = 60, mT = 60, mode = 'static', clk = 0, rest = 0, manT = 0, act = -1, ckT = 0, lastClock = '';
  const LOOP = { PLAY: 12, REST: 4.2, LEAD: 0.5, MAN: 9 };

  function renderB(force, dt) {
    const f = clamp(dm / 60, 0, 1), off = (RC * (1 - f)).toFixed(1);
    rprog.setAttribute('stroke-dashoffset', off); rglow.setAttribute('stroke-dashoffset', off);
    rhead.setAttribute('transform', 'rotate(' + (f * 360).toFixed(2) + ' 110 110)');
    const n = Math.min(60, Math.floor(dm + 0.0001));
    while (lit < n) paintTick(lit++, true);
    while (lit > n) paintTick(--lit, false);
    setHead(n > 0 && n < 60 && mode !== 'static' ? n - 1 : -1);
    const ax = Math.min(4, Math.floor(dm / 15 + 0.0001));
    if (ax !== axN) { axN = ax; for (let i = 0; i < 5; i++) gAx[i].classList.toggle('on', i <= ax && dm > 0.01); }
    for (let i = 0; i < 6; i++) {
      const v = mode === 'manual' ? on[i] : clamp((dm - GR[i][0]) / (GR[i][1] - GR[i][0]), 0, 1), q = Math.round(v * 100) / 100;
      if (q !== gF[i]) { gF[i] = q; gRows[i].style.setProperty('--f', q); }
    }
    gPh.style.transform = 'translateX(' + (f * gW).toFixed(1) + 'px)';
    ckT += dt || 0;
    if (force || ckT > 0.07) {
      ckT = 0; const sec = Math.round(dm * 60), s = pad2((sec / 60) | 0) + ':' + pad2(sec % 60);
      if (s !== lastClock) { lastClock = s; clockEl.textContent = s; badgeB.textContent = s; }
    }
  }
  const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six'];
  function armText() {
    setT(armB, killed ? 'HALTED' : 'ARMED');
    setT(armS, killed ? 'kill switch thrown · every order routes to human review' : 'gate open at floor ' + S.floor.toFixed(2) + ' · loss cap on · kill switch live');
    setT(clockL, mode === 'play' ? 'minutes elapsed' : sumOn() === 6 ? (killed ? 'halted' : 'armed') : 'minutes spent');
  }
  const sumOn = () => on[0] + on[1] + on[2] + on[3] + on[4] + on[5];
  function updArm() {
    const n = sumOn(), all = n === 6, was = armEl.dataset.s;
    armEl.dataset.s = all ? 'armed' : 'wait';
    setT(armWt, 'waiting on ' + WORDS[6 - n] + (6 - n === 1 ? ' switch' : ' switches'));
    armText();
    return all && was !== 'armed';
  }
  function setSw(i, v, pop) {
    const b = sws[i]; on[i] = v ? 1 : 0;
    b.classList.toggle('on', v); b.setAttribute('aria-pressed', v ? 'true' : 'false');
    setT(b.querySelector('em'), v ? 'on' : 'off'); cells[i].classList.toggle('on', v);
    if (pop) {
      /* class swaps restart the animations (identical keyframes under two names): no forced layout */
      const a = !b.classList.contains('rip-a'); b.classList.toggle('rip-a', a); b.classList.toggle('rip-b', !a);
      if (v) { const q = !b.classList.contains('pop-a'); b.classList.toggle('pop-a', q); b.classList.toggle('pop-b', !q); }
    }
  }
  function setAct(i) {
    if (act === i) return;
    if (act >= 0) { sws[act].classList.remove('act'); barS[act].style.transform = ''; }
    act = i; if (i >= 0) sws[i].classList.add('act');
  }
  const DUR = [8, 18, 15, 11, 6, 2];
  function manualMinutes() { let m = 0; for (let i = 0; i < 6; i++) if (on[i]) m += DUR[i]; return m; }

  /* burst particles (additive sprites, pooled) */
  const BU = { g: null, W: 0, H: 0, live: false, shocks: [], ring: { x: 0, y: 0 }, arm: { x: 0, y: 0 }, rs: 1 };
  const PP = Array.from({ length: 260 }, () => ({ x: 0, y: 0, vx: 0, vy: 0, l: 0, m: 1, s: 4, c: 0, k: 0, r: 0, vr: 0 }));
  const BCOL = [C.pink, C.pink2, C.amber, '#ffffff', C.orange, C.green, C.cyan];
  let flashN = false;
  function armFlash() {
    flashN = !flashN;
    armEl.classList.toggle('hr-fa', flashN); armEl.classList.toggle('hr-fb', !flashN);
    const rf = $('.hr-rflash', panB); if (rf) { rf.classList.toggle('hr-fa', flashN); rf.classList.toggle('hr-fb', !flashN); }
  }
  /** a few outward sparks off the freshly lit minute tick (tier 3 every minute, tier 2 every fifth) */
  function tickSpark(m) {
    const tr = J.tier || 2; if (reduce || tr < 2 || !BU.g || (tr < 3 && m % 5)) return;
    const a = m / 60 * TAU - Math.PI / 2, x = BU.ring.x + Math.cos(a) * 98 * BU.rs, y = BU.ring.y + Math.sin(a) * 98 * BU.rs, n = m % 5 === 0 ? 7 : 3;
    for (let i = 0, k = 0; i < PP.length && k < n; i++) {
      const p = PP[i]; if (p.l > 0) continue;
      const b = a + (Math.random() - 0.5) * 1.1, s = 40 + Math.random() * 90;
      p.x = x; p.y = y; p.vx = Math.cos(b) * s; p.vy = Math.sin(b) * s; p.m = p.l = 0.35 + Math.random() * 0.3; p.s = 2.5 + Math.random() * 2; p.c = (m % 5 === 0 ? 3 : 2); p.k = 0; k++;
    }
    BU.live = true;
  }
  function burst(x, y, n, up, R) {
    let k = 0;
    for (let i = 0; i < PP.length && k < n; i++) {
      const p = PP[i]; if (p.l > 0) continue;
      const a = up ? -Math.PI * (0.08 + 0.84 * Math.random()) : Math.random() * TAU, s = 90 + Math.random() * 280;
      p.x = x; p.y = y; p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s; p.m = p.l = 0.8 + Math.random() * 0.9; p.s = 3 + Math.random() * 5; p.c = (Math.random() * BCOL.length) | 0;
      /* kinds: 0 glow spark · 1 tumbling confetti · 2 streak along its velocity */
      p.k = k % 3; p.r = Math.random() * TAU; p.vr = (Math.random() - 0.5) * 16; if (p.k === 1) p.l = p.m = p.m * 1.25; k++;
    }
    BU.shocks.push({ x, y, t: 0, R: R || 120 }); if (BU.shocks.length > 3) BU.shocks.shift(); BU.live = true;
  }
  function stepBurst(dt) {
    const g = BU.g; if (!g || (!BU.live && !BU.shocks.length)) return;
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, BU.W, BU.H);
    g.globalCompositeOperation = 'lighter';
    let live = 0;
    for (let i = 0; i < PP.length; i++) {
      const p = PP[i]; if (p.l <= 0) continue;
      p.l -= dt; if (p.l <= 0) continue; live++;
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 230 * dt; p.vx *= 1 - 1.3 * dt;
      const k = p.l / p.m;
      if (p.k === 0) blit(g, BCOL[p.c], p.x, p.y, p.s * (0.7 + k), k);
      else if (p.k === 1) {
        p.r += p.vr * dt; const L = p.s * 0.9, Wd = p.s * 0.45 * Math.abs(Math.cos(p.r * 0.8)) + 0.4, ca = Math.cos(p.r), sa = Math.sin(p.r);
        const ux = ca * L, uy = sa * L, vx = -sa * Wd, vy = ca * Wd;
        g.globalAlpha = Math.min(1, k * 1.6); g.fillStyle = BCOL[p.c];
        g.beginPath(); g.moveTo(p.x - ux - vx, p.y - uy - vy); g.lineTo(p.x + ux - vx, p.y + uy - vy); g.lineTo(p.x + ux + vx, p.y + uy + vy); g.lineTo(p.x - ux + vx, p.y - uy + vy); g.closePath(); g.fill();
      } else {
        g.globalAlpha = k; g.strokeStyle = BCOL[p.c]; g.lineWidth = 1.4; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 0.045, p.y - p.vy * 0.045); g.stroke();
        blit(g, '#ffffff', p.x, p.y, 2.2, k);
      }
    }
    for (let i = BU.shocks.length - 1; i >= 0; i--) {
      const s = BU.shocks[i]; s.t += dt; const u = s.t / 0.9;
      if (u >= 1) { BU.shocks.splice(i, 1); continue; }
      g.globalAlpha = (1 - u) * (1 - u) * 0.9; g.lineWidth = 0.6 + 2.6 * (1 - u); g.strokeStyle = killed ? C.red : C.pink2; g.beginPath(); g.arc(s.x, s.y, 12 + s.R * (1 - Math.pow(1 - u, 3)), 0, TAU); g.stroke();
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    BU.live = live > 0;
    if (!live && !BU.shocks.length) g.clearRect(0, 0, BU.W, BU.H);
  }
  J.watch($('#hr-g-rows'), () => { gW = $('#hr-g-rows').clientWidth; gPh.style.transform = 'translateX(' + (clamp(dm / 60, 0, 1) * gW).toFixed(1) + 'px)'; });
  J.watch(panB, () => {
    const f = fitC(burstCv); BU.g = f.g; BU.W = f.W; BU.H = f.H;
    const rb = offs($('.hr-ringbox', panB), panB), ab = offs(armEl, panB);
    BU.rs = rb.w / 220; BU.ring.x = rb.x + rb.w / 2; BU.ring.y = rb.y + rb.h / 2; BU.arm.x = ab.x + ab.w / 2; BU.arm.y = ab.y + ab.h / 2;
  });
  function arrive() {
    if (killed) return;
    const tr = J.tier || 2;
    burst(BU.arm.x, BU.arm.y, tr >= 3 ? 150 : 92, true, 200); burst(BU.ring.x, BU.ring.y, tr >= 3 ? 80 : 46, false, 118);
    armFlash();
    if (J.pulse) J.pulse(0.7);
    if (!reduce && tr >= 2) cinema(tr);
  }
  /* ARMED cinematic: screen-wide shockwave (+ radial light burst at tier 3), a confetti rain with gravity, and the whole panel lifting in 3D for a beat */
  const shockEl = $('#hr-shock'), lbEl = $('#hr-lightb');
  let cinN = false;
  function cinema(tr) {
    cinN = !cinN;
    const r = armEl.getBoundingClientRect();
    shockEl.style.setProperty('--sx', (r.left + r.width / 2).toFixed(0) + 'px'); shockEl.style.setProperty('--sy', (r.top + r.height / 2).toFixed(0) + 'px');
    lbEl.style.setProperty('--sx', (r.left + r.width / 2).toFixed(0) + 'px'); lbEl.style.setProperty('--sy', (r.top + r.height / 2).toFixed(0) + 'px');
    for (const el of tr >= 3 ? [shockEl, lbEl, panB] : [shockEl, panB]) {
      const p = el === panB ? 'hr-lift-' : 'hr-f';
      el.classList.toggle(p + 'a', cinN); el.classList.toggle(p + 'b', !cinN);
    }
    if (tr >= 3) { /* confetti rain from the panel's top edge */
      for (let i = 0, k = 0; i < PP.length && k < 60; i++) {
        const p = PP[i]; if (p.l > 0) continue;
        p.x = Math.random() * BU.W; p.y = 4 + Math.random() * 20; p.vx = (Math.random() - 0.5) * 60; p.vy = 30 + Math.random() * 120; p.m = p.l = 1.4 + Math.random() * 1.1;
        p.s = 3 + Math.random() * 4; p.c = (Math.random() * BCOL.length) | 0; p.k = 1; p.r = Math.random() * TAU; p.vr = (Math.random() - 0.5) * 14; k++;
      }
    }
  }
  function resetB() {
    for (let i = 0; i < 6; i++) { setSw(i, false); barS[i].style.transform = ''; }
    setAct(-1); dm = 0; renderB(true, 0); updArm();
  }
  function beginLoop() { mode = 'play'; clk = -LOOP.LEAD; resetB(); }
  function userFlip(i) {
    if (mode !== 'manual') mode = 'manual';
    manT = 0; setAct(-1); for (let k = 0; k < 6; k++) barS[k].style.transform = '';
    setSw(i, !on[i], true); mT = manualMinutes();
    const armed = updArm();
    if (armed) arrive();
    if (reduce) { dm = mT; renderB(true, 0); }
  }
  sws.forEach((b, i) => b.addEventListener('click', () => userFlip(i)));
  J.task(panB, (t, dt) => {
    stepBurst(dt);
    if (mode === 'play') {
      clk += dt;
      const m = clamp(clk / LOOP.PLAY, 0, 1) * 60;
      dm = m;
      for (let i = 0; i < 6; i++) if (m >= PHS[i + 1] && !on[i]) { setSw(i, true, true); if (act === i) setAct(-1); barS[i].style.transform = ''; if (updArm()) arrive(); }
      if (m < 60) { const p = phaseOf(m); setAct(p); barS[p].style.transform = 'scaleX(' + ((m - PHS[p]) / (PHS[p + 1] - PHS[p])).toFixed(3) + ')'; }
      else { setAct(-1); mode = 'rest'; rest = 0; renderB(true, dt); armText(); return; }
      renderB(false, dt);
    } else if (mode === 'rest') {
      rest += dt; if (rest > LOOP.REST) beginLoop();
    } else if (mode === 'manual') {
      manT += dt; dm += (mT - dm) * (1 - Math.exp(-dt * 7)); if (Math.abs(mT - dm) < 0.02) dm = mT;
      renderB(false, dt);
      if (manT > LOOP.MAN) beginLoop();
    }
  });
  J.onView(panB, () => { if (!reduce) { mode = 'idle'; setTimeout(() => { if (mode === 'idle') beginLoop(); }, 350); } }, { threshold: 0.4 });

  /* =====================================================================
   * C · the backtest — 1,840 seeded trades, calibrated so the printed stats are the data's own
   * ===================================================================== */
  const N = 1840, NW = 1067, TARGET = Math.pow(1.31, 4); // 58% green · 31%/yr over four years
  let bt = null;
  const buildBT = () => {
    const R = J.rng(18407), isW = new Uint8Array(N), mag = new Float32Array(N), inW = new Uint8Array(N), score = new Float32Array(N), idx = new Array(N);
    for (let i = 0; i < N; i++) { inW[i] = i >= 1010 && i < 1135 ? 1 : 0; score[i] = R() + inW[i] * 0.3; mag[i] = 0.35 + 1.25 * R() * R(); idx[i] = i; }
    idx.sort((a, b) => score[a] - score[b]);
    for (let k = 0; k < NW; k++) isW[idx[k]] = 1;
    const ret = new Float32Array(N), eq = new Float32Array(N + 1), dd = new Float32Array(N + 1);
    const run = (a, mW, store) => {
      let e = 1, pk = 1, pki = 0, worst = 0, wp = 0, wt = 0;
      for (let i = 0; i < N; i++) {
        const r = isW[i] ? a * mag[i] : -a * 1.04 * mag[i] * (inW[i] ? mW : 1);
        e *= 1 + r; if (e > pk) { pk = e; pki = i + 1; }
        const d = 1 - e / pk; if (d > worst) { worst = d; wp = pki; wt = i + 1; }
        if (store) { ret[i] = r; eq[i + 1] = e; dd[i + 1] = d; }
      }
      return { e, worst, pi: wp, ti: wt };
    };
    let a = 0.0045, mW = 1.2;
    for (let it = 0; it < 5; it++) {
      let lo = 0.0003, hi = 0.03;
      for (let k = 0; k < 22; k++) { const m = (lo + hi) / 2; if (run(m, mW).e < TARGET) lo = m; else hi = m; }
      a = (lo + hi) / 2; lo = 0.4; hi = 5;
      for (let k = 0; k < 22; k++) { const m = (lo + hi) / 2; if (run(a, m).worst < 0.22) lo = m; else hi = m; }
      mW = (lo + hi) / 2;
    }
    eq[0] = 1; const fin = run(a, mW, true);
    let emax = 1, emin = 1; for (let i = 0; i <= N; i++) { if (eq[i] > emax) emax = eq[i]; if (eq[i] < emin) emin = eq[i]; }
    return { ret, eq, dd, pi: fin.pi, ti: fin.ti, worst: fin.worst, final: fin.e, emax, emin, annual: (Math.pow(fin.e, 0.25) - 1) * 100 };
  };

  const btBox = $('#hr-btbox'), btCv = $('#hr-btc'), tip = $('#hr-bt-tip');
  const BT = { g: null, W: 0, H: 0, off: null, e: reduce ? 1 : 0, go: reduce, t0: -1, hx: -1, dirty: true, sweep: -1, nextSweep: 9, ey: null, padL: 38, cw: 100, last: -1, left: 0, rl: true, tipX: -1, tipDone: -1, lastLive: 0, bx0: 0, bx1: 0, top: 0, bot: 0 };
  const X = (v) => '×' + v.toFixed(2);
  const tierNow = () => J.tier || 2;
  function layoutC() {
    BT.rl = true; // box moved / resized: re-read its left edge on the next hover
    if (!bt) return;
    const f = fitC(btCv); BT.g = f.g; BT.W = f.W; BT.H = f.H;
    const W = f.W, H = f.H, narrow = W < 420, dpr = J.DPR;
    const padL = narrow ? 32 : 40, padR = 10, padT = 16, cw = W - padL - padR, split = Math.round(H * 0.46), pitch = narrow ? 2.5 : 3, cols = Math.max(24, Math.floor(cw / pitch));
    BT.padL = padL; BT.cw = cw; BT.cols = cols;
    const up = new Float32Array(cols), dn = new Float32Array(cols), ey = new Float32Array(cols);
    for (let i = 0; i < N; i++) { const c = Math.min(cols - 1, (i * cols / N) | 0), r = bt.ret[i]; if (r > 0) up[c] += r; else dn[c] -= r; }
    let mx = 1e-9; for (let c = 0; c < cols; c++) mx = Math.max(mx, up[c], dn[c]);
    const e0 = bt.emin * 0.97, e1 = bt.emax * 1.03, eTop = padT + 4, eBot = split - 14, EY = (v) => eBot - (v - e0) / (e1 - e0) * (eBot - eTop);
    const cx = (c) => padL + (c + 0.5) * cw / cols;
    for (let c = 0; c < cols; c++) ey[c] = EY(bt.eq[Math.min(N, Math.round((c + 1) * N / cols))]);
    BT.ey = ey; BT.cx0 = padL; BT.EY = EY;
    const off = BT.off || (BT.off = document.createElement('canvas')); off.width = Math.round(W * dpr); off.height = Math.round(H * dpr);
    const g = off.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const bTop = split + 6, bBot = H - 22, mid = (bTop + bBot) / 2, half = (bBot - bTop) / 2 - 3, xOf = (i) => padL + i / N * cw;
    // year dividers + labels
    g.font = '600 9px ' + MONO; g.textAlign = 'center';
    for (let y = 0; y < 4; y++) {
      if (y) { g.strokeStyle = 'rgba(255,255,255,.07)'; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(Math.round(padL + cw * y / 4) + 0.5, padT); g.lineTo(Math.round(padL + cw * y / 4) + 0.5, H - 20); g.stroke(); g.setLineDash([]); }
      g.fillStyle = 'rgba(160,152,176,.8)'; g.fillText('year ' + (y + 1), padL + cw * (y + 0.5) / 4, H - 8);
    }
    // drawdown block (behind everything else)
    const bx0 = xOf(bt.pi), bx1 = xOf(bt.ti); BT.bx0 = bx0; BT.bx1 = bx1; BT.top = padT; BT.bot = H - 20;
    const dg = g.createLinearGradient(0, padT, 0, H - 20); dg.addColorStop(0, 'rgba(255,77,94,.26)'); dg.addColorStop(1, 'rgba(255,77,94,.07)');
    g.fillStyle = dg; g.fillRect(bx0, padT, bx1 - bx0, H - 20 - padT);
    g.strokeStyle = 'rgba(255,77,94,.55)'; g.lineWidth = 1; g.setLineDash([3, 3]); g.strokeRect(bx0 + 0.5, padT + 0.5, bx1 - bx0 - 1, H - 20 - padT - 1); g.setLineDash([]);
    // bars
    g.strokeStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(padL, Math.round(mid) + 0.5); g.lineTo(W - padR, Math.round(mid) + 0.5); g.stroke();
    const bw = Math.max(1.2, cw / cols - 1), ug = g.createLinearGradient(0, mid - half, 0, mid), dgr = g.createLinearGradient(0, mid, 0, mid + half);
    ug.addColorStop(0, 'rgba(46,230,166,.95)'); ug.addColorStop(1, 'rgba(46,230,166,.45)'); dgr.addColorStop(0, 'rgba(255,77,94,.5)'); dgr.addColorStop(1, 'rgba(255,77,94,.98)');
    g.fillStyle = ug; for (let c = 0; c < cols; c++) { const h = up[c] / mx * half; g.fillRect(cx(c) - bw / 2, mid - h, bw, h); }
    g.fillStyle = dgr; for (let c = 0; c < cols; c++) { const h = dn[c] / mx * half; g.fillRect(cx(c) - bw / 2, mid + 1, bw, h); }
    // running total: glow underlay, area, line
    g.lineJoin = 'round';
    g.beginPath(); for (let c = 0; c < cols; c++) { if (c) g.lineTo(cx(c), ey[c]); else g.moveTo(cx(c), ey[c]); }
    g.lineWidth = 7; g.strokeStyle = 'rgba(255,193,61,.14)'; g.stroke();
    g.lineWidth = 2.2; const lg = g.createLinearGradient(padL, 0, W - padR, 0); lg.addColorStop(0, '#ffc13d'); lg.addColorStop(1, '#ff9d3d'); g.strokeStyle = lg; g.stroke();
    g.lineTo(cx(cols - 1), eBot + 4); g.lineTo(cx(0), eBot + 4); g.closePath();
    const ag = g.createLinearGradient(0, eTop, 0, eBot); ag.addColorStop(0, 'rgba(255,193,61,.2)'); ag.addColorStop(1, 'rgba(255,193,61,0)'); g.fillStyle = ag; g.fill();
    if (tierNow() >= 2) { /* heat glow under the curve: hot amber near the line, cooling to the baseline, brighter where the curve is high */
      g.save(); g.clip(); g.globalCompositeOperation = 'lighter';
      const hg = g.createLinearGradient(0, eTop, 0, eBot); hg.addColorStop(0, 'rgba(255,150,40,.34)'); hg.addColorStop(0.45, 'rgba(255,96,40,.12)'); hg.addColorStop(1, 'rgba(255,60,60,0)');
      g.fillStyle = hg; g.fillRect(padL, eTop - 8, cw, eBot - eTop + 14);
      if (tierNow() >= 3) { g.lineJoin = 'round'; g.beginPath(); for (let c = 0; c < cols; c++) { if (c) g.lineTo(cx(c), ey[c]); else g.moveTo(cx(c), ey[c]); } g.lineWidth = 14; g.strokeStyle = 'rgba(255,170,60,.1)'; g.stroke(); }
      g.restore();
    }
    // labels
    g.textAlign = 'left'; g.font = '700 9.5px ' + MONO;
    g.fillStyle = '#2ee6a6'; g.fillText('win', 4, mid - 9); g.fillStyle = '#ff6b79'; g.fillText('loss', 4, mid + 17);
    g.fillStyle = 'rgba(255,214,120,.95)'; g.fillText(bt.emax.toFixed(1) + '×', 4, EY(bt.emax) + 3); g.fillStyle = 'rgba(160,152,176,.85)'; g.fillText('1×', 4, EY(1) + 3);
    g.textAlign = 'center'; g.fillStyle = '#ff6b79'; g.font = '800 ' + (narrow ? 11 : 13) + 'px ' + MONO;
    const lx = clamp((bx0 + bx1) / 2, padL + 20, W - padR - 22); g.fillText('-' + Math.round(bt.worst * 100) + '%', lx, padT + 11);
    BT.dirty = true; if (BT.pin >= 0) setPin(BT.pin); else if (reduce) renderC(0, 0);
  }
  J.watch(btBox, layoutC);
  setTimeout(() => {
    bt = buildBT(); const sb = $$('b', $('#hr-c-stats'));
    sb[1].dataset.to = String(Math.round(bt.annual)); sb[2].dataset.to = String(-Math.round(bt.worst * 100)); setT($('.hr-c .hr-badge'), Math.round(bt.annual) + '% / yr');
    layoutC();
  }, reduce ? 0 : 500);

  const idxAt = (x) => clamp(Math.round((x - BT.padL) / BT.cw * N), 1, N);
  const xOfI = (i) => BT.padL + i / N * BT.cw;
  const pct = (v, d) => (v >= 0 ? '+' : '-') + Math.abs(v * 100).toFixed(d == null ? 2 : d) + '%';
  /** trade #, outcome, running total and drawdown for trade i (1-based) */
  function tipHtml(i, pin) {
    const dd = bt.dd[i], yr = Math.min(4, 1 + Math.floor((i - 1) / N * 4)), r = bt.ret[i - 1], w = r > 0;
    return (pin ? '<i class="pn">pinned</i> ' : '') + 'trade <b>#' + fmt(i) + '</b> · year ' + yr + ' · <span class="' + (w ? 'up' : 'dn') + '">' + (w ? 'win ' : 'loss ') + pct(r) + '</span><br>total <b>' + X(bt.eq[i]) + '</b> · ' +
      (dd > 0.0005 ? '<span class="dn">-' + (dd * 100).toFixed(1) + '%</span> from peak' : 'at a new high') + ' <em>sim</em>';
  }
  /* side with the room, then clamped inside the box with min()/max() (100% = the tip's own width): never clipped at 390px */
  const tipSide = (el, x) => { const rt = x < BT.W * 0.5; el.style.transform = 'translateX(' + (rt ? 'min(' + Math.round(x + 14) + 'px, calc(' + Math.round(BT.W) + 'px - 100% - 4px))' : 'max(4px, calc(' + Math.round(x - 14) + 'px - 100%))') + ')'; };
  function setTip(x) {
    if (x < 0 || !bt) { tip.classList.remove('on'); return; }
    const i = idxAt(x);
    if (i !== BT.last) { BT.last = i; tip.innerHTML = tipHtml(i, false); }
    tip.classList.add('on'); tipSide(tip, x);
  }
  const pinEl = $('#hr-bt-pin'), srEl = $('#hr-bt-sr');
  BT.pin = -1; BT.over = false;
  function setPin(i) {
    BT.pin = i; BT.dirty = true;
    if (i < 0 || !bt) { pinEl.classList.remove('on'); return; }
    pinEl.innerHTML = tipHtml(i, true); pinEl.classList.add('on'); tipSide(pinEl, xOfI(i));
    if (reduce) renderC(J.time, 0);
  }
  /* hover: the box's left edge is cached (re-read once per hover, and after a resize / reveal via layoutC), so pointermove does no layout read and no DOM write;
     the tip text + transform are written by the frame task (renderC), at most once per frame. (reduced motion freezes the task, so it flushes inline there) */
  const hoverAt = (e) => {
    if (BT.rl) { BT.left = btBox.getBoundingClientRect().left; BT.rl = false; }
    BT.hx = clamp(e.clientX - BT.left, BT.padL, BT.W - 10); BT.dirty = true; BT.tipX = BT.hx;
    if (reduce) { flushTip(); renderC(J.time, 0); }
  };
  const flushTip = () => { if (BT.tipX !== BT.tipDone) { BT.tipDone = BT.tipX; setTip(BT.tipX); } };
  btBox.addEventListener('pointerenter', () => { BT.rl = true; BT.over = true; });
  btBox.addEventListener('pointermove', hoverAt);
  btBox.addEventListener('pointerleave', () => { BT.over = false; BT.hx = -1; BT.dirty = true; BT.tipX = -1; if (reduce) { flushTip(); renderC(J.time, 0); } });
  btBox.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') { BT.rl = true; BT.over = true; hoverAt(e); } });
  /* click / tap pins the trade under the pointer; clicking the pin again (or Esc) clears it */
  btBox.addEventListener('click', (e) => {
    if (!bt || BT.e < 1 || e.detail === 0) return;
    if (BT.rl) { BT.left = btBox.getBoundingClientRect().left; BT.rl = false; }
    const x = clamp(e.clientX - BT.left, BT.padL, BT.W - 10), i = idxAt(x);
    setPin(BT.pin >= 0 && Math.abs(xOfI(BT.pin) - x) < 9 ? -1 : i);
  });
  /* keyboard parity: arrows scrub (shift = x5), Home / End jump, Enter or Space pins, Esc clears */
  let kbI = 0;
  const kbShow = (i) => {
    kbI = clamp(i, 1, N); BT.hx = xOfI(kbI); BT.tipX = BT.hx; BT.dirty = true;
    srEl.textContent = 'trade ' + kbI + ', ' + (bt.ret[kbI - 1] > 0 ? 'win ' : 'loss ') + pct(bt.ret[kbI - 1]) + ', total ' + X(bt.eq[kbI]) + ', drawdown ' + (bt.dd[kbI] * 100).toFixed(1) + ' percent, simulated';
    if (reduce) { flushTip(); renderC(J.time, 0); }
  };
  btBox.addEventListener('keydown', (e) => {
    if (!bt || BT.e < 1) return;
    const k = e.key, st = (e.shiftKey ? 5 : 1) * 12;
    if (k === 'ArrowRight' || k === 'ArrowUp') kbShow((kbI || (BT.hx > 0 ? idxAt(BT.hx) : N >> 1)) + st);
    else if (k === 'ArrowLeft' || k === 'ArrowDown') kbShow((kbI || (BT.hx > 0 ? idxAt(BT.hx) : N >> 1)) - st);
    else if (k === 'Home') kbShow(1); else if (k === 'End') kbShow(N);
    else if (k === 'Enter' || k === ' ') { if (!kbI) kbShow(BT.hx > 0 ? idxAt(BT.hx) : N >> 1); setPin(BT.pin === kbI ? -1 : kbI); }
    else if (k === 'Escape') setPin(-1);
    else return;
    e.preventDefault();
  });
  btBox.addEventListener('blur', () => { kbI = 0; if (!BT.over) { BT.hx = -1; BT.tipX = -1; BT.dirty = true; if (reduce) { flushTip(); renderC(J.time, 0); } } });

  const statFmtC = { pct: (v) => Math.round(v) + '%', int: (v) => fmt(Math.round(v)) };
  J.onView(btBox, () => {
    if (reduce) return;
    BT.go = true; BT.t0 = -1;
    $$('b', $('#hr-c-stats')).forEach((b, i) => countUp(b, 2200, 300 + i * 160, statFmtC[b.dataset.f]));
  }, { threshold: 0.35 });
  if (!reduce) { BT.e = 0; BT.go = false; }

  const renderC = (t, dt) => {
    const g = BT.g; if (!g || !BT.off) return;
    flushTip();
    let need = BT.dirty;
    const live = !reduce && BT.e >= 1 && BT.bx1 > BT.bx0 && tierNow() >= 2;   /* drawdown block pulses + warning scan: redraw at ~30 Hz */
    if (live && t - BT.lastLive > 0.033) { BT.lastLive = t; need = true; }
    if (BT.go && BT.e < 1) { if (BT.t0 < 0) BT.t0 = t; const p = clamp((t - BT.t0) / 2.6, 0, 1); BT.e = 1 - Math.pow(1 - p, 3); need = true; if (p >= 1) BT.nextSweep = t + 3; }
    else if (BT.e >= 1 && !reduce) { if (BT.sweep < 0 && t > BT.nextSweep) BT.sweep = 0; if (BT.sweep >= 0) { BT.sweep += dt / 1.5; need = true; if (BT.sweep > 1) { BT.sweep = -1; BT.nextSweep = t + 8; } } }
    if (!need) return;
    BT.dirty = false;
    const W = BT.W, H = BT.H, e = BT.e, sx = BT.padL + e * (W - BT.padL);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, W, H);
    if (e > 0.002) { const k = e >= 1 ? 1 : sx / W; g.drawImage(BT.off, 0, 0, BT.off.width * k, BT.off.height, 0, 0, W * k, H); }
    g.globalCompositeOperation = 'lighter';
    if (e < 1 && e > 0) {
      const c = clamp(Math.floor((sx - BT.padL) / BT.cw * BT.cols), 0, BT.cols - 1);
      g.globalAlpha = 0.55; g.drawImage(glow('#4d8dff'), sx - 16, 0, 32, H); g.globalAlpha = 0.9; g.fillStyle = '#fff'; g.fillRect(sx - 0.5, 8, 1, H - 24);
      blit(g, '#ffc13d', sx, BT.ey[c], 18, 0.95);
      if (tierNow() >= 2) { /* glowing head: bloom + a comet tail riding the curve */
        blit(g, '#ffffff', sx, BT.ey[c], 5, 0.9); blit(g, '#ffa63d', sx, BT.ey[c], 34, 0.32);
        for (let k = 1; k <= (tierNow() >= 3 ? 9 : 4); k++) { const cc = c - k * 2; if (cc < 0) break; blit(g, '#ffc13d', BT.padL + (cc + 0.5) * BT.cw / BT.cols, BT.ey[cc], 12 - k, 0.42 - k * 0.04); }
      }
    }
    if (live) {
      const w = BT.bx1 - BT.bx0, ph = 0.5 + 0.5 * Math.sin(t * 3.4), top = BT.top, hh = BT.bot - top;
      g.globalAlpha = 0.05 + 0.13 * ph; g.fillStyle = '#ff2e45'; g.fillRect(BT.bx0, top, w, hh);
      g.globalAlpha = 0.25 + 0.4 * ph; g.strokeStyle = '#ff4d5e'; g.lineWidth = 1.2; g.strokeRect(BT.bx0 + 0.5, top + 0.5, w - 1, hh - 1);
      const sy = top + ((t * 0.55) % 1) * hh;   // warning scan line sweeping down the block
      g.globalAlpha = 0.9; g.drawImage(glow('#ff4d5e'), BT.bx0, sy - 9, w, 18); g.globalAlpha = 0.7; g.fillStyle = '#ffd0d5'; g.fillRect(BT.bx0, sy - 0.5, w, 1);
      if (tierNow() >= 3) { g.globalAlpha = 0.16; g.fillStyle = '#ff6b79'; for (let y = top + 3; y < top + hh; y += 5) g.fillRect(BT.bx0, y, w, 1); }
    }
    if (BT.sweep >= 0) { const x = BT.padL + BT.sweep * BT.cw; g.globalAlpha = Math.sin(BT.sweep * Math.PI) * 0.2; g.drawImage(glow('#8fb4ff'), x - 22, 4, 44, H - 8); }
    if (BT.hx >= 0 && e >= 1) {
      const c = clamp(Math.floor((BT.hx - BT.padL) / BT.cw * BT.cols), 0, BT.cols - 1);
      g.globalAlpha = 0.5; g.fillStyle = '#fff'; g.fillRect(Math.round(BT.hx), 6, 1, H - 24);
      blit(g, '#ffc13d', BT.hx, BT.ey[c], 16, 1); blit(g, '#ffffff', BT.hx, BT.ey[c], 4, 1);
      /* drawdown bracket: from the running peak down to the running total at this trade */
      const hi = idxAt(BT.hx), ddv = bt.dd[hi];
      if (ddv > 0.004) {
        const yT = BT.EY(bt.eq[hi] / (1 - ddv)), yB = BT.EY(bt.eq[hi]), xb = Math.round(BT.hx) + 5;
        g.globalAlpha = 0.85; g.strokeStyle = '#ff6b79'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(xb - 3, yT); g.lineTo(xb, yT); g.lineTo(xb, yB); g.lineTo(xb - 3, yB); g.stroke();
        g.globalAlpha = 0.35; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(BT.padL, yT); g.lineTo(xb, yT); g.stroke(); g.setLineDash([]);
      }
    }
    if (BT.pin >= 0 && e >= 1) {
      const px = Math.round(xOfI(BT.pin)) + 0.5, py = BT.EY(bt.eq[BT.pin]);
      g.globalAlpha = 0.55; g.strokeStyle = '#8fb4ff'; g.lineWidth = 1; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(px, 6); g.lineTo(px, H - 20); g.stroke(); g.setLineDash([]);
      blit(g, '#4d8dff', px, py, 14, 0.9); g.globalAlpha = 1; g.strokeStyle = '#fff'; g.lineWidth = 1.6; g.beginPath(); g.arc(px, py, 4.5, 0, TAU); g.stroke();
      g.fillStyle = '#8fb4ff'; g.beginPath(); g.moveTo(px - 4.5, 6); g.lineTo(px + 4.5, 6); g.lineTo(px, 12); g.closePath(); g.fill();
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  };
  J.task(btBox, renderC);

  /* =====================================================================
   * D · the arithmetic — log gauge, capital = 1,200,000 / return
   * ===================================================================== */
  const gaugeEl = $('#hr-gauge'), gsvg = $('#hr-gsvg'), knob = $('#hr-knob'), rangeEl = $('#hr-range');
  const retEl = $('#hr-ret'), capEl = $('#hr-capv'), badgeD = $('#hr-d-badge'), verdEl = $('#hr-verdict'), smallEl = $('#hr-small'), noteD = $('#hr-d-note');
  const GA = 135, GS = 270, RMIN = 5, RMAX = 480, LOGR = Math.log(RMAX / RMIN), CX = 160, CY = 140, RR = 112, ANNUAL = 1200000;
  const u2r = (u) => RMIN * Math.exp(u * LOGR), r2u = (r) => Math.log(r / RMIN) / LOGR;
  const rad = (u) => (GA + GS * u) * Math.PI / 180;
  const polar = (u, r) => [CX + r * Math.cos(rad(u)), CY + r * Math.sin(rad(u))];
  const arcD = (u0, u1, r) => { const a = polar(u0, r), b = polar(u1, r); return 'M' + a[0].toFixed(2) + ' ' + a[1].toFixed(2) + 'A' + r + ' ' + r + ' 0 ' + ((u1 - u0) * GS > 180 ? 1 : 0) + ' 1 ' + b[0].toFixed(2) + ' ' + b[1].toFixed(2); };
  const gTrack = $('#hr-gtrack'), gLit = $('#hr-glit'), gTicks = $('#hr-gticks'), gNeedle = $('#hr-gneedle'), gTag = $('#hr-gtag');
  const SEG = [[0, r2u(31) - 0.008, C.green], [r2u(31) + 0.008, r2u(100) - 0.008, C.amber], [r2u(100) + 0.008, 1, C.red]];
  const segLit = [], segGlow = [];
  SEG.forEach((s) => {
    svg('path', { d: arcD(s[0], s[1], RR), fill: 'none', stroke: s[2], 'stroke-width': 11, opacity: 0.26 }, gTrack);
    segGlow.push(svg('path', { d: arcD(s[0], s[1], RR), fill: 'none', stroke: s[2], 'stroke-width': 20, opacity: 0.16, 'stroke-dasharray': '0 999' }, gLit));
    segLit.push(svg('path', { d: arcD(s[0], s[1], RR), fill: 'none', stroke: s[2], 'stroke-width': 11, 'stroke-dasharray': '0 999' }, gLit));
  });
  const segLen = SEG.map((s) => RR * (s[1] - s[0]) * GS * Math.PI / 180);
  const gTk = [];
  [5, 7, 10, 14, 17, 20, 25, 31, 40, 50, 70, 100, 150, 200, 300, 480].forEach((v) => {
    const major = v === 5 || v === 17 || v === 31 || v === 100 || v === 480, u = r2u(v), a = polar(u, RR + 9), b = polar(u, RR + (major ? 19 : 14));
    const ln = svg('line', { x1: a[0].toFixed(1), y1: a[1].toFixed(1), x2: b[0].toFixed(1), y2: b[1].toFixed(1), class: 'hr-gtick' + (major ? ' mj' : '') }, gTicks);
    let tx = null;
    if (major) { const p = polar(u, RR + 33), c = Math.cos(rad(u)); tx = svg('text', { x: p[0].toFixed(1), y: (p[1] + 4).toFixed(1), class: 'hr-glab', 'text-anchor': c < -0.3 ? 'end' : c > 0.3 ? 'start' : 'middle' }, gTicks); tx.textContent = v + '%'; }
    gTk.push({ u, ln, tx, st: 0 });
  });
  /* magnets: the three numbers the whole section argues about */
  const MAGS = [17, 31, 100].map(r2u), MAGR = [17, 31, 100];
  const gPulse = svg('circle', { cx: 0, cy: 0, r: 7, class: 'hr-gpulse' }, gTicks);
  let pulseN = false, magNow = -1;
  function magPulse(m) {
    const p = polar(MAGS[m], RR + 14); gPulse.setAttribute('cx', p[0].toFixed(1)); gPulse.setAttribute('cy', p[1].toFixed(1));
    pulseN = !pulseN; gPulse.setAttribute('class', 'hr-gpulse ' + (pulseN ? 'pa' : 'pb'));
    if (!reduce && navigator.vibrate) { try { navigator.vibrate(8); } catch (_) { /* no haptics */ } }
  }
  const magnet = (u, tol) => { for (let i = 0; i < 3; i++) if (Math.abs(u - MAGS[i]) < tol) return i; return -1; };
  const G = { u: r2u(31), uT: r2u(31), v: 0, drag: false, cap: 0, capT: 0, ret: 31, lastRet: '', lastCap: '', zone: '', scale: 1, rest: true };
  G.cap = G.capT = ANNUAL / 0.31;
  const fmtRet = (r) => (r < 10 ? r.toFixed(1) : String(Math.round(r))) + '%';
  const fmtCap = (v) => (v >= 1e6 ? '$' + (v / 1e6).toFixed(2) + 'M' : '$' + fmt(Math.round(v / 1e3)) + 'K');
  const zoneOf = (r) => (r < 30.5 ? 'g' : r < 100.5 ? 'a' : 'r');
  const VERD = { 0: 'almost cash: the capital it takes is enormous', 1: 'what survives fees, spread and slippage', 2: 'what the backtest promised, before the bill', 3: 'every trade must work, every year: nobody sustains this', 4: 'the red end of the dial: returns nobody delivers' };
  const verdIdx = (r) => (r < 12 ? 0 : r < 24 ? 1 : r < 45 ? 2 : r < 120 ? 3 : 4);
  const dispRet = (u) => { const r = u2r(clamp(u, 0, 1)); return r < 10 ? Math.round(r * 10) / 10 : Math.round(r); };
  /* needle spectacle: sparks shed from the tip at speed + a flare on every gauge tick the needle passes (one small canvas, pooled) */
  const gcv = $('#hr-gcv'), GP = Array.from({ length: 36 }, () => ({ x: 0, y: 0, vx: 0, vy: 0, l: 0, m: 1, c: C.pink })), FL = Array.from({ length: 8 }, () => ({ x: 0, y: 0, t: 1, mj: 0 }));
  const GC = { g: null, W: 0, H: 0, s: 1, busy: false }; let flN = 0;
  function flare(i) {
    if (reduce || (J.tier || 2) < 2 || !GC.g) return;
    const k = gTk[i], p = polar(k.u, RR + 14), f = FL[flN++ % FL.length]; f.x = p[0]; f.y = p[1]; f.t = 0; f.mj = k.tx ? 1 : 0; GC.busy = true;
  }
  J.watch(gaugeEl, () => { const f = fitC(gcv); GC.g = f.g; GC.W = f.W; GC.H = f.H; GC.s = f.W / 320; });
  function stepGC(dt) {
    const g = GC.g; if (!g) return;
    const tr = J.tier || 2, sp = Math.abs(G.v);
    if (tr >= 2 && !reduce && sp > 0.35) {   /* shed from the tip, thrown backwards along the sweep */
      const n = Math.min(tr >= 3 ? 3 : 1, 1 + ((sp - 0.35) * 2) | 0), tp = polar(clamp(G.u, 0, 1), 94), dir = G.v > 0 ? -1 : 1, a = rad(clamp(G.u, 0, 1)) + dir * Math.PI / 2;
      const col = G.u < r2u(31) ? C.green : G.u < r2u(100) ? C.amber : C.red;
      for (let q = 0, c = 0; q < GP.length && c < n; q++) if (GP[q].l <= 0) {
        const p = GP[q], v = 30 + sp * 70 * Math.random(), j = (Math.random() - 0.5) * 1.2;
        p.x = tp[0]; p.y = tp[1]; p.vx = Math.cos(a + j) * v; p.vy = Math.sin(a + j) * v; p.m = p.l = 0.35 + Math.random() * 0.4; p.c = Math.random() < 0.35 ? '#ffffff' : col; c++; GC.busy = true;
      }
    }
    if (!GC.busy) return;
    const s = GC.s; g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, GC.W, GC.H); g.globalCompositeOperation = 'lighter';
    let live = 0;
    for (let i = 0; i < GP.length; i++) {
      const p = GP[i]; if (p.l <= 0) continue; p.l -= dt; if (p.l <= 0) continue; live++;
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; const k = p.l / p.m;
      blit(g, p.c, p.x * s, p.y * s, (2.5 + 4 * k) * s, k); 
    }
    for (let i = 0; i < FL.length; i++) {
      const f = FL[i]; if (f.t >= 1) continue; f.t += dt / 0.5; live++; const u = Math.min(1, f.t), k = 1 - u;
      blit(g, '#ffffff', f.x * s, f.y * s, (4 + 6 * u) * s, k); blit(g, f.mj ? C.pink : C.violet, f.x * s, f.y * s, (10 + 22 * u) * s * (f.mj ? 1.3 : 1), k * 0.7);
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    if (!live) { g.clearRect(0, 0, GC.W, GC.H); GC.busy = false; }
  }
  function renderG(dt) {
    const u = clamp(G.u, 0, 1), ang = GA + GS * u;
    gNeedle.setAttribute('transform', 'rotate(' + (ang - 270).toFixed(2) + ' ' + CX + ' ' + CY + ')');
    
    const rem = RR * u * GS * Math.PI / 180;
    for (let i = 0; i < 3; i++) {
      const start = RR * SEG[i][0] * GS * Math.PI / 180, l = clamp(rem - start, 0, segLen[i]), d = l.toFixed(1) + ' 999';
      segLit[i].setAttribute('stroke-dasharray', d); segGlow[i].setAttribute('stroke-dasharray', d);
    }
    const tip2 = polar(u, 94); knob.style.transform = 'translate(' + (tip2[0] * G.scale).toFixed(1) + 'px,' + (tip2[1] * G.scale).toFixed(1) + 'px)';
    /* tick-by-tick: passed ticks glow, the one under the needle is hot */
    let hot = -1, bd = 0.02;
    for (let i = 0; i < gTk.length; i++) { const d = Math.abs(gTk[i].u - u); if (d < bd) { bd = d; hot = i; } }
    for (let i = 0; i < gTk.length; i++) {
      const k = gTk[i], st = i === hot ? 2 : k.u <= u + 1e-4 ? 1 : 0;
      if (st !== k.st) { if (st === 2) flare(i); k.st = st; k.ln.setAttribute('class', 'hr-gtick' + (k.tx ? ' mj' : '') + (st === 2 ? ' hot' : st ? ' lit' : '')); if (k.tx) k.tx.setAttribute('class', 'hr-glab' + (st ? ' lit' : '')); }
    }
    const r = dispRet(u), rs = fmtRet(r);
    if (rs !== G.lastRet) {
      G.lastRet = rs; setT(retEl, rs); setT(gTag, rs); G.capT = ANNUAL / (r / 100);
      setT(smallEl, J.usd(Math.round(25000 * r / 100 / 12)));
      const av = rs + ' a year, ' + fmtCap(G.capT) + ' of capital needed';
      rangeEl.setAttribute('aria-valuetext', av); knob.setAttribute('aria-valuetext', av); knob.setAttribute('aria-valuenow', String(r));
      const vi = verdIdx(r), z = zoneOf(r);
      if (G.zone !== vi) { G.zone = vi; setT(verdEl, VERD[vi]); verdEl.dataset.z = z; setT(noteD, z === 'r' ? 'the red end of the dial is the returns nobody delivers' : z === 'a' ? 'the amber middle is where backtests live and live accounts do not' : 'the green end is slow money: it needs a very large account'); }
      if (document.activeElement !== rangeEl) rangeEl.value = String(Math.round(clamp(G.uT, 0, 1) * 1000));
      $$('.hr-pb').forEach((b) => b.classList.toggle('on', Math.abs(+b.dataset.r - r) < 0.5));
    }
    G.cap += (G.capT - G.cap) * (dt ? 1 - Math.exp(-dt * 16) : 1);
    if (Math.abs(G.capT - G.cap) < G.capT * 0.0004) G.cap = G.capT;
    const cs = fmtCap(G.cap);
    if (cs !== G.lastCap) { G.lastCap = cs; setT(capEl, cs); setT(badgeD, cs); }
  }
  function setU(u, snap) {
    G.uT = clamp(u, 0, 1); G.rest = false; if (snap) { G.u = G.uT; G.v = 0; }
    if (reduce) { G.u = G.uT; G.v = 0; renderG(0); }
  }
  /** pointer drag: a weak detent pulls the target onto a magnet and fires one pulse on entering it */
  function dragU(u) {
    const m = magnet(u, 0.012);
    if (m !== magNow) { magNow = m; if (m >= 0) magPulse(m); }
    setU(m >= 0 ? MAGS[m] : u);
  }
  /** release: snap to the nearest magnet within ~8deg, with a velocity kick so the needle overshoots and settles like a detent */
  function settle() {
    magNow = -1;
    const m = magnet(G.uT, 0.03);
    if (m < 0) return;
    if (Math.abs(G.uT - MAGS[m]) > 1e-4 || !G.rest) { const dir = MAGS[m] >= G.u ? 1 : -1; magPulse(m); G.v += dir * 0.9; }
    setU(MAGS[m]);
  }
  const STEP = 0.01;
  function kbMove(dir, mult) {
    let t = G.uT + dir * STEP * mult;
    for (let i = 0; i < 3; i++) if ((MAGS[i] - G.uT) * dir > 1e-4 && (MAGS[i] - t) * dir <= 1e-4) { t = MAGS[i]; magPulse(i); G.v += dir * 0.5; break; }
    setU(t);
  }
  /* the gauge rect is cached for the length of a drag (re-read on pointerdown, after a resize, and after any scroll) instead of once per pointermove */
  let gRect = null;
  const dropRect = () => { gRect = null; };
  function ptrU(e, fresh) {
    if (fresh || !gRect) gRect = gsvg.getBoundingClientRect();
    const r = gRect, s = r.width / 320;
    let a = Math.atan2(e.clientY - r.top - CY * s, e.clientX - r.left - CX * s) * 180 / Math.PI; if (a < 0) a += 360;
    const d = (a - GA + 360) % 360;
    return d <= GS ? d / GS : d < GS + (360 - GS) / 2 ? 1 : 0;
  }
  const beginDrag = () => { G.drag = true; window.addEventListener('scroll', dropRect, { passive: true }); };
  knob.addEventListener('pointerdown', (e) => { beginDrag(); knob.setPointerCapture(e.pointerId); knob.classList.add('drag', 'used'); dragU(ptrU(e, true)); e.preventDefault(); });
  knob.addEventListener('pointermove', (e) => { if (G.drag) dragU(ptrU(e)); });
  const endDrag = () => { const was = G.drag; G.drag = false; knob.classList.remove('drag'); window.removeEventListener('scroll', dropRect); if (was) settle(); };
  knob.addEventListener('pointerup', endDrag); knob.addEventListener('pointercancel', endDrag); knob.addEventListener('lostpointercapture', endDrag);
  gsvg.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' && e.button === 0) { beginDrag(); gsvg.setPointerCapture(e.pointerId); knob.classList.add('used'); dragU(ptrU(e, true)); } });
  gsvg.addEventListener('pointermove', (e) => { if (G.drag && e.pointerType === 'mouse') dragU(ptrU(e)); });
  gsvg.addEventListener('pointerup', endDrag); gsvg.addEventListener('pointercancel', endDrag);
  gsvg.addEventListener('click', (e) => { if (e.pointerType === 'mouse') return; knob.classList.add('used'); setU(ptrU(e, true)); settle(); });
  rangeEl.addEventListener('input', () => { knob.classList.add('used'); setU(+rangeEl.value / 1000); });
  rangeEl.addEventListener('pointerup', () => { settle(); });
  knob.addEventListener('keydown', (e) => {
    const k = e.key, m = e.shiftKey ? 5 : 1;
    if (k === 'ArrowRight' || k === 'ArrowUp') kbMove(1, m); else if (k === 'ArrowLeft' || k === 'ArrowDown') kbMove(-1, m);
    else if (k === 'PageUp') kbMove(1, 5); else if (k === 'PageDown') kbMove(-1, 5);
    else if (k === 'Home') setU(0); else if (k === 'End') setU(1);
    else return;
    knob.classList.add('used'); e.preventDefault();
  });
  $$('.hr-pb').forEach((b) => b.addEventListener('click', () => { knob.classList.add('used'); const u = r2u(+b.dataset.r); setU(u); const m = magnet(u, 1e-3); if (m >= 0) { magPulse(m); G.v += (u >= G.u ? 1 : -1) * 0.6; } }));
  J.watch(gaugeEl, () => { gRect = null; G.scale = gsvg.clientWidth / 320; renderG(0); });
  J.task(gaugeEl, (t, dt) => {
    stepGC(dt);
    const k = G.drag ? 620 : 175, c = G.drag ? 46 : 17, d = G.uT - G.u;
    if (Math.abs(d) > 1e-4 || Math.abs(G.v) > 1e-3) {
      G.v += d * k * dt; G.v *= Math.exp(-c * dt); G.u += G.v * dt; G.rest = false; renderG(dt);
    } else if (!G.rest || Math.abs(G.capT - G.cap) > 0) { G.u = G.uT; G.v = 0; G.rest = true; renderG(dt); }
  });
  J.onView(gaugeEl, () => { if (!reduce) { setU(1, true); renderG(0); G.cap = ANNUAL / (u2r(1) / 100); setTimeout(() => { if (!knob.classList.contains('used')) setU(r2u(31)); }, 450); } }, { threshold: 0.5 });
  renderG(0);

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

  /* ---------- bus: kill switch + decisions ---------- */
  J.bus.on('kill', (v) => showKill(v));
  J.bus.on('floor', armText);
  J.bus.on('tier', () => { buildStaticA(); if (bt) layoutC(); });
  showKill(S.killed);
  if (reduce) { mode = 'static'; renderB(true, 0); updArm(); }
  else { mode = 'static'; }
});
