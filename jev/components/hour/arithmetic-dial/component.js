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

