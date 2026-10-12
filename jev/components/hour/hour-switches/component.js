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

