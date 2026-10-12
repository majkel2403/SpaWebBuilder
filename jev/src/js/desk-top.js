/* desk-top — status ticker · swarm P&L · the tape (prefix dkt-). Everything here is SIMULATED:
 * candles come from JEV.market ticks (+ a seeded back-history), P&L moves on executed decisions (+ mark-to-market of open tickets). */
JEV.mod('desk-top', () => {
  const J = JEV, $ = J.$, $$ = J.$$, C = J.C, S = J.S, M = J.market, TAU = J.TAU, clamp = J.clamp, fmt = J.fmt;
  const bar = $('#dkt-bar'), pnl = $('#dkt-pnl'), tape = $('#dkt-tape');
  if (!bar || !pnl || !tape) return;
  const reduce = J.reduce;
  const MONO = "'JetBrains Mono', ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, Consolas, monospace";
  const SANS = "'Space Grotesk', 'Inter', system-ui, sans-serif";
  const nowMs = () => performance.now();
  const setT = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  const rgbOf = (h) => { const n = parseInt(h.slice(1), 16); return (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255); };
  const GRN = rgbOf(C.green), RED = rgbOf(C.red), AMB = rgbOf(C.amber), VIO = rgbOf(C.violet), PNK = rgbOf(C.pink);
  const cG = (a) => 'rgba(' + GRN + ',' + a + ')', cR = (a) => 'rgba(' + RED + ',' + a + ')';
  const sgnUsd = (v) => (v >= 0 ? '+$' : '-$') + fmt(Math.abs(Math.round(v)));
  const sgnPct = (v, d) => (v >= 0 ? '+' : '-') + Math.abs(v).toFixed(d == null ? 2 : d) + '%';
  const short = (s) => s.split('-')[0].toLowerCase();
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  /** soft additive glow sprite (drawn with 'lighter'; replaces shadowBlur) */
  const sprite = (rgb) => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(' + rgb + ',.9)'); gr.addColorStop(.3, 'rgba(' + rgb + ',.3)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c;
  };
  const SP = { g: sprite(GRN), r: sprite(RED), a: sprite(AMB), p: sprite(PNK) };
  const glow = (g, spr, x, y, r, a) => { g.globalAlpha = a; g.drawImage(spr, x - r, y - r, r * 2, r * 2); g.globalAlpha = 1; };
  /* ---- spectacle kit (tier-gated: tier 1 = the page as it always was; reduced motion = off) ---- */
  const tier = () => (reduce ? 1 : (J.tier || 2));
  const SPW = sprite('255,255,255'), SPR = [SP.g, SP.r, SP.a, SP.p, SPW];       // particle sprites: 0 green 1 red 2 amber 3 pink 4 white
  const beamSpr = (rgb) => {                                                    // vertical light column: soft sides, bright toward the bottom (stretched, never re-rendered)
    const c = document.createElement('canvas'); c.width = 16; c.height = 64; const g = c.getContext('2d');
    const v = g.createLinearGradient(0, 0, 0, 64); v.addColorStop(0, 'rgba(' + rgb + ',0)'); v.addColorStop(1, 'rgba(' + rgb + ',.9)'); g.fillStyle = v; g.fillRect(0, 0, 16, 64);
    g.globalCompositeOperation = 'destination-in'; const h = g.createLinearGradient(0, 0, 16, 0); h.addColorStop(0, 'rgba(0,0,0,0)'); h.addColorStop(.5, '#000'); h.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = h; g.fillRect(0, 0, 16, 64); return c;
  };
  const BM = { g: beamSpr(GRN), r: beamSpr(RED), p: beamSpr(PNK), a: beamSpr(AMB) };
  const bandSpr = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 4; const g = c.getContext('2d'), h = g.createLinearGradient(0, 0, 64, 0);
    h.addColorStop(0, 'rgba(255,255,255,0)'); h.addColorStop(.5, 'rgba(255,255,255,.2)'); h.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = h; g.fillRect(0, 0, 64, 4); return c; })();
  /** bounded particle pool (typed arrays, ring-reused: no allocation per spawn / frame). slot = x y vx vy life max size kind */
  const mkPool = (n) => ({ n, a: new Float32Array(n * 8), c: 0 });
  function spawn(p, x, y, vx, vy, life, size, kind) {
    const a = p.a, o = p.c * 8; p.c = (p.c + 1) % p.n;
    a[o] = x; a[o + 1] = y; a[o + 2] = vx; a[o + 3] = vy; a[o + 4] = life; a[o + 5] = life; a[o + 6] = size; a[o + 7] = kind;
  }
  /** burst of radial sparks; ay = vertical accel (px/s^2, negative rises) */
  function burst(p, x, y, n, kind, speed, life, size, ay) {
    for (let i = 0; i < n; i++) { const an = Math.random() * TAU, sp = speed * (0.35 + Math.random() * 0.75); spawn(p, x, y, Math.cos(an) * sp, Math.sin(an) * sp + (ay || 0) * 0.02, life * (0.6 + Math.random() * 0.6), size * (0.7 + Math.random() * 0.6), Math.random() < 0.25 ? 4 : kind); }
  }
  function drawPool(p, g, dt, ay, drag, flick) {
    const a = p.a, k = Math.exp(-dt * drag); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < p.n; i++) {
      const o = i * 8; let life = a[o + 4]; if (life <= 0) continue;
      life -= dt; a[o + 4] = life; if (life <= 0) continue;
      a[o + 2] *= k; a[o + 3] = a[o + 3] * k + ay * dt; a[o] += a[o + 2] * dt; a[o + 1] += a[o + 3] * dt;
      const f = life / a[o + 5], fl = flick ? 0.65 + 0.35 * Math.sin(life * 38 + i * 1.7) : 1;
      glow(g, SPR[a[o + 7]], a[o], a[o + 1], a[o + 6] * (0.35 + 0.65 * f), Math.min(1, f * 1.6) * fl);
    }
    g.globalCompositeOperation = 'source-over';
  }
  const AG = {}; J.AGENTS.forEach((a) => (AG[a.key] = a));
  const HOLD = { entry: 'edge', sizer: 'kelly', guard: 'prior', router: 'taker', exit: 'closer', funding: 'prior', news: 'spotter', mm: 'taker', liq: 'closer', rebal: 'spotter' };

  /* =====================================================================================
   * shared simulation state
   * ===================================================================================== */
  const BASE = 527759, CAP = BASE, LEV = 10, HEDGE = 0.3, HN = 300, OW = 200;
  const hist = new Float64Array(HN); let hh = 0;               // balance ring: one sample per market tick (4 Hz)
  const hpush = (v) => { hist[hh] = v; hh = (hh + 1) % HN; };
  const hat = (i) => hist[(hh + i) % HN];                      // i = 0 oldest
  const sim = {
    bal: BASE, open: BASE, peak: BASE, dd: 0, shown: BASE, tixN: 14882, outc: [], sumBps: 0, nBps: 300, sizeN: [31, 36, 22, 11],
    tix: [], holder: 'kelly', gap: 1.0, lastDec: 0, edgeAvg: 9, imbT: 0, spr: 1.1, last: null, jump: 0, jumpT: -99, stripDirty: true,
  };
  const reviews = [], pulseEv = [];
  const rgs = J.rng(7741), gzs = () => Math.sqrt(-2 * Math.log(rgs() + 1e-9)) * Math.cos(TAU * rgs());
  (function seedSim() {
    let nz = 0, step = 0; const raw = [];
    for (let i = 0; i < HN; i++) {
      const x = i / (HN - 1);
      nz = nz * 0.965 + gzs() * 38;
      if (rgs() < 0.075) step += (rgs() < 0.56 ? 1 : -1) * (55 + rgs() * 120);
      raw.push(1100 * x - 2300 * Math.exp(-Math.pow((x - 0.5) / 0.12, 2)) + 420 * Math.sin(x * 11) + nz + step * 0.8 + gzs() * 12);
    }
    const off = BASE - raw[HN - 1];
    sim.open = raw[0] + off; sim.peak = sim.open;
    for (let i = 0; i < HN; i++) {
      const v = raw[i] + off; hpush(v);
      if (v > sim.peak) sim.peak = v; else sim.dd = Math.max(sim.dd, (sim.peak - v) / sim.peak);
    }
    for (let i = 0; i < OW; i++) { const m = 3 + rgs() * 9; sim.outc.push(rgs() < 0.55 ? m : -m * 0.85); }
    sim.sumBps = 1.78 * sim.nBps;
    const t = nowMs();
    [[1, 52800], [-1, 26400], [1, 105600], [1, 52800]].forEach((a, i) => sim.tix.push({ dir: a[0], notional: a[1], born: t - 4000 * i, life: 16000 + i * 7000 }));
  })();

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

  /* =====================================================================================
   * status ticker
   * ===================================================================================== */
  const mt = $('#dkt-mt'), set1 = $('#dkt-ms');
  const set2 = set1.cloneNode(true); set2.removeAttribute('id'); set2.setAttribute('aria-hidden', 'true');
  $$('[id]', set2).forEach((e) => e.removeAttribute('id')); mt.appendChild(set2);
  const kEls = {}; $$('[data-k]', mt).forEach((e) => (kEls[e.dataset.k] || (kEls[e.dataset.k] = [])).push(e));
  const chipEls = {}; $$('[data-ck]', mt).forEach((e) => (chipEls[e.dataset.ck] || (chipEls[e.dataset.ck] = [])).push(e));
  const holdChips = $$('.dkt-c', mt).filter((e) => e.querySelector('[data-k="holder"]'));
  const K = (k, s) => { const a = kEls[k]; if (a) for (let i = 0; i < a.length; i++) setT(a[i], s); };
  const chipC = (k, c) => { const a = chipEls[k]; if (a) for (let i = 0; i < a.length; i++) if (a[i].dataset.c !== c) a[i].dataset.c = c; };
  $$('.dkt-c', set1).forEach((e) => { e.tabIndex = 0; });       // keyboard: tab through the chips (the marquee holds while one has focus); the clone stays out of the tab order
  const mq = $('.dkt-mq', bar);
  if (mq) {                                                      // touch: tap the strip to hold it, tap again to resume
    mq.addEventListener('click', () => { if (matchMedia('(hover: none)').matches) mq.classList.toggle('dkt-hold'); });
  }
  let mqW = 0;
  J.watch(set1, (r) => {
    if (!r.width || (mqW && Math.abs(r.width - mqW) / mqW < 0.05)) return;
    mqW = r.width; mt.style.setProperty('--mqd', Math.round(r.width / (J.narrow() ? 36 : 46)) + 's');
  });
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

  /* handoff pulse: last 60 s of decisions */
  const pu = $('#dkt-pu'), puS = { g: null, W: 0, H: 0 };
  if (pu) {
    J.watch(pu, () => { const r = J.fit(pu); puS.g = r.g; puS.W = r.W; puS.H = r.H; });
    const t = nowMs(), dests = ['execute', 'execute', 'execute', 'review', 'review', 'skip', 'skip', 'skip'];
    for (let i = 0; i < 44; i++) pulseEv.push({ t: t - rgs() * 58000, dest: dests[(rgs() * dests.length) | 0], conf: 0.5 + rgs() * 0.48 });
    pulseEv.sort((a, b) => a.t - b.t);
  }
  const PD = { execute: [GRN, '#2ee6a6'], review: [AMB, '#ffc13d'], skip: ['125,117,144', '#7d7590'] };
  function drawPulse() {
    const g = puS.g; if (!g) return;
    const W = puS.W, H = puS.H, t = nowMs();
    g.clearRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(0, H - 1, W, 1);
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < pulseEv.length; i++) {
      const e = pulseEv[i], age = (t - e.t) / 60000; if (age > 1) continue;
      const x = Math.round(W - 3 - age * (W - 4)), h = 4 + e.conf * (H - 8), c = PD[e.dest];
      g.globalAlpha = 1 - age * 0.7; g.fillStyle = c[1]; g.fillRect(x, H - 1 - h, 2, h);
      if (e.dest === 'execute' && age < 0.5) { g.globalAlpha = 0.14 * (1 - age * 2); g.fillRect(x - 2, H - 1 - h, 6, h); }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  let acB = 0;
  J.task(bar, (t, dt) => { drawPulse(); acB += dt; if (acB < 0.25) return; acB = 0; flushBar(); });

  /* =====================================================================================
   * swarm p&l
   * ===================================================================================== */
  const balEl = $('#dkt-bal'), balSr = $('#dkt-bal-sr'), runEl = $('#dkt-run'), dvEl = $('#dkt-dv'), dpcEl = $('#dkt-dpc'), darEl = $('#dkt-dar'), subEl = $('#dkt-sub'), liveEl = $('#dkt-live');
  const sTix = $('#dkt-s-tix'), sWin = $('#dkt-s-win'), sEdge = $('#dkt-s-edge'), sDd = $('#dkt-s-dd'), ringEl = $('#dkt-ring');
  let digs = [], srT = 0;
  /* flashes: the glow is a static text-shadow on a child overlay (.dkt-gl, rasterised once); only its opacity (and the digit's transform) animate,
   * so a flash is compositor-only - the old color + textShadow(30px) animations repainted blurred glyphs on the main thread every frame. One flash per host per 420 ms. */
  const FLASH_MS = 420, GLOW_KF = [{ opacity: 1 }, { opacity: .55, offset: .3 }, { opacity: 0 }];
  function glowFlash(host, txt, cls) {
    if (reduce) return null;
    let gl = host._gl;
    if (!gl) { gl = host._gl = document.createElement('i'); gl.setAttribute('aria-hidden', 'true'); gl.textContent = txt; host.appendChild(gl); }
    else if (gl.textContent !== txt) gl.textContent = txt;           // a still-fading overlay always mirrors the current text (never a ghost of the old digit)
    const t = nowMs(); if (t - (host._ft || -1e9) < FLASH_MS) return null;
    const a = J.animate(gl, GLOW_KF, { duration: 780, easing: 'cubic-bezier(.2,.7,.3,1)' }); if (!a) return null;
    host._ft = t; gl.className = 'dkt-gl ' + cls;
    return a;
  }
  let rollN = 0;
  /** odometer roll: the old glyph slides out one way while the new one rolls in from the other, with a springy settle (transform + opacity only) */
  function digitFlash(sp, ch, dir, old) {
    glowFlash(sp, ch, dir > 0 ? 'u' : 'd');
    if (reduce) return;
    const tn = sp.firstChild;
    const a = J.animate(sp, [{ transform: 'translateY(' + (dir > 0 ? '34%' : '-34%') + ') scale(1.04)', opacity: .15 }, { transform: 'translateY(' + (dir > 0 ? '-3%' : '3%') + ')', opacity: 1, offset: .55 }, { transform: 'none', opacity: 1 }], { duration: 620, easing: 'cubic-bezier(.2,.9,.25,1.12)' });
    if (!a || rollN > 9 || old == null) return;
    const g = document.createElement('i'); g.className = 'dkt-ol'; g.setAttribute('aria-hidden', 'true'); g.textContent = old; sp.appendChild(g);
    const b = J.animate(g, [{ transform: 'none', opacity: .5 }, { transform: 'translateY(' + (dir > 0 ? '-48%' : '48%') + ')', opacity: 0 }], { duration: 340, easing: 'cubic-bezier(.4,0,.8,.4)' });
    if (!b) { g.remove(); return; }
    rollN++; b.onfinish = b.oncancel = () => { rollN--; g.remove(); };
  }
  function setBalText(s, dir) {
    if (digs.length !== s.length) {
      balEl.textContent = ''; digs = [];
      for (let i = 0; i < s.length; i++) { const sp = document.createElement('span'); sp.className = s[i] === ',' ? 'dkt-cm' : 'dkt-dg'; sp.appendChild(document.createTextNode(s[i])); balEl.appendChild(sp); digs.push(sp); }
      return;
    }
    for (let i = 0; i < s.length; i++) { const sp = digs[i], tn = sp.firstChild; if (tn.data !== s[i]) { const old = tn.data; tn.data = s[i]; if (sp.className === 'dkt-dg') digitFlash(sp, s[i], dir, old); } }
  }
  /** stat value with a flash overlay: text lives in firstChild so the overlay survives text updates */
  const flashStat = (el, txt) => { const tn = el.firstChild; if (tn.data === txt) return; tn.data = txt; glowFlash(el, txt, 's'); };
  const setW = (el, pct) => { const v = pct.toFixed(1) + '%'; if (el.style.getPropertyValue('--w') !== v) el.style.setProperty('--w', v); };
  const segs = (id) => $$('#' + id + ' i');
  const pb1 = segs('dkt-pb1'), pb2 = segs('dkt-pb2'), pb3 = segs('dkt-pb3'), pv1 = $('#dkt-pv1'), pv2 = $('#dkt-pv2'), pv3 = $('#dkt-pv3');
  function flushPnl() {
    const bal = sim.bal, delta = bal - sim.open, pos = delta >= 0, pct = delta / sim.open * 100;
    if (pnl.classList.contains('dkt-neg') === pos) {
      pnl.classList.toggle('dkt-neg', !pos);
      const pill = $('.dkt-dp', pnl); if (pill && pill._pos != null) J.animate(pill, [{ transform: 'scale(1)' }, { transform: 'scale(1.12)', offset: .35 }, { transform: 'scale(1)' }], { duration: 560, easing: 'cubic-bezier(.2,.9,.3,1.2)' });   // sign flip: the pill morphs colour (css transition) and pops
    }
    { const pill = $('.dkt-dp', pnl); if (pill) pill._pos = pos; }
    if (dpcEl) { const arrow = darEl; if (arrow && arrow._pos !== pos) { arrow._pos = pos; arrow.style.transform = pos ? 'none' : 'rotate(180deg)'; } }
    const dir = bal >= sim.shown ? 1 : -1; sim.shown = bal;
    const s = fmt(Math.round(bal)); setBalText(s, dir);
    const t = nowMs(); if (t - srT > 6000) { srT = t; setT(balSr, 'swarm balance ' + s + ' dollars, ' + sgnUsd(delta) + ' on the session, simulated'); }
    setT(runEl, sgnUsd(delta)); setT(dvEl, sgnUsd(delta)); setT(dpcEl, sgnPct(pct)); setT(darEl, '▲');
    setT(subEl, 'vs open $' + fmt(Math.round(sim.open)) + ' · settled by code');
    setT(liveEl, S.killed ? 'halted' : 'live');
    // stats
    flashStat(sTix, fmt(sim.tixN));
    let w = 0; for (let i = 0; i < sim.outc.length; i++) if (sim.outc[i] > 0) w++;
    const wr = w / sim.outc.length * 100; flashStat(sWin, wr.toFixed(1) + '%'); ringEl.style.setProperty('--p', wr.toFixed(1));
    const ae = sim.sumBps / sim.nBps; flashStat(sEdge, (ae >= 0 ? '+' : '-') + Math.abs(ae).toFixed(2) + 'bp');
    setT(sDd, (sim.dd * 100).toFixed(2) + '%');
    // proportion bars
    setW(pb1[0], wr); setW(pb1[1], 100 - wr); const up = Math.round(wr); setT(pv1, up + '% up · ' + (100 - up) + '% down');
    const dx = S.dest, a = 38 + dx.execute, b = 24 + dx.review, c = 38 + dx.skip, tt = a + b + c;
    setW(pb2[0], a / tt * 100); setW(pb2[1], b / tt * 100); setW(pb2[2], c / tt * 100);
    const pa = Math.round(a / tt * 100), pbb = Math.round(b / tt * 100); setT(pv2, pa + ' go · ' + pbb + ' rev · ' + (100 - pa - pbb) + ' skip');   // always sums to 100
    const sz = sim.sizeN, st = sz[0] + sz[1] + sz[2] + sz[3];
    for (let i = 0; i < 4; i++) setW(pb3[i], sz[i] / st * 100);
    setT(pv3, '.5 · 1 · 2 · 4 %');
  }

  /* p&l canvases.
   * The line + area + labels + the end tag only change when the balance series moves (a 4 Hz tick or a decision), the y-range is still easing or the kill switch flips, so they are
   * rendered into offscreen layers ONLY then (one Path2D shared by the fill, the glow stroke and the line) and every frame just blits them and draws the live end dot / ripple.
   * No `ctx.font` is assigned on the visible canvas per frame: that assignment forces a style+layout update whenever anything dirtied style (measured ~2.6 ms per frame here). */
  const pcv = $('#dkt-pc'), wcv = $('#dkt-wl');
  const pc = { g: null, W: 0, H: 0, ax: 64, yMin: 0, yMax: 1, init: false, gG: null, gR: null, off: document.createElement('canvas'), og: null, dirty: true,
    tag: document.createElement('canvas'), tg: null, tw: 55, dpr: 1, rKill: false, rHh: -1, rBal: NaN, tMin: 0, tMax: 1, lo: 0, hi: 0, rMin: 0, rMax: 0, yEnd: 0, ty: 0, up: true, fs: 9.5 };
  const tfs = (w) => clamp(w / 110, 9.5, 10.5);                // canvas text never below 9.5px, grows gently with the panel width
  const wl = { g: null, W: 0, H: 0 };
  J.watch(pcv.parentNode, () => {
    const r = J.fit(pcv); pc.g = r.g; pc.W = r.W; pc.H = r.H; pc.ax = r.W < 300 ? 54 : 64; pc.fs = tfs(r.W); pc.dpr = r.dpr; pc.tw = pc.ax - 9;
    pc.off.width = pcv.width; pc.off.height = pcv.height; const og = pc.og = pc.off.getContext('2d'); og.setTransform(pcv.width / r.W, 0, 0, pcv.height / r.H, 0, 0);
    pc.tag.width = Math.max(1, Math.round(pc.tw * r.dpr)); pc.tag.height = Math.max(1, Math.round(16 * r.dpr)); const tg2 = pc.tg = pc.tag.getContext('2d'); tg2.setTransform(r.dpr, 0, 0, r.dpr, 0, 0);
    pc.gG = og.createLinearGradient(0, 0, 0, r.H); pc.gG.addColorStop(0, cG(0.5)); pc.gG.addColorStop(1, cG(0));
    pc.gR = og.createLinearGradient(0, 0, 0, r.H); pc.gR.addColorStop(0, cR(0)); pc.gR.addColorStop(1, cR(0.5));
    pc.dirty = true;
  });
  J.watch(wcv, () => { const r = J.fit(wcv); wl.g = r.g; wl.W = r.W; wl.H = r.H; wl.fs = tfs(r.W); sim.stripDirty = true; });
  /* hover / touch scrub over the balance history: a vertical guide + dot are drawn per frame (no text), the readout is a DOM chip updated only when the sample changes */
  const scrub = document.createElement('div'); scrub.className = 'dkt-scrub'; scrub.setAttribute('aria-hidden', 'true');
  scrub.innerHTML = '<b></b><span></span>'; pcv.parentNode.appendChild(scrub);
  const scB = scrub.firstChild, scS = scrub.lastChild; const sc = { on: false, x: 0, i: -1, t: 0, touch: false };
  const scMove = (e) => { sc.on = true; sc.x = e.offsetX; sc.t = nowMs(); sc.touch = e.pointerType === 'touch'; };
  pcv.addEventListener('pointermove', scMove, { passive: true }); pcv.addEventListener('pointerdown', scMove, { passive: true });
  pcv.addEventListener('pointerleave', () => { if (!sc.touch) sc.on = false; }); pcv.addEventListener('pointercancel', () => { if (!sc.touch) sc.on = false; });
  pcv.style.touchAction = 'pan-y'; pcv.style.cursor = 'crosshair';
  const PY0 = 16, PX0 = 8;
  const pfx = { pool: mkPool(56), hiT: -1e9, loT: -1e9, crackT: -1e9, crack: new Float32Array(24), trail: 0 };
  /** the cached layer: grid, above/below-open fill, glow + line, open baseline, axis labels */
  function renderPnl() {
    const og = pc.og, W = pc.W, H = pc.H, x0 = PX0, x1 = W - pc.ax, y0 = PY0, y1 = H - 10, yMin = pc.yMin;
    const ys = (y1 - y0) / (pc.yMax - yMin), Yp = (v) => y1 - (v - yMin) * ys;
    pc.rMin = pc.yMin; pc.rMax = pc.yMax; pc.rKill = S.killed;
    og.clearRect(0, 0, W, H);
    og.strokeStyle = 'rgba(255,255,255,.045)'; og.lineWidth = 1; og.beginPath();       // faint grid
    for (let i = 0; i < 4; i++) { const y = Math.round(y0 + (y1 - y0) * i / 3) + 0.5; og.moveTo(x0, y); og.lineTo(x1 + 6, y); }
    og.stroke();
    const dx = (x1 - x0) / HN, yEnd = Yp(sim.bal), by = clamp(Yp(sim.open), y0, y1);
    const line = new Path2D(); line.moveTo(x0, Yp(hat(0)));
    for (let i = 1; i < HN; i++) line.lineTo(x0 + i * dx, Yp(hat(i)));
    line.lineTo(x1, yEnd);
    const area = new Path2D(line); area.lineTo(x1, by); area.lineTo(x0, by); area.closePath();
    for (let side = 0; side < 2; side++) {                       // above the open line = green, below = red
      const up = side === 0, top = up ? 0 : by, hgt = up ? by : H - by; if (hgt <= 0) continue;
      og.save(); og.beginPath(); og.rect(0, top, W, hgt); og.clip();
      og.fillStyle = up ? pc.gG : pc.gR; og.fill(area);
      og.globalCompositeOperation = 'lighter'; og.lineJoin = 'round';
      og.lineWidth = 6; og.strokeStyle = up ? cG(0.13) : cR(0.13); og.stroke(line);
      og.lineWidth = 2; og.strokeStyle = up ? cG(1) : cR(1); og.stroke(line);
      og.restore();
    }
    // open baseline + axis
    og.setLineDash([2, 4]); og.strokeStyle = 'rgba(255,255,255,.28)'; og.beginPath(); og.moveTo(x0, by + 0.5); og.lineTo(x1 + 4, by + 0.5); og.stroke(); og.setLineDash([]);
    og.font = '500 ' + pc.fs + 'px ' + MONO; og.textBaseline = 'middle'; og.textAlign = 'left';
    og.fillStyle = '#b4abc2'; og.fillText('open', x1 + 8, clamp(by, y0 + 6, y1 - 6));
    og.fillStyle = '#cfc6dc'; og.fillText(fmt(Math.round(pc.hi)), x1 + 8, y0 - 3); og.fillText(fmt(Math.round(pc.lo)), x1 + 8, y1 + 1);
    if (S.killed) { og.fillStyle = cR(0.9); og.font = '700 ' + pc.fs + 'px ' + MONO; og.fillText('halted · tickets go to review', x0 + 2, y0 + 2); }
    pc.yEnd = yEnd; pc.ty = clamp(yEnd, y0 + 9, y1 - 9); pc.up = sim.bal >= sim.open;
    // end tag (own tiny layer: drawn after the live glow so the glow never tints it)
    const tg2 = pc.tg; tg2.clearRect(0, 0, pc.tw, 16); rr(tg2, 0, 0, pc.tw, 16, 4); tg2.fillStyle = pc.up ? C.green : C.red; tg2.fill();
    tg2.fillStyle = '#0a0710'; tg2.font = '700 ' + pc.fs + 'px ' + MONO; tg2.textBaseline = 'middle'; tg2.textAlign = 'left'; tg2.fillText(fmt(Math.round(sim.bal)), 4, 8.5);
  }
  function drawPnl(t, dt) {
    const g = pc.g; if (!g) return;
    const W = pc.W, H = pc.H, ax = pc.ax, x1 = W - ax, y0 = PY0, y1 = H - 10;
    pc.frames++;
    let fresh = pc.dirty || pc.rKill !== S.killed;
    if (pc.rHh !== hh || pc.rBal !== sim.bal) {                  // series moved: new y-range targets (hist scan only here, not every frame)
      pc.rHh = hh; pc.rBal = sim.bal; fresh = true;
      let lo = sim.open, hi = sim.open;
      for (let i = 0; i < HN; i++) { const v = hist[i]; if (v < lo) lo = v; if (v > hi) hi = v; }
      if (sim.bal < lo) lo = sim.bal; if (sim.bal > hi) hi = sim.bal;
      if (pc.init && tier() >= 2) {                              // new window high: embers rise off the head; new window low: a red crack + a glitch jolt (rate-limited)
        const tn = nowMs();
        if (sim.bal > pc.hi + 0.5 && tn - pfx.hiT > 2500) {
          pfx.hiT = tn; const ex = pc.W - pc.ax, n = tier() >= 3 ? 26 : 14;
          for (let i = 0; i < n; i++) spawn(pfx.pool, ex + (Math.random() - 0.5) * 8, pc.yEnd, (Math.random() - 0.7) * 44, -(30 + Math.random() * 70), 0.9 + Math.random() * 1.3, 5 + Math.random() * 6, i % 3 === 0 ? 4 : i % 3 === 1 ? 2 : 0);
        } else if (sim.bal < pc.lo - 0.5 && tn - pfx.loT > 2500) {
          pfx.loT = tn; pfx.crackT = tn; const c = pfx.crack;
          for (let b = 0; b < 3; b++) { let x = 0, y = 0; const an = Math.PI * (0.6 + b * 0.35) + (Math.random() - 0.5) * 0.4; for (let j = 0; j < 4; j++) { const l = 9 + Math.random() * 12, a2 = an + (Math.random() - 0.5) * 1.1; x += Math.cos(a2) * l; y += Math.sin(a2) * l; c[b * 8 + j * 2] = x; c[b * 8 + j * 2 + 1] = y; } }
          if (bigEl) J.animate(bigEl, [{ transform: 'none' }, { transform: 'translateX(-3px) skewX(-4deg)', offset: .12 }, { transform: 'translateX(4px)', offset: .24 }, { transform: 'translateX(-2px) skewX(3deg)', offset: .38 }, { transform: 'translateX(1px)', offset: .55 }, { transform: 'none' }], { duration: 420, easing: 'steps(7, end)' });
        }
      }
      const pad = Math.max((hi - lo) * 0.16, 30); pc.lo = lo; pc.hi = hi; pc.tMin = lo - pad; pc.tMax = hi + pad;
    }
    if (!pc.init) { pc.yMin = pc.tMin; pc.yMax = pc.tMax; pc.init = true; } else { const k = 1 - Math.exp(-dt * 4); pc.yMin += (pc.tMin - pc.yMin) * k; pc.yMax += (pc.tMax - pc.yMax) * k; }
    const ys = (y1 - y0) / (pc.yMax - pc.yMin);
    if (fresh || Math.abs(pc.yMin - pc.rMin) * ys > 0.12 || Math.abs(pc.yMax - pc.rMax) * ys > 0.12) { renderPnl(); pc.dirty = false; }
    g.clearRect(0, 0, W, H); g.drawImage(pc.off, 0, 0, W, H);
    // end tag + live dot
    const yEnd = pc.yEnd, rgb = pc.up ? SP.g : SP.r;
    g.globalCompositeOperation = 'lighter'; glow(g, rgb, x1, yEnd, 14 + Math.sin(t * 4) * 3, 0.9);
    const age = (nowMs() - sim.jumpT) / 1000;
    if (age < 1.1) { g.strokeStyle = sim.jump >= 0 ? cG(1 - age / 1.1) : cR(1 - age / 1.1); g.lineWidth = 1.5; g.beginPath(); g.arc(x1, yEnd, 5 + age * 34, 0, TAU); g.stroke(); }
    const tr = tier();
    if (tr >= 2) {
      const ys2 = (y1 - y0) / (pc.yMax - pc.yMin), dxp = (x1 - PX0) / HN, K = tr >= 3 ? 36 : 22, yb = y1 + pc.yMin * ys2;
      g.lineCap = 'round'; g.strokeStyle = pc.up ? '#b8ffe6' : '#ffc0c6';                  // comet trail: the last ~6-9 s of the curve, tapering toward the tail
      let px0 = x1 - K * dxp, py0 = yb - hat(HN - K) * ys2;
      for (let i = HN - K + 1; i < HN; i++) {
        const r = (i - (HN - K)) / K, x = x1 - (HN - 1 - i) * dxp, y = i === HN - 1 ? yEnd : yb - hat(i) * ys2;
        g.globalAlpha = r * r * 0.85; g.lineWidth = 0.8 + 3.4 * r; g.beginPath(); g.moveTo(px0, py0); g.lineTo(x, y); g.stroke(); px0 = x; py0 = y;
      }
      g.globalAlpha = 1; g.lineCap = 'butt';
      const ph = (t * 0.13) % 1.25, sx = PX0 + (ph - 0.1) * (x1 - PX0);                      // scanning highlight: a soft band sweeps the plot, a bead rides the curve under it
      if (sx > PX0 && sx < x1) {
        g.globalAlpha = 0.9; g.drawImage(bandSpr, sx - 46, y0 - 4, 92, y1 - y0 + 8); g.globalAlpha = 1;
        const ix = clamp(Math.round((sx - PX0) / dxp), 0, HN - 1); glow(g, pc.up ? SP.g : SP.r, sx, yb - (ix === HN - 1 ? sim.bal : hat(ix)) * ys2, 9, 0.85);
      }
      glow(g, SPW, x1, yEnd, 6 + Math.sin(t * 6) * 1.5, 0.55);
      const ca = (nowMs() - pfx.crackT) / 1000;
      if (ca < 0.75) {                                                                          // crack: three jagged red forks from the head, flickering out
        g.globalAlpha = (1 - ca / 0.75) * (ca < 0.3 ? 1 : 0.5 + 0.5 * Math.sin(ca * 70)); g.lineWidth = 1.6; g.strokeStyle = C.red; g.lineJoin = 'miter';
        for (let b = 0; b < 3; b++) { g.beginPath(); g.moveTo(x1, yEnd); for (let j = 0; j < 4; j++) g.lineTo(x1 + pfx.crack[b * 8 + j * 2], yEnd + pfx.crack[b * 8 + j * 2 + 1]); g.stroke(); }
        g.globalAlpha = 1; g.lineJoin = 'round';
      }
      drawPool(pfx.pool, g, Math.min(dt, 0.05), -18, 1.6, true);
    }
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x1, yEnd, 2.6, 0, TAU); g.fill();
    g.drawImage(pc.tag, x1 + 7, pc.ty - 8, pc.tw, 16);
    if (sc.on && sc.touch && nowMs() - sc.t > 3500) sc.on = false;
    if (sc.on && pc.W) {
      const dxs = (x1 - PX0) / HN, k = clamp(Math.round((sc.x - PX0) / dxs), 0, HN - 1), v = k === HN - 1 ? sim.bal : hat(k), xx = PX0 + k * dxs, ysc = (y1 - y0) / (pc.yMax - pc.yMin), yy = y1 - (v - pc.yMin) * ysc;
      g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(Math.round(xx) + 0.5, y0 - 4); g.lineTo(Math.round(xx) + 0.5, y1 + 6); g.stroke(); g.setLineDash([]);
      g.fillStyle = v >= sim.open ? C.green : C.red; g.beginPath(); g.arc(xx, yy, 4, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke();
      if (k !== sc.i) {
        sc.i = k; const dlt = v - sim.open, ago = (HN - 1 - k) / 4;
        setT(scB, '$' + fmt(Math.round(v))); setT(scS, sgnUsd(dlt) + ' vs open · ' + (ago < 1 ? 'now' : '-' + Math.round(ago) + 's')); scB.style.color = dlt >= 0 ? C.green : C.red;
      }
      scrub.style.transform = 'translate(' + Math.round(clamp(xx - 62, 4, pc.W - ax - 112)) + 'px,' + 2 + 'px)'; if (!scrub.classList.contains('on')) scrub.classList.add('on');
    } else if (scrub.classList.contains('on')) { scrub.classList.remove('on'); sc.i = -1; }
  }
  function drawStrip() {
    const g = wl.g; if (!g) return;
    const W = wl.W, H = wl.H, n = 96, o = sim.outc, st = o.length - n, x0 = 32, slot = (W - x0 - 2) / n, bw = Math.max(1.4, slot * 0.62), mid = H / 2;
    g.clearRect(0, 0, W, H);
    let mx = 1; for (let i = st; i < o.length; i++) { const a = Math.abs(o[i]); if (a > mx) mx = a; }
    g.fillStyle = cG(0.95);
    for (let i = st; i < o.length; i++) if (o[i] > 0) { const h = Math.max(1.5, o[i] / mx * (mid - 2)); g.fillRect(x0 + (i - st) * slot, mid - 0.5 - h, bw, h); }
    g.fillStyle = cR(0.95);
    for (let i = st; i < o.length; i++) if (o[i] < 0) { const h = Math.max(1.5, -o[i] / mx * (mid - 2)); g.fillRect(x0 + (i - st) * slot, mid + 0.5, bw, h); }
    g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(x0 - 4, Math.round(mid), W - x0 + 4, 1);
    g.font = '500 ' + wl.fs + 'px ' + MONO; g.textBaseline = 'middle'; g.textAlign = 'left';
    g.fillStyle = '#7fe9c4'; g.fillText('win', 0, mid - 8); g.fillStyle = '#ff8b97'; g.fillText('loss', 0, mid + 8);
    sim.stripDirty = false;
  }
  let acP = 0;
  J.task(pnl, (t, dt) => {
    drawPnl(t, dt); if (sim.stripDirty) drawStrip();
    acP += dt; if (acP < 0.25) return; acP = 0; flushPnl();
  });

  /* =====================================================================================
   * the tape — canvas
   * ===================================================================================== */
  const tcv = $('#dkt-cv'), twrap = $('#dkt-tc');
  const L = { vwap: true, bands: true, book: true };
  const hv = { on: false, x: 0, y: 0, touch: false, t: 0, key: false };
  const hits = [];                                              // marker hit boxes of the last frame {x,y,m}
  const tg = { gArea: null, g: null, W: 0, H: 0, bf: 0.225, bfT: 0.225, bfMax: 0.225, px: M.price, yMin: 0, yMax: 1, ys: 1, init: false, slide: 0, n: 0, nar: false,
    x0: 8, x1: 100, y0: 12, y1: 100, cw: 100, bw: 0, axW: 60, slot: 8, nVis: 70, volH: 40, timeH: 16, fs: 9.5 };
  function layout() {
    const W = tg.W, H = tg.H, nar = W < 520;
    tg.nar = nar; tg.fs = tfs(W); tg.bfMax = nar ? 0.285 : 0.225; if (L.book) tg.bfT = tg.bfMax; else tg.bfT = 0;
    tg.bw = Math.round(W * tg.bf); tg.cw = W - tg.bw; tg.axW = nar ? 46 : 62;
    tg.x0 = 8; tg.x1 = tg.cw - tg.axW; tg.y0 = 14; tg.timeH = 16;
    tg.volH = Math.round((H - tg.y0 - tg.timeH) * 0.14); tg.y1 = H - tg.timeH - tg.volH - 8;
    if (tg.g) { tg.gArea = tg.g.createLinearGradient(0, tg.y0, 0, tg.y1); tg.gArea.addColorStop(0, 'rgba(' + PNK + ',.13)'); tg.gArea.addColorStop(1, 'rgba(77,141,255,0)'); }
    tg.slot = clamp((tg.x1 - tg.x0) / (nar ? 42 : 74), 5.4, 13); tg.nVis = Math.max(20, Math.floor((tg.x1 - tg.x0 - 6) / tg.slot));
  }
  J.watch(twrap, () => { const r = J.fit(tcv); tg.g = r.g; tg.W = r.W; tg.H = r.H; tg.bf = L.book ? (r.W < 520 ? 0.285 : 0.225) : 0; layout(); });
  $$('.dkt-chip[data-l]', tape).forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.l; L[k] = !L[k]; b.classList.toggle('on', L[k]); b.setAttribute('aria-pressed', String(L[k]));
    if (k === 'book') layout();
  }));
  const setHover = (e) => { hv.on = true; hv.key = false; hv.touch = e.pointerType === 'touch'; hv.x = e.offsetX; hv.y = e.offsetY; hv.t = nowMs(); };
  tcv.addEventListener('pointermove', setHover, { passive: true });
  tcv.addEventListener('pointerdown', setHover, { passive: true });
  tcv.addEventListener('pointerleave', () => { if (!hv.touch) hv.on = false; });   // touch: the read-out stays ~4 s after lifting, then fades (see drawTape)
  tcv.addEventListener('pointercancel', () => { if (!hv.touch) hv.on = false; });
  /* keyboard parity: focus the canvas, arrows walk the candles, home/end jump, esc clears */
  tcv.tabIndex = 0; tcv.setAttribute('role', 'img');
  tcv.addEventListener('keydown', (e) => {
    const k = e.key; if (k !== 'ArrowLeft' && k !== 'ArrowRight' && k !== 'Home' && k !== 'End' && k !== 'Escape') return;
    e.preventDefault(); if (k === 'Escape') { hv.on = false; return; }
    const n = tg.n || 1; let i = hv.on && hv.key ? hv.i : n - 1;
    i = k === 'ArrowLeft' ? i - 1 : k === 'ArrowRight' ? i + 1 : k === 'Home' ? 0 : n - 1; i = clamp(i, 0, n - 1);
    hv.on = true; hv.key = true; hv.touch = false; hv.i = i; hv.x = X(i); hv.y = tg.y0 + (tg.y1 - tg.y0) * 0.5; hv.t = nowMs();
  });
  tcv.addEventListener('blur', () => { if (hv.key) hv.on = false; });
  const X = (i) => tg.x1 - 4 - tg.slot * (tg.n - 1 - i) - tg.slot * 0.5 + tg.slide;
  const Y = (p) => tg.y1 - (p - tg.yMin) * tg.ys;
  const f0 = (n) => fmt(Math.round(n));

  function drawBook(t, dt) {
    const g = tg.g, W = tg.W, H = tg.H, cw = tg.cw, al = clamp(tg.bf / tg.bfMax, 0, 1);
    const k = 1 - Math.exp(-dt * 7); let sa = 0, sb = 0, mx = 0.5;
    for (let i = 0; i < NB; i++) {
      bkA[i] += (tA[i] - bkA[i]) * k; bkB[i] += (tB[i] - bkB[i]) * k; fA[i] = Math.max(0, fA[i] - dt * 1.7); fB[i] = Math.max(0, fB[i] - dt * 1.7);
      sa += bkA[i]; sb += bkB[i]; if (bkA[i] > mx) mx = bkA[i]; if (bkB[i] > mx) mx = bkB[i];
    }
    book.mx += (mx - book.mx) * k * 0.6; book.imb = (sb - sa) / (sb + sa || 1);
    if (al < 0.03) return;
    const nar = tg.nar, bx0 = cw + 10, bx1 = W - 8, bwid = bx1 - bx0, headH = 24, spH = 30, imbH = 44;
    const rh = (H - headH - spH - imbH - 4) / (NB * 2), yS = headH + NB * rh, cmx = Math.max(sa, sb, 1);
    g.save(); g.globalAlpha = al;
    g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(cw + 1, 0, 1, H);
    const fs = tg.fs;
    g.font = '700 ' + fs + 'px ' + MONO; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = '#d6cde2';
    g.fillText(nar ? 'BOOK' : 'ORDER BOOK', bx0, 12);
    g.textAlign = 'right'; g.fillStyle = '#b4abc2'; g.font = '500 ' + fs + 'px ' + MONO; g.fillText('10 × 10', bx1 - (nar ? 0 : 12), 12);
    if (!nar) { g.fillStyle = C.green; g.beginPath(); g.arc(bx1 - 2, 12, 2 + 0.6 * Math.sin(t * 5), 0, TAU); g.fill(); }
    const fz = fs, tr = tier(), shY = headH + (((t * 0.32) % 1.5) - 0.25) * (H - headH - imbH);   // tier>=2: size glow at each bar tip, waterfall shimmer, eaten-level sparks
    for (let side = 0; side < 2; side++) {
      const ask = side === 0, eat = ask ? eA : eB, bk = ask ? bkA : bkB, fl = ask ? fA : fB, sg = ask ? sA : sB, pv = ask ? pA : pB, lb = ask ? lblA : lblB; let cum = 0;
      for (let kk = 0; kk < NB; kk++) {
        cum += bk[kk];
        const y = ask ? headH + (NB - 1 - kk) * rh : yS + spH + kk * rh, h = rh - 1.2;
        g.fillStyle = ask ? cR(0.085) : cG(0.08); g.fillRect(bx1 - cum / cmx * bwid, y, cum / cmx * bwid, h);
        const w = Math.max(2, Math.min(1, bk[kk] / book.mx) * (nar ? bwid * 0.94 : bwid - 46));
        g.fillStyle = ask ? cR(kk === 0 ? 0.78 : 0.52) : cG(kk === 0 ? 0.72 : 0.46); g.fillRect(bx1 - w, y, w, h);
        g.fillStyle = ask ? cR(0.95) : cG(0.95); g.fillRect(bx1 - w, y, 1.5, h);
        if (tr >= 2) {
          const sz = Math.min(1, bk[kk] / book.mx), yc = y + h / 2, sh = Math.exp(-Math.pow((yc - shY) / (rh * 2.4), 2));
          g.globalCompositeOperation = 'lighter';
          glow(g, ask ? SP.r : SP.g, bx1 - w, yc, 8 + sz * 14, (0.12 + 0.4 * sz * sz) * al); g.globalAlpha = al;
          if (sh > 0.03) { g.fillStyle = 'rgba(255,255,255,' + (0.13 * sh).toFixed(3) + ')'; g.fillRect(bx1 - w, y, w, h); }
          g.globalCompositeOperation = 'source-over';
          if (eat[kk]) { eat[kk] = 0; if (al > 0.6) burst(fx.pool, cw + 10 + (bwid - w), yc, tr >= 3 ? 12 : 7, ask ? 1 : 0, 90, 0.7, 7, 0); }
        } else if (eat[kk]) eat[kk] = 0;
        if (fl[kk] > 0.02) {                                  // size change: green = grew, red = shrank; the old edge fades as a trail
          const f = fl[kk], bwm = nar ? bwid * 0.94 : bwid - 46, wp = Math.max(2, Math.min(1, pv[kk] / book.mx) * bwm), grew = sg[kk] > 0;
          g.fillStyle = grew ? cG(f * 0.5) : cR(f * 0.5); g.fillRect(bx1 - w, y, w, h);
          if (Math.abs(wp - w) > 1) { g.fillStyle = grew ? cG(f * 0.3) : 'rgba(255,255,255,' + (f * 0.22).toFixed(3) + ')'; g.fillRect(bx1 - Math.max(w, wp), y, Math.abs(wp - w), h); }
          g.fillStyle = 'rgba(255,255,255,' + (f * f * 0.6).toFixed(3) + ')'; g.fillRect(bx1 - w, y, 1.5, h);
        }
        g.font = '600 ' + fz + 'px ' + MONO; g.textAlign = 'right'; g.fillStyle = '#fff'; g.fillText(bk[kk].toFixed(2), bx1 - 3, y + h / 2 + 0.5);
        if (!nar) { g.font = '500 ' + fz + 'px ' + MONO; g.textAlign = 'left'; g.fillStyle = ask ? '#ff9ca6' : '#7af3cb'; g.fillText(lb[kk], bx0 + 1, y + h / 2 + 0.5); }
      }
    }
    // spread row
    g.fillStyle = 'rgba(255,255,255,.045)'; g.fillRect(bx0 - 6, yS, bwid + 14, spH);
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(bx0 - 6, yS, bwid + 14, 1); g.fillRect(bx0 - 6, yS + spH - 1, bwid + 14, 1);
    g.textAlign = 'left'; g.fillStyle = book.up ? C.green : C.red; g.font = '700 ' + (nar ? 10.5 : 12) + 'px ' + MONO;
    g.fillText((book.up ? '▲ ' : '▼ ') + book.mid, bx0, yS + 10);
    g.fillStyle = '#cfc6dc'; g.font = '500 ' + fs + 'px ' + MONO; g.fillText(nar ? 'spr ' + book.sprBps.toFixed(1) + 'bp' : 'spread ' + book.spr, bx0, yS + 22);
    // imbalance meter
    const yi = H - imbH + 5, share = sb / (sa + sb || 1);
    g.textAlign = 'left'; g.fillStyle = '#cfc6dc'; g.font = '500 ' + fs + 'px ' + MONO; g.fillText(bwid < 92 ? 'imb' : 'imbalance', bx0, yi + 3);                  // 'imbalance' + the value need ~80 px at 9.5 px mono
    g.textAlign = 'right'; g.fillStyle = book.imb >= 0 ? C.green : C.red; g.font = '700 ' + fs + 'px ' + MONO; g.fillText((book.imb >= 0 ? '+' : '-') + Math.abs(book.imb).toFixed(2), bx1, yi + 3);
    const bw1 = Math.round(bwid * share);
    g.fillStyle = cG(0.9); g.fillRect(bx0, yi + 11, bw1 - 1, 6); g.fillStyle = cR(0.9); g.fillRect(bx0 + bw1 + 1, yi + 11, bwid - bw1 - 1, 6);
    g.globalCompositeOperation = 'lighter'; g.fillStyle = cG(0.16); g.fillRect(bx0, yi + 8, bw1, 12); g.fillStyle = cR(0.16); g.fillRect(bx0 + bw1, yi + 8, bwid - bw1, 12); g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#fff'; g.fillRect(bx0 + bwid / 2 - 0.5, yi + 9, 1, 10);
    // depth heat: cumulative size per level, bids grow left of centre (green), asks right (red); brighter = deeper, centre = touch
    const hy = yi + 23, hw = bwid / 2 - 1, cw1 = hw / NB; let cb = 0, ca = 0;
    for (let kk = 0; kk < NB; kk++) {
      cb += bkB[kk]; ca += bkA[kk];
      g.fillStyle = cG(0.12 + 0.78 * cb / cmx); g.fillRect(bx0 + hw - (kk + 1) * cw1 + 0.5, hy, cw1 - 1, 6);
      g.fillStyle = cR(0.12 + 0.78 * ca / cmx); g.fillRect(bx0 + hw + 2 + kk * cw1 + 0.5, hy, cw1 - 1, 6);
    }
    g.restore();
  }

  function drawTape(t, dt) {
    const g = tg.g; if (!g) return;
    if (Math.abs(tg.bf - tg.bfT) > 0.0008) { tg.bf += (tg.bfT - tg.bf) * (1 - Math.exp(-dt * 9)); layout(); } else if (tg.bf !== tg.bfT) { tg.bf = tg.bfT; layout(); }
    const W = tg.W, H = tg.H, x0 = tg.x0, x1 = tg.x1, y0 = tg.y0, y1 = tg.y1, cw = tg.cw, slot = tg.slot, nar = tg.nar;
    g.clearRect(0, 0, W, H);
    const cur = cands[cands.length - 1], n = Math.min(tg.nVis, cands.length), st = cands.length - n;
    tg.n = n; tg.slide *= Math.exp(-dt * 8); if (tg.slide < 0.05) tg.slide = 0;
    tg.px = reduce ? M.price : tg.px + (M.price - tg.px) * (1 - Math.exp(-dt * 14)); const px = tg.px;
    // visible range
    let lo = px, hi = px, iHi = -1, iLo = -1;
    for (let i = 0; i < n; i++) { const c = cands[st + i], ch = i === n - 1 ? Math.max(c.h, px) : c.h, cl = i === n - 1 ? Math.min(c.l, px) : c.l; if (ch >= hi) { hi = ch; iHi = i; } if (cl <= lo) { lo = cl; iLo = i; } }
    const pad = Math.max((hi - lo) * 0.13, 10), tMin = lo - pad * 1.25, tMax = hi + pad;
    if (!tg.init) { tg.yMin = tMin; tg.yMax = tMax; tg.init = true; } else { const k = 1 - Math.exp(-dt * 3.2); tg.yMin += (tMin - tg.yMin) * k; tg.yMax += (tMax - tg.yMax) * k; }
    tg.ys = (y1 - y0) / (tg.yMax - tg.yMin);
    const yMin = tg.yMin, yMax = tg.yMax, tr = tier();

    // grid + price axis
    const raw = (yMax - yMin) / (nar ? 4 : 5), mag = Math.pow(10, Math.floor(Math.log10(raw))), rm = raw / mag, step = (rm <= 1 ? 1 : rm <= 2 ? 2 : rm <= 5 ? 5 : 10) * mag;
    const gx1 = cw - 2;
    g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,.055)'; g.beginPath();
    for (let p = Math.ceil(yMin / step) * step; p < yMax; p += step) { const y = Math.round(Y(p)) + 0.5; if (y < y0 - 2 || y > y1 + 2) continue; g.moveTo(x0, y); g.lineTo(gx1 - tg.axW + 6, y); }
    const every = nar ? 10 : 12, lastCid = cur.cid;
    for (let i = 0; i < n; i++) { const c = cands[st + i]; if (c.cid % every !== 0) continue; const x = Math.round(X(i)) + 0.5; g.moveTo(x, y0); g.lineTo(x, H - tg.timeH); }
    g.stroke();
    const fs = tg.fs;
    g.font = '500 ' + fs + 'px ' + MONO; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = '#bdb4cb';
    for (let p = Math.ceil(yMin / step) * step; p < yMax; p += step) { const y = Y(p); if (y < y0 + 2 || y > y1 - 2) continue; g.fillText(f0(p), x1 + 10, y); }
    g.textAlign = 'center'; g.fillStyle = '#a79eb6';
    for (let i = 0; i < n; i++) { const c = cands[st + i]; if (c.cid % every !== 0) continue; const x = X(i); if (x < x0 + 14 || x > x1 - 10) continue; g.fillText(lastCid === c.cid ? 'now' : '-' + (lastCid - c.cid) + 'm', x, H - 7); }

    // everything below is clipped to the plot
    g.save(); g.beginPath(); g.rect(x0 - 2, 0, x1 - x0 + 8, H); g.clip();
    if (tg.gArea) {
      g.beginPath();
      for (let i = 0; i < n; i++) { const c = cands[st + i], x = X(i), y = Y(i === n - 1 ? px : c.c); i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.lineTo(X(n - 1), y1 + 4); g.lineTo(X(0), y1 + 4); g.closePath(); g.fillStyle = tg.gArea; g.fill();
    }
    if (L.bands) {
      g.beginPath();
      for (let i = 0; i < n; i++) { const c = cands[st + i], x = X(i), y = Y(c.vw + c.sd); i ? g.lineTo(x, y) : g.moveTo(x, y); }
      for (let i = n - 1; i >= 0; i--) { const c = cands[st + i]; g.lineTo(X(i), Y(c.vw - c.sd)); }
      g.closePath(); g.fillStyle = 'rgba(' + VIO + ',.11)'; g.fill();
      g.setLineDash([3, 4]); g.lineWidth = 1; g.strokeStyle = 'rgba(' + VIO + ',.55)'; g.lineDashOffset = tr >= 2 ? -t * 9 : 0;      // tier>=2: the band edges flow
      for (let s = 0; s < 2; s++) { g.beginPath(); for (let i = 0; i < n; i++) { const c = cands[st + i], x = X(i), y = Y(c.vw + (s ? -c.sd : c.sd)); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
      g.setLineDash([]); g.lineDashOffset = 0;
    }
    // volume
    let vmax = 1; for (let i = 0; i < n; i++) if (cands[st + i].v > vmax) vmax = cands[st + i].v;
    const vb = H - tg.timeH - 2, bw = Math.max(1.6, slot * 0.64);
    for (let pass = 0; pass < 2; pass++) {
      g.fillStyle = pass === 0 ? cG(0.4) : cR(0.4);
      for (let i = 0; i < n; i++) { const c = cands[st + i], cc = i === n - 1 ? px : c.c; if ((cc >= c.o) !== (pass === 0)) continue; const h = Math.max(1, c.v / vmax * tg.volH); g.fillRect(X(i) - bw / 2, vb - h, bw, h); }
    }
    if (tr >= 2) {                                                // volume glow: soft additive halo under every bar, hot cap on the busy ones
      g.globalCompositeOperation = 'lighter';
      for (let pass = 0; pass < 2; pass++) {
        g.fillStyle = pass === 0 ? cG(0.1) : cR(0.1);
        for (let i = 0; i < n; i++) { const c = cands[st + i], cc = i === n - 1 ? px : c.c; if ((cc >= c.o) !== (pass === 0)) continue; const h = Math.max(1, c.v / vmax * tg.volH); g.fillRect(X(i) - bw / 2 - 2, vb - h - 2, bw + 4, h + 2); }
        g.fillStyle = pass === 0 ? cG(0.6) : cR(0.6);
        for (let i = 0; i < n; i++) { const c = cands[st + i], cc = i === n - 1 ? px : c.c; if ((cc >= c.o) !== (pass === 0) || c.v < vmax * 0.6) continue; const h = Math.max(1, c.v / vmax * tg.volH); g.fillRect(X(i) - bw / 2, vb - h, bw, 1.5); }
      }
      g.globalCompositeOperation = 'source-over';
    }
    // candles — halo, wicks, bodies
    g.globalCompositeOperation = 'lighter';
    for (let pass = 0; pass < 2; pass++) {
      g.fillStyle = pass === 0 ? cG(0.07) : cR(0.07);
      for (let i = 0; i < n; i++) {
        const c = cands[st + i], cc = i === n - 1 ? px : c.c; if ((cc >= c.o) !== (pass === 0)) continue;
        const yt = Y(Math.max(c.o, cc)), yb = Y(Math.min(c.o, cc)); g.fillRect(X(i) - bw / 2 - 2, yt - 2, bw + 4, yb - yt + 4);
      }
    }
    {                                                           // the live candle breathes: a slow additive halo around its body + wick (static when reduced motion)
      const c = cur, cc = px, br = reduce ? 0.5 : 0.5 + 0.5 * Math.sin(t * 2.4), bx = X(n - 1), yt = Y(Math.max(c.o, cc, c.h)), yb = Y(Math.min(c.o, cc, c.l));
      g.fillStyle = cc >= c.o ? cG(0.05 + 0.1 * br) : cR(0.05 + 0.1 * br); g.fillRect(bx - bw / 2 - 3 - br * 2, yt - 2, bw + 6 + br * 4, yb - yt + 4);
    }
    g.globalCompositeOperation = 'source-over';
    for (let pass = 0; pass < 2; pass++) {
      const col = pass === 0 ? C.green : C.red; g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 1; g.beginPath();
      for (let i = 0; i < n; i++) {
        const c = cands[st + i], last = i === n - 1, cc = last ? px : c.c; if ((cc >= c.o) !== (pass === 0)) continue;
        const x = Math.round(X(i)) + 0.5; g.moveTo(x, Y(last ? Math.max(c.h, px) : c.h)); g.lineTo(x, Y(last ? Math.min(c.l, px) : c.l));
      }
      g.stroke();
      for (let i = 0; i < n; i++) {
        const c = cands[st + i], cc = i === n - 1 ? px : c.c; if ((cc >= c.o) !== (pass === 0)) continue;
        const yt = Y(Math.max(c.o, cc)), yb = Y(Math.min(c.o, cc)); g.fillRect(X(i) - bw / 2, yt, bw, Math.max(1.2, yb - yt));
      }
    }
    if (L.vwap) {
      g.lineJoin = 'round'; g.globalCompositeOperation = 'lighter';
      for (let s = 0; s < 2; s++) {
        g.lineWidth = s ? 1.6 : 5; g.strokeStyle = 'rgba(' + AMB + ',' + (s ? 0.95 : 0.14) + ')'; g.beginPath();
        for (let i = 0; i < n; i++) { const x = X(i), y = Y(cands[st + i].vw); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
      }
      g.globalCompositeOperation = 'source-over';
      if (tr >= 2) {                                              // vwap flow: a travelling highlight rides the line
        g.globalCompositeOperation = 'lighter'; g.setLineDash([16, 120]); g.lineDashOffset = -t * 70; g.lineWidth = 2.6; g.strokeStyle = 'rgba(255,238,190,.75)'; g.beginPath();
        for (let i = 0; i < n; i++) { const x = X(i), y = Y(cands[st + i].vw); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
        g.setLineDash([]); g.lineDashOffset = 0; g.globalCompositeOperation = 'source-over';
      }
    }
    // high / low flags
    g.font = '500 ' + fs + 'px ' + MONO; g.textAlign = 'center'; g.fillStyle = '#d6cde2';
    if (iHi >= 0 && iHi < n - 1) g.fillText(f0(hi), clamp(X(iHi), x0 + 22, x1 - 22), Y(hi) - 8);
    if (iLo >= 0 && iLo < n - 1) g.fillText(f0(lo), clamp(X(iLo), x0 + 22, x1 - 22), Y(lo) + 9);
    if (tr >= 2) {                                                // candle birth: a pink light column + a spark burst at the new open
      const bx = X(n - 1), age = (nowMs() - fx.birthT) / 1000;
      if (fx.birthN) { fx.birthN = 0; burst(fx.pool, bx, Y(cur.o), tr >= 3 ? 16 : 9, 3, 120, 0.9, 7, 60); }
      if (age < 0.8) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = (1 - age / 0.8) * 0.5; g.drawImage(BM.p, bx - bw - 3, y0, bw * 2 + 6, y1 - y0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    }
    // fired tickets
    const first = cands[st].cid, r = nar ? 4.5 : 5.5, tnow = nowMs(); hits.length = 0;
    for (let pass = 0; pass < 2; pass++) {
      for (let j = 0; j < marks.length; j++) {
        const m = marks[j], i = m.cid - first; if (i < 0 || i >= n) continue;
        const isB = m.kind === 'buy', isS = m.kind === 'sell'; if ((pass === 0) !== (isB || isS)) continue;
        const x = X(i), y = isB ? Y(m.price) + 12 : isS ? Y(m.price) - 12 : Y(m.price), age = (tnow - m.t) / 1000;
        hits.push({ x, y, m });
        if (pass === 0) {
          g.beginPath();
          if (isB) { g.moveTo(x, y - r); g.lineTo(x + r, y + r * 0.8); g.lineTo(x - r, y + r * 0.8); } else { g.moveTo(x, y + r); g.lineTo(x + r, y - r * 0.8); g.lineTo(x - r, y - r * 0.8); }
          g.closePath(); g.fillStyle = isB ? C.green : C.red; g.fill(); g.lineWidth = 1.2; g.strokeStyle = 'rgba(5,3,10,.9)'; g.stroke();
        } else {
          g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r, y); g.lineTo(x, y + r); g.lineTo(x - r, y); g.closePath(); g.fillStyle = C.amber; g.fill(); g.lineWidth = 1.2; g.strokeStyle = 'rgba(5,3,10,.9)'; g.stroke();
        }
        if (age < 3.2) {
          g.globalCompositeOperation = 'lighter';
          glow(g, isB ? SP.g : isS ? SP.r : SP.a, x, y, 12 + age * 12, 0.9 * (1 - age / 3.2));
          g.strokeStyle = isB ? cG(1 - age / 1.4) : isS ? cR(1 - age / 1.4) : 'rgba(' + AMB + ',' + (1 - age / 1.4) + ')'; if (age < 1.4) { g.lineWidth = 1.4; g.beginPath(); g.arc(x, y, r + age * 16, 0, TAU); g.stroke(); }
          if (tr >= 2) {
            const bs = isB ? BM.g : isS ? BM.r : BM.a, fall = Math.min(1, age / 0.45);
            for (let q = 1; q <= 2; q++) { const a2 = age - q * 0.22; if (a2 > 0 && a2 < 1.6) { g.globalAlpha = (1 - a2 / 1.6) * 0.6; g.lineWidth = 1.1; g.strokeStyle = isB ? C.green : isS ? C.red : C.amber; g.beginPath(); g.arc(x, y, r + a2 * 24, 0, TAU); g.stroke(); } }
            const hy = y0 + (y - y0) * (1 - Math.pow(1 - fall, 3));
            g.globalAlpha = age < 0.45 ? 0.7 : 0.7 * Math.max(0, 1 - (age - 0.45) / 1.7);
            if (g.globalAlpha > 0.01 && hy > y0 + 2) g.drawImage(bs, x - 4, y0, 8, hy - y0);
            g.globalAlpha = 1;
            if (age < 0.45) glow(g, SPW, x, hy, 9, 0.9);
            else if (!m.fx) { m.fx = 1; burst(fx.pool, x, y, tr >= 3 ? 14 : 8, isB ? 0 : isS ? 1 : 2, 105, 0.85, 7, 40); }
          }
          g.globalCompositeOperation = 'source-over';
          if (m.txt && !nar) { g.globalAlpha = Math.min(1, (3.2 - age) / 1.2); g.font = '700 ' + fs + 'px ' + MONO; g.textAlign = 'right'; g.fillStyle = isB ? '#7ff5cf' : isS ? '#ff9aa4' : '#ffd77a'; g.fillText(m.txt, x - r - 5, y + 0.5); g.globalAlpha = 1; }
        }
      }
    }
    // last price: marching dashed line, pulse
    const up = px >= cur.o, lcol = up ? C.green : C.red, ly = Y(px), lx = X(n - 1);
    g.setLineDash([5, 4]); g.lineDashOffset = -t * 18; g.lineWidth = 1; g.strokeStyle = 'rgba(' + (up ? GRN : RED) + ',' + (0.55 + 0.3 * Math.sin(t * 5)).toFixed(2) + ')';
    g.beginPath(); g.moveTo(lx, ly + 0.5); g.lineTo(x1 + 8, ly + 0.5); g.stroke(); g.setLineDash([]);
    g.globalCompositeOperation = 'lighter'; glow(g, up ? SP.g : SP.r, lx, ly, 13 + 4 * Math.sin(t * 5), 0.95);
    if (tr >= 2) {                                                // every tick: a ring leaves the last price and a light runs down the price line to the tag
      const pa = (tnow - fx.tickT) / 1000;
      if (pa < 0.9) { g.lineWidth = 1.3; g.strokeStyle = up ? cG(0.8 * (1 - pa / 0.9)) : cR(0.8 * (1 - pa / 0.9)); g.beginPath(); g.arc(lx, ly, 4 + pa * 26, 0, TAU); g.stroke(); }
      if (pa < 0.55) glow(g, SPW, lx + (x1 + 8 - lx) * (pa / 0.55), ly, 6, 0.8 * (1 - pa / 0.55));
    }
    g.globalCompositeOperation = 'source-over';
    g.restore();
    // price tag
    const tw = tg.axW - 4; rr(g, x1 + 5, ly - 8.5, tw, 17, 4); g.fillStyle = lcol; g.fill();
    g.fillStyle = '#0a0710'; g.font = '700 9.5px ' + MONO; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(nar ? f0(px) : fmt(px, 1), x1 + 9, ly + 0.5);

    // crosshair + tooltip (mouse hover, touch hold or keyboard)
    if (hv.on && hv.touch && tnow - hv.t > 4200) hv.on = false;
    if (hv.on && hv.x >= x0 && hv.x <= x1 + 4 && hv.y >= y0 && hv.y <= H - tg.timeH) {
      let i = hv.key ? hv.i : Math.round((hv.x - X(0)) / slot); i = clamp(i, 0, n - 1); const c = cands[st + i], cx = Math.round(X(i)) + 0.5, py = hv.y, last = i === n - 1;
      let hm = null, hd = 15;                                    // nearest fired-ticket marker within reach (bigger reach for touch)
      for (let j = 0; j < hits.length; j++) { const h = hits[j], d2 = Math.hypot(h.x - hv.x, h.y - hv.y); if (d2 < hd + (hv.touch ? 10 : 0) && (!hm || d2 < hd)) { hm = h; hd = d2; } }
      if (hm) i = clamp(hm.m.cid - first, 0, n - 1);
      const cc = hm ? cands[st + i] : c, cxx = hm ? Math.round(X(i)) + 0.5 : cx;
      g.setLineDash([3, 3]); g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.moveTo(cxx, y0); g.lineTo(cxx, H - tg.timeH); g.moveTo(x0, Math.round(py) + 0.5); g.lineTo(x1 + 4, Math.round(py) + 0.5); g.stroke(); g.setLineDash([]);
      g.font = '700 9.5px ' + MONO; g.textBaseline = 'middle';
      if (py <= y1) { const pv = yMin + (y1 - py) / tg.ys; rr(g, x1 + 5, py - 8.5, tw, 17, 4); g.fillStyle = '#f4eef6'; g.fill(); g.fillStyle = '#0a0710'; g.textAlign = 'left'; g.fillText(nar ? f0(pv) : fmt(pv, 1), x1 + 9, py + 0.5); }
      const ci = i === n - 1 ? px : cc.c, hi2 = i === n - 1 ? Math.max(cc.h, px) : cc.h, lo2 = i === n - 1 ? Math.min(cc.l, px) : cc.l, upc = ci >= cc.o;
      // time chip on the axis
      const tl = i === n - 1 ? 'now' : '-' + (lastCid - cc.cid) + 'm', tlw = g.measureText(tl).width + 12; rr(g, clamp(cxx - tlw / 2, x0, x1 - tlw + 6), H - tg.timeH + 1, tlw, 14, 4); g.fillStyle = '#f4eef6'; g.fill();
      g.fillStyle = '#0a0710'; g.textAlign = 'center'; g.fillText(tl, clamp(cxx, x0 + tlw / 2, x1 - tlw / 2 + 6), H - tg.timeH + 8.5);
      // ohlc / vwap / volume card (flips to the free side of the cursor)
      const rows = nar ? [['o', f0(cc.o)], ['h', f0(hi2)], ['l', f0(lo2)], ['c', f0(ci)], ['vwap', f0(cc.vw)], ['vol', cc.v.toFixed(1)]]
        : [['open', f0(cc.o)], ['high', f0(hi2)], ['low', f0(lo2)], ['close', f0(ci)], ['vwap', f0(cc.vw) + (cc.sd > 0 ? ' ±' + cc.sd.toFixed(1) : '')], ['volume', cc.v.toFixed(1) + ' btc']];
      const rh2 = 13, cwd = nar ? 104 : 148, chh = rows.length * rh2 + 22;
      let bx = cxx + 14; if (bx + cwd > x1 + 2) bx = cxx - 14 - cwd; bx = Math.max(x0 + 2, bx);
      let by = clamp(py - chh / 2, y0 - 6, y1 - chh + 6);
      if (!hm) {
        rr(g, Math.round(bx), Math.round(by), cwd, chh, 6); g.fillStyle = 'rgba(10,6,16,.92)'; g.fill(); g.strokeStyle = upc ? cG(0.5) : cR(0.5); g.lineWidth = 1; g.stroke();
        g.font = '700 9.5px ' + MONO; g.textAlign = 'left'; g.fillStyle = upc ? '#7ff5cf' : '#ff9aa4'; g.fillText(tl + ' · ' + (upc ? 'up' : 'down') + ' ' + sgnPct((ci / cc.o - 1) * 100), Math.round(bx) + 8, Math.round(by) + 10);
        g.font = '500 9.5px ' + MONO;
        for (let r2 = 0; r2 < rows.length; r2++) { const yy = Math.round(by) + 24 + r2 * rh2; g.textAlign = 'left'; g.fillStyle = '#a79eb6'; g.fillText(rows[r2][0], Math.round(bx) + 8, yy); g.textAlign = 'right'; g.fillStyle = r2 === 4 ? '#ffd77a' : '#f1eaf7'; g.fillText(rows[r2][1], Math.round(bx) + cwd - 8, yy); }
      }
      if (hm) {                                                  // fired-ticket card: action · size · confidence · destination
        const m = hm.m, col = m.kind === 'buy' ? C.green : m.kind === 'sell' ? C.red : C.amber, ln = [(m.act || m.kind) + (m.kind === 'close' ? '' : ' ' + m.size + '%'), 'conf .' + String(Math.round(m.conf * 100)).padStart(2, '0') + ' ≥ floor', 'dest ' + m.dest + ' · ' + (m.venue || 'sim')];
        const mw = 150, mh = 54, mx = clamp(hm.x - mw / 2, x0 + 2, x1 - mw + 4), my = hm.y - 14 - mh < y0 ? hm.y + 14 : hm.y - 14 - mh;
        g.globalCompositeOperation = 'lighter'; glow(g, m.kind === 'buy' ? SP.g : m.kind === 'sell' ? SP.r : SP.a, hm.x, hm.y, 17, 0.8); g.globalCompositeOperation = 'source-over';
        rr(g, Math.round(mx), Math.round(my), mw, mh, 6); g.fillStyle = 'rgba(10,6,16,.95)'; g.fill(); g.strokeStyle = col; g.stroke();
        g.textAlign = 'left'; g.font = '700 10px ' + MONO; g.fillStyle = col; g.fillText('◆ ' + ln[0], Math.round(mx) + 8, Math.round(my) + 11);
        g.font = '500 9.5px ' + MONO; g.fillStyle = '#e9e1f1'; g.fillText(ln[1], Math.round(mx) + 8, Math.round(my) + 26); g.fillStyle = '#b4abc2'; g.fillText(ln[2], Math.round(mx) + 8, Math.round(my) + 40);
      }
    }
    drawBook(t, dt);
    if (tr >= 2) drawPool(fx.pool, g, Math.min(dt, 0.05), 60, 2.2, false);
    if (S.killed) {
      const m = 'KILL SWITCH · NEW ORDERS GO TO REVIEW'; g.font = '700 9.5px ' + MONO;
      const bx = (x1 + x0) / 2 - 150, by = y0 + 8; rr(g, bx, by, 300, 20, 5); g.fillStyle = 'rgba(255,77,94,.16)'; g.fill(); g.strokeStyle = cR(0.7); g.stroke();
      g.fillStyle = C.red; g.textAlign = 'center'; g.fillText(m, bx + 150, by + 10.5);
    }
  }

  /* tape header readouts (4 Hz) */
  const pxEl = $('#dkt-px'), pxdEl = $('#dkt-px-d'), pxpEl = $('#dkt-pxp'), pxcEl = $('#dkt-pxc'), hiEl = $('#dkt-hi'), loEl = $('#dkt-lo'), volEl = $('#dkt-vol');
  function flushTape() {
    const p = M.price, ch = (p / M.open - 1) * 100, up = ch >= 0;
    const ip = Math.floor(p), fr = String(Math.round((p - ip) * 10) % 10);
    setT(pxEl, fmt(ip)); setT(pxdEl, '.' + fr);
    setT(pxcEl, sgnPct(ch)); const ar = pxpEl.firstElementChild; setT(ar, up ? '▲' : '▼'); if (pxpEl.classList.contains('dn') === up) pxpEl.classList.toggle('dn', !up);
    let hi = -1e9, lo = 1e9, v = 0; const n = Math.min(tg.nVis || 70, cands.length);
    for (let i = cands.length - n; i < cands.length; i++) { const c = cands[i]; if (c.h > hi) hi = c.h; if (c.l < lo) lo = c.l; v += c.v; }
    setT(hiEl, f0(hi)); setT(loEl, f0(lo)); setT(volEl, fmt(v, 0) + ' btc');
  }
  let acT = 0;
  J.task(tape, (t, dt) => { drawTape(t, dt); acT += dt; if (acT < 0.25) return; acT = 0; flushTape(); });

  /* first paint of text so nothing waits for the first visible frame */
  flushBar(); flushPnl(); flushTape();
});
