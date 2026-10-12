/* hour / backtest-bars — 1,840 seeded trades as thin up (win) / down (loss) bars, the running total riding above them and the pulsing -22% drawdown block.
 * Hover / touch scrubs a crosshair with a tooltip (trade #, outcome, total, drawdown from peak); click or Enter pins one; arrows / Home / End / Esc work from the keyboard.
 *
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod  J.$ J.$$ J.TAU J.clamp J.fmt J.rng  J.fit J.watch J.task J.onView J.countTo  J.DPR J.reduce J.tier  J.bus 'tier'.
 * Data: buildBT() generates the seeded trades (calibrated so the printed 58% green / 31% a year / -22% worst are the data's own numbers).
 * Everything is simulated.
 */
JEV.mod('hour-backtest-bars', () => {
  const J = JEV, $ = J.$, $$ = J.$$, TAU = J.TAU, clamp = J.clamp, fmt = J.fmt;
  const root = $('#hr-c');
  if (!root) return;
  const reduce = J.reduce;
  const MONO = (getComputedStyle(document.documentElement).getPropertyValue('--mono') || 'monospace').trim();
  const setT = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  /* ---------- shared helpers ---------- */
  /** J.fit, corrected for ancestors that are mid-transform (.rv reveal scales the box, which would make getBoundingClientRect lie) */
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
  /** count-up that settles with a one-off glow (bounded timers, started from onView only) */
  const countUp = (b, dur, delay, f) => setTimeout(() => {
    J.countTo(b, +b.dataset.to, { dur, fmt: f });
    if (!reduce) setTimeout(() => b.classList.add('hr-done'), dur + 60);
  }, delay);

  /* =====================================================================
   * C · the backtest — 1,840 seeded trades, calibrated so the printed stats are the data's own
   * ===================================================================== */
  const N = 1840, NW = 1067, TARGET = Math.pow(1.31, 4); // 58% green · 31%/yr over four years
  let bt = null;
  const buildBT = () => {
    const R = J.rng(18407), isW = new Uint8Array(N), mag = new Float32Array(N), inW = new Uint8Array(N), score = new Float32Array(N), idx = new Array(N);
    for (let i = 0; i < N; i++) { inW[i] = i >= 1010 && i < 1135 ? 1 : 0; score[i] = R() + inW[i] * 0.3; mag[i] = 0.35 + 1.25 * R() * R(); idx[i] = i; }
    idx.sort((a, b) => score[a] - score[b]);
    for (let k = 0; k < NW; k++) isW[idx[k]] = 1;
    const ret = new Float32Array(N), eq = new Float32Array(N + 1), dd = new Float32Array(N + 1);
    const run = (a, mW, store) => {
      let e = 1, pk = 1, pki = 0, worst = 0, wp = 0, wt = 0;
      for (let i = 0; i < N; i++) {
        const r = isW[i] ? a * mag[i] : -a * 1.04 * mag[i] * (inW[i] ? mW : 1);
        e *= 1 + r; if (e > pk) { pk = e; pki = i + 1; }
        const d = 1 - e / pk; if (d > worst) { worst = d; wp = pki; wt = i + 1; }
        if (store) { ret[i] = r; eq[i + 1] = e; dd[i + 1] = d; }
      }
      return { e, worst, pi: wp, ti: wt };
    };
    let a = 0.0045, mW = 1.2;
    for (let it = 0; it < 5; it++) {
      let lo = 0.0003, hi = 0.03;
      for (let k = 0; k < 22; k++) { const m = (lo + hi) / 2; if (run(m, mW).e < TARGET) lo = m; else hi = m; }
      a = (lo + hi) / 2; lo = 0.4; hi = 5;
      for (let k = 0; k < 22; k++) { const m = (lo + hi) / 2; if (run(a, m).worst < 0.22) lo = m; else hi = m; }
      mW = (lo + hi) / 2;
    }
    eq[0] = 1; const fin = run(a, mW, true);
    let emax = 1, emin = 1; for (let i = 0; i <= N; i++) { if (eq[i] > emax) emax = eq[i]; if (eq[i] < emin) emin = eq[i]; }
    return { ret, eq, dd, pi: fin.pi, ti: fin.ti, worst: fin.worst, final: fin.e, emax, emin, annual: (Math.pow(fin.e, 0.25) - 1) * 100 };
  };

  const btBox = $('#hr-btbox'), btCv = $('#hr-btc'), tip = $('#hr-bt-tip');
  const BT = { g: null, W: 0, H: 0, off: null, e: reduce ? 1 : 0, go: reduce, t0: -1, hx: -1, dirty: true, sweep: -1, nextSweep: 9, ey: null, padL: 38, cw: 100, last: -1, left: 0, rl: true, tipX: -1, tipDone: -1, lastLive: 0, bx0: 0, bx1: 0, top: 0, bot: 0 };
  const X = (v) => '×' + v.toFixed(2);
  const tierNow = () => J.tier || 2;
  function layoutC() {
    BT.rl = true; // box moved / resized: re-read its left edge on the next hover
    if (!bt) return;
    const f = fitC(btCv); BT.g = f.g; BT.W = f.W; BT.H = f.H;
    const W = f.W, H = f.H, narrow = W < 420, dpr = J.DPR;
    const padL = narrow ? 32 : 40, padR = 10, padT = 16, cw = W - padL - padR, split = Math.round(H * 0.46), pitch = narrow ? 2.5 : 3, cols = Math.max(24, Math.floor(cw / pitch));
    BT.padL = padL; BT.cw = cw; BT.cols = cols;
    const up = new Float32Array(cols), dn = new Float32Array(cols), ey = new Float32Array(cols);
    for (let i = 0; i < N; i++) { const c = Math.min(cols - 1, (i * cols / N) | 0), r = bt.ret[i]; if (r > 0) up[c] += r; else dn[c] -= r; }
    let mx = 1e-9; for (let c = 0; c < cols; c++) mx = Math.max(mx, up[c], dn[c]);
    const e0 = bt.emin * 0.97, e1 = bt.emax * 1.03, eTop = padT + 4, eBot = split - 14, EY = (v) => eBot - (v - e0) / (e1 - e0) * (eBot - eTop);
    const cx = (c) => padL + (c + 0.5) * cw / cols;
    for (let c = 0; c < cols; c++) ey[c] = EY(bt.eq[Math.min(N, Math.round((c + 1) * N / cols))]);
    BT.ey = ey; BT.cx0 = padL; BT.EY = EY;
    const off = BT.off || (BT.off = document.createElement('canvas')); off.width = Math.round(W * dpr); off.height = Math.round(H * dpr);
    const g = off.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const bTop = split + 6, bBot = H - 22, mid = (bTop + bBot) / 2, half = (bBot - bTop) / 2 - 3, xOf = (i) => padL + i / N * cw;
    // year dividers + labels
    g.font = '600 9px ' + MONO; g.textAlign = 'center';
    for (let y = 0; y < 4; y++) {
      if (y) { g.strokeStyle = 'rgba(255,255,255,.07)'; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(Math.round(padL + cw * y / 4) + 0.5, padT); g.lineTo(Math.round(padL + cw * y / 4) + 0.5, H - 20); g.stroke(); g.setLineDash([]); }
      g.fillStyle = 'rgba(160,152,176,.8)'; g.fillText('year ' + (y + 1), padL + cw * (y + 0.5) / 4, H - 8);
    }
    // drawdown block (behind everything else)
    const bx0 = xOf(bt.pi), bx1 = xOf(bt.ti); BT.bx0 = bx0; BT.bx1 = bx1; BT.top = padT; BT.bot = H - 20;
    const dg = g.createLinearGradient(0, padT, 0, H - 20); dg.addColorStop(0, 'rgba(255,77,94,.26)'); dg.addColorStop(1, 'rgba(255,77,94,.07)');
    g.fillStyle = dg; g.fillRect(bx0, padT, bx1 - bx0, H - 20 - padT);
    g.strokeStyle = 'rgba(255,77,94,.55)'; g.lineWidth = 1; g.setLineDash([3, 3]); g.strokeRect(bx0 + 0.5, padT + 0.5, bx1 - bx0 - 1, H - 20 - padT - 1); g.setLineDash([]);
    // bars
    g.strokeStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(padL, Math.round(mid) + 0.5); g.lineTo(W - padR, Math.round(mid) + 0.5); g.stroke();
    const bw = Math.max(1.2, cw / cols - 1), ug = g.createLinearGradient(0, mid - half, 0, mid), dgr = g.createLinearGradient(0, mid, 0, mid + half);
    ug.addColorStop(0, 'rgba(46,230,166,.95)'); ug.addColorStop(1, 'rgba(46,230,166,.45)'); dgr.addColorStop(0, 'rgba(255,77,94,.5)'); dgr.addColorStop(1, 'rgba(255,77,94,.98)');
    g.fillStyle = ug; for (let c = 0; c < cols; c++) { const h = up[c] / mx * half; g.fillRect(cx(c) - bw / 2, mid - h, bw, h); }
    g.fillStyle = dgr; for (let c = 0; c < cols; c++) { const h = dn[c] / mx * half; g.fillRect(cx(c) - bw / 2, mid + 1, bw, h); }
    // running total: glow underlay, area, line
    g.lineJoin = 'round';
    g.beginPath(); for (let c = 0; c < cols; c++) { if (c) g.lineTo(cx(c), ey[c]); else g.moveTo(cx(c), ey[c]); }
    g.lineWidth = 7; g.strokeStyle = 'rgba(255,193,61,.14)'; g.stroke();
    g.lineWidth = 2.2; const lg = g.createLinearGradient(padL, 0, W - padR, 0); lg.addColorStop(0, '#ffc13d'); lg.addColorStop(1, '#ff9d3d'); g.strokeStyle = lg; g.stroke();
    g.lineTo(cx(cols - 1), eBot + 4); g.lineTo(cx(0), eBot + 4); g.closePath();
    const ag = g.createLinearGradient(0, eTop, 0, eBot); ag.addColorStop(0, 'rgba(255,193,61,.2)'); ag.addColorStop(1, 'rgba(255,193,61,0)'); g.fillStyle = ag; g.fill();
    if (tierNow() >= 2) { /* heat glow under the curve: hot amber near the line, cooling to the baseline, brighter where the curve is high */
      g.save(); g.clip(); g.globalCompositeOperation = 'lighter';
      const hg = g.createLinearGradient(0, eTop, 0, eBot); hg.addColorStop(0, 'rgba(255,150,40,.34)'); hg.addColorStop(0.45, 'rgba(255,96,40,.12)'); hg.addColorStop(1, 'rgba(255,60,60,0)');
      g.fillStyle = hg; g.fillRect(padL, eTop - 8, cw, eBot - eTop + 14);
      if (tierNow() >= 3) { g.lineJoin = 'round'; g.beginPath(); for (let c = 0; c < cols; c++) { if (c) g.lineTo(cx(c), ey[c]); else g.moveTo(cx(c), ey[c]); } g.lineWidth = 14; g.strokeStyle = 'rgba(255,170,60,.1)'; g.stroke(); }
      g.restore();
    }
    // labels
    g.textAlign = 'left'; g.font = '700 9.5px ' + MONO;
    g.fillStyle = '#2ee6a6'; g.fillText('win', 4, mid - 9); g.fillStyle = '#ff6b79'; g.fillText('loss', 4, mid + 17);
    g.fillStyle = 'rgba(255,214,120,.95)'; g.fillText(bt.emax.toFixed(1) + '×', 4, EY(bt.emax) + 3); g.fillStyle = 'rgba(160,152,176,.85)'; g.fillText('1×', 4, EY(1) + 3);
    g.textAlign = 'center'; g.fillStyle = '#ff6b79'; g.font = '800 ' + (narrow ? 11 : 13) + 'px ' + MONO;
    const lx = clamp((bx0 + bx1) / 2, padL + 20, W - padR - 22); g.fillText('-' + Math.round(bt.worst * 100) + '%', lx, padT + 11);
    BT.dirty = true; if (BT.pin >= 0) setPin(BT.pin); else if (reduce) renderC(0, 0);
  }
  J.watch(btBox, layoutC);
  setTimeout(() => {
    bt = buildBT(); const sb = $$('b', $('#hr-c-stats'));
    sb[1].dataset.to = String(Math.round(bt.annual)); sb[2].dataset.to = String(-Math.round(bt.worst * 100)); setT($('.hr-badge', root), Math.round(bt.annual) + '% / yr');
    layoutC();
  }, reduce ? 0 : 500);

  const idxAt = (x) => clamp(Math.round((x - BT.padL) / BT.cw * N), 1, N);
  const xOfI = (i) => BT.padL + i / N * BT.cw;
  const pct = (v, d) => (v >= 0 ? '+' : '-') + Math.abs(v * 100).toFixed(d == null ? 2 : d) + '%';
  /** trade #, outcome, running total and drawdown for trade i (1-based) */
  function tipHtml(i, pin) {
    const dd = bt.dd[i], yr = Math.min(4, 1 + Math.floor((i - 1) / N * 4)), r = bt.ret[i - 1], w = r > 0;
    return (pin ? '<i class="pn">pinned</i> ' : '') + 'trade <b>#' + fmt(i) + '</b> · year ' + yr + ' · <span class="' + (w ? 'up' : 'dn') + '">' + (w ? 'win ' : 'loss ') + pct(r) + '</span><br>total <b>' + X(bt.eq[i]) + '</b> · ' +
      (dd > 0.0005 ? '<span class="dn">-' + (dd * 100).toFixed(1) + '%</span> from peak' : 'at a new high') + ' <em>sim</em>';
  }
  /* side with the room, then clamped inside the box with min()/max() (100% = the tip's own width): never clipped at 390px */
  const tipSide = (el, x) => { const rt = x < BT.W * 0.5; el.style.transform = 'translateX(' + (rt ? 'min(' + Math.round(x + 14) + 'px, calc(' + Math.round(BT.W) + 'px - 100% - 4px))' : 'max(4px, calc(' + Math.round(x - 14) + 'px - 100%))') + ')'; };
  function setTip(x) {
    if (x < 0 || !bt) { tip.classList.remove('on'); return; }
    const i = idxAt(x);
    if (i !== BT.last) { BT.last = i; tip.innerHTML = tipHtml(i, false); }
    tip.classList.add('on'); tipSide(tip, x);
  }
  const pinEl = $('#hr-bt-pin'), srEl = $('#hr-bt-sr');
  BT.pin = -1; BT.over = false;
  function setPin(i) {
    BT.pin = i; BT.dirty = true;
    if (i < 0 || !bt) { pinEl.classList.remove('on'); return; }
    pinEl.innerHTML = tipHtml(i, true); pinEl.classList.add('on'); tipSide(pinEl, xOfI(i));
    if (reduce) renderC(J.time, 0);
  }
  /* hover: the box's left edge is cached (re-read once per hover, and after a resize / reveal via layoutC), so pointermove does no layout read and no DOM write;
     the tip text + transform are written by the frame task (renderC), at most once per frame. (reduced motion freezes the task, so it flushes inline there) */
  const hoverAt = (e) => {
    if (BT.rl) { BT.left = btBox.getBoundingClientRect().left; BT.rl = false; }
    BT.hx = clamp(e.clientX - BT.left, BT.padL, BT.W - 10); BT.dirty = true; BT.tipX = BT.hx;
    if (reduce) { flushTip(); renderC(J.time, 0); }
  };
  const flushTip = () => { if (BT.tipX !== BT.tipDone) { BT.tipDone = BT.tipX; setTip(BT.tipX); } };
  btBox.addEventListener('pointerenter', () => { BT.rl = true; BT.over = true; });
  btBox.addEventListener('pointermove', hoverAt);
  btBox.addEventListener('pointerleave', () => { BT.over = false; BT.hx = -1; BT.dirty = true; BT.tipX = -1; if (reduce) { flushTip(); renderC(J.time, 0); } });
  btBox.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') { BT.rl = true; BT.over = true; hoverAt(e); } });
  /* click / tap pins the trade under the pointer; clicking the pin again (or Esc) clears it */
  btBox.addEventListener('click', (e) => {
    if (!bt || BT.e < 1 || e.detail === 0) return;
    if (BT.rl) { BT.left = btBox.getBoundingClientRect().left; BT.rl = false; }
    const x = clamp(e.clientX - BT.left, BT.padL, BT.W - 10), i = idxAt(x);
    setPin(BT.pin >= 0 && Math.abs(xOfI(BT.pin) - x) < 9 ? -1 : i);
  });
  /* keyboard parity: arrows scrub (shift = x5), Home / End jump, Enter or Space pins, Esc clears */
  let kbI = 0;
  const kbShow = (i) => {
    kbI = clamp(i, 1, N); BT.hx = xOfI(kbI); BT.tipX = BT.hx; BT.dirty = true;
    srEl.textContent = 'trade ' + kbI + ', ' + (bt.ret[kbI - 1] > 0 ? 'win ' : 'loss ') + pct(bt.ret[kbI - 1]) + ', total ' + X(bt.eq[kbI]) + ', drawdown ' + (bt.dd[kbI] * 100).toFixed(1) + ' percent, simulated';
    if (reduce) { flushTip(); renderC(J.time, 0); }
  };
  btBox.addEventListener('keydown', (e) => {
    if (!bt || BT.e < 1) return;
    const k = e.key, st = (e.shiftKey ? 5 : 1) * 12;
    if (k === 'ArrowRight' || k === 'ArrowUp') kbShow((kbI || (BT.hx > 0 ? idxAt(BT.hx) : N >> 1)) + st);
    else if (k === 'ArrowLeft' || k === 'ArrowDown') kbShow((kbI || (BT.hx > 0 ? idxAt(BT.hx) : N >> 1)) - st);
    else if (k === 'Home') kbShow(1); else if (k === 'End') kbShow(N);
    else if (k === 'Enter' || k === ' ') { if (!kbI) kbShow(BT.hx > 0 ? idxAt(BT.hx) : N >> 1); setPin(BT.pin === kbI ? -1 : kbI); }
    else if (k === 'Escape') setPin(-1);
    else return;
    e.preventDefault();
  });
  btBox.addEventListener('blur', () => { kbI = 0; if (!BT.over) { BT.hx = -1; BT.tipX = -1; BT.dirty = true; if (reduce) { flushTip(); renderC(J.time, 0); } } });

  const statFmtC = { pct: (v) => Math.round(v) + '%', int: (v) => fmt(Math.round(v)) };
  J.onView(btBox, () => {
    if (reduce) return;
    BT.go = true; BT.t0 = -1;
    $$('b', $('#hr-c-stats')).forEach((b, i) => countUp(b, 2200, 300 + i * 160, statFmtC[b.dataset.f]));
  }, { threshold: 0.35 });
  if (!reduce) { BT.e = 0; BT.go = false; }

  const renderC = (t, dt) => {
    const g = BT.g; if (!g || !BT.off) return;
    flushTip();
    let need = BT.dirty;
    const live = !reduce && BT.e >= 1 && BT.bx1 > BT.bx0 && tierNow() >= 2;   /* drawdown block pulses + warning scan: redraw at ~30 Hz */
    if (live && t - BT.lastLive > 0.033) { BT.lastLive = t; need = true; }
    if (BT.go && BT.e < 1) { if (BT.t0 < 0) BT.t0 = t; const p = clamp((t - BT.t0) / 2.6, 0, 1); BT.e = 1 - Math.pow(1 - p, 3); need = true; if (p >= 1) BT.nextSweep = t + 3; }
    else if (BT.e >= 1 && !reduce) { if (BT.sweep < 0 && t > BT.nextSweep) BT.sweep = 0; if (BT.sweep >= 0) { BT.sweep += dt / 1.5; need = true; if (BT.sweep > 1) { BT.sweep = -1; BT.nextSweep = t + 8; } } }
    if (!need) return;
    BT.dirty = false;
    const W = BT.W, H = BT.H, e = BT.e, sx = BT.padL + e * (W - BT.padL);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, W, H);
    if (e > 0.002) { const k = e >= 1 ? 1 : sx / W; g.drawImage(BT.off, 0, 0, BT.off.width * k, BT.off.height, 0, 0, W * k, H); }
    g.globalCompositeOperation = 'lighter';
    if (e < 1 && e > 0) {
      const c = clamp(Math.floor((sx - BT.padL) / BT.cw * BT.cols), 0, BT.cols - 1);
      g.globalAlpha = 0.55; g.drawImage(glow('#4d8dff'), sx - 16, 0, 32, H); g.globalAlpha = 0.9; g.fillStyle = '#fff'; g.fillRect(sx - 0.5, 8, 1, H - 24);
      blit(g, '#ffc13d', sx, BT.ey[c], 18, 0.95);
      if (tierNow() >= 2) { /* glowing head: bloom + a comet tail riding the curve */
        blit(g, '#ffffff', sx, BT.ey[c], 5, 0.9); blit(g, '#ffa63d', sx, BT.ey[c], 34, 0.32);
        for (let k = 1; k <= (tierNow() >= 3 ? 9 : 4); k++) { const cc = c - k * 2; if (cc < 0) break; blit(g, '#ffc13d', BT.padL + (cc + 0.5) * BT.cw / BT.cols, BT.ey[cc], 12 - k, 0.42 - k * 0.04); }
      }
    }
    if (live) {
      const w = BT.bx1 - BT.bx0, ph = 0.5 + 0.5 * Math.sin(t * 3.4), top = BT.top, hh = BT.bot - top;
      g.globalAlpha = 0.05 + 0.13 * ph; g.fillStyle = '#ff2e45'; g.fillRect(BT.bx0, top, w, hh);
      g.globalAlpha = 0.25 + 0.4 * ph; g.strokeStyle = '#ff4d5e'; g.lineWidth = 1.2; g.strokeRect(BT.bx0 + 0.5, top + 0.5, w - 1, hh - 1);
      const sy = top + ((t * 0.55) % 1) * hh;   // warning scan line sweeping down the block
      g.globalAlpha = 0.9; g.drawImage(glow('#ff4d5e'), BT.bx0, sy - 9, w, 18); g.globalAlpha = 0.7; g.fillStyle = '#ffd0d5'; g.fillRect(BT.bx0, sy - 0.5, w, 1);
      if (tierNow() >= 3) { g.globalAlpha = 0.16; g.fillStyle = '#ff6b79'; for (let y = top + 3; y < top + hh; y += 5) g.fillRect(BT.bx0, y, w, 1); }
    }
    if (BT.sweep >= 0) { const x = BT.padL + BT.sweep * BT.cw; g.globalAlpha = Math.sin(BT.sweep * Math.PI) * 0.2; g.drawImage(glow('#8fb4ff'), x - 22, 4, 44, H - 8); }
    if (BT.hx >= 0 && e >= 1) {
      const c = clamp(Math.floor((BT.hx - BT.padL) / BT.cw * BT.cols), 0, BT.cols - 1);
      g.globalAlpha = 0.5; g.fillStyle = '#fff'; g.fillRect(Math.round(BT.hx), 6, 1, H - 24);
      blit(g, '#ffc13d', BT.hx, BT.ey[c], 16, 1); blit(g, '#ffffff', BT.hx, BT.ey[c], 4, 1);
      /* drawdown bracket: from the running peak down to the running total at this trade */
      const hi = idxAt(BT.hx), ddv = bt.dd[hi];
      if (ddv > 0.004) {
        const yT = BT.EY(bt.eq[hi] / (1 - ddv)), yB = BT.EY(bt.eq[hi]), xb = Math.round(BT.hx) + 5;
        g.globalAlpha = 0.85; g.strokeStyle = '#ff6b79'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(xb - 3, yT); g.lineTo(xb, yT); g.lineTo(xb, yB); g.lineTo(xb - 3, yB); g.stroke();
        g.globalAlpha = 0.35; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(BT.padL, yT); g.lineTo(xb, yT); g.stroke(); g.setLineDash([]);
      }
    }
    if (BT.pin >= 0 && e >= 1) {
      const px = Math.round(xOfI(BT.pin)) + 0.5, py = BT.EY(bt.eq[BT.pin]);
      g.globalAlpha = 0.55; g.strokeStyle = '#8fb4ff'; g.lineWidth = 1; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(px, 6); g.lineTo(px, H - 20); g.stroke(); g.setLineDash([]);
      blit(g, '#4d8dff', px, py, 14, 0.9); g.globalAlpha = 1; g.strokeStyle = '#fff'; g.lineWidth = 1.6; g.beginPath(); g.arc(px, py, 4.5, 0, TAU); g.stroke();
      g.fillStyle = '#8fb4ff'; g.beginPath(); g.moveTo(px - 4.5, 6); g.lineTo(px + 4.5, 6); g.lineTo(px, 12); g.closePath(); g.fill();
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  };
  J.task(btBox, renderC);

  J.bus.on('tier', () => { if (bt) layoutC(); });
});
