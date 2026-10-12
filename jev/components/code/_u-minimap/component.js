  /* minimap: coloured stubs per typed line (0.5 px per char, 4 px pitch) */
  function mm(P) {
    const m = P.gm; if (!m) return;
    const g = m.g; g.clearRect(0, 0, m.W, m.H);
    const pal = MMC[P.skin];
    for (let i = 0; i < P.lines.length; i++) {
      const L = P.lines[i]; if (!L.done && !P.rt) break;
      let x = 3;
      for (const k of L.toks) {
        const w = k.t.length * 0.5;
        if (k.c !== 'w' && k.t.trim()) { g.fillStyle = k.live ? pal.live : pal[k.c] || pal.v; g.fillRect(x, 4 + i * 4, Math.max(0.6, Math.min(w, m.W - x - 1)), 1.8); }
        x += w;
        if (x > m.W) break;
      }
    }
  }
  for (const P of [D, S, Q]) {
    J.watch(P.mmW, () => { const f = J.fit(P.mmC); P.gm = f; mm(P); });
    J.watch(P.body, () => {
      const cs = getComputedStyle(win);
      P.lh = parseFloat(cs.getPropertyValue('--code-lh')) || 19; P.rows = parseFloat(cs.getPropertyValue('--code-rows')) || 14;
      P.cw = (parseFloat(cs.getPropertyValue('--code-fs')) || 12) * 0.6; P.hv = P.rows * P.lh + 16; P.dh = P.lines.length * P.lh + 16; P.mmV.style.height = (P.rows * 4 + 2) + 'px';
      band(P, P.cur); P.sy = P.ty = clamp(P.ty, 0, Math.max(0, P.dh - P.hv)); applyScroll(P);
    });
  }

