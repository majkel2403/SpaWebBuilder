/* desk-pnl-odometer — P&L odometer  (everything here is SIMULATED)
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* used: JEV.mod  JEV.task  JEV.fit  JEV.watch  JEV.animate  JEV.bus ('tick', 'decision', 'kill')  JEV.market  JEV.S  JEV.C
 * Safe without the rest of the page: every DOM lookup is guarded. */
JEV.mod('desk-pnl-odometer', () => {
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
const card = $('#dkto'); if (!card) return;
  const reduce = J.reduce, balEl = $('#dkto-bal'), bigEl = $('#dkto-big'), sr = $('#dkto-sr');
  const dv = $('#dkto-dv'), pc = $('#dkto-pc'), ar = $('#dkto-ar'), pill = $('.dkt-dp', card), live = $('.dkt-live', card);
  let digs = [], shown = sim.bal, popN = 0, rollN = 0, pos = null, srT = 0;
  const FLASH_MS = 420, GLOW_KF = [{ opacity: 1 }, { opacity: .55, offset: .3 }, { opacity: 0 }];
  function glowFlash(host, txt, cls) {                       // static text-shadow overlay, only its opacity animates (compositor-only)
    if (reduce) return;
    let gl = host._gl;
    if (!gl) { gl = host._gl = document.createElement('i'); gl.setAttribute('aria-hidden', 'true'); gl.textContent = txt; host.appendChild(gl); } else if (gl.textContent !== txt) gl.textContent = txt;
    const t = performance.now(); if (t - (host._ft || -1e9) < FLASH_MS) return;
    const a = J.animate(gl, GLOW_KF, { duration: 780, easing: 'cubic-bezier(.2,.7,.3,1)' }); if (!a) return;
    host._ft = t; gl.className = 'dkt-gl ' + cls;
  }
  function digitRoll(sp, ch, dir, old) {                      // old glyph slides out, new one rolls in with a springy settle
    glowFlash(sp, ch, dir > 0 ? 'u' : 'd'); if (reduce) return;
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
    for (let i = 0; i < s.length; i++) { const sp = digs[i], tn = sp.firstChild; if (tn.data !== s[i]) { const old = tn.data; tn.data = s[i]; if (sp.className === 'dkt-dg') digitRoll(sp, s[i], dir, old); } }
  }
  function pop(txt, dir) {
    if (reduce || !bigEl || popN > 3) return;
    const e = document.createElement('i'); e.className = 'dkt-pop'; e.textContent = txt; e.style.color = dir > 0 ? C.green : C.red;
    e.style.right = (Math.random() * 20).toFixed(0) + 'px'; e.style.top = innerWidth < 420 ? '-15px' : '10px';
    bigEl.appendChild(e);
    const a = J.animate(e, [{ opacity: 0, transform: 'translateY(16px) scale(.85)' }, { opacity: 1, transform: 'translateY(0) scale(1)', offset: .16 }, { opacity: 1, offset: .62 }, { opacity: 0, transform: 'translateY(-26px) scale(1)' }], { duration: 1800, easing: 'cubic-bezier(.2,.8,.2,1)' });
    if (!a) { e.remove(); return; }
    popN++; a.onfinish = a.oncancel = () => { popN--; e.remove(); };
  }
  function flush() {
    const bal = sim.bal, delta = bal - sim.open, p = delta >= 0;
    if (pos !== p) {
      card.classList.toggle('dkt-neg', !p);
      if (pos !== null) J.animate(pill, [{ transform: 'scale(1)' }, { transform: 'scale(1.12)', offset: .35 }, { transform: 'scale(1)' }], { duration: 560, easing: 'cubic-bezier(.2,.9,.3,1.2)' });
      pos = p; if (ar) ar.style.transform = p ? 'none' : 'rotate(180deg)';
    }
    const dir = bal >= shown ? 1 : -1; shown = bal;
    setBalText(fmt(Math.round(bal)), dir);
    setT(dv, sgnUsd(delta)); setT(pc, (p ? '+' : '-') + Math.abs(delta / sim.open * 100).toFixed(2) + '%');
    const t = performance.now(); if (t - srT > 2000) { srT = t; setT(sr, 'swarm balance ' + fmt(Math.round(bal)) + ' dollars, simulated'); }
    setT(live, S.killed ? 'halted' : 'live');
  }
  J.bus.on('tick', (e) => simTick(e));
  J.bus.on('decision', (d) => { const j = simDec(d); if (j) pop(sgnUsd(j) + ' · ' + d.action + ' ' + d.size + '%', j); });
  let ac = 0; flush();
  J.task(card, (t, dt) => { ac += dt; if (ac < 0.25) return; ac = 0; flush(); });
});
