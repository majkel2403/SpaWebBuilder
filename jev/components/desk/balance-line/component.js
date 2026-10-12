/* desk-balance-line — Balance history chart  (everything here is SIMULATED)
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* used: JEV.mod  JEV.task  JEV.fit  JEV.watch  JEV.animate  JEV.bus ('tick', 'decision')  JEV.market  JEV.S  JEV.C
 * Safe without the rest of the page: every DOM lookup is guarded. */
JEV.mod('desk-balance-line', () => {
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
const card = $('#dkbl'), cv = $('#dkbl-cv'); if (!card || !cv) return;
  const wrap = cv.parentNode, sc = $('#dkbl-sc'), SG = sprite(GRN), SR = sprite(RED);
  let st = null, hover = -1;
  J.watch(cv, () => { st = J.fit(cv); });
  const idxAt = (cx) => { const r = cv.getBoundingClientRect(); return clamp(Math.round((cx - r.left - 6) / Math.max(1, r.width - 24) * (HN - 1)), 0, HN - 1); };
  cv.addEventListener('pointermove', (e) => { hover = idxAt(e.clientX); });
  cv.addEventListener('pointerleave', () => { hover = -1; sc.classList.remove('on'); });
  cv.addEventListener('pointerdown', (e) => { hover = idxAt(e.clientX); });
  J.bus.on('tick', (e) => simTick(e));
  J.bus.on('decision', (d) => simDec(d));
  function draw(t) {
    if (!st) return; const g = st.g, W = st.W, H = st.H; g.clearRect(0, 0, W, H);
    let lo = sim.open, hi = sim.open; for (let i = 0; i < HN; i++) { const v = hat(i); if (v < lo) lo = v; if (v > hi) hi = v; }
    const rLo = lo, rHi = hi, pad = Math.max(30, (hi - lo) * 0.16); lo -= pad; hi += pad;
    const ax = W < 300 ? 54 : 64, fs = clamp(W / 110, 9.5, 10.5), MONO = "'JetBrains Mono', ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, Consolas, monospace";
    const L = 8, R = W - ax, T = 16, B = H - 10, X = (i) => L + i / (HN - 1) * (R - L), Y = (v) => B - (v - lo) / (hi - lo) * (B - T), y0 = Y(sim.open);
    g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 1; for (let k = 1; k < 4; k++) { const y = T + (B - T) * k / 4; g.beginPath(); g.moveTo(L, y); g.lineTo(R + 6, y); g.stroke(); }
    g.setLineDash([4, 5]); g.strokeStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.moveTo(L, y0); g.lineTo(R, y0); g.stroke(); g.setLineDash([]);
    const path = () => { g.beginPath(); for (let i = 0; i < HN; i++) { const x = X(i), y = Y(hat(i)); i ? g.lineTo(x, y) : g.moveTo(x, y); } };
    [[0, y0, GRN, 0], [y0, H, RED, 1]].forEach((z) => {
      g.save(); g.beginPath(); g.rect(0, z[0], W, z[1] - z[0]); g.clip();
      path(); g.lineTo(X(HN - 1), y0); g.lineTo(X(0), y0); g.closePath();
      const gr = g.createLinearGradient(0, y0, 0, z[3] ? B : T); gr.addColorStop(0, 'rgba(' + z[2] + ',0)'); gr.addColorStop(1, 'rgba(' + z[2] + ',.3)'); g.fillStyle = gr; g.fill();
      g.lineJoin = 'round'; path(); g.strokeStyle = 'rgba(' + z[2] + ',.22)'; g.lineWidth = 6; g.stroke(); path(); g.strokeStyle = 'rgb(' + z[2] + ')'; g.lineWidth = 2; g.stroke(); g.restore();
    });
    g.font = '500 ' + fs + 'px ' + MONO; g.textBaseline = 'middle'; g.textAlign = 'left';
    g.fillStyle = '#b4abc2'; g.fillText('open', R + 8, clamp(y0, T + 6, B - 6));
    g.fillStyle = '#cfc6dc'; g.fillText(fmt(Math.round(rHi)), R + 8, T - 3); g.fillText(fmt(Math.round(rLo)), R + 8, B + 1);
    { const tw = ax - 9, ty = clamp(Y(sim.bal), T + 9, B - 9); g.beginPath(); g.roundRect(R + 5, ty - 8, tw, 16, 4); g.fillStyle = sim.bal >= sim.open ? C.green : C.red; g.fill();
      g.fillStyle = '#0a0710'; g.font = '700 ' + fs + 'px ' + MONO; g.fillText(fmt(Math.round(sim.bal)), R + 9, ty + 0.5); }
    const lx = X(HN - 1), ly = Y(sim.bal), up = sim.bal >= sim.open, pulse = 0.75 + 0.25 * Math.sin(t * 4);
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = pulse; const r = 15 + 3 * pulse; g.drawImage(up ? SG : SR, lx - r, ly - r, r * 2, r * 2); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#fff'; g.beginPath(); g.arc(lx, ly, 2.4, 0, TAU); g.fill();
    if (hover >= 0) {
      const v = hat(hover), x = X(hover), y = Y(v);
      g.strokeStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.moveTo(x, T); g.lineTo(x, B); g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 3.2, 0, TAU); g.fill();
      setT($('#dkbl-sv'), '$' + fmt(Math.round(v))); const sd = $('#dkbl-sd'); setT(sd, sgnUsd(v - sim.open) + ' vs open'); sd.style.color = v >= sim.open ? C.green : C.red;
      sc.classList.add('on'); const sw = sc.offsetWidth || 90; sc.style.transform = 'translate(' + clamp(x - sw / 2, 0, W - sw).toFixed(0) + 'px,' + Math.max(0, y - 52).toFixed(0) + 'px)';
    }
  }
  let ac = 0; const run = $('#dkbl-run'), op = $('#dkbl-open'), nw = $('#dkbl-now');
  J.task(card, (t, dt) => {
    draw(t);
    ac += dt; if (ac < 0.25) return; ac = 0; const d = sim.bal - sim.open;
    card.classList.toggle('dkt-neg', d < 0); setT(run, sgnUsd(d)); setT(op, '$' + fmt(Math.round(sim.open))); setT(nw, '$' + fmt(Math.round(sim.bal)));
  });
});
