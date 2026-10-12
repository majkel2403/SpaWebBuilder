  /* =====================================================================================
   * the tape — candle model (seeded back-history + live ticks), vwap ±1σ, order book model
   * ===================================================================================== */
  const CAND_MS = 6000, KEEP = 150, LAM = 0.975, NB = 10;
  const cands = [], marks = []; let cidSeq = 0;
  const mkC = (o, t) => ({ cid: cidSeq++, o, h: o, l: o, c: o, v: 0, ev: 0, epv: 0, epv2: 0, vw: o, sd: 0, t0: t });
  const accum = (cd, pv) => {                                   // decayed volume-weighted sums → vwap and σ
    const tp = (cd.h + cd.l + cd.c) / 3;
    cd.ev = (pv ? pv.ev * LAM : 0) + cd.v; cd.epv = (pv ? pv.epv * LAM : 0) + cd.v * tp; cd.epv2 = (pv ? pv.epv2 * LAM : 0) + cd.v * tp * tp;
    if (cd.ev > 0) { cd.vw = cd.epv / cd.ev; cd.sd = Math.sqrt(Math.max(0, cd.epv2 / cd.ev - cd.vw * cd.vw)); } else { cd.vw = tp; cd.sd = 0; }
  };
  (function seedTape() {
    const rg = J.rng(8473), gz = () => Math.sqrt(-2 * Math.log(rg() + 1e-9)) * Math.cos(TAU * rg());
    const N = 76; let p = 84722, drift = 0, vx = 0.00085;
    for (let i = 0; i < N; i++) {
      const x = i / N;
      drift = drift * 0.8 + gz() * 0.00009 + 0.00005 * Math.sin(x * TAU * 1.3 + 0.4);
      vx = clamp(vx * 0.9 + 0.000085 + Math.abs(gz()) * 0.00005, 0.0005, 0.0016);
      const o = p, r = drift + vx * gz(), c = o * (1 + r);
      const h = Math.max(o, c) * (1 + Math.abs(gz()) * vx * 0.55), l = Math.min(o, c) * (1 - Math.abs(gz()) * vx * 0.55);
      const cd = mkC(o, 0); cd.c = c; cd.h = h; cd.l = l; cd.v = (34 + 30 * Math.abs(r) / vx) * Math.exp(gz() * 0.3);
      cands.push(cd); p = c;
    }
    const f = M.price / p;
    for (let i = 0; i < cands.length; i++) { const c = cands[i]; c.o *= f; c.h *= f; c.l *= f; c.c *= f; accum(c, cands[i - 1]); }
    const live = mkC(M.price, nowMs()); live.v = 6; accum(live, cands[cands.length - 1]); cands.push(live);
    for (let i = 0; i < 11; i++) {                               // a few fired tickets in the back-history
      const c = cands[4 + Math.floor(rg() * (N - 10))], k = rg(), kind = k < 0.4 ? 'buy' : k < 0.8 ? 'sell' : 'close';
      marks.push({ cid: c.cid, price: kind === 'buy' ? c.l : kind === 'sell' ? c.h : (c.o + c.c) / 2, kind, t: -1e9, txt: '', size: J.SIZES[(rg() * 4) | 0], conf: 0.86 + rg() * 0.11, dest: 'execute', venue: ['binance', 'okx', 'bybit', 'hyperliquid', 'coinbase', 'kraken'][(rg() * 6) | 0] });
    }
  })();

  const pA = new Float32Array(NB), pB = new Float32Array(NB), sA = new Int8Array(NB), sB = new Int8Array(NB);
  const bkA = new Float32Array(NB), bkB = new Float32Array(NB), tA = new Float32Array(NB), tB = new Float32Array(NB), fA = new Float32Array(NB), fB = new Float32Array(NB);
  const lblA = new Array(NB).fill(''), lblB = new Array(NB).fill('');
  const book = { mid: '', spr: '', sprBps: 0, imb: 0, up: true, mx: 3, gap: 5 };
  const draw1 = (k, imb, bid) => (0.35 + Math.random() * 1.5) * (1 + k * 0.2) * (Math.random() < 0.05 ? 2.4 : 1) * Math.max(0.35, 1 + (bid ? 1 : -1) * 0.6 * imb);
  const retarget = (frac) => {
    for (let k = 0; k < NB; k++) {
      if (Math.random() < frac) { const v = draw1(k, sim.imbT, false); if (Math.abs(v - tA[k]) > 0.6 + 0.4 * tA[k]) { fA[k] = 1; sA[k] = v > tA[k] ? 1 : -1; pA[k] = bkA[k]; if (v < tA[k] * 0.42 && tA[k] > 1) eA[k] = 1; } tA[k] = v; }
      if (Math.random() < frac) { const v = draw1(k, sim.imbT, true); if (Math.abs(v - tB[k]) > 0.6 + 0.4 * tB[k]) { fB[k] = 1; sB[k] = v > tB[k] ? 1 : -1; pB[k] = bkB[k]; if (v < tB[k] * 0.42 && tB[k] > 1) eB[k] = 1; } tB[k] = v; }
    }
  };
  const bookLabels = (price) => {
    const half = Math.max(1, Math.round(price * sim.spr / 2e4)), bb = Math.round(price) - half, ba = Math.round(price) + half;
    for (let k = 0; k < NB; k++) { lblB[k] = fmt(bb - k * 2); lblA[k] = fmt(ba + k * 2); }
    book.mid = fmt(price, 1); book.spr = '$' + (half * 2) + ' · ' + sim.spr.toFixed(1) + 'bp'; book.sprBps = sim.spr; book.gap = half;
  };
  for (let k = 0; k < NB; k++) { tA[k] = bkA[k] = draw1(k, 0, false); tB[k] = bkB[k] = draw1(k, 0, true); }
  bookLabels(M.price);

  const eA = new Int8Array(NB), eB = new Int8Array(NB);              // 'level eaten' flags (a size collapsed): consumed by drawBook
  const fx = { birthT: -1e9, birthN: 0, tickT: -1e9, pool: mkPool(120) };
  let lastPx = M.price;
  function tapeTick(price, dp) {
    const t = nowMs(); let cur = cands[cands.length - 1];
    fx.tickT = t;
    if (t - cur.t0 >= CAND_MS) {
      fx.birthT = t; fx.birthN = 1;
      accum(cur, cands[cands.length - 2]);
      cur = mkC(cur.c, t); cands.push(cur); if (cands.length > KEEP) cands.shift();
      tg.slide = tg.slot || 8;
      while (marks.length && marks[0].cid < cands[0].cid - 1) marks.shift();
    }
    cur.c = price; if (price > cur.h) cur.h = price; if (price < cur.l) cur.l = price;
    cur.v += (0.8 + 2.4 * Math.abs(dp) / (price * M.vol)) * (0.55 + Math.random() * 0.9);
    accum(cur, cands[cands.length - 2]);
    book.up = price >= lastPx; lastPx = price;
    retarget(0.3); bookLabels(price);
  }

