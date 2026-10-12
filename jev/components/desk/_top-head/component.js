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

