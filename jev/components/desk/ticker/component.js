  const clockEl = $('#dkt-clock'), navEl = $('#dkt-nav'), splEl = $('#dkt-spl'), flrEl = $('#dkt-flr');
  let holderShown = '';
  function flushBar() {
    const t = nowMs();
    setT(clockEl, new Date().toISOString().slice(11, 19));
    while (reviews.length && t - reviews[0] > 30000) reviews.shift();
    const fairBps = sim.edgeAvg * 0.3, fair = M.price * (1 + fairBps / 1e4), d = sim.last, delta = sim.bal - sim.open;
    K('hand', String(Math.round(60 / sim.gap * 1.7)));
    K('fair', fmt(Math.round(fair))); K('mkt', fmt(Math.round(M.price)));
    K('edge', (fairBps >= 0 ? '+' : '-') + Math.abs(fairBps).toFixed(1) + 'bps'); chipC('edge', fairBps >= 0 ? 'green' : 'red');
    K('open', String(sim.tix.length));
    K('wait', reviews.length + ' waiting');
    K('spent', '$' + S.cost.toFixed(3));
    K('pnl', sgnUsd(delta)); chipC('pnl', delta >= 0 ? 'green' : 'red');
    K('floor', S.floor.toFixed(2));
    K('kill', S.killed ? 'halted' : 'armed'); chipC('kill', S.killed ? 'red' : 'green');
    if (d) {
      const a = d.action; K('last', (a === 'hold' ? 'hold ' + short(d.symbol) : a + ' ' + short(d.symbol) + ' ' + d.size + '%') + ' .' + String(Math.round(d.conf * 100)).padStart(2, '0') + ' · ' + d.dest);
      chipC('last', d.dest === 'execute' ? 'green' : d.dest === 'review' ? 'yellow' : 'gray');
    }
    const ag = AG[sim.holder];
    if (ag && holderShown !== sim.holder) {
      holderShown = sim.holder; K('holder', ag.name.toLowerCase());
      const rgb = rgbOf(ag.col); holdChips.forEach((e) => { e.style.setProperty('--cc', ag.col); e.style.setProperty('--cc-rgb', rgb); });
    }
    setT(navEl, '$' + (sim.bal / 1000).toFixed(1) + 'k'); setT(splEl, sgnUsd(delta)); if (splEl) splEl.style.color = delta >= 0 ? C.green : C.red;
    setT(flrEl, S.floor.toFixed(2));
  }

