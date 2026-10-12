  /* ---- state.json: model built from a real decision record ---- */
  const DEF = { id: 'b71d44a2', symbol: 'BTC-PERP', action: 'buy', conf: 0.93, size: 1, sizeIdx: 1, sizes: [0.1, 0.62, 0.2, 0.08], riskOk: true, pRisk: 0.96, dest: 'execute', reason: 'ok', ms: 3.2, floor: 0.85, killed: false,
    state: { price: 84722.4, edge_bps: 22.4, spread_bps: 1.2, imbalance: 0.41, position_pct: 0.5, daily_pnl: 312, latency_ms: 41 } };
  function stateModel(d) {
    const s = d.state;
    const T = (c, t) => ({ c, t }), V = (c, t, x) => ({ c, t, live: true, x: 'code-live' + (x ? ' ' + x : '') });
    const w = (n) => T('w', '  '.repeat(n)), jk = (k) => T('jk', '"' + k + '"'), p = (t) => T('p', t);
    const str = (v, x) => V('s', '"' + v + '"', x), num = (v) => V('n', String(v)), bool = (b) => V('k', String(!!b), 'code-bool' + (b ? '' : ' no'));
    const row = (n, k, val, last) => [w(n), jk(k), p(': '), val, p(last ? '' : ',')];
    const f1 = (v) => (+v).toFixed(1), f2 = (v) => (+v).toFixed(2);
    return [
      [p('{')],
      row(1, 'id', str(d.id)),
      [w(1), jk('state'), p(': {')],
      row(2, 'symbol', str(d.symbol)), row(2, 'price', num(s.price)), row(2, 'edge_bps', num(f1(s.edge_bps))), row(2, 'spread_bps', num(f1(s.spread_bps))),
      row(2, 'imbalance', num(f2(s.imbalance))), row(2, 'position_pct', num(f1(s.position_pct))), row(2, 'daily_pnl', num(Math.round(s.daily_pnl))), row(2, 'latency_ms', num(Math.round(s.latency_ms)), true),
      [w(1), p('},')],
      [w(1), jk('answers'), p(': {')],
      [w(2), jk('action'), p(': { '), jk('choice'), p(': '), str(d.action, 'code-d-' + d.action), p(', '), jk('conf'), p(': '), num(f2(d.conf)), p(' },')],
      [w(2), jk('size'), p(': { '), jk('pct'), p(': '), num(d.size), p(', '), jk('p'), p(': '), num(f2(d.sizes[d.sizeIdx])), p(' },')],
      [w(2), jk('risk_ok'), p(': { '), jk('flag'), p(': '), bool(d.riskOk), p(', '), jk('p'), p(': '), num(f2(d.pRisk)), p(' }')],
      [w(1), p('},')],
      row(1, 'dest', str(d.dest, 'code-d-' + d.dest)),
      row(1, 'why', str(d.reason)),
      row(1, 'ms', num(f1(d.ms)), true),
      [p('}')],
    ];
  }
  let latest = null, lastRetype = -99;
  build(S, stateModel(DEF));
  function retype(d, t) {
    const old = S.lines.map((L) => L.toks.map((k) => k.t));
    setModel(S, stateModel(d));
    S.lines.forEach((L, i) => L.toks.forEach((k, j) => { // diff-style underline on every value that changed
      k.df = '';
      if (!k.live || old[i][j] === k.t) return;
      const a = parseFloat(old[i][j].replace(/"/g, '')), b = parseFloat(k.t.replace(/"/g, ''));
      k.df = isFinite(a) && isFinite(b) && /^[\d.\-]+$/.test(k.t) ? (b > a ? 'code-dfu' : 'code-dfd') : 'code-dfc';
    }));
    lastRetype = t;
    start(S, { rt: true, cps: 230 });
  }

