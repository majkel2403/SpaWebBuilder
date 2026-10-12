
  let timer = 0;
  function runStep() {
    timer = 0;
    if (document.hidden) return; // the visibilitychange handler restarts the chain
    const kd = J.S.killed, pv = ST.working, show = live();
    if (show && dirty) resync();
    let i = (ST.step + 1) % 6;
    if (kd && i > 2) i = 0;
    if (i === 0) {
      ST.loop++; adopt();
      for (let j = 0; j < 6; j++) { if (show) unbar(AGK[j]); setStatus(j, kd && j > 2 ? 'halted' : 'idle'); }
    } else if (pv >= 0 && pv !== i) { if (show) unbar(AGK[pv]); setStatus(pv, 'done'); }
    const key = AGK[i], dur = (kd ? 1350 : rnd(700, 1500)) * (J.reduce ? 1.8 : 1), ev = describe(i, kd);
    ev.pnl = i === 5 && !kd ? ST.pnl : null;
    ST.step = i; ST.working = i; ST.t0 = performance.now(); ST.dur = dur; LAST[key] = ev;
    setStatus(i, 'working');
    if (show) {
      runBar(key, dur); paintRow(key); paintStep(i); paintEdge();
      flash(TAB[key].el); flash(ROW[key].el); react(key);
      applyOn(); tickCd();
      // the world reacts: a burst down a beam to the ticket, a packet out of the venue the agent looked at
      if (!kd) {
        if (BEAMS.length >= 7) spawn(1, (Math.random() * 7) | 0, AGCOL[i], 0.8, false, 1.15);
        if (ev.city != null) { const arcs = ARC_BY_CITY[ev.city], ai = arcs[(Math.random() * arcs.length) | 0]; FL[ev.city] = 1; ARCS[ai].lit = Math.min(1, ARCS[ai].lit + 0.6); spawn(0, ai, i === 4 ? 3 : i === 5 ? 2 : 0, 0.6, ARCS[ai].a !== ev.city, 1.15); }
      }
    } else dirty = true;
    J.bus.emit('agentstep', { agent: key, verb: VERB[i], text: ev.text, pnl: ev.pnl == null ? null : +ev.pnl.toFixed(2) });
    timer = setTimeout(runStep, dur);
  }
