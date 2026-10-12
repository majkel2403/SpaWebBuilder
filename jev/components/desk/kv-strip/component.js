/* desk-kv-strip — Desk KPI readouts  (everything here is SIMULATED)
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* used: JEV.mod  JEV.task  JEV.fit  JEV.watch  JEV.animate  JEV.bus ('tick', 'decision', 'kill', 'floor')  JEV.market  JEV.S  JEV.C
 * Safe without the rest of the page: every DOM lookup is guarded. */
JEV.mod('desk-kv-strip', () => {
  const J = JEV, $ = J.$, $$ = J.$$, C = J.C, S = J.S, M = J.market, TAU = J.TAU, clamp = J.clamp, fmt = J.fmt;
  const setT = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  const sgnUsd = (v) => (v >= 0 ? '+$' : '-$') + fmt(Math.abs(Math.round(v)));
  const sprite = (rgb) => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(' + rgb + ',.9)'); gr.addColorStop(.3, 'rgba(' + rgb + ',.3)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c;
  };
  const rgbOf = (h) => { const n = parseInt(h.slice(1), 16); return (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255); };
  const GRN = rgbOf(C.green), RED = rgbOf(C.red), AMB = rgbOf(C.amber);
  const BASE = 527759, LEV = 10, HEDGE = 0.3, HN = 300, OW = 200;
  const rgs = J.rng(7741), gzs = () => Math.sqrt(-2 * Math.log(rgs() + 1e-9)) * Math.cos(TAU * rgs());
  const sim = { bal: BASE, open: BASE, peak: BASE, dd: 0.004, tix: [], outc: [], sumBps: 1.78 * 300, nBps: 300, tixN: 14882, sizeN: [31, 36, 22, 11], hist: new Float64Array(HN), hh: 0, jump: 0, jumpT: 0 };
  const hpush = (v) => { sim.hist[sim.hh] = v; sim.hh = (sim.hh + 1) % HN; };
  const hat = (i) => sim.hist[(sim.hh + i) % HN];          // i = 0 oldest
  (function seed() {
    let nz = 0, step = 0; const raw = [];
    for (let i = 0; i < HN; i++) {
      const x = i / (HN - 1);
      nz = nz * 0.965 + gzs() * 38;
      if (rgs() < 0.075) step += (rgs() < 0.56 ? 1 : -1) * (55 + rgs() * 120);
      raw.push(1100 * x - 2300 * Math.exp(-Math.pow((x - 0.5) / 0.12, 2)) + 420 * Math.sin(x * 11) + nz + step * 0.8 + gzs() * 12);
    }
    const off = BASE - raw[HN - 1]; sim.open = raw[0] + off; sim.peak = sim.open;
    for (let i = 0; i < HN; i++) { const v = raw[i] + off; hpush(v); if (v > sim.peak) sim.peak = v; }
    for (let i = 0; i < OW; i++) { const m = 3 + rgs() * 9; sim.outc.push(rgs() < 0.55 ? m : -m * 0.85); }
    const t = performance.now(); [[1, 52800], [-1, 26400], [1, 105600], [1, 52800]].forEach((a, i) => sim.tix.push({ dir: a[0], notional: a[1], born: t - 4000 * i, life: 16000 + i * 7000 }));
  })();
  const setBal = (v) => { sim.bal = v; if (v > sim.peak) sim.peak = v; else { const d = (sim.peak - v) / sim.peak; if (d > sim.dd) sim.dd = d; } };
  /** per market tick: mark-to-market of the open tickets */
  function simTick(e) {
    const t = performance.now();
    for (let i = sim.tix.length - 1; i >= 0; i--) if (t - sim.tix[i].born > sim.tix[i].life) sim.tix.splice(i, 1);
    let ex = 0; for (const k of sim.tix) ex += k.dir * k.notional;
    setBal(sim.bal + ex * HEDGE * (e.dp / e.price) + (BASE - sim.bal) * 0.0002); hpush(sim.bal);
  }
  /** per executed decision: a ticket opens and the book jumps by its realised bps. returns the jump in $ (or 0) */
  function simDec(d) {
    if (d.dest !== 'execute') return 0; const t = performance.now(), a = d.action;
    if (a === 'buy' || a === 'sell') {
      const dir = a === 'buy' ? 1 : -1, notional = d.size / 100 * BASE * LEV;
      const pWin = clamp(0.54 + (d.conf - 0.88) * 1.1 - clamp((sim.bal - BASE) / 2600, -0.22, 0.22), 0.3, 0.78);
      const mag = (3 + Math.abs(d.net) * 0.26) * (0.55 + Math.random() * 0.9), bps = Math.random() < pWin ? mag : -mag * 0.85, jump = notional * bps / 1e4;
      setBal(sim.bal + jump); sim.jump = jump; sim.jumpT = t; sim.outc.push(bps); if (sim.outc.length > OW) sim.outc.shift();
      sim.sumBps += bps; sim.nBps++; sim.tixN++; sim.sizeN[d.sizeIdx]++;
      sim.tix.push({ dir, notional, born: t, life: 9000 + Math.random() * 26000 }); if (sim.tix.length > 6) sim.tix.shift();
      return jump;
    }
    if (a === 'close') { sim.tix.shift(); sim.tixN++; } else if (a === 'flatten') { sim.tix.length = 0; sim.tixN++; }
    return 0;
  }
const card = $('#dkkv'); if (!card) return;
  const nav = $('#dkkv-nav'), spl = $('#dkkv-spl'), flr = $('#dkkv-flr'), kill = $('#dkkv-kill');
  J.bus.on('tick', (e) => simTick(e)); J.bus.on('decision', (d) => simDec(d));
  function flush() {
    const d = sim.bal - sim.open; setT(nav, '$' + (sim.bal / 1000).toFixed(1) + 'k'); setT(spl, sgnUsd(d)); if (spl) spl.style.color = d >= 0 ? C.green : C.red;
    setT(flr, S.floor.toFixed(2)); setT(kill, S.killed ? 'halted' : 'armed'); if (kill) kill.style.color = S.killed ? C.red : C.green;
  }
  let ac = 0; flush(); J.task(card, (t, dt) => { ac += dt; if (ac < 0.25) return; ac = 0; flush(); });
});
