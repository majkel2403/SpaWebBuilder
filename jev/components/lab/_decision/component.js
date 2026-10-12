  function setVal(f, v) { V[f.k] = v; const r = rows[f.k]; r.input.value = v; paintRow(r, v); }

  /* ------------------------------------------------------------------ decision ------------------------------------------------------------------ */
  function route(s) {
    const h = Math.abs(Math.round(s.edge_bps * 2) * 31 + Math.round(s.imbalance * 20) * 17 + Math.round(s.latency_ms / 10) * 7 + Math.round(s.spread_bps * 3) * 13);
    return VENUES[h % VENUES.length];
  }
  function decideState(st) {
    const d = J.decide(st);
    d.conf = clamp(d.conf, 0.3, 0.995);
    if (/^conf /.test(d.reason)) d.reason = 'conf ' + d.conf.toFixed(2) + ' < ' + d.floor.toFixed(2);
    d.st = st; d.venue = route(st);
    return d;
  }
  const stateNow = () => { const st = {}; FIELDS.forEach((f) => (st[f.k] = V[f.k])); return st; };
  function riskChecks(s, killed) {
    const lossUse = clamp(-s.daily_pnl / (J.RULES.lossCap || 2000), 0, 1.5);
    return [
      { id: 'spread', bad: s.spread_bps > 8, val: s.spread_bps.toFixed(1) },
      { id: 'latency', bad: s.latency_ms > 300, val: Math.round(s.latency_ms) + 'ms' },
      { id: 'age', bad: s.signal_age_s > 45, val: Math.round(s.signal_age_s) + 's' },
      { id: 'loss', bad: lossUse >= 0.8, val: Math.round(lossUse * 100) + '%' },
      { id: 'dd', label: 'drawdown', bad: s.drawdown_pct >= 8, val: s.drawdown_pct.toFixed(1) + '%' },
      { id: 'vol', bad: s.vol_1h >= 160, val: Math.round(s.vol_1h) + '%' },
      { id: 'kill', bad: !!killed, val: killed ? 'on' : 'off' },
    ];
  }

