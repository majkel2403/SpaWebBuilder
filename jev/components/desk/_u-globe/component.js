    // ---- aurora ribbons over the upper hemisphere
    if (alive > 0.02) {
      for (let r = 0; r < AUR.length; r++) {
        const A = AUR[r];
        for (let i = 0; i < AM; i++) {
          const s = i / (AM - 1), lat = (A.lat + A.amp * Math.sin(s * 4.3 + t * 0.35 + A.ph)) * D2R, lon = (A.lon + s * A.span + t * A.spd) * D2R, cl = Math.cos(lat);
          const vx = cl * Math.sin(lon), vy = Math.sin(lat), vz = cl * Math.cos(lon);
          const hh = A.h * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(s * 7.1 - t * 0.9 + A.ph))) * Math.pow(Math.sin(Math.PI * s), 0.7), r0 = 1.025, r1 = r0 + hh;
          const bx = vx * r0, by = vy * r0, bz = vz * r0, tx = vx * r1, ty = vy * r1, tz = vz * r1;
          const b1 = bx * cyw + bz * syw, bz1 = -bx * syw + bz * cyw, b2 = by * ct - bz1 * st, bzz = by * st + bz1 * ct;
          const t1 = tx * cyw + tz * syw, tz1 = -tx * syw + tz * cyw, t2 = ty * ct - tz1 * st;
          ABX[i] = cx + R * b1; ABY[i] = cy - R * b2; ATX[i] = cx + R * t1; ATY[i] = cy - R * t2;
          AV[i] = bzz > -0.04 || b1 * b1 + b2 * b2 > 1.02 ? 1 : 0;
        }
        for (let l = 0; l < 3; l++) {
          if (l === 1 && lq > 2) continue;
          g.fillStyle = A.fs[l]; g.globalAlpha = alive; g.beginPath();
          for (let i = 0; i < AM - 1; i++) {
            if (!AV[i] || !AV[i + 1]) continue; const f = AFR[l];
            g.moveTo(ABX[i], ABY[i]); g.lineTo(ABX[i + 1], ABY[i + 1]); g.lineTo(ABX[i + 1] + (ATX[i + 1] - ABX[i + 1]) * f, ABY[i + 1] + (ATY[i + 1] - ABY[i + 1]) * f); g.lineTo(ABX[i] + (ATX[i] - ABX[i]) * f, ABY[i] + (ATY[i] - ABY[i]) * f); g.closePath();
          }
          g.fill();
        }
        g.strokeStyle = A.ridge; g.globalAlpha = alive; g.lineWidth = 1.3; g.beginPath(); let pen = false;
        for (let i = 0; i < AM; i++) { if (AV[i]) { if (!pen) { g.moveTo(ABX[i], ABY[i]); pen = true; } else g.lineTo(ABX[i], ABY[i]); } else pen = false; }
        g.stroke();
      }
      g.globalAlpha = 1;
    }
    // ---- radar sweep: one parallel scans pole to pole every ~9 s
    {
      const sp = (t % 9) / 6;
      if (sp < 1 && alive > 0.05) {
        const lat = (-72 + 144 * sp) * D2R, cl = Math.cos(lat), sl = Math.sin(lat), fade = Math.sin(Math.PI * sp);
        for (let pass = 0; pass < 2; pass++) {
          g.strokeStyle = pass ? 'rgb(190,250,255)' : 'rgb(59,224,255)'; g.globalAlpha = (pass ? 0.7 : 0.16) * fade * alive; g.lineWidth = pass ? 1.2 : 7; g.beginPath(); let pen = false;
          for (let i = 0; i <= 64; i++) {
            const lo = (i / 64) * TAU, x = cl * Math.sin(lo), z = cl * Math.cos(lo), x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw, y2 = sl * ct - z1 * st, z2 = sl * st + z1 * ct;
            if (z2 > 0) { if (!pen) { g.moveTo(cx + R * x1, cy - R * y2); pen = true; } else g.lineTo(cx + R * x1, cy - R * y2); } else pen = false;
          }
          g.stroke();
        }
        g.globalAlpha = 1;
      }
    }
    // ---- rim comets
    for (let c = 0; c < 2; c++) {
      const a0 = t * (c ? -0.33 : 0.5) + c * 2.4, cs = COMET[km > 0.5 ? 1 : 0][c];
      for (let j = 0; j < (lq > 2 ? 4 : 7); j++) {
        g.strokeStyle = cs[j]; g.lineWidth = 2.4 - j * 0.15; g.beginPath();
        if (c) g.arc(cx, cy, R * 1.008, a0 + j * 0.1, a0 + j * 0.1 + 0.11); else g.arc(cx, cy, R * 1.008, a0 - (j + 1) * 0.1, a0 - j * 0.1);
        g.stroke();
      }
    }
