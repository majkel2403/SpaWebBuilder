    // ---- agent orbs: light halos (+ a soft reflection on the globe for the ones passing in front of it)
    if (TIER >= 2 && alive > 0.02) {
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < OB.length; i++) {
        const o = OB[i], dd = o.d * 0.5 + 0.5, sc = (0.66 + 0.34 * dd) * (1 + 0.26 * o.act), hs = OB_OS * 3.1 * sc, ox = o.x, oy = o.y, al = (0.2 + 0.5 * o.act) * (0.5 + 0.5 * dd) * alive;
        g.globalAlpha = al; g.drawImage(SPR[AGCOL[i]], ox - hs / 2, oy - hs / 2, hs, hs);
        if (o.d > 0.05 && TIER >= 2) {
          const dx = cx - ox, dy = cy - oy, dist = Math.hypot(dx, dy) || 1;
          if (dist < R * 1.5) {
            const k = Math.min(0.5, (dist - R * 0.5) / dist), rxp = ox + dx * Math.max(0.15, k), ryp = oy + dy * Math.max(0.15, k), rs = R * (0.5 + 0.2 * o.act);
            g.globalAlpha = (0.14 + 0.2 * o.act) * alive * clamp(1.4 - dist / (R * 1.3), 0.15, 1); g.drawImage(SPR[AGCOL[i]], rxp - rs / 2, ryp - rs / 2, rs, rs);
          }
        }
      }
      g.globalAlpha = 1;
    }
    // ---- orbit track, front half (over the globe)
    g.globalCompositeOperation = 'source-over'; g.setLineDash(DASH); g.lineWidth = 1; g.strokeStyle = km > 0.5 ? 'rgba(255,150,160,.34)' : 'rgba(190,215,255,.34)';
    g.beginPath(); g.ellipse(OB_X, OB_Y, OB_RX, OB_RY, OB_ROT, 0, Math.PI); g.stroke(); g.setLineDash(EMPTY);
    // ---- beams: globe -> ticket port, feeds -> globe
    g.globalCompositeOperation = 'lighter';
    for (let b = 0; b < BEAMS.length; b++) {
      const B = BEAMS[b], al = B.al * (0.6 + 0.4 * Math.sin(t * 0.9 + B.off * 6));
      if (alive > 0.01) { g.strokeStyle = B.gN; if (lq < 3) { g.lineWidth = B.w * 6; g.globalAlpha = al * 0.15 * alive; g.stroke(B.path); } g.lineWidth = B.w * 1.2; g.globalAlpha = al * 0.9 * alive; g.stroke(B.path); }
      if (km > 0.01) { g.strokeStyle = B.gK; g.lineWidth = B.w; g.globalAlpha = al * 0.32 * km; g.stroke(B.path); }
      if (!killed) {
        const u = (t * B.spd + B.off) % 1, f = u * 40, i0 = Math.min(39, f | 0), fr = f - i0, q = B.pts, x = q[i0 * 2] + (q[i0 * 2 + 2] - q[i0 * 2]) * fr, y = q[i0 * 2 + 1] + (q[i0 * 2 + 3] - q[i0 * 2 + 1]) * fr;
        beamTail(q, i0, x, y, B.dir >= 0 ? -1 : 1, lq > 2 ? 4 : 7, B.col, 0.7 * al * (B.wide ? 1 : 0.8)); g.globalAlpha = 0.9 * (B.wide ? 1 : 0.7); const sz = 20 + (B.wide ? 6 : 0); g.drawImage(SPR[B.col], x - sz / 2, y - sz / 2, sz, sz);
      }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  /** tapered comet tail along a bezier polyline (pts = flat x,y; i0 = segment of the head; sgn -1 trails toward index 0) */
  function beamTail(q, i0, x, y, sgn, n, col, a0) {
    let ox = x, oy = y; g.strokeStyle = COLS[col]; g.lineCap = 'round';
    for (let j = 1; j <= n; j++) {
      const ii = sgn < 0 ? i0 - j + 1 : i0 + j; if (ii < 0 || ii > 40) break;
      const nx = q[ii * 2], ny = q[ii * 2 + 1], k = 1 - j / (n + 1);
      g.globalAlpha = a0 * k * k; g.lineWidth = 0.6 + 2.2 * k; g.beginPath(); g.moveTo(ox, oy); g.lineTo(nx, ny); g.stroke(); ox = nx; oy = ny;
    }
    g.lineCap = 'butt';
  }
  let slowAcc = 0;

