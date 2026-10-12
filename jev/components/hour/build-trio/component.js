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

