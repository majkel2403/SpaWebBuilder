  /** step rail + stage header + orbit labels for step i (only what changed) */
  function paintStep(i, all) {
    if (railN !== i || all) {
      T.rail.style.setProperty('--q', i); T.rail.style.setProperty('--mc', AG[i].col);
      for (let j = 0; j < T.sds.length; j++) if (all || (j <= i) !== (j <= railN)) T.sds[j].classList.toggle('on', j <= i);
      if (!all && i > railN && railN >= 0) J.animate(T.tl, [{ scale: '2.6 1', opacity: 1 }, { scale: '1 1', opacity: 0.75 }], { duration: 750, easing: 'cubic-bezier(.2,.8,.2,1)' });
      railN = i;
    }
    txt(T.stn, '0' + (i + 1)); txt(T.stv, VERB[i].toLowerCase()); txt(T.loop, String(ST.loop));
    for (let j = 0; j < OB.length; j++) txt(OB[j].label, j === i ? AGK[j] + ' · ' + VERB[j].toLowerCase() : AGK[j]);
  }
  function paintEdge() { if (ST.step === 5 && !J.S.killed) { const p = ST.pnl, v = (p >= 0 ? 'closed +' : 'closed -') + '$' + Math.abs(p).toFixed(2); txt(T.edge, v); const c = p >= 0 ? 'up' : 'dn'; if (T.edge.className !== c) T.edge.className = c; } }
  /** repaint every agent surface from state (the strip was off screen / the tab hidden while steps went by) */
  function resync() {
    dirty = false; const i = ST.step; if (i < 0) return;
    const left = Math.max(0, ST.dur - (performance.now() - ST.t0));
    for (let j = 0; j < 6; j++) { const k = AGK[j]; paintStatus(j); paintRow(k); if (ST.status[j] === 'working') runBar(k, left); else unbar(k); }
    if (ST.tk) paintTicket(ST.tk);
    paintStep(i, true); paintEdge(); applyOn(); tickCd();
  }
