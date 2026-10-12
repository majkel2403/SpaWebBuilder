
  function bezPts(p0, p1, p2, p3, n) {
    const o = new Float32Array((n + 1) * 2);
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
      o[i * 2] = a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0]; o[i * 2 + 1] = a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1];
    }
    return o;
  }
  function mkBeam(p0, p1, p2, p3, col, al, w, spd, off, dir, wide) {
    const path = new Path2D(); path.moveTo(p0[0], p0[1]); path.bezierCurveTo(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]);
    const mkg = (rgb, a) => { const gr = g.createLinearGradient(p0[0], p0[1], p3[0], p3[1]); if (dir === 0) { gr.addColorStop(0, 'rgba(' + rgb + ',0)'); gr.addColorStop(0.15, 'rgba(' + rgb + ',' + a * 0.6 + ')'); gr.addColorStop(0.6, 'rgba(' + rgb + ',' + a * 0.45 + ')'); gr.addColorStop(1, 'rgba(' + rgb + ',0)'); } else if (dir > 0) { gr.addColorStop(0, 'rgba(' + rgb + ',0)'); gr.addColorStop(0.1, 'rgba(' + rgb + ',' + a * 0.55 + ')'); gr.addColorStop(0.55, 'rgba(' + rgb + ',' + a * 0.5 + ')'); gr.addColorStop(1, 'rgba(' + rgb + ',' + a + ')'); } else { gr.addColorStop(0, 'rgba(' + rgb + ',' + a * 0.75 + ')'); gr.addColorStop(0.5, 'rgba(' + rgb + ',' + a * 0.4 + ')'); gr.addColorStop(1, 'rgba(' + rgb + ',0)'); } return gr; };
    const hx = COLS[col], n = parseInt(hx.slice(1), 16), rgb = (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
    BEAMS.push({ path, pts: bezPts(p0, p1, p2, p3, 40), col, al, w, spd, off, dir, gN: mkg(rgb, 1), gK: mkg('255,77,94', 1), wide });
  }

  function layout() {
    const f = J.fit(cv, { maxPx: PXBUD[QL] }); g = f.g; W = f.W; H = f.H; kx = cv.width / W; ky = cv.height / H; layDpr = Math.min(kx, LAYMAX);
    const cr = cv.getBoundingClientRect(); cks = cr.width / (cv.offsetWidth || 1) || 1;
    const rel = (el) => { const r = el.getBoundingClientRect(); return { x: (r.left - cr.left) / cks, y: (r.top - cr.top) / cks, w: r.width / cks, h: r.height / cks }; };
    const s = rel(stage); SX = s.x; SY = s.y; SW = s.w; SH = s.h;
    const pr0 = rel(port), sig = W + 'x' + H + '/' + (SX | 0) + ',' + (SY | 0) + ',' + (SW | 0) + ',' + (SH | 0) + '/' + (pr0.x | 0) + ',' + (pr0.y | 0) + '/' + cv.width + 'x' + cv.height;
    if (sig === lastSig) return; lastSig = sig;
    const single = body.offsetWidth < 640; compact = SW < 480;
    fontStr = '700 ' + (compact ? 8.5 : 9.5) + 'px ' + MONO;
    R = Math.max(70, Math.min(SW * (single ? 0.37 : 0.36), SH * (single ? 0.35 : 0.375)));
    cx = SX + SW / 2; cy = SY + SH * (single ? 0.46 : 0.5) + R * 0.04;
    dotK = clamp(R / 230, 0.8, 1.12); ptsBase = single ? Math.round(NPT * 0.7) : NPT; nPts = ptsFor();
    const os = (stage.querySelector('.dkw-ob') || {}).offsetWidth || 44; OB_OS = os;
    OB_X = cx; OB_Y = cy + R * 0.05; OB_RX = Math.max(R * 1.1, Math.min(SW / 2 - os * 0.8, R * 1.68)); OB_RY = R * (single ? 0.4 : 0.34);
    buildLayers();
    // beams: right set globe -> ticket port, left set feed rows -> globe
    BEAMS.length = 0;
    const tr = rel(tixEl), pr = rel(port), mode = tr.x > SX + SW - 60 ? 'side' : tr.y + 40 < H ? 'below' : 'single';
    const D = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    const rc = [0, 6, 1, 3, 0, 2, 3], rw = [1.1, 0.9, 1, 1.25, 0.9, 1, 0.9];
    for (let j = 0; j < 7; j++) {
      const th = (mode === 'side' ? -52 + j * 17.3 : 18 + j * 15) * D2R, c = Math.cos(th), sn = Math.sin(th);
      const p0 = [cx + c * R * 1.0, cy + sn * R * 1.0];
      let p3, ad;
      if (mode === 'side') { p3 = [pr.x + pr.w / 2 - 2, pr.y + pr.h / 2 + (j - 3) * 6]; ad = [1, 0]; }
      else if (mode === 'below') { p3 = [pr.x + pr.w / 2 - 2, pr.y + pr.h / 2 + (j - 3) * 5]; ad = [1, 0.15]; }
      else { p3 = [cx + (j - 3) * 20, SY + SH - 34]; ad = [0, 1]; }
      const d = D(p0, p3);
      mkBeam(p0, [p0[0] + c * d * 0.36, p0[1] + sn * d * 0.36], [p3[0] - ad[0] * d * 0.38, p3[1] - ad[1] * d * 0.38 + (j - 3) * 9], p3, rc[j], 1, rw[j], 0.22 + (j % 3) * 0.07, j * 0.37, mode === 'single' ? 0 : 1, true);
    }
    if (mode === 'side') {
      const rows = J.$$('.dkw-v', feedsEl), lc = [3, 4, 5, 1], lt = [150, 172, 192, 214];
      for (let j = 0; j < 4; j++) {
        const rr = rel(rows[1 + j * 2] || rows[0]), p0 = [rr.x + rr.w + 3, rr.y + rr.h / 2], th = lt[j] * D2R, p3 = [cx + Math.cos(th) * R, cy + Math.sin(th) * R], d = D(p0, p3);
        mkBeam(p0, [p0[0] + d * 0.38, p0[1]], [p3[0] + Math.cos(th) * d * 0.4, p3[1] + Math.sin(th) * d * 0.4], p3, lc[j], 0.55, 0.8, 0.2 + j * 0.05, j * 0.29, -1, false);
      }
    }
    // oracle spark canvas
    if (ocv) { const o = J.fit(ocv); og = o.g; OW = o.W; OH = o.H; ogFill = og.createLinearGradient(0, 0, 0, OH); ogFill.addColorStop(0, 'rgba(120,170,255,.36)'); ogFill.addColorStop(1, 'rgba(120,170,255,0)'); drawOracle(); }
    // a resize clears the canvas: redraw right away (also keeps reduced-motion, where the task freezes, from going blank)
    draw(J.time || 0, 0); orbits(J.time || 0, 0);
  }

