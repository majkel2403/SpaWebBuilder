/* desk-ticker — status ticker card: wordmark, handoff pulse, desk nav/p&l/floor, UTC clock and the scrolling chip marquee  (everything here is SIMULATED)
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* API relied on:
 *   JEV.mod(name, init)  JEV.task(el, fn(t,dt))  JEV.fit(canvas)  JEV.watch(el, cb)  JEV.animate(el, kf, opts)
 *   JEV.bus  events: 'tick' ({price, dp}, 4 Hz), 'decision' (d: action, symbol, size, sizeIdx, conf, net, dest, venue, build, state{edge_bps, imbalance, spread_bps})
 *   JEV.market {price, open}   JEV.S {killed, floor, cost, dest{execute,review,skip}}   JEV.C palette   JEV.RULES   JEV.tier   JEV.reduce
 *   JEV.rng(seed)  JEV.fmt  JEV.clamp  JEV.TAU  JEV.AGENTS  JEV.SIZES  JEV.narrow()
 * Safe without the rest of the page: optional DOM and optional JEV facilities are guarded. */
JEV.mod('desk-ticker', () => {
  const J = JEV, $ = J.$, $$ = J.$$, C = J.C, S = J.S, M = J.market, TAU = J.TAU, clamp = J.clamp, fmt = J.fmt;
  const bar = $('#dkt-bar');
  if (!bar) return;
  const reduce = J.reduce;
  const MONO = "'JetBrains Mono', ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, Consolas, monospace";
  const nowMs = () => performance.now();
  const setT = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  const rgbOf = (h) => { const n = parseInt(h.slice(1), 16); return (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255); };
  const GRN = rgbOf(C.green), RED = rgbOf(C.red), AMB = rgbOf(C.amber), VIO = rgbOf(C.violet), PNK = rgbOf(C.pink);
  const cG = (a) => 'rgba(' + GRN + ',' + a + ')', cR = (a) => 'rgba(' + RED + ',' + a + ')';
  const sgnUsd = (v) => (v >= 0 ? '+$' : '-$') + fmt(Math.abs(Math.round(v)));
  const sgnPct = (v, d) => (v >= 0 ? '+' : '-') + Math.abs(v).toFixed(d == null ? 2 : d) + '%';
  const short = (s) => s.split('-')[0].toLowerCase();
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

/* events: tick → mark-to-market of the open tickets, decision → tickets / chips */
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
    } else if (a === 'close') { sim.tix.shift(); sim.tixN++; } else if (a === 'flatten') { sim.tix.length = 0; sim.tixN++; }
  }
  J.bus.on('tick', (e) => {
    const t = nowMs();
    for (let i = sim.tix.length - 1; i >= 0; i--) if (t - sim.tix[i].born > sim.tix[i].life) sim.tix.splice(i, 1);
    let ex = 0; for (const k of sim.tix) ex += k.dir * k.notional;
    setBal(sim.bal + ex * HEDGE * (e.dp / e.price) + (BASE - sim.bal) * 0.0002);
    hpush(sim.bal);
  });
  J.bus.on('decision', (d) => {
    const t = nowMs();
    if (sim.lastDec) sim.gap += (clamp((t - sim.lastDec) / 1000, 0.3, 3) - sim.gap) * 0.12;
    sim.lastDec = t; sim.last = d; sim.holder = HOLD[d.build] || 'kelly';
    sim.edgeAvg += (clamp(d.state.edge_bps, -40, 40) - sim.edgeAvg) * 0.1;
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

  flushBar();
});
