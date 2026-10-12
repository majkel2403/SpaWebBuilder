  const hops = []; let lastHop = -9, eqAct = 0;
  function planHops(d, t0) {
    eqAct = Math.min(1, eqAct + 0.7);
    if (hops.length > 40) hops.splice(0, hops.length - 12); // nobody is looking (section off screen): never let the plan grow
    hops.push({ at: t0, flow: 0 }, { at: t0 + 0.2, flow: 1 }, { at: t0 + 0.5, flow: 2 }, { at: t0 + DELAY, flow: 3, d });
    if (t0 - lastHop < 2.0) return; lastHop = t0;
    hops.push({ at: t0, P: D, i: D.hop.ask, tab: 'desk' }, { at: t0 + 0.12, P: Q, i: Q.hop.action }, { at: t0 + 0.2, P: S, i: S.hop.action }, { at: t0 + 0.3, P: Q, i: Q.hop.size },
      { at: t0 + 0.45, P: D, i: D.hop.gate }, { at: t0 + 0.48, P: Q, i: Q.hop.risk }, { at: t0 + 0.6, P: S, i: S.hop.dest });
    if (d.dest === 'skip') hops.push({ at: t0 + 0.66, P: D, i: D.hop.skip });
    hops.push({ at: t0 + 0.72, P: Q, i: d.killed ? Q.hop.kill : Q.hop.gate, tab: 'q' }, { at: t0 + DELAY, P: D, i: D.hop.write, tab: 'queue' });
  }
  function runHops(t) {
    for (let i = hops.length - 1; i >= 0; i--) {
      const h = hops[i]; if (h.at > t) continue;
      hops.splice(i, 1);
      if (t - h.at > 1.5) continue; // stale (frame stall / tab was hidden): skip instead of replaying
      if (h.flow != null) { fnode(h.flow, h.d); continue; }
      if (h.P.mode === 'idle' && !h.P.out) { band(h.P, h.i); pop(h.P.dot); sel(h.P); h.P.okAt = t + 0.4; }
      if (h.tab) tab(h.tab);
    }
  }
