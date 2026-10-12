    // ---- venue markers
    g.font = fontStr; g.textBaseline = 'middle'; if ('letterSpacing' in g) g.letterSpacing = '1.2px';
    const mcol = km > 0.5 ? COLS[7] : COLS[3];
    for (let i = 0; i < CITIES.length; i++) {
      const v = CITIES[i].v, x = v[0], y = v[1], z = v[2], x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw, y2 = y * ct - z1 * st, z2 = y * st + z1 * ct;
      const sx = cx + R * x1, sy = cy - R * y2; MX[i] = sx; MY[i] = sy; MZ[i] = z2; FL[i] = Math.max(0, FL[i] - dt * 1.5);
      if (z2 < 0.02) continue;
      const fa = clamp(z2 * 2.4, 0, 1), fl = FL[i], ang = Math.atan2(sy - cy, sx - cx) + Math.PI / 2;
      g.strokeStyle = mcol; g.lineWidth = 1.2;
      for (let k = 0; k < 2; k++) {
        const ph = (t * 0.5 + i * 0.41 + k * 0.5) % 1, rr = (3 + ph * 15) * (0.8 + 0.2 * dotK) + fl * 4;
        g.globalAlpha = (1 - ph) * 0.75 * fa * (0.5 + fl); g.beginPath(); g.ellipse(sx, sy, rr, rr * (0.3 + 0.7 * z2), ang, 0, TAU); g.stroke();
      }
      g.globalAlpha = fa; const gs = 22 + fl * 22; g.drawImage(SPR[km > 0.5 ? 7 : 3], sx - gs / 2, sy - gs / 2, gs, gs);
      g.globalCompositeOperation = 'source-over'; g.fillStyle = '#fff'; g.fillRect(sx - 1.5, sy - 1.5, 3, 3);
      if (z2 > 0.28 && !(compact && z2 < 0.45)) {
        const dx = sx - cx, dy = sy - cy, dl = Math.hypot(dx, dy) || 1, nx = dx / dl, ny = dy / dl, lx = sx + nx * 15, ly = sy + ny * 12 - 3;
        g.globalAlpha = fa * (0.65 + 0.35 * fl); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(sx + nx * 3, sy + ny * 3); g.lineTo(lx - nx * 2, ly + 3); g.stroke();
        g.textAlign = nx > 0.35 ? 'left' : nx < -0.35 ? 'right' : 'center'; const tx = lx + (nx > 0.35 ? 1 : nx < -0.35 ? -1 : 0);
        g.lineWidth = 3; g.strokeStyle = 'rgba(4,2,10,.9)'; g.strokeText(CITIES[i].c, tx, ly); g.fillStyle = fl > 0.2 ? '#fff' : '#d8e8ff'; g.fillText(CITIES[i].c, tx, ly);
      }
      g.globalCompositeOperation = 'lighter';
    }
    g.globalAlpha = 1;
    // ---- impact ripples: rings expanding over the sphere surface where packets land on a venue
    for (let r = 0; r < RP.length; r++) {
      const p = RP[r]; if (!p.on) continue;
      p.t += dt * 0.85; if (p.t >= 1 || killed) { p.on = 0; continue; }
      const c = p.c, z2 = MZ[c]; if (z2 < 0.06) continue;
      const sx = MX[c], sy = MY[c], ang = Math.atan2(sy - cy, sx - cx) + Math.PI / 2, fa = clamp(z2 * 2.4, 0, 1); g.strokeStyle = COLS[p.col];
      for (let k = 0; k < 2; k++) {
        const ph = clamp(p.t - k * 0.2, 0, 1); if (ph <= 0) continue; const rr = 5 + ph * R * (k ? 0.17 : 0.24), u = 1 - ph;
        g.globalAlpha = u * u * 0.85 * fa; g.lineWidth = 0.6 + 2.2 * u; g.beginPath(); g.ellipse(sx, sy, rr, rr * (0.25 + 0.75 * z2), ang, 0, TAU); g.stroke();
      }
    }
    g.globalAlpha = 1;
    if (TIER >= 2) { // ring system, front half + satellites with trails
      g.globalCompositeOperation = 'source-over'; g.lineWidth = 1; g.strokeStyle = km > 0.5 ? 'rgba(255,150,160,.18)' : 'rgba(170,200,255,.18)';
      for (let r = 0; r < RINGS.length; r++) { const rg = RINGS[r]; g.beginPath(); g.ellipse(cx, cy, rg.k * R, rg.k * R * rg.m, rg.rot, 0, Math.PI); g.stroke(); }
      if (TIER >= 3 && lq < 2) {
        g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
        for (let r = 0; r < RINGS.length; r++) {
          const rg = RINGS[r];
          for (let s = 0; s < 2; s++) {
            const a = t * rg.sp[s] + s * 3.1 + r * 1.3, dr = rg.sp[s] > 0 ? 1 : -1; ringPt(rg, a); let ox = _px, oy = _py; const vis = _pf;
            g.strokeStyle = km > 0.5 ? '#ff9aa4' : '#cfe6ff';
            for (let j = 1; j <= 5; j++) { ringPt(rg, a - dr * j * 0.045); if (_pf && vis) { g.globalAlpha = 0.6 * (1 - j / 6); g.lineWidth = 1.5 - j * 0.2; g.beginPath(); g.moveTo(ox, oy); g.lineTo(_px, _py); g.stroke(); } ox = _px; oy = _py; }
            ringPt(rg, a); if (_pf) { g.globalAlpha = 0.95; g.fillStyle = '#fff'; g.fillRect(_px - 1.2, _py - 1.2, 2.4, 2.4); g.globalAlpha = 0.5; g.drawImage(SPR[km > 0.5 ? 7 : 3], _px - 7, _py - 7, 14, 14); }
          }
        }
        g.lineCap = 'butt'; g.globalAlpha = 1;
      }
    }
