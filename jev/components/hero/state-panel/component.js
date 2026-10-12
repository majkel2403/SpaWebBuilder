/* hero / state-panel — STATE column: 15 fields as ports with live values; numeric fields keep a 20-decision sparkline behind the value, fields that changed light up.
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot()
 * Data: JEV.bus 'decision' -> d.state {symbol price vwap_dist_bps spread_bps imbalance funding_bps vol_1h edge_bps position_pct daily_pnl drawdown_pct latency_ms signal_age_s venue regime}. */
JEV.mod('hero-state-panel', () => {
  'use strict';
  const J = JEV, list = J.$('#hspRows');
  if (!list) return;
  const KEYS = J.STATE_KEYS, HN = 20, refPx = {}, hist = [], rows = [], vals = [], prev = new Array(15).fill(''), cvs = [], gx = [];
  for (let i = 0; i < 15; i++) hist.push(new Float32Array(HN)); let hCount = 0;
  const NUM = [null, (s) => Math.log(s.price / (refPx[s.symbol] || (refPx[s.symbol] = s.price))), (s) => s.vwap_dist_bps, (s) => s.spread_bps, (s) => s.imbalance, (s) => s.funding_bps, (s) => s.vol_1h, (s) => s.edge_bps, (s) => s.position_pct, (s) => s.daily_pnl, (s) => s.drawdown_pct, (s) => s.latency_ms, (s) => s.signal_age_s];
  for (let i = 0; i < 15; i++) {
    const li = document.createElement('li'); li.className = 'hsp-row'; li.title = KEYS[i];
    const cv = i >= 1 && i <= 12 ? document.createElement('canvas') : null; if (cv) { cv.setAttribute('aria-hidden', 'true'); li.appendChild(cv); }
    li.insertAdjacentHTML('beforeend', '<span class="hsp-v"></span><span class="hsp-k">' + KEYS[i] + '</span><i class="hsp-port"></i>');
    list.appendChild(li); rows.push(li); vals.push(li.querySelector('.hsp-v')); cvs.push(cv);
  }
  function text(s) {
    const t = []; t[0] = s.symbol; t[1] = s.price >= 1000 ? J.fmt(s.price, 0) : J.fmt(s.price, s.price < 100 ? 2 : 1);
    t[2] = J.sgn(s.vwap_dist_bps, 1); t[3] = s.spread_bps.toFixed(1); t[4] = J.sgn(s.imbalance, 2); t[5] = J.sgn(s.funding_bps, 1); t[6] = Math.round(s.vol_1h) + '';
    t[7] = J.sgn(s.edge_bps, 1); t[8] = J.sgn(s.position_pct, 1); t[9] = J.sgn(s.daily_pnl, 0); t[10] = s.drawdown_pct.toFixed(1); t[11] = Math.round(s.latency_ms) + '';
    t[12] = s.signal_age_s.toFixed(1); t[13] = s.venue; t[14] = s.regime; return t;
  }
  function spark(i) {
    const cv = cvs[i]; if (!cv || hCount < 3) return;
    if (!gx[i] || cv._w !== cv.clientWidth) { gx[i] = J.fit(cv); cv._w = cv.clientWidth; } const f = gx[i]; if (!f || !f.W) return;
    const g = f.g, a = hist[i], n = hCount, amp = 8; g.setTransform(f.dpr, 0, 0, f.dpr, 0, 0); g.clearRect(0, 0, f.W, f.H);
    let lo = 1e18, hi = -1e18; for (let j = HN - n; j < HN; j++) { if (a[j] < lo) lo = a[j]; if (a[j] > hi) hi = a[j]; } const rg = hi - lo || 1;
    g.strokeStyle = 'rgba(255,130,184,.5)'; g.lineWidth = 1; g.lineJoin = 'round'; g.beginPath(); let ex = 0, ey = 0;
    for (let j = 0; j < n; j++) { const x = f.W - 2 - (f.W - 6) * (n - 1 - j) / (HN - 1), y = f.H / 2 + amp - (a[HN - n + j] - lo) / rg * amp * 2; if (j) g.lineTo(x, y); else g.moveTo(x, y); ex = x; ey = y; }
    g.stroke(); g.fillStyle = 'rgba(255,210,228,.85)'; g.beginPath(); g.arc(ex, ey, 1.5, 0, J.TAU); g.fill();
  }
  function update(d) {
    const s = d.state; if (!s) return; const t = text(s);
    for (let i = 1; i < 13; i++) { const h = hist[i]; h.copyWithin(0, 1); h[HN - 1] = NUM[i](s); } if (hCount < HN) hCount++;
    for (let i = 0; i < 15; i++) {
      vals[i].textContent = t[i]; const ch = prev[i] !== t[i]; prev[i] = t[i];
      if (ch) { rows[i].classList.add('is-lit'); clearTimeout(rows[i]._t); rows[i]._t = setTimeout(() => rows[i].classList.remove('is-lit'), 900); }
      spark(i);
    }
  }
  J.watch(list, () => { for (let i = 0; i < 15; i++) { gx[i] = null; spark(i); } });
  const d0 = J.recent[0] || J.makeDecision(); if (d0) update(d0);
  J.bus.on('decision', update);
  const b = J.$('#hspFire'); if (b) b.addEventListener('click', () => J.fire());
});
