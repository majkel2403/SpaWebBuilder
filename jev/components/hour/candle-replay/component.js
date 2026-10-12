/* hour / candle-replay — canvas candle replay: seeded random-walk OHLC, entries, stops, take-profits and exits, auto-scaled, endless.
 *
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod  J.$ J.C J.rng J.fit J.watch J.task J.DPR J.reduce J.TAU  J.bus 'kill'(bool).
 * Everything is simulated.
 */
JEV.mod('hour-candle-replay', () => {
  const J = JEV, $ = J.$, $$ = J.$$, C = J.C, S = J.S, TAU = J.TAU, clamp = J.clamp, fmt = J.fmt, rgba = J.rgba;
  const reduce = J.reduce;
  const MONO = (getComputedStyle(document.documentElement).getPropertyValue('--mono') || 'monospace').trim();
  const setT = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  const pad2 = (n) => (n < 10 ? '0' : '') + n;
  /** J.fit, corrected for ancestors that are mid-transform */
  function fitC(c) {
    const f = J.fit(c), cw = c.clientWidth, ch = c.clientHeight;
    if (cw > 0 && ch > 0 && (cw !== f.W || ch !== f.H)) {
      const w = Math.round(cw * J.DPR), h = Math.round(ch * J.DPR);
      if (c.width !== w) c.width = w;
      if (c.height !== h) c.height = h;
      f.g.setTransform(J.DPR, 0, 0, J.DPR, 0, 0); f.W = cw; f.H = ch;
    }
    return f;
  }
  /** layout-space box of el inside the positioned ancestor `top` (transform-proof) */
  function offs(el, top) {
    let x = 0, y = 0, e = el;
    const w = el.offsetWidth, h = el.offsetHeight;
    while (e && e !== top) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    return { x, y, w, h };
  }
  const SPR = {};
  /** pre-rendered additive glow sprite (white core -> colour -> transparent) */
  function glow(hex) {
    if (SPR[hex]) return SPR[hex];
    const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.16, 'rgba(' + r + ',' + g + ',' + b + ',.95)');
    gr.addColorStop(0.5, 'rgba(' + r + ',' + g + ',' + b + ',.26)'); gr.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    return (SPR[hex] = c);
  }
  const blit = (g, hex, x, y, r, a) => { g.globalAlpha = a; g.drawImage(glow(hex), x - r, y - r, r * 2, r * 2); };
  function makePath(pts) {
    const n = pts.length, x = new Float32Array(n), y = new Float32Array(n), s = new Float32Array(n);
    let L = 0;
    for (let i = 0; i < n; i++) { x[i] = pts[i][0]; y[i] = pts[i][1]; if (i) L += Math.hypot(x[i] - x[i - 1], y[i] - y[i - 1]); s[i] = L; }
    return { x, y, s, n, len: L };
  }
  const PT = { x: 0, y: 0 };
  function at(p, d) {
    d = d < 0 ? 0 : d > p.len ? p.len : d;
    let lo = 0, hi = p.n - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (p.s[m] > d) hi = m; else lo = m; }
    const k = (d - p.s[lo]) / (p.s[hi] - p.s[lo] || 1);
    PT.x = p.x[lo] + (p.x[hi] - p.x[lo]) * k; PT.y = p.y[lo] + (p.y[hi] - p.y[lo]) * k;
    return PT;
  }
  function bez(p0, p1, p2, p3, n) {
    const a = [];
    for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; a.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]); }
    return a;
  }
  const tier = () => J.tier || 2;
  let killed = !!S.killed;
  if (!$('#hr-tape')) return;
  /* ---------- candle replay tape (seeded, endless) ---------- */
  const tapeCv = $('#hr-tape');
  const T = { g: null, W: 0, H: 0, pitch: 10, bw: 6, playX: 0, pos: 0, hi: 106, lo: 94, bg: null, ok: false };
  const GREEN = C.green, RED = C.red; // declared before layoutT can run (reduced motion draws one frame from inside J.watch)
  const RN = 512, tO = new Float32Array(RN), tH = new Float32Array(RN), tL = new Float32Array(RN), tC = new Float32Array(RN);
  const tr = J.rng(4100), trades = [];
  const tg = () => { let u = 0, v = 0; while (!u) u = tr(); while (!v) v = tr(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };
  let gi = -1, tp = 100, tmu = 0.1, tleft = 0, tvol = 1, tOpen = null, tEnd = -9;
  function genCandle() {
    const i = ++gi, k = i & (RN - 1);
    if (--tleft <= 0) { tleft = 16 + ((tr() * 26) | 0); tmu = (tr() - 0.4) * 0.8; tvol = 1.15 + tr() * 1.25; }
    const o = tp, c = o + tmu + tg() * tvol, hi = Math.max(o, c) + Math.abs(tg()) * tvol * 0.55, lo = Math.min(o, c) - Math.abs(tg()) * tvol * 0.55;
    tp = c; tO[k] = o; tH[k] = hi; tL[k] = lo; tC[k] = c;
    if (tOpen) {
      const q = tOpen;
      if (lo <= q.stop) { q.i1 = i; q.exit = q.stop; q.win = false; q.why = 'stop'; }
      else if (hi >= q.tp) { q.i1 = i; q.exit = q.tp; q.win = true; q.why = 'tp'; }
      else if (i - q.i0 >= 13) { q.i1 = i; q.exit = c; q.win = c > q.entry; q.why = 'exit'; }
      if (q.i1 >= 0) { tOpen = null; tEnd = i; }
    } else if (i - tEnd > 4 && c > o && tr() < 0.4) {
      const rg = tvol * 1.15;
      tOpen = { i0: i, i1: -1, entry: c, stop: c - rg * 1.55, tp: c + rg * 2.5, exit: 0, win: false, why: '' };
      trades.push(tOpen);
    }
  }
  const ensure = (n) => { while (gi < n) genCandle(); };
  ensure(150); T.pos = 120;

  function layoutT() {
    const f = fitC(tapeCv); T.g = f.g; T.W = f.W; T.H = f.H;
    const narrow = f.W < 420;
    T.pitch = narrow ? 8 : 11; T.bw = narrow ? 4.5 : 7; T.playX = Math.round(f.W * (narrow ? 0.7 : 0.64)); T.pt = 18; T.pb = 22;
    const dpr = J.DPR, bg = T.bg || (T.bg = document.createElement('canvas'));
    bg.width = Math.round(f.W * dpr); bg.height = Math.round(f.H * dpr);
    const g = bg.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.strokeStyle = 'rgba(255,255,255,.055)'; g.lineWidth = 1; g.beginPath();
    for (let i = 1; i < 4; i++) { const y = Math.round(T.pt + (f.H - T.pt - T.pb) * i / 4) + 0.5; g.moveTo(0, y); g.lineTo(f.W, y); }
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,.05)';
    for (let x = T.playX + 12; x < f.W; x += 11) g.fillRect(x, T.pt, 1, f.H - T.pt - T.pb);
    g.fillStyle = 'rgba(180,170,200,.62)'; g.font = '600 9px ' + MONO; g.textAlign = 'right'; g.fillText('replaying >>', f.W - 8, 12);
    g.textAlign = 'left'; g.fillText('year 1', 8, 12);
    const lab = (txt, col) => { const c = document.createElement('canvas'); c.width = Math.round(34 * dpr); c.height = Math.round(14 * dpr); const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.font = '700 9px ' + MONO; x.textAlign = 'center'; x.fillStyle = col; x.fillText(txt, 17, 10); return c; };
    T.sBuy = lab('buy', '#7ff5cb'); T.sStop = lab('stop', 'rgba(255,128,140,.95)');
    const fg = g.createLinearGradient(0, 0, T.playX * 0.5, 0); fg.addColorStop(0, 'rgba(0,0,0,.82)'); fg.addColorStop(1, 'rgba(0,0,0,0)'); T.fade = fg;
    T.ok = true; if (reduce) drawT(J.time, 0);
  }
  J.watch(tapeCv, layoutT);

  function drawT(t, dt) {
    const g = T.g; if (!g || !T.ok) return;
    const W = T.W, H = T.H, pitch = T.pitch, px = T.playX;
    if (!reduce) T.pos += dt * (killed ? 0.4 : 1.1);
    const cur = Math.floor(T.pos); ensure(cur + 1);
    const first = cur - Math.ceil(px / pitch) - 2;
    let hi = -1e9, lo = 1e9;
    for (let i = Math.max(0, first); i <= cur; i++) { const k = i & (RN - 1); if (tH[k] > hi) hi = tH[k]; if (tL[k] < lo) lo = tL[k]; }
    for (let i = 0; i < trades.length; i++) { const q = trades[i]; if (q.i0 > cur || (q.i1 >= 0 && q.i1 < first)) continue; if (q.stop < lo) lo = q.stop; }
    const k1 = T.init ? 1 - Math.exp(-dt * 3.2) : 1; T.init = true;
    T.hi += (hi + (hi - lo) * 0.06 - T.hi) * k1; T.lo += (lo - (hi - lo) * 0.1 - T.lo) * k1;
    const top = T.pt, hh = H - T.pt - T.pb, sc = hh / (T.hi - T.lo || 1);
    const Y = (v) => top + (T.hi - v) * sc;
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.clearRect(0, 0, W, H);
    while (trades.length && trades[0].i1 >= 0 && trades[0].i1 < first - 8 && trades[0].i1 <= cur) trades.shift();
    // stop lines (only what the replay has already reached)
    g.lineWidth = 1.2; g.setLineDash([4, 4]); g.strokeStyle = 'rgba(255,77,94,.85)'; g.beginPath();
    for (let i = 0; i < trades.length; i++) {
      const q = trades[i]; if (q.i0 > cur) continue;
      const done = q.i1 >= 0 && q.i1 <= cur, x1 = done ? px - (T.pos - q.i1) * pitch : px;
      if (x1 < -30) continue;
      const ys = Y(q.stop); g.moveTo(px - (T.pos - q.i0) * pitch, ys); g.lineTo(x1 + 4, ys);
    }
    g.stroke(); g.setLineDash([]);
    // candles, batched by colour
    const bw = T.bw, hw = bw / 2;
    for (let pass = 0; pass < 2; pass++) {
      g.fillStyle = pass ? RED : GREEN; g.beginPath();
      for (let i = first; i <= cur; i++) {
        if (i < 0) continue;
        const k = i & (RN - 1), x = px - (T.pos - i) * pitch;
        if (x < -pitch || (tC[k] >= tO[k]) === (pass === 1)) continue;
        const yo = Y(tO[k]), yc = Y(tC[k]), yh = Y(tH[k]);
        g.rect(x - 0.5, yh, 1, Y(tL[k]) - yh); g.rect(x - hw, Math.min(yo, yc), bw, Math.max(1.6, Math.abs(yc - yo)));
      }
      g.fill();
    }
    // fade the old tape on the left, then slide the grid in behind everything
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = T.fade; g.fillRect(0, 0, px * 0.5, H);
    g.globalCompositeOperation = 'destination-over'; g.drawImage(T.bg, 0, 0, W, H);
    g.globalCompositeOperation = 'source-over';
    for (let i = 0; i < trades.length; i++) {
      const q = trades[i]; if (q.i0 > cur) continue;
      const x0 = px - (T.pos - q.i0) * pitch, done = q.i1 >= 0 && q.i1 <= cur, x1 = done ? px - (T.pos - q.i1) * pitch : px;
      if (x0 > -12) {
        const yl = Y(tL[q.i0 & (RN - 1)]) + 8;
        g.fillStyle = GREEN; g.beginPath(); g.moveTo(x0, yl - 5); g.lineTo(x0 - 4.5, yl + 3); g.lineTo(x0 + 4.5, yl + 3); g.closePath(); g.fill();
        g.drawImage(T.sBuy, x0 - 17, yl + 4, 34, 14);
      }
      if (!done || x1 > px - 44) g.drawImage(T.sStop, Math.min(x1 + 7, px - 26) - 3, Y(q.stop) - 14, 34, 14);
      if (done && x1 > -12) { const yh = Y(tH[q.i1 & (RN - 1)]) - 8; g.fillStyle = q.win ? GREEN : RED; g.beginPath(); g.moveTo(x1, yh + 5); g.lineTo(x1 - 4.5, yh - 3); g.lineTo(x1 + 4.5, yh - 3); g.closePath(); g.fill(); }
    }
    // playhead
    g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(px, top - 8, 1, hh + 14);
    g.globalCompositeOperation = 'lighter';
    const hy = Y(tC[cur & (RN - 1)]);
    blit(g, '#8fb4ff', px, hy, 14, 0.7); blit(g, '#ffffff', px, hy, 3.5, 0.9);
    g.drawImage(glow('#8fb4ff'), px - 9, top - 8, 18, hh + 14);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  J.task(tapeCv, drawT);

  J.bus.on('kill', (v) => { killed = !!v; });

});
