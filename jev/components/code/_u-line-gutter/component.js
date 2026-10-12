  function act(P, i) { // active-line gutter glow + the minimap cursor tick
    if (P.actI === i) return;
    const o = P.lines[P.actI]; if (o) o.el.classList.remove('act');
    P.actI = i; const n = P.lines[i]; if (n) n.el.classList.add('act');
    P.mmT.style.transform = 'translate3d(0,' + (4 + i * 4).toFixed(1) + 'px,0)';
  }
  function band(P, i) {
    P.cur = i; P.band.style.transform = 'translate3d(0,' + (i * P.lh) + 'px,0)'; act(P, i);
    const L = P.lines[i];
    if (L) { const tk = L.toks, at = tk.length ? tk[tk.length - 1].el.nextSibling : null; if (P.caret.parentNode !== L.el || P.caretEnd !== i) { L.el.insertBefore(P.caret, at); P.caretEnd = i; } }
    follow(P, i);
  }
  function follow(P, i) {
    if (J.time < P.seekUntil) return; // the reader moved the view: do not fight them
    const y0 = 8 + i * P.lh, m = 2 * P.lh, max = Math.max(0, P.dh - P.hv);
    if (y0 < P.ty + m) P.ty = y0 - m; else if (y0 + P.lh > P.ty + P.hv - m) P.ty = y0 + P.lh - P.hv + m;
    P.ty = clamp(P.ty, 0, max);
  }
  function applyScroll(P) {
    P.doc.style.transform = 'translate3d(0,' + (-P.sy).toFixed(2) + 'px,0)';
    P.mmV.style.transform = 'translate3d(0,' + (4 + (P.sy / P.lh) * 4).toFixed(2) + 'px,0)';
  }
  function scroll(P, dt) {
    const d = P.ty - P.sy;
    if (Math.abs(d) < 0.04) { if (d !== 0) { P.sy = P.ty; applyScroll(P); } return; }
    P.sy += d * (1 - Math.exp(-dt * 9)); applyScroll(P);
  }

