
  /* ================================================================ packets, markers, rendering ================================================================ */
  const POOL = Array.from({ length: 40 }, () => ({ on: 0, kind: 0, idx: 0, t: 0, spd: 0.5, col: 0, rev: 0, sz: 1 }));
  function spawn(kind, idx, col, spd, rev, sz) {
    for (let i = 0; i < POOL.length; i++) { const p = POOL[i]; if (!p.on) { p.on = 1; p.kind = kind; p.idx = idx; p.t = 0; p.spd = spd; p.col = col; p.rev = rev ? 1 : 0; p.sz = sz || 1; return p; } }
    return null;
  }
  const FL = new Float32Array(CITIES.length), MX = new Float32Array(CITIES.length), MY = new Float32Array(CITIES.length), MZ = new Float32Array(CITIES.length);
  let tiltOff = 0, hoverCity = -1, kbi = -1;
  let yaw = 0.2, yawVel = 0, tilt = 0.4, focusYaw = null, focusHold = 0, focusCity = -1, dragging = false, ambient = 0.5;
  const AUTO = 0.1;
  const EMPTY = [], DASH = [2, 7];

  // quality governor: the draw cost (median-ish mean over GOV_N draws, warm-up skipped) steps the globe down one level when it stays above the level's
  // budget (ms): 1 = 30 fps while idle · 2 = 0.75x dots, no back-hemisphere grid · 3 = 0.56x dots, thinner aurora / beams / comets, smaller backing store. Never steps up.
  const GOV_N = 90, GOV_THR = [5, 9, 12], gCost = new Float32Array(GOV_N);
  let gI = 0, gSkip = 30, acc = 0;
  const ptsFor = () => Math.min(ptsBase, Math.max(1200, Math.round(ptsBase * PQ[QL])));
  function govern(ms) {
    if (J.reduce || QL >= 3) return;
    if (gSkip > 0) { gSkip--; return; }
    gCost[gI++] = ms; if (gI < GOV_N) return;
    gI = 0; gCost.sort(); let m = 0; const k = (GOV_N * 0.8) | 0; for (let i = 0; i < k; i++) m += gCost[i]; m /= k;
    if (m > GOV_THR[QL]) {
      QL++; gSkip = 30; root.dataset.dkwQ = QL; nPts = ptsFor();
      if (QL === 3) { lastSig = ''; layout(); } // smaller backing store
    }
  }
  /** frame task: the globe draws every frame (every other one once the governor has stepped in and nothing is being dragged / focused); the DOM agents move every frame */
  function frame(t, dt) {
    if (!g) return;
    acc += dt;
    if (QL < 1 || dragging || focusYaw !== null || Math.abs(yawVel) > 0.08 || acc >= 0.028) { const a = performance.now(); draw(t, acc); acc = 0; govern(performance.now() - a); }
    orbits(t, dt);
    slowAcc += dt; if (slowAcc > 0.25) { slowAcc = 0; slow(); }
  }
  function draw(t, dt) {
    killMix += ((killed ? 1 : 0) - killMix) * Math.min(1, dt * 2.6);
    if (Math.abs(killMix - (killed ? 1 : 0)) < 0.003) killMix = killed ? 1 : 0;
    const km = killMix, ks = Math.round(km * 10), alive = 1 - km, lq = QL, TIER = J.tier || 2;
    // ---- rotation: idle spin · drag inertia · focus-a-venue
    if (!dragging) {
      if (focusYaw !== null) {
        let d = focusYaw - yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); yaw += d * Math.min(1, dt * 3.2);
        if (Math.abs(d) < 0.03) { focusHold -= dt; if (focusHold <= 0) { focusYaw = null; setFocusRow(-1); } }
      } else { yaw += (AUTO * (1 - 0.85 * km) + yawVel) * dt; yawVel *= Math.exp(-dt * 2.2); }
    }
    if (!dragging) tiltOff *= Math.exp(-dt * 2.4);
    tilt = 0.4 + 0.045 * Math.sin(t * 0.21) + tiltOff;
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt);
    g.setTransform(kx, 0, 0, ky, 0, 0);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, W, H);
