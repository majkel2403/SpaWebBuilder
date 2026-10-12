  /* =====================================================================================
   * events: tick → mark-to-market, decision → tickets / jumps / markers
   * ===================================================================================== */
  const bigEl = $('#dkt-big'); let popN = 0;
  function pop(txt, dir) {
    if (reduce || !bigEl || popN > 3) return;
    const e = document.createElement('i'); e.className = 'dkt-pop'; e.textContent = txt; e.style.color = dir > 0 ? C.green : C.red;
    e.style.right = (Math.random() * 20).toFixed(0) + 'px'; e.style.top = innerWidth < 420 ? '-15px' : '10px';   // narrow: float above the numeral, never over its digits
    bigEl.appendChild(e);
    const a = J.animate(e, [{ opacity: 0, transform: 'translateY(16px) scale(.85)' }, { opacity: 1, transform: 'translateY(0) scale(1)', offset: .16 }, { opacity: 1, offset: .62 }, { opacity: 0, transform: 'translateY(-26px) scale(1)' }], { duration: 1800, easing: 'cubic-bezier(.2,.8,.2,1)' });
    if (!a) { e.remove(); return; }                                // hidden tab / no WAAPI: never leave an unfinishable animation behind
    popN++; a.onfinish = a.oncancel = () => { popN--; e.remove(); };
  }
  function setBal(v) {
    sim.bal = v;
    if (v > sim.peak) sim.peak = v; else { const d = (sim.peak - v) / sim.peak; if (d > sim.dd) sim.dd = d; }
  }
  function execute(d, t) {
    const a = d.action;
    if (a === 'buy' || a === 'sell') {
      const dir = a === 'buy' ? 1 : -1, notional = d.size / 100 * CAP * LEV;
      const pWin = clamp(0.54 + (d.conf - 0.88) * 1.1 - clamp((sim.bal - BASE) / 2600, -0.22, 0.22), 0.3, 0.78);
      const mag = (3 + Math.abs(d.net) * 0.26) * (0.55 + Math.random() * 0.9);
      const bps = Math.random() < pWin ? mag : -mag * 0.85, jump = notional * bps / 1e4;
      setBal(sim.bal + jump); sim.jump = jump; sim.jumpT = t;
      sim.outc.push(bps); if (sim.outc.length > OW) sim.outc.shift(); sim.sumBps += bps; sim.nBps++; sim.stripDirty = true;
      sim.tixN++; sim.sizeN[d.sizeIdx]++;
      sim.tix.push({ dir, notional, born: t, life: 9000 + Math.random() * 26000 }); if (sim.tix.length > 6) sim.tix.shift();
      pop(sgnUsd(jump) + ' · ' + a + ' ' + d.size + '%', jump);
    } else if (a === 'close') { sim.tix.shift(); sim.tixN++; } else if (a === 'flatten') { sim.tix.length = 0; sim.tixN++; }
    if (d.symbol === 'BTC-PERP' && a !== 'hold') {
      marks.push({ cid: cands[cands.length - 1].cid, price: M.price, kind: a === 'buy' || a === 'sell' ? a : 'close', t, act: a, size: d.size, conf: d.conf, dest: d.dest, venue: d.venue,
        txt: (a === 'buy' || a === 'sell' ? a + ' ' + d.size + '% ' : a + ' ') + '.' + String(Math.round(d.conf * 100)).padStart(2, '0') });
      if (marks.length > 60) marks.shift();
    }
  }
  J.bus.on('tick', (e) => {
    const t = nowMs();
    for (let i = sim.tix.length - 1; i >= 0; i--) if (t - sim.tix[i].born > sim.tix[i].life) sim.tix.splice(i, 1);
    let ex = 0; for (const k of sim.tix) ex += k.dir * k.notional;
    setBal(sim.bal + ex * HEDGE * (e.dp / e.price) + (BASE - sim.bal) * 0.0002);
    hpush(sim.bal);
    tapeTick(e.price, e.dp);
  });
  J.bus.on('decision', (d) => {
    const t = nowMs();
    if (sim.lastDec) sim.gap += (clamp((t - sim.lastDec) / 1000, 0.3, 3) - sim.gap) * 0.12;
    sim.lastDec = t; sim.last = d; sim.holder = HOLD[d.build] || 'kelly';
    sim.edgeAvg += (clamp(d.state.edge_bps, -40, 40) - sim.edgeAvg) * 0.1;
    sim.imbT += (clamp(d.state.imbalance, -0.8, 0.8) - sim.imbT) * 0.35;
    sim.spr += (clamp(d.state.spread_bps, 0.5, 3.5) - sim.spr) * 0.2;
    pulseEv.push({ t, dest: d.dest, conf: d.conf }); if (pulseEv.length > 90) pulseEv.shift();
    if (d.dest === 'review') reviews.push(t);
    if (d.dest === 'execute') execute(d, t);
  });

