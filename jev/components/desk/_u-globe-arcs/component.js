    // ---- ambient traffic + arcs
    if (!killed) {
      ambient -= dt;
      if (ambient < 0) { ambient = rnd(0.14, 0.42); const ai = (Math.random() * ARCS.length) | 0, col = AMB_COL[(Math.random() * 6) | 0]; if (spawn(0, ai, col, rnd(0.3, 0.55), Math.random() < 0.5, 1.1)) ARCS[ai].lit = Math.min(1, ARCS[ai].lit + 0.4); }
    }
    for (let a = 0; a < ARCS.length; a++) {
      const A = ARCS[a], pts = A.pts; A.lit = Math.max(0, A.lit - dt * 0.42);
      for (let i = 0; i <= ARC_SEG; i++) {
        const x = pts[i * 3], y = pts[i * 3 + 1], z = pts[i * 3 + 2], x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw, y2 = y * ct - z1 * st, z2 = y * st + z1 * ct;
        A.sx[i] = cx + R * x1; A.sy[i] = cy - R * y2; A.sz[i] = z2; A.vis[i] = z2 > 0.01 || x1 * x1 + y2 * y2 > 1.0 ? 1 : 0;
      }
      g.strokeStyle = km > 0.5 ? COLS[7] : COLS[A.col];
      const np = TIER >= 3 && lq < 2 && A.lit > 0.08 ? 3 : 2;
      for (let pass = 0; pass < np; pass++) {
        if (pass === 2) { g.lineWidth = 16; g.globalAlpha = 0.07 * A.lit * (1 - 0.7 * km); } else {
        g.lineWidth = pass ? 1.3 + A.lit * 0.8 : 6.5; g.globalAlpha = pass ? (0.34 + 0.6 * A.lit) * (1 - 0.7 * km) : (0.07 + 0.2 * A.lit) * (1 - 0.7 * km); }
        g.beginPath(); let pen = false;
        for (let i = 0; i <= ARC_SEG; i++) { if (A.vis[i]) { if (!pen) { g.moveTo(A.sx[i], A.sy[i]); pen = true; } else g.lineTo(A.sx[i], A.sy[i]); } else pen = false; }
        g.stroke();
      }
    }
    g.globalAlpha = 1;
    // ---- packets (arc packets + beam bursts)
    for (let k = 0; k < POOL.length; k++) {
      const p = POOL[k]; if (!p.on) continue;
      if (killed) { p.on = 0; continue; }
      p.t += p.spd * dt; if (p.t >= 1) { p.on = 0; if (p.kind === 0) { ARCS[p.idx].lit = Math.min(1, ARCS[p.idx].lit + 0.3); const c = p.rev ? ARCS[p.idx].a : ARCS[p.idx].b; FL[c] = Math.min(1, FL[c] + 0.8); if (TIER >= 2) ripple(c, p.col); } continue; }
      if (p.kind === 0) {
        const A = ARCS[p.idx], tt = p.rev ? 1 - p.t : p.t, f = tt * ARC_SEG, i0 = Math.min(ARC_SEG - 1, f | 0), fr = f - i0;
        if (!A.vis[i0] || !A.vis[i0 + 1]) continue;
        const x = A.sx[i0] + (A.sx[i0 + 1] - A.sx[i0]) * fr, y = A.sy[i0] + (A.sy[i0 + 1] - A.sy[i0]) * fr;
        const dir = p.rev ? 1 : -1, nT = lq > 2 ? 4 : TIER >= 3 && lq < 2 ? 12 : 8; let ox = x, oy = y; g.strokeStyle = COLS[p.col]; g.lineCap = 'round';
        for (let j = 1; j <= nT; j++) {
          const tf = clamp(tt + dir * j * 0.02, 0, 1) * ARC_SEG, i1 = Math.min(ARC_SEG - 1, tf | 0), f1 = tf - i1; if (!A.vis[i1] || !A.vis[i1 + 1]) break;
          const nx = A.sx[i1] + (A.sx[i1 + 1] - A.sx[i1]) * f1, ny = A.sy[i1] + (A.sy[i1 + 1] - A.sy[i1]) * f1, k = 1 - j / (nT + 1);
          g.globalAlpha = 0.75 * k * k; g.lineWidth = 0.6 + 2.4 * k; g.beginPath(); g.moveTo(ox, oy); g.lineTo(nx, ny); g.stroke(); ox = nx; oy = ny;
        }
        g.lineCap = 'butt';
        g.globalAlpha = 1; const sz = 22 * p.sz; g.drawImage(SPR[p.col], x - sz / 2, y - sz / 2, sz, sz);
        if (TIER >= 3 && lq < 2) { const bz = sz * 2.1; g.globalAlpha = 0.3; g.drawImage(SPR[p.col], x - bz / 2, y - bz / 2, bz, bz); g.globalAlpha = 1; }
      } else {
        const B = BEAMS[p.idx]; if (!B) continue; const f = p.t * 40, i0 = Math.min(39, f | 0), fr = f - i0, q = B.pts;
        const x = q[i0 * 2] + (q[i0 * 2 + 2] - q[i0 * 2]) * fr, y = q[i0 * 2 + 1] + (q[i0 * 2 + 3] - q[i0 * 2 + 1]) * fr, sz = 26 * p.sz;
        beamTail(q, i0, x, y, -1, lq > 2 ? 4 : 8, p.col, 0.7); g.globalAlpha = 1;
        g.drawImage(SPR[p.col], x - sz / 2, y - sz / 2, sz, sz);
      }
    }
    g.globalAlpha = 1;
