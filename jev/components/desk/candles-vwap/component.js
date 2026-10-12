/* desk-candles-vwap — Candle chart (no book)  (everything here is SIMULATED)
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* used: JEV.mod  JEV.task  JEV.fit  JEV.watch  JEV.animate  JEV.bus ('tick', 'decision')  JEV.market  JEV.S  JEV.C
 * Safe without the rest of the page: every DOM lookup is guarded. */
JEV.mod('desk-candles-vwap', () => {
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
  const CAND_MS = 6000, KEEP = 150, VIS = 80, LAM = 0.975;
  const cands = [], marks = []; let cid = 0;
  const mkC = (o, t) => ({ cid: cid++, o, h: o, l: o, c: o, v: 0, ev: 0, epv: 0, epv2: 0, vw: o, sd: 0, t0: t });
  const accum = (cd, pv) => {                                   // decayed volume-weighted sums -> vwap and sigma
    const tp = (cd.h + cd.l + cd.c) / 3;
    cd.ev = (pv ? pv.ev * LAM : 0) + cd.v; cd.epv = (pv ? pv.epv * LAM : 0) + cd.v * tp; cd.epv2 = (pv ? pv.epv2 * LAM : 0) + cd.v * tp * tp;
    if (cd.ev > 0) { cd.vw = cd.epv / cd.ev; cd.sd = Math.sqrt(Math.max(0, cd.epv2 / cd.ev - cd.vw * cd.vw)); } else { cd.vw = tp; cd.sd = 0; }
  };
  (function seed() {
    const rg = J.rng(8473), gz = () => Math.sqrt(-2 * Math.log(rg() + 1e-9)) * Math.cos(TAU * rg());
    const N = 76; let p = 84722, drift = 0, vx = 0.00085;
    for (let i = 0; i < N; i++) {
      const x = i / N; drift = drift * 0.8 + gz() * 0.00009 + 0.00005 * Math.sin(x * TAU * 1.3 + 0.4); vx = clamp(vx * 0.9 + 0.000085 + Math.abs(gz()) * 0.00005, 0.0005, 0.0016);
      const o = p, r = drift + vx * gz(), c = o * (1 + r), h = Math.max(o, c) * (1 + Math.abs(gz()) * vx * 0.55), l = Math.min(o, c) * (1 - Math.abs(gz()) * vx * 0.55);
      const cd = mkC(o, 0); cd.c = c; cd.h = h; cd.l = l; cd.v = (34 + 30 * Math.abs(r) / vx) * Math.exp(gz() * 0.3); cands.push(cd); p = c;
    }
    const f = M.price / p; for (let i = 0; i < cands.length; i++) { const c = cands[i]; c.o *= f; c.h *= f; c.l *= f; c.c *= f; accum(c, cands[i - 1]); }
    const live = mkC(M.price, performance.now()); live.v = 6; accum(live, cands[cands.length - 1]); cands.push(live);
    for (let i = 0; i < 9; i++) { const c = cands[cands.length - 70 + Math.floor(rg() * 62)], k = rg(); marks.push({ cid: c.cid, kind: k < 0.4 ? 'buy' : k < 0.8 ? 'sell' : 'close', price: k < 0.4 ? c.l : k < 0.8 ? c.h : (c.o + c.c) / 2 }); }
  })();
const card = $('#dkcv'), cv = $('#dkcv-cv'); if (!card || !cv) return;
  let st = null, hover = -1; const SP = sprite('255,46,110');
  J.watch(cv, () => { st = J.fit(cv); });
  J.bus.on('tick', (e) => {
    const t = performance.now(); let cur = cands[cands.length - 1];
    if (t - cur.t0 >= CAND_MS) { accum(cur, cands[cands.length - 2]); cur = mkC(cur.c, t); cands.push(cur); if (cands.length > KEEP) cands.shift(); while (marks.length && marks[0].cid < cands[0].cid - 1) marks.shift(); }
    cur.c = e.price; if (e.price > cur.h) cur.h = e.price; if (e.price < cur.l) cur.l = e.price;
    cur.v += (0.8 + 2.4 * Math.abs(e.dp) / e.price * 1e4) * (0.55 + Math.random() * 0.9); accum(cur, cands[cands.length - 2]);
  });
  J.bus.on('decision', (d) => {
    if (d.symbol !== 'BTC-PERP' || d.action === 'hold' || d.dest !== 'execute') return;
    marks.push({ cid: cands[cands.length - 1].cid, price: M.price, kind: d.action === 'buy' || d.action === 'sell' ? d.action : 'close' }); if (marks.length > 60) marks.shift();
  });
  let lay = null;
  const idxAt = (cx) => { if (!lay) return -1; const r = cv.getBoundingClientRect(); const k = Math.floor((cx - r.left - lay.L) / lay.slot); return k >= 0 && k < lay.n ? k : -1; };
  cv.addEventListener('pointermove', (e) => { hover = idxAt(e.clientX); cv._y = e.clientY - cv.getBoundingClientRect().top; });
  cv.addEventListener('pointerleave', () => { hover = -1; });
  cv.addEventListener('pointerdown', (e) => { hover = idxAt(e.clientX); cv._y = e.clientY - cv.getBoundingClientRect().top; });
  const MONO = "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace";
  function draw(t) {
    if (!st) return; const g = st.g, W = st.W, H = st.H; g.clearRect(0, 0, W, H);
    const n = Math.min(VIS, cands.length), vis = cands.slice(cands.length - n), L = 10, R = 62, T = 14, B = H - 20, vh = (B - T) * 0.2, pB = B - vh - 8;
    const slot = (W - L - R) / (VIS + 1), cw = Math.max(2, slot * 0.64); lay = { L, slot, n };
    let lo = 1e18, hi = -1e18, vm = 1; for (const c of vis) { lo = Math.min(lo, c.l, c.vw - c.sd); hi = Math.max(hi, c.h, c.vw + c.sd); vm = Math.max(vm, c.v); }
    const pd = (hi - lo) * 0.08; lo -= pd; hi += pd;
    const Y = (p) => pB - (p - lo) / (hi - lo) * (pB - T), X = (i) => L + (i + 0.5) * slot;
    g.font = '500 9.5px ' + MONO; g.textAlign = 'left'; g.textBaseline = 'middle';
    for (let k = 0; k <= 4; k++) { const p = lo + (hi - lo) * k / 4, y = Y(p); g.strokeStyle = 'rgba(255,255,255,.05)'; g.beginPath(); g.moveTo(L, y); g.lineTo(W - R + 4, y); g.stroke(); g.fillStyle = '#8f87a0'; g.fillText(fmt(Math.round(p)), W - R + 8, y); }
    g.beginPath(); vis.forEach((c, i) => { const x = X(i), y = Y(c.vw + c.sd); i ? g.lineTo(x, y) : g.moveTo(x, y); }); for (let i = n - 1; i >= 0; i--) g.lineTo(X(i), Y(vis[i].vw - vis[i].sd)); g.closePath();
    g.fillStyle = 'rgba(166,107,255,.11)'; g.fill();
    for (let i = 0; i < n; i++) { const c = vis[i], x = X(i), h = c.v / vm * vh; g.fillStyle = c.c >= c.o ? 'rgba(' + GRN + ',.28)' : 'rgba(' + RED + ',.28)'; g.fillRect(x - cw / 2, B - h, cw, h); }
    g.beginPath(); vis.forEach((c, i) => { const x = X(i), y = Y(c.vw); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.strokeStyle = 'rgba(255,197,61,.9)'; g.lineWidth = 1.4; g.stroke(); g.lineWidth = 1;
    for (let i = 0; i < n; i++) {
      const c = vis[i], x = X(i), up = c.c >= c.o, col = up ? C.green : C.red, yo = Y(c.o), yc = Y(c.c);
      g.strokeStyle = col; g.beginPath(); g.moveTo(x, Y(c.h)); g.lineTo(x, Y(c.l)); g.stroke();
      g.fillStyle = up ? 'rgba(' + GRN + ',.85)' : 'rgba(' + RED + ',.85)'; g.fillRect(x - cw / 2, Math.min(yo, yc), cw, Math.max(1.5, Math.abs(yc - yo)));
    }
    const ids = new Map(vis.map((c, i) => [c.cid, i]));
    for (const m of marks) { const i = ids.get(m.cid); if (i == null) continue; const x = X(i), y = Y(m.price), s = 5;
      g.fillStyle = m.kind === 'buy' ? C.green : m.kind === 'sell' ? C.red : C.amber; g.beginPath();
      if (m.kind === 'buy') { g.moveTo(x, y + 4); g.lineTo(x - s, y + 4 + s * 1.5); g.lineTo(x + s, y + 4 + s * 1.5); } else if (m.kind === 'sell') { g.moveTo(x, y - 4); g.lineTo(x - s, y - 4 - s * 1.5); g.lineTo(x + s, y - 4 - s * 1.5); } else { g.moveTo(x, y - s); g.lineTo(x + s, y); g.lineTo(x, y + s); g.lineTo(x - s, y); }
      g.closePath(); g.fill(); }
    const last = vis[n - 1], ly = Y(last.c), pul = 0.7 + 0.3 * Math.sin(t * 5);
    g.setLineDash([3, 4]); g.strokeStyle = 'rgba(255,46,110,.55)'; g.beginPath(); g.moveTo(L, ly); g.lineTo(W - R + 4, ly); g.stroke(); g.setLineDash([]);
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = pul; g.drawImage(SP, X(n - 1) - 13, ly - 13, 26, 26); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#ff2e6e'; g.fillRect(W - R + 4, ly - 8, R - 6, 16); g.fillStyle = '#fff'; g.font = '700 10px ' + MONO; g.fillText(fmt(Math.round(last.c)), W - R + 8, ly + 0.5);
    if (hover >= 0 && hover < n) {
      const c = vis[hover], x = X(hover); g.strokeStyle = 'rgba(255,255,255,.28)'; g.beginPath(); g.moveTo(x, T); g.lineTo(x, B); g.stroke();
      const lines = ['o ' + fmt(c.o, 1) + '  h ' + fmt(c.h, 1), 'l ' + fmt(c.l, 1) + '  c ' + fmt(c.c, 1), 'vwap ' + fmt(c.vw, 1) + ' · vol ' + c.v.toFixed(0)], bw = 178, bh = 50;
      const bx = clamp(x + 12 > W - R - bw ? x - bw - 12 : x + 12, 4, W - bw - 4), by = clamp((cv._y || 60) - bh / 2, T, pB - bh);
      g.fillStyle = 'rgba(10,6,16,.92)'; g.strokeStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.rect(bx, by, bw, bh); g.fill(); g.stroke();
      g.font = '500 10px ' + MONO; g.fillStyle = '#ece5f2'; lines.forEach((s, k) => g.fillText(s, bx + 9, by + 12 + k * 14));
    }
  }
  J.task(card, (t) => draw(t));
});
