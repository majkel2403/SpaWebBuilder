  /* ------------------------------------------------------------------ fx : ribbons · comet · bursts (2 canvases) ------------------------------------------------------------------ */
  const fx = (() => {
    const c0 = $('#lab-fx0'), c1 = $('#lab-fx1');
    let g0 = null, g1 = null, W = 0, H = 0, L = null;
    const SC = [C.blue, C.pink, C.orange, C.green];
    const spr = {};
    const sprite = (col) => {
      if (spr[col]) return spr[col];
      const s = document.createElement('canvas'); s.width = s.height = 64;
      const g = s.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.16, J.rgba(col, 0.95)); gr.addColorStop(0.5, J.rgba(col, 0.26)); gr.addColorStop(1, J.rgba(col, 0));
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      return (spr[col] = s);
    };
    [C.blue, C.pink, C.orange, C.green, C.red, C.amber, C.pink2, '#b8b2c2', '#ffffff'].forEach(sprite);
    const act = [0, 0, 0], np = [0, 0, 0, 0];
    const cm = { y: 0, from: 0, to: 0, t0: 0, a: 0, fade: false, si: 0, pend: 0, pt: 0 };
    const rp = [];
    for (let g = 0; g < 3; g++) for (let k = 0; k < 14; k++) rp.push({ g, r: 0, u: Math.random(), sp: 0.3 + Math.random() * 0.5 });
    const sd = [];
    for (let k = 0; k < 7; k++) sd.push({ ph: k / 7 + Math.random() * 0.05 });
    const BP = Array.from({ length: 190 }, () => ({ gv: 40, dm: 1.8, on: 0, x: 0, y: 0, vx: 0, vy: 0, t: 0, d: 1, s: 10, c: C.pink }));
    const RG = Array.from({ length: 20 }, () => ({ on: 0, x: 0, y: 0, t0: 0, d: 600, r0: 4, r1: 60, c: C.pink, lw: 2, dir: 1 }));
    const BD = Array.from({ length: 10 }, () => ({ on: 0, x: 0, w: 0, y0: 0, y1: 0, h: 20, t0: 0, d: 600, c: C.amber, fl: 0 }));
    const MT = Array.from({ length: 40 }, (_, i) => ({ x: Math.random(), y: Math.random(), z: 0.25 + Math.random() * 0.75, ph: Math.random() * 6.28, c: SC[i & 3] }));
    const fl = [0, 0, 0, 0], FI = { on: 0, t0: 0, d: 520, x0: 0, y0: 0, x1: 0, y1: 0, cx: 0, cy: 0, c: C.green, dest: 'execute' };
    let landCb = null;
    const FL = Array.from({ length: 40 }, () => ({ on: 0, x0: 0, y0: 0, x1: 0, y1: 0, cx: 0, cy: 0, t0: 0, d: 600, c: C.pink, s: 14 }));

    function off(el) {
      let x = 0, y = 0, e = el;
      while (e && e !== pipe) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
      return { x, y, w: el.offsetWidth, h: el.offsetHeight };
    }
    function mk(src, dst) {
      const rb = [];
      if (!src.length || !dst.length) return rb;
      for (let i = 0; i < src.length; i++) rb.push({ x0: src[i], x1: dst[Math.min(dst.length - 1, Math.floor(i * dst.length / src.length))] });
      for (let j = 0; j < dst.length; j++) rb.push({ x0: src[Math.min(src.length - 1, Math.floor(j * src.length / dst.length))], x1: dst[j] });
      return rb;
    }
    function measure() {
      const st = stg.map(off);
      const sx = Math.max(7, parseFloat(getComputedStyle(pipe).paddingLeft) / 2 - 1);
      const nodes = stg.map((s) => { const h = off($('.lab-sh', s)); return h.y + h.h / 2; });
      const cx = (o) => o.x + o.w / 2;
      const chips = CH.map((c) => off(c.el)), maxB = Math.max.apply(null, chips.map((o) => o.y + o.h));
      const src0 = chips.filter((o) => o.y + o.h > maxB - 4).map(cx);
      const qp = $$('.lab-q', stg[1]).map(off), minQ = Math.min.apply(null, qp.map((o) => o.y)), maxQ = Math.max.apply(null, qp.map((o) => o.y + o.h));
      const dst0 = qp.filter((o) => o.y < minQ + 4).map(cx), src1 = qp.filter((o) => o.y + o.h > maxQ - 4).map(cx);
      const s3 = st[2], fan = [0.28, 0.5, 0.72].map((p) => s3.x + s3.w * p);
      const ap = [$('.lab-jsw', stg[3]), $('.lab-tree', stg[3]), $('.lab-dest', stg[3])].map(off), minA = Math.min.apply(null, ap.map((o) => o.y));
      const dst2 = ap.filter((o) => o.y < minA + 4).map(cx);
      const gaps = [
        { y0: st[0].y + st[0].h, y1: st[1].y, rb: mk(src0, dst0) },
        { y0: st[1].y + st[1].h, y1: st[2].y, rb: mk(src1, fan) },
        { y0: st[2].y + st[2].h, y1: st[3].y, rb: mk(fan, dst2) },
      ];
      const fo = {};
      ['execute', 'review', 'skip'].forEach((k) => (fo[k] = off(folders[k].el)));
      const fi = {}; ['execute', 'review', 'skip'].forEach((k) => (fi[k] = off(folders[k].list)));
      L = { sx, st, n: nodes, gaps, gt: off(gt), dest: off(destEl), js: off($('.lab-jsw', stg[3])), fo, fi };
      if (cm.a < 0.01) { cm.y = nodes[0]; cm.from = nodes[0]; cm.to = nodes[0]; }
    }
    function drawStatic() {
      if (!g0 || !L) return;
      const g = g0, killed = J.S.killed;
      g.clearRect(0, 0, W, H);
      const y0 = L.n[0], y1 = L.n[3], sx = L.sx;
      const gr = g.createLinearGradient(0, y0, 0, y1);
      SC.forEach((c, i) => gr.addColorStop(i / 3, J.rgba(killed ? C.red : c, 0.7)));
      g.lineCap = 'round';
      g.strokeStyle = gr; g.lineWidth = 1.4; g.beginPath(); g.moveTo(sx, y0); g.lineTo(sx, y1); g.stroke();
      g.globalAlpha = 0.14; g.lineWidth = 7; g.stroke(); g.globalAlpha = 1;
      L.gaps.forEach((gp, i) => {
        const dy = gp.y1 - gp.y0;
        if (dy < 6) return;
        const lg = g.createLinearGradient(0, gp.y0, 0, gp.y1);
        lg.addColorStop(0, J.rgba(killed ? C.red : SC[i], 0.5)); lg.addColorStop(1, J.rgba(killed ? C.red : SC[i + 1], 0.5));
        g.strokeStyle = lg;
        gp.rb.forEach((r) => {
          g.beginPath(); g.moveTo(r.x0, gp.y0); g.bezierCurveTo(r.x0, gp.y0 + dy * 0.6, r.x1, gp.y1 - dy * 0.6, r.x1, gp.y1);
          g.lineWidth = 1; g.globalAlpha = 0.55; g.stroke();
          g.lineWidth = 5; g.globalAlpha = 0.07; g.stroke();
        });
        g.globalAlpha = 1;
      });
      L.n.forEach((y, i) => {
        const c = killed ? C.red : SC[i];
        g.strokeStyle = J.rgba(c, 0.45); g.lineWidth = 1; g.beginPath(); g.moveTo(sx, y); g.lineTo(L.st[i].x, y); g.stroke();
        g.fillStyle = '#0a0610'; g.strokeStyle = c; g.lineWidth = 1.6; g.beginPath(); g.arc(sx, y, 5, 0, J.TAU); g.fill(); g.stroke();
        g.fillStyle = c; g.beginPath(); g.arc(sx, y, 2, 0, J.TAU); g.fill();
        g.fillStyle = c; g.beginPath(); g.arc(L.st[i].x, y, 2.2, 0, J.TAU); g.fill();
      });
    }
    function resize() {
      const a = J.fit(c0, 1.5), b = J.fit(c1, 1); // soft glow + hairlines: capped ratio (tall canvas, ~3x less backing store)
      g0 = a.g; g1 = b.g; W = a.W; H = a.H;
      measure(); drawStatic();
    }
    function spawn(x, y, col, n, spd, size, life, up, gv, dm) {
      if (J.reduce) return;
      for (let i = 0, k = 0; i < BP.length && k < n; i++) {
        const p = BP[i]; if (p.on) continue;
        const a = Math.random() * J.TAU, s = spd * (0.35 + Math.random() * 0.8);
        p.on = 1; p.x = x; p.y = y; p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s - spd * 0.12 - (up || 0) * (0.5 + Math.random() * 0.5); p.gv = gv == null ? 40 : gv; p.dm = dm == null ? 1.8 : dm; p.t = 0; p.d = life * (0.6 + Math.random() * 0.6); p.s = size * (0.6 + Math.random() * 0.7); p.c = col;
        k++;
      }
    }
    function stream(x0, y0, x1, y1, col, n) {
      if (J.reduce) return;
      const t = now();
      for (let i = 0, k = 0; i < FL.length && k < n; i++) {
        const f = FL[i]; if (f.on) continue;
        f.on = 1; f.x0 = x0; f.y0 = y0; f.x1 = x1 + (Math.random() - 0.5) * 6; f.y1 = y1 + (Math.random() - 0.5) * 8;
        f.cx = (x0 + x1) / 2 + (Math.random() - 0.5) * 70; f.cy = Math.min(y0, y1) - 10 - Math.random() * 40;
        f.t0 = t + k * 26; f.d = 520 + Math.random() * 240; f.c = col; f.s = 12 + Math.random() * 8;
        k++;
      }
    }
    function ring(x, y, c, r0, r1, d, lw, delay, dir) {
      if (J.reduce) return;
      for (let i = 0; i < RG.length; i++) {
        const r = RG[i]; if (r.on) continue;
        r.on = 1; r.x = x; r.y = y; r.c = c; r.r0 = r0; r.r1 = r1; r.d = d; r.lw = lw; r.t0 = now() + (delay || 0); r.dir = dir || 1;
        return;
      }
    }
    function band(x, w, y0, y1, h, d, c, flick, delay) {
      if (J.reduce) return;
      for (let i = 0; i < BD.length; i++) {
        const b = BD[i]; if (b.on) continue;
        b.on = 1; b.x = x; b.w = w; b.y0 = y0; b.y1 = y1; b.h = h; b.d = d; b.c = c; b.fl = flick ? 1 : 0; b.t0 = now() + (delay || 0);
        return;
      }
    }
    function implode(x, y, col, n, R, life) {
      if (J.reduce) return;
      for (let i = 0, k = 0; i < BP.length && k < n; i++) {
        const p = BP[i]; if (p.on) continue;
        const a = Math.random() * J.TAU, rr = R * (0.7 + Math.random() * 0.4);
        p.on = 1; p.x = x + Math.cos(a) * rr; p.y = y + Math.sin(a) * rr * 0.7; p.t = 0; p.d = life * (0.8 + Math.random() * 0.3); p.gv = 0; p.dm = 0;
        p.vx = -Math.cos(a) * rr / (p.d * 0.9); p.vy = -Math.sin(a) * rr * 0.7 / (p.d * 0.9); p.s = 8 + Math.random() * 7; p.c = col; k++;
      }
    }
    function ignite(i) { // the pulse reached stage i (1..4): flare + shockwave
      const y = L.n[i - 1], col = J.S.killed ? C.red : SC[i - 1], T = tierN();
      np[i - 1] = 1; fl[i - 1] = 1;
      spawn(L.sx, y, col, T >= 2 ? 12 : 8, 70, 14, 0.7);
      ring(L.sx, y, col, 6, T >= 2 ? 92 : 60, 720, 2.4);
      if (T >= 2) ring(L.st[i - 1].x, y, col, 3, 46, 560, 1.5, 90);
      if (T >= 3) ring(L.sx, y, '#ffffff', 2, 54, 520, 1.2, 50);
    }
    function fileFly(dest) {
      if (J.reduce || !L || !L.fi[dest]) return;
      const a = L.js, b = L.fi[dest];
      FI.on = 1; FI.t0 = now(); FI.d = 520; FI.x0 = a.x + a.w - 8; FI.y0 = a.y + a.h * 0.5; FI.x1 = b.x + 16; FI.y1 = b.y + 10;
      FI.cx = (FI.x0 + FI.x1) / 2 + 26; FI.cy = Math.min(FI.y0, FI.y1) - 46; FI.c = DHEX[dest]; FI.dest = dest;
    }
    function drawS(g, c, x, y, s, a) { if (a <= 0.005) return; g.globalAlpha = a > 1 ? 1 : a; g.drawImage(spr[c], x - s / 2, y - s / 2, s, s); }
    function frame(t, dt) {
      if (!g1 || !L) return;
      const g = g1, killed = J.S.killed, pc = killed ? C.red : C.pink, n = now();
      const T = tierN(), bloom = T >= 3;
      g.clearRect(0, 0, W, H); g.globalCompositeOperation = 'lighter';
      if (T >= 2 && !J.reduce) { // depth motes: far = small + slow, near = bigger; pointer + scroll parallax
        const cnt = T >= 3 ? 40 : 16, px = (J.pointer && J.pointer.nx) || 0, sy = (J.scroll && J.scroll.y) || 0;
        for (let i = 0; i < cnt; i++) {
          const m = MT[i], x = m.x * W - px * 18 * m.z, y = (((m.y * H - sy * 0.22 * m.z - t * 7 * m.z) % H) + H) % H;
          drawS(g, m.c, x, y, 5 + m.z * 13, (0.05 + 0.15 * m.z) * (0.65 + 0.35 * Math.sin(t * 0.9 + m.ph)));
        }
      }
      if (cm.pend && n >= cm.pt) { const pi = cm.pend; cm.pend = 0; ignite(pi); }
      for (let i = 0; i < 3; i++) act[i] = Math.max(0, act[i] - dt * 1.1);
      for (let i = 0; i < 4; i++) { np[i] = Math.max(0, np[i] - dt * 1.3); fl[i] = Math.max(0, fl[i] - dt * 1.7); }
      // ribbon particles
      for (let i = 0; i < rp.length; i++) {
        const p = rp[i], gp = L.gaps[p.g];
        if (!gp || !gp.rb.length) continue;
        const dy = gp.y1 - gp.y0; if (dy < 6) continue;
        p.u += dt * p.sp * (1 + 3.6 * act[p.g]);
        if (p.u >= 1 || p.r >= gp.rb.length) { p.u = p.u >= 1 ? p.u - 1 : 0; p.r = (Math.random() * gp.rb.length) | 0; }
        const r = gp.rb[p.r], u = p.u, mt = 1 - u, a3 = mt * mt * mt, b3 = 3 * mt * mt * u, c3 = 3 * mt * u * u, d3 = u * u * u;
        const x = (a3 + b3) * r.x0 + (c3 + d3) * r.x1, y = a3 * gp.y0 + b3 * (gp.y0 + dy * 0.6) + c3 * (gp.y1 - dy * 0.6) + d3 * gp.y1;
        const al = Math.sin(u * Math.PI) * (0.4 + 0.75 * act[p.g]);
        drawS(g, act[p.g] > 0.12 && !killed ? SC[p.g + 1] : pc, x, y, 10 + 12 * act[p.g], al);
      }
      // spine drift
      const sx = L.sx, y0 = L.n[0], len = L.n[3] - y0;
      if (len > 10) for (let i = 0; i < sd.length; i++) { const k = ((t * 0.045 + sd[i].ph) % 1), y = y0 + k * len; drawS(g, pc, sx, y, 8, Math.sin(k * Math.PI) * 0.55); }
      // nodes
      for (let i = 0; i < 4; i++) {
        const col = killed ? C.red : SC[i];
        drawS(g, col, sx, L.n[i], 22 + np[i] * 40, 0.3 + np[i] * 0.7);
        if (fl[i] > 0.02) { // ignition flare: horizontal lens streak into the stage + a vertical spike on the spine
          const f = fl[i], y = L.n[i], w = L.st[i].x - sx + 8;
          if (w > 8) { g.globalAlpha = Math.min(1, f * 0.85); g.drawImage(spr[col], sx - 6, y - 4 - 14 * f, w + 6, 8 + 28 * f); g.globalAlpha = f * 0.6; g.drawImage(spr['#ffffff'], sx - 6, y - 1.5 - 2 * f, w * 0.8, 3 + 4 * f); }
          g.globalAlpha = f * 0.7; g.drawImage(spr['#ffffff'], sx - 3, y - 70 * f, 6, 140 * f);
          if (bloom) drawS(g, col, sx, y, 110 * f + 30, f * 0.35);
        }
      }
      // comet
      if (cm.a > 0.01) {
        const p = clamp((n - cm.t0) / 300, 0, 1);
        cm.y = lerp(cm.from, cm.to, ease3(p));
        if (cm.fade) cm.a = Math.max(0, cm.a - dt * 1.6);
        const col = killed ? C.red : SC[Math.max(0, Math.min(3, cm.si | 0))];
        if (T >= 2 && cm.y > y0) { // the line stays lit behind the pulse
          g.strokeStyle = col; g.lineCap = 'round'; g.lineWidth = 2.4; g.globalAlpha = 0.5 * cm.a; g.beginPath(); g.moveTo(sx, y0); g.lineTo(sx, cm.y); g.stroke();
          g.lineWidth = 9; g.globalAlpha = 0.12 * cm.a; g.stroke();
        }
        const TK = T >= 2 ? 12 : 6, SP = T >= 2 ? 5 : 7;
        for (let k = TK; k >= 1; k--) { const ty = cm.y - k * SP; if (ty >= y0 - 2) drawS(g, col, sx, ty, 34 - k * (T >= 2 ? 1.8 : 3.4), (1 - k / (TK + 1)) * 0.5 * cm.a); }
        if (bloom) drawS(g, col, sx, cm.y, 96, 0.3 * cm.a);
        drawS(g, col, sx, cm.y, 46, cm.a); drawS(g, '#ffffff', sx, cm.y, 16, 0.9 * cm.a);
      }
      // flyers
      for (let i = 0; i < FL.length; i++) {
        const f = FL[i]; if (!f.on) continue;
        const p = (n - f.t0) / f.d; if (p < 0) continue;
        if (p >= 1) { f.on = 0; continue; }
        for (let k = 0; k < 3; k++) {
          const q = Math.max(0, ease3(p) - k * 0.045), mt = 1 - q;
          const x = mt * mt * f.x0 + 2 * mt * q * f.cx + q * q * f.x1, y = mt * mt * f.y0 + 2 * mt * q * f.cy + q * q * f.y1;
          drawS(g, f.c, x, y, f.s * (1 - k * 0.28), (1 - k * 0.3) * Math.min(1, (1 - p) * 3));
        }
      }
      // file flight : curved path, comet tail, landing ripple
      if (FI.on) {
        const p = (n - FI.t0) / FI.d;
        if (p >= 1) {
          FI.on = 0;
          ring(FI.x1, FI.y1, FI.c, 3, 40, 620, 2); ring(FI.x1, FI.y1, '#ffffff', 2, 22, 460, 1.2, 110);
          spawn(FI.x1, FI.y1, FI.c, T >= 2 ? 14 : 8, 90, 10, 0.6);
          if (landCb) landCb(FI.dest);
        } else if (p >= 0) {
          const TN = T >= 2 ? 14 : 8;
          for (let k = TN; k >= 1; k--) {
            const q = Math.max(0, p - k * 0.026), e = q * q * (3 - 2 * q), mt = 1 - e;
            drawS(g, FI.c, mt * mt * FI.x0 + 2 * mt * e * FI.cx + e * e * FI.x1, mt * mt * FI.y0 + 2 * mt * e * FI.cy + e * e * FI.y1, 22 - k * 1.2, (1 - k / (TN + 1)) * 0.6);
          }
          const e = p * p * (3 - 2 * p), mt = 1 - e;
          const x = mt * mt * FI.x0 + 2 * mt * e * FI.cx + e * e * FI.x1, y = mt * mt * FI.y0 + 2 * mt * e * FI.cy + e * e * FI.y1;
          const ang = Math.atan2(2 * mt * (FI.cy - FI.y0) + 2 * e * (FI.y1 - FI.cy), 2 * mt * (FI.cx - FI.x0) + 2 * e * (FI.x1 - FI.cx));
          drawS(g, FI.c, x, y, 40, 0.9); if (bloom) drawS(g, FI.c, x, y, 84, 0.3);
          g.globalAlpha = 1; g.save(); g.translate(x, y); g.rotate(ang * 0.35);
          g.fillStyle = 'rgba(255,255,255,.92)'; g.fillRect(-4, -5.5, 8, 11); g.strokeStyle = FI.c; g.lineWidth = 1.2; g.strokeRect(-4.5, -6, 9, 12);
          g.restore();
        }
      }
      // shockwave rings
      for (let i = 0; i < RG.length; i++) {
        const r = RG[i]; if (!r.on) continue;
        const p = (n - r.t0) / r.d; if (p < 0) continue;
        if (p >= 1) { r.on = 0; continue; }
        const e = ease3(p), rad = r.dir > 0 ? lerp(r.r0, r.r1, e) : lerp(r.r1, r.r0, e), a = Math.pow(1 - p, 1.5);
        g.strokeStyle = r.c; g.beginPath(); g.arc(r.x, r.y, rad, 0, J.TAU);
        g.lineWidth = r.lw * (1 - p * 0.55) + 0.4; g.globalAlpha = a * 0.9; g.stroke();
        if (bloom) { g.lineWidth = r.lw * 5; g.globalAlpha = a * 0.16; g.stroke(); }
      }
      // sweeps and tears
      for (let i = 0; i < BD.length; i++) {
        const b = BD[i]; if (!b.on) continue;
        const p = (n - b.t0) / b.d; if (p < 0) continue;
        if (p >= 1) { b.on = 0; continue; }
        const y = lerp(b.y0, b.y1, eio(p)); let a = Math.sin(p * Math.PI);
        if (b.fl && Math.random() < 0.45) a *= 0.35;
        g.globalAlpha = a * 0.9; g.drawImage(spr[b.c], b.x, y - b.h / 2, b.w, b.h);
        g.globalAlpha = a * 0.75; g.drawImage(spr['#ffffff'], b.x + b.w * 0.05, y - b.h * 0.09, b.w * 0.9, b.h * 0.18);
      }
      // bursts
      for (let i = 0; i < BP.length; i++) {
        const p = BP[i]; if (!p.on) continue;
        p.t += dt;
        if (p.t >= p.d) { p.on = 0; continue; }
        p.vx *= 1 - dt * p.dm; p.vy = p.vy * (1 - dt * p.dm) + p.gv * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        const k = 1 - p.t / p.d;
        drawS(g, p.c, p.x, p.y, p.s * (0.4 + k), k * 0.95);
        if (bloom) drawS(g, p.c, p.x, p.y, p.s * (0.4 + k) * 2.5, k * 0.2);
      }
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
    return {
      resize, frame, restyle: drawStatic,
      begin() { cm.pend = 0; cm.a = 1; cm.fade = false; cm.y = cm.from = cm.to = L ? L.n[0] : 0; cm.si = 0; cm.t0 = now(); },
      end() { cm.fade = true; },
      stage(i) { // i = 1..4
        if (!L) return;
        cm.from = cm.y; cm.to = L.n[i - 1]; cm.t0 = now(); cm.si = i - 1; cm.a = 1; cm.fade = false;
        if (i > 1) act[i - 2] = 1;
        if (J.reduce) { np[i - 1] = 1; return; }
        cm.pend = i; cm.pt = cm.t0 + (i > 1 ? 210 : 0); // flare + shockwave fire when the pulse arrives
      },
      gate(conf, v) {
        if (!L) return;
        const x = L.gt.x + conf * L.gt.w, y = L.gt.y + L.gt.h / 2, col = v === 'pass' ? C.green : v === 'halt' ? C.red : C.amber;
        spawn(x, y, col, 26, 150, 16, 0.9); spawn(x, y, '#ffffff', 8, 90, 10, 0.6);
        if (tierN() >= 2) ring(x, y, col, 4, 70, 640, 2.2);
        if (v === 'below') { // red glitch tear across the gate bar
          const w = L.gt.w + 24;
          for (let k = 0; k < 4; k++) band(L.gt.x - 12 + (Math.random() - 0.5) * 14, w, L.gt.y + 3 + Math.random() * (L.gt.h - 6), L.gt.y + 3 + Math.random() * (L.gt.h - 6), 10 + Math.random() * 8, 280 + k * 50, C.red, true, k * 70);
        }
      },
      land(dest) {
        if (!L) return;
        const f = L.fo[dest]; if (!f) return;
        stream(L.js.x + L.js.w - 8, L.js.y + L.js.h * 0.5, f.x + 12, f.y + 12, DHEX[dest], tierN() >= 2 ? 9 : 16);
        fileFly(dest);
      },
      setLand(f) { landCb = f; },
      stamp(dest, d) {
        if (!L) return;
        const x = L.dest.x + L.dest.w / 2, y = L.dest.y + L.dest.h / 2, T = tierN(), col = DHEX[dest], B = L.dest;
        if (T < 2) { spawn(x, y, col, 34, 200, 18, 1.0); spawn(x, y, '#ffffff', 10, 120, 10, 0.7); return; }
        if (dest === 'execute') { // green radial burst + particle shower
          spawn(x, y, col, 34, 210, 18, 1.0); spawn(x, y, '#ffffff', 10, 120, 10, 0.7);
          ring(x, y, col, 8, Math.max(B.w, 150) * 0.8, 780, 3); ring(x, y, '#ffffff', 4, 70, 520, 1.4, 70);
          spawn(x, y - B.h * 0.2, col, T >= 3 ? 46 : 24, 130, 12, 1.4, 250, 340, 0.7);
        } else if (dest === 'review') { // amber scan-line sweep
          const c = d && d.killed ? C.red : C.amber;
          band(B.x - 6, B.w + 12, B.y - 4, B.y + B.h + 4, 40, 720, c, false);
          if (T >= 3) band(B.x - 6, B.w + 12, B.y + B.h + 4, B.y - 4, 30, 640, c, false, 640);
          ring(x, y, c, 10, Math.max(B.w, 150) * 0.6, 760, 2); spawn(x, y, c, 14, 150, 14, 0.8);
        } else { // skip: dim collapse, everything drains inward
          ring(x, y, col, 8, Math.max(B.w, 150) * 0.6, 700, 2, 0, -1);
          implode(x, y, col, T >= 3 ? 26 : 16, Math.max(B.w, 140) * 0.55, 0.7);
        }
      },
    };
    function killed() { return J.S.killed; }
  })();

  // the flying file landed: ripple the folder badge
  fx.setLand((k) => {
    const f = folders[k]; if (!f) return;
    fxa(f.em, [{ transform: 'scale(1)' }, { transform: 'scale(1.7)', offset: 0.25 }, { transform: 'scale(.92)', offset: 0.6 }, { transform: 'scale(1)' }], { duration: 560, easing: 'ease-out' });
    fxa(f.el, [{ boxShadow: '-6px 0 0 -2px rgba(255,255,255,0)' }, { boxShadow: '-10px 0 22px -8px var(--cc)', offset: 0.3 }, { boxShadow: '-6px 0 0 -2px rgba(255,255,255,0)' }], { duration: 700, easing: 'ease-out' });
  });

  /* ------------------------------------------------------------------ run : live scrub vs cinematic commit ------------------------------------------------------------------ */
  const TL = [0, 290, 720, 990, 1300];
  const STAGE_TXT = ['encode', 'typed questions', 'the gate', 'code acts'];
  function cancelRun() {
    timers.forEach(clearTimeout); timers = [];
    if (running) { running = false; pipe.classList.remove('lab-run'); stg.forEach((s) => s.classList.remove('on')); fx.end(); }
  }
  function stageOn(i) {
    stg.forEach((s, k) => { s.classList.toggle('on', k === i - 1); if (k < i - 1) s.classList.add('done'); });
    setStat('stage ' + i + '/4 · ' + STAGE_TXT[i - 1]);
    fx.stage(i);
  }
  let liveT = 0, livePend = 0;
  function live() {
    const t = now();
    if (t - liveT < 55) { if (!livePend) livePend = setTimeout(() => { livePend = 0; live(); }, 60); return; }
    liveT = t;
    cancelRun();
    pipe.classList.add('lab-live'); pipe.classList.remove('lab-run');
    cur = decideState(stateNow());
    base = lastC;
    rAll(cur, false);
    if (!dirty) setStat('scrubbing …');
  }
  function finishRun(d, why, anim_) {
    running = false;
    pipe.classList.remove('lab-run');
    stg.forEach((s) => { s.classList.remove('on'); if (anim_) s.classList.add('done'); });
    fx.end();
    setStat('done · #' + hex2(d.n) + ' · ' + d.ms.toFixed(1) + ' ms');
    srEl.textContent = 'jev: ' + d.action + (d.action === 'hold' ? '' : ' ' + fmtSize(d.size)) + ' at confidence ' + d.conf.toFixed(2) + ', ' + d.dest + ', ' + d.reason;
  }
  function publish(d) {
    if (!lv) return;
    try {
      const S = J.S, s = d.st;
      const rec = Object.assign({}, d, { id: d.file.slice(0, 8), symbol: 'BTC-PERP', arch: 'lab', lab: true, build: BUILD[d.action] || 'entry' });
      rec.state = Object.assign({ symbol: 'BTC-PERP', price: J.market.price, vwap_dist_bps: s.edge_bps * 0.35, funding_bps: 0.8, venue: d.venue, regime: 'lab' }, s);
      rec.line = rec.symbol + ' edge ' + J.sgn(s.edge_bps) + 'bps imb ' + J.sgn(s.imbalance, 2) + ' spr ' + s.spread_bps.toFixed(1);
      S.count++; S.cost += 0.00003; S.ms.push(d.ms); if (S.ms.length > 41) S.ms.shift(); S.counts.choice++;
      if (S.dest[d.dest] != null) S.dest[d.dest]++;
      J.recent.unshift(rec); if (J.recent.length > 40) J.recent.pop();
      J.bus.emit('decision', rec); J.hud();
    } catch (e) { /* the lab never breaks the page */ }
  }
  /** full cinematic decision: ~1.3 s, stage by stage. why: 'decide' | 'preset' | 'input' | 'floor' | 'kill' | 'view' | 'replay' */
  function commit(why) {
    clearTimeout(ct); clearTimeout(livePend); livePend = 0;
    cancelRun();
    const replay = why === 'replay' && !!cur && !!cur.n;
    const d = replay && cur ? cur : decideState(stateNow());
    cur = d;
    if (!replay) { d.n = ++seq; d.file = hex2(d.n) + rhex(6) + '.json'; }
    setDirty(false); go.classList.remove('dirty');
    committed = true; schedHash();
    if (!replay) { base = lastC; lastC = d; }
    const animate = pv && !J.reduce;
    if (!animate) {
      pipe.classList.add('lab-live'); pipe.classList.remove('lab-run');
      rAll(d, false);
      if (!replay) { landFile(d, false); pushTape(d); renderTape(false); if (why !== 'view') publish(d); pending = !pv; }
      finishRun(d, why, false);
      return;
    }
    pipe.classList.remove('lab-live'); pipe.classList.add('lab-run');
    running = true;
    stg.forEach((s) => s.classList.remove('on', 'done'));
    fx.begin();
    anim($('u', prog), [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: TL[4], easing: 'cubic-bezier(.4,0,.2,1)' });
    rMini(d); paintBad(d); rDiff(d);
    const T = (ms, fn) => timers.push(setTimeout(fn, ms));
    stageOn(1); rEncode(d, true);
    T(TL[1], () => { stageOn(2); rQuestions(d, true); });
    T(TL[2], () => { stageOn(3); rGate(d, true); });
    T(TL[2] + 560, () => fx.gate(d.conf, d.killed ? 'halt' : d.conf >= d.floor ? 'pass' : 'below'));
    T(TL[3], () => { stageOn(4); rActs(d, true); });
    if (!replay) T(TL[3] + 230, () => { landFile(d, true); fx.land(d.dest); });
    else T(TL[3] + 230, () => { folders[d.dest].el.classList.add('hit'); setTimeout(() => folders[d.dest].el.classList.remove('hit'), 1500); fx.land(d.dest); });
    T(TL[3] + 400, () => fx.stamp(d.dest, d));
    T(TL[4], () => {
      finishRun(d, why, true);
      if (!replay) { pushTape(d); renderTape(true); if (why !== 'view') publish(d); }
    });
  }
  function scheduleCommit(ms, why) { clearTimeout(ct); ct = setTimeout(() => commit(why), ms); }

