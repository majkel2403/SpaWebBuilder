    // ---- stars
    g.fillStyle = '#cfe3ff';
    for (let i = 0; i < STARS.length; i += lq > 2 ? 2 : 1) { const s = STARS[i], pu = s.u + yaw * 0.008 * s.s; g.globalAlpha = (0.12 + 0.45 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph))) * (1 - 0.5 * km); g.fillRect(SX + (pu - Math.floor(pu)) * SW, SY + s.v * SH, s.s, s.s); }
    if (TIER >= 3) { // depth stars: twinkle + parallax with the spin and tilt; a few get a cross flare
      const cy0 = (tilt - 0.4) * 26;
      for (let i = 0; i < STARS2.length; i += lq > 1 ? 2 : 1) {
        const s = STARS2[i], pu = s.u + yaw * 0.014 * s.d, tw = 0.5 + 0.5 * Math.sin(t * s.sp + s.ph), x = SX + (pu - Math.floor(pu)) * SW, y = SY + s.v * SH + cy0 * s.d;
        g.globalAlpha = (0.2 + 0.6 * tw) * (1 - 0.5 * km); g.fillStyle = s.d > 1.4 ? '#fff' : '#bcd4ff'; g.fillRect(x, y, 1.6, 1.6);
        if (s.f && tw > 0.55) { const L = 3 + 6 * tw; g.globalAlpha = (tw - 0.5) * 1.2 * (1 - 0.5 * km); g.fillRect(x + 0.8 - L, y + 0.5, L * 2, 0.6); g.fillRect(x + 0.5, y + 0.8 - L, 0.6, L * 2); }
      }
    }
    g.globalAlpha = 1;
