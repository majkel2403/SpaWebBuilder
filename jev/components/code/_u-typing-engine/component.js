  /* ---- typing engine: one line at a time, tokens in order; "live" tokens (json values) pop in whole with a flash ---- */
  function flash(el, hot) {
    if (reduce || !el.animate) return;
    if (hot && T() >= 2) { // state.json: the value blooms white-hot, then cools through a pink halo
      el.animate([{ backgroundColor: '#ffffff', boxShadow: '0 0 0 3px #fff, 0 0 30px 9px rgba(255,255,255,.95), 0 0 64px 20px rgba(255,150,195,.7)' },
        { offset: 0.3, backgroundColor: 'rgba(255,255,255,.78)', boxShadow: '0 0 0 3px rgba(255,255,255,.7), 0 0 22px 6px rgba(255,255,255,.55), 0 0 42px 12px rgba(255,150,195,.35)' }], { duration: 1150, easing: 'ease-out' });
      return;
    }
    el.animate([{ backgroundColor: '#ffffff', boxShadow: '0 0 0 3px #fff, 0 0 22px 6px rgba(255,255,255,.95)' }], { duration: 950, easing: 'ease-out' });
  }
  function beginLine(P, L) {
    if (P.rt) for (const k of L.toks) { k.tn.nodeValue = ''; cls(k); }
    L.on = true; L.done = false; L.el.classList.add('on');
    P.cur = P.li; P.band.style.transform = 'translate3d(0,' + (P.li * P.lh) + 'px,0)'; act(P, P.li);
    L.el.insertBefore(P.caret, L.no.nextSibling); P.caretEnd = -1;
    follow(P, P.li); P.began = true;
  }
  function endLine(P, L) {
    L.done = true; P.began = false; P.li++; P.ti = 0; P.ci = 0;
    const toks = L.toks.length;
    P.pause = (toks === 0 ? 0.05 : 0.035 + Math.random() * 0.07) * (P.rt ? 0.7 : 1);
    mm(P);
    if (P.li >= P.lines.length) finish(P);
  }
  function finish(P) {
    P.mode = 'idle'; P.rt = false; P.el.classList.remove('code-typing'); P.idleAt = J.time;
    P.caretEnd = -2; band(P, P.rest); mm(P);
  }
  function type(P, dt) {
    if (P.mode !== 'type') return;
    if (P.wait > 0) { P.wait -= dt; return; }
    if (P.pause > 0) { P.pause -= dt; return; }
    const b = P.cps * dt + P.carry; let n = Math.floor(b); P.carry = b - n;
    let guard = 160;
    while (n > 0 && P.mode === 'type' && guard-- > 0) {
      const L = P.lines[P.li];
      if (!L) { finish(P); break; }
      if (!P.began) beginLine(P, L);
      const k = L.toks[P.ti];
      if (!k) { endLine(P, L); if (P.pause > 0) break; continue; }
      if (k.live) { k.tn.nodeValue = k.t; flash(k.el, P.skin === 'hot'); if (k.df) { k.el.classList.add('code-df', k.df); k.df = ''; } L.el.insertBefore(P.caret, k.el.nextSibling); P.ti++; P.ci = 0; n -= 3; continue; }
      if (!k.t.trim()) { k.tn.nodeValue = k.t; P.ti++; P.ci = 0; continue; } // indentation is free
      const take = Math.min(n, k.t.length - P.ci);
      P.ci += take; n -= take; k.tn.nodeValue = k.t.slice(0, P.ci);
      if (P.ci >= k.t.length) { P.ti++; P.ci = 0; L.el.insertBefore(P.caret, k.el.nextSibling); }
    }
    if (P.mode === 'type' && P.lines[P.li] && P.lines[P.li].toks.length === 0 && P.began) endLine(P, P.lines[P.li]);
  }
  function start(P, o) {
    o = o || {};
    if (reduce) { fillAll(P); return; }
    P.rt = !!o.rt;
    if (!P.rt) blank(P); else { P.li = P.ti = P.ci = 0; P.began = false; P.carry = 0; P.ty = 0; }
    P.mode = 'type'; P.wait = o.delay || 0; P.cps = o.cps || P.cps; P.pause = 0; P.el.classList.add('code-typing'); P.typedAt = J.time;
    tab(P.tab);
  }

