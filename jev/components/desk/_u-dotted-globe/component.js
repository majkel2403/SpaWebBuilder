    // ---- grid lines
    {
      let o = 0, anyF = false;
      for (let l = 0; l < LINES.length; l++) {
        const v = LINES[l], n = v.length / 3;
        for (let i = 0; i < n; i++) {
          const x = v[i * 3], y = v[i * 3 + 1], z = v[i * 3 + 2], x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw, y2 = y * ct - z1 * st, z2 = y * st + z1 * ct;
          LSX[o + i] = cx + R * x1; LSY[o + i] = cy - R * y2; LSZ[o + i] = z2;
        }
        o += n;
      }
      g.lineWidth = 1;
      for (let pass = lq > 1 ? 1 : 0; pass < 2; pass++) { // (the faint back-hemisphere pass is the first thing to go)
        g.strokeStyle = pass ? (km > 0.5 ? 'rgba(255,120,130,.13)' : 'rgba(120,190,255,.2)') : 'rgba(120,150,230,.06)'; g.beginPath(); o = 0;
        for (let l = 0; l < LINES.length; l++) {
          const n = LINES[l].length / 3; let pen = false;
          for (let i = 0; i < n; i++) { const fr = LSZ[o + i] > 0; if (fr === (pass === 1)) { if (!pen) { g.moveTo(LSX[o + i], LSY[o + i]); pen = true; } else g.lineTo(LSX[o + i], LSY[o + i]); } else pen = false; }
          o += n;
        }
        g.stroke();
      }
    }
    // ---- the point cloud
    const sxv = -0.62 + 0.1 * Math.sin(t * 0.045), syv = 0.4 + 0.05 * Math.sin(t * 0.031 + 1), szv = 0.62, sl = Math.hypot(sxv, syv, szv), kz = szv / sl, lit = TIER >= 3 && lq < 2 && alive > 0.02;
    const sux = sxv / sl, suy = syv / sl, suz = kz;
    bN.fill(0); LN4.fill(0);
    for (let i = 0; i < nPts; i++) {
      const x = PX[i], y = PY[i], z = PZ[i], x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw, y2 = y * ct - z1 * st, z2 = y * st + z1 * ct, kd = PK[i];
      SXa[i] = cx + R * x1; SYa[i] = cy - R * y2;
      const b = z2 > 0.02 ? kd * 4 + (z2 > 0.75 ? 3 : z2 > 0.45 ? 2 : z2 > 0.2 ? 1 : 0) : 16 + (kd > 1 ? 1 : 0);
      bIdx[b][bN[b]++] = i;
      if (lit && LITV[i] && z2 > 0.06) { const lum = x1 * sux + y2 * suy + z2 * suz; if (lum < -0.02) { const q = (lum < -0.22 ? 2 : 0) + LITV[i] - 1; LIX[q][LN4[q]++] = i; } }
    }
    const pal = PAL[ks];
    for (let b = 0; b < NBK; b++) {
      const n = bN[b]; if (!n) continue;
      const sz = BSZ[b] * dotK, h = sz / 2, ix = bIdx[b];
      g.fillStyle = pal[b]; g.beginPath();
      for (let j = 0; j < n; j++) { const i = ix[j]; g.rect(SXa[i] - h, SYa[i] - h, sz, sz); }
      g.fill();
    }
    g.globalCompositeOperation = 'lighter'; g.fillStyle = HALO[ks];
    for (let q = 0; q < 3; q++) {
      const b = q === 0 ? 11 : 13 + q, n = bN[b], ix = bIdx[b], sz = 4.6 * dotK, h = sz / 2; if (!n) continue;
      g.beginPath(); for (let j = 0; j < n; j++) { const i = ix[j]; g.rect(SXa[i] - h, SYa[i] - h, sz, sz); } g.fill();
    }
    if (lit) { // city lights on the night side
      const tw = 0.5 + 0.5 * Math.sin(t * 2.3), sz = 1.7 * dotK, h = sz / 2, base = km > 0.5 ? '255,120,90,' : '255,206,128,';
      for (let q = 0; q < 4; q++) {
        const n = LN4[q]; if (!n) continue;
        const ph = (q & 1) ? tw : 1 - tw; g.fillStyle = 'rgba(' + base + ((q > 1 ? 0.78 : 0.38) * (0.55 + 0.45 * ph) * alive).toFixed(2) + ')'; g.beginPath();
        const ix = LIX[q]; for (let j = 0; j < n; j++) { const i = ix[j]; g.rect(SXa[i] - h, SYa[i] - h, sz, sz); } g.fill();
        if (q > 1) { g.fillStyle = 'rgba(' + base + (0.07 * alive).toFixed(2) + ')'; g.beginPath(); for (let j = 0; j < n; j++) { const i = ix[j]; g.rect(SXa[i] - 2.4, SYa[i] - 2.4, 4.8, 4.8); } g.fill(); }
      }
    }
    // ---- day / night terminator: a soft, nested night crescent (the sun sits upper-left in view space and drifts slowly)
    {
      g.globalCompositeOperation = 'source-over'; g.save(); g.translate(cx, cy); g.rotate(Math.atan2(-syv, sxv));
      const nest = lq > 2 ? 1 : TIER >= 3 && lq < 2 ? 6 : 3, rr = R * 0.996;
      g.fillStyle = km > 0.5 ? 'rgba(20,0,6,' : 'rgba(2,5,24,';
      for (let q = 0; q < nest; q++) {
        const k = nest === 1 ? kz : nest === 6 ? kz + (1 - q * 0.4) * 0.17 : kz + (1 - q) * 0.17;
        g.globalAlpha = nest === 1 ? 0.3 : nest === 6 ? 0.075 : 0.13; g.beginPath(); g.arc(0, 0, rr, -Math.PI / 2, Math.PI / 2, true);
        for (let i = 0; i < TN; i++) g.lineTo(-k * rr * TC[i], rr * TS[i]);
        g.closePath(); g.fillStyle = km > 0.5 ? '#14000a' : '#02051a'; g.fill();
      }
      g.restore(); g.globalAlpha = 1; g.globalCompositeOperation = 'lighter';
      if (TIER >= 2 && alive > 0.02) { // sun side: warm bloom on the limb + a hairline of sunlight
        const ang = Math.atan2(-syv, sxv), gs = R * 1.5, wx = cx + Math.cos(ang) * R * 0.88, wy = cy + Math.sin(ang) * R * 0.88;
        g.globalAlpha = 0.3 * alive; g.drawImage(WARM, wx - gs / 2, wy - gs / 2, gs, gs);
        g.lineWidth = 1.6; g.strokeStyle = 'rgba(255,214,160,' + (0.5 * alive).toFixed(2) + ')'; g.beginPath(); g.arc(cx, cy, R * 1.006, ang - 0.85, ang + 0.85); g.stroke();
        g.lineWidth = 6; g.strokeStyle = 'rgba(255,170,100,' + (0.1 * alive).toFixed(2) + ')'; g.beginPath(); g.arc(cx, cy, R * 1.012, ang - 0.7, ang + 0.7); g.stroke(); g.globalAlpha = 1;
      }
    }
