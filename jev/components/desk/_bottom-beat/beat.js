  /* heartbeat: the three cards breathe a synchronized glow on every decision / JEV.pulse (bus 'pulse' when core emits it) */
  let lastBeat = -1e9;
  const beat = (str) => {
    if (!FX_ON() || J.hidden()) return;
    const n = performance.now(); if (n - lastBeat < 260) return; lastBeat = n;
    const a = 0.12 + 0.3 * clamp(str, 0, 1), k = S.killed ? '255,77,94' : '255,46,110';
    [bay, lgc, drc].forEach((c) => J.animate(c, [{ boxShadow: '0 0 0 0 rgba(' + k + ',0), inset 0 0 0 rgba(' + k + ',0)' }, { boxShadow: '0 0 34px -6px rgba(' + k + ',' + a.toFixed(2) + '), inset 0 0 38px rgba(' + k + ',' + (a * 0.35).toFixed(2) + ')', offset: 0.2 }, { boxShadow: '0 0 12px -6px rgba(' + k + ',' + (a * 0.3).toFixed(2) + '), inset 0 0 14px rgba(' + k + ',' + (a * 0.1).toFixed(2) + ')', offset: 0.42 }, { boxShadow: '0 0 0 0 rgba(' + k + ',0), inset 0 0 0 rgba(' + k + ',0)' }], { duration: 1100, easing: 'ease-out' }));
  };
  J.bus.on('decision', (d) => beat(d && d.dest === 'execute' ? 0.8 : 0.4));
  J.bus.on('pulse', (s) => beat(+s || 0.5));
