  /* ------------------------------------------------------------------ config ------------------------------------------------------------------ */
  const FIELDS = [
    { k: 'edge_bps', chip: 'edge', min: -40, max: 40, step: 0.5, v: 9, cc: 'pink', dec: 1, sign: 1, bi: 1, mark: 0 },
    { k: 'imbalance', chip: 'imb', min: -1, max: 1, step: 0.01, v: 0.2, cc: 'violet', dec: 2, sign: 1, bi: 1, mark: 0 },
    { k: 'spread_bps', chip: 'spread', min: 0.2, max: 20, step: 0.1, v: 1.8, cc: 'yellow', dec: 1, dz: [8, 20], risk: 'spread' },
    { k: 'vol_1h', chip: 'vol', min: 10, max: 200, step: 1, v: 54, cc: 'orange', dec: 0, unit: '%', dz: [160, 200], risk: 'vol' },
    { k: 'position_pct', chip: 'pos', min: -4, max: 4, step: 0.1, v: 0, cc: 'blue', dec: 1, sign: 1, bi: 1, mark: 0 },
    { k: 'daily_pnl', chip: 'pnl', min: -2500, max: 1500, step: 10, v: 320, cc: 'green', usd: 1, bi: 1, mark: 0, dz: [-2500, -1600], risk: 'loss' },
    { k: 'drawdown_pct', chip: 'dd', min: 0, max: 14, step: 0.1, v: 3.2, cc: 'red', dec: 1, dz: [8, 14], risk: 'dd' },
    { k: 'latency_ms', chip: 'lat', min: 5, max: 600, step: 1, v: 42, cc: 'cyan', dec: 0, dz: [300, 600], risk: 'latency' },
    { k: 'signal_age_s', chip: 'age', min: 0, max: 120, step: 1, v: 8, cc: 'gray', dec: 0, dz: [45, 120], risk: 'age' },
  ];
  FIELDS.forEach((f) => (f.label = f.k));
  const FLOOR = { k: 'floor', label: 'floor', min: 0.5, max: 0.99, step: 0.01, v: 0.85, cc: 'orange', dec: 2, mark: 0.85 };
  // order = FIELDS order: edge · imbalance · spread · vol · position · pnl · drawdown · latency · age
  const PRESETS = {
    trend: [22, 0.34, 1.4, 58, 0, 420, 1.4, 38, 6],
    'mean-revert': [-7, 0.12, 2.2, 30, 0, 120, 1, 44, 9],
    'wide book': [22, 0.3, 12.5, 84, 0, 200, 2.1, 140, 8],
    'stale feed': [16, 0.2, 2.2, 52, 0, 150, 1.8, 360, 52],
    reversal: [-12, -0.2, 1.6, 62, 2.4, 380, 2, 40, 6],
    stress: [-6, -0.3, 6.5, 168, 3.2, -1900, 10.2, 190, 12],
  };
  const ACOL = { buy: '46,230,166', sell: '255,77,94', hold: '184,178,194', close: '255,138,61', flatten: '166,107,255' };
  const DC = { execute: 'green', review: 'yellow', skip: 'gray' };
  const DHEX = { execute: C.green, review: C.amber, skip: '#b8b2c2' };
  const BUILD = { buy: 'entry', sell: 'entry', hold: 'guard', close: 'exit', flatten: 'liq' };
  const VENUES = ['binance', 'hyperliquid', 'okx', 'bybit', 'coinbase', 'kraken'];

  const fmtV = (f, v) => {
    if (f.usd) return (v < 0 ? '-$' : '+$') + J.fmt(Math.abs(Math.round(v)));
    if (Math.abs(v) < Math.pow(10, -(f.dec || 0)) / 2) v = 0;
    return (f.sign ? J.sgn(v, f.dec) : J.fmt(v, f.dec)) + (f.unit || '');
  };
  const fmtP = (p) => (p >= 0.995 ? '>99%' : p < 0.005 ? '<1%' : Math.round(p * 100) + '%');
  const fmtSize = (s) => s + '%';
  const snap = (f, v) => +(Math.round((v - f.min) / f.step) * f.step + f.min).toFixed(4);

