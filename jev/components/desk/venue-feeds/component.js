/* desk/venue-feeds — the global feeds column: an oracle price tile with a live sparkline and one row per simulated venue (price, latency, bps vs oracle, mini history bars, deviation heat)
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* API relied on: $ $$ C TAU clamp lerp rnd ri gauss rng rgba fmt usd sgn · bus (on 'tick' 'decision' 'kill' 'tier', emit 'agentstep') · fit watch task animate · market recent S RULES AGENTS · makeDecision · tier reduce time.
 * Data: JEV.market {price, open, hist[]} (oracle + venue prices), decision records {id symbol venue action size conf net dest riskOk state{spread_bps regime price}}.
 */
JEV.mod('desk-venue-feeds', () => {
  'use strict';
  const J = JEV, C = J.C, TAU = J.TAU, clamp = J.clamp, lerp = J.lerp, D2R = Math.PI / 180;
  const root = J.$('#dkw-feeds');
  if (!root) return;
  const txt = (el, v) => { if (el && el.textContent !== v) el.textContent = v; };
  const fmt = J.fmt, rnd = J.rnd;
  let killed = !!J.S.killed;

  /* ---------------- venues ---------------- */
  const FEEDS = [
    { k: 'coinbase', city: 'SFO', bias: 0.3, lat0: 24 }, { k: 'kraken', city: 'NYC', bias: -0.2, lat0: 31 }, { k: 'binance', city: 'SGP', bias: 0.1, lat0: 18 },
    { k: 'okx', city: 'SYD', bias: -0.1, lat0: 42 }, { k: 'bybit', city: 'DXB', bias: 0.2, lat0: 36 }, { k: 'bitstamp', city: 'LON', bias: -0.4, lat0: 58 },
    { k: 'upbit', city: 'TYO', bias: 0.8, lat0: 71 }, { k: 'deribit', city: 'FRA', bias: 0, lat0: 27 },
  ];
  const feedsEl = root;
  const ocv = J.$('#dkw-ocv');
  let og = null, OW = 0, OH = 0, ogFill = null, inView = true, ft = 0;
  const flash = (el) => { const a = el.classList.contains('ha'); el.classList.remove(a ? 'ha' : 'hb'); el.classList.add(a ? 'hb' : 'ha'); };
  const FD = FEEDS.map((f, i) => {
    const el = J.$('.dkw-v[data-k="' + f.k + '"]', feedsEl), spark = J.$('.dkw-vs', el);
    const bars = Array.from({ length: 12 }, () => { const b = document.createElement('i'); spark.appendChild(b); return b; });
    return { k: f.k, i, el, bias: f.bias, lat0: f.lat0, off: 0, lat: f.lat0, price: 0, prev: 0, up: true, alt: 0, hist: new Float32Array(12), hq: -1, hs: '', bars, p: J.$('.dkw-vp', el), u: J.$('.dkw-vm u', el), s: J.$('.dkw-vm s', el), n: 0 };
  });
  const E = { op: J.$('#dkw-op'), opd: J.$('#dkw-opd'), oc: J.$('#dkw-oc'), disp: J.$('#dkw-disp') };
  let tickN = 0;
  function layout() {
    const o = J.fit(ocv); og = o.g; OW = o.W; OH = o.H; ogFill = og.createLinearGradient(0, 0, 0, OH); ogFill.addColorStop(0, 'rgba(120,170,255,.36)'); ogFill.addColorStop(1, 'rgba(120,170,255,0)'); drawOracle();
  }
  function drawOracle() {
    if (!og) return;
    const h = J.market.hist, n = Math.min(h.length, 120), s = h.length - n;
    if (n < 4) return;
    let mn = 1e12, mx = -1e12; for (let i = 0; i < n; i++) { const v = h[s + i]; if (v < mn) mn = v; if (v > mx) mx = v; }
    const pad = 6, ih = OH - pad * 2, rg = mx - mn || 1;
    og.clearRect(0, 0, OW, OH); og.beginPath();
    for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * OW, y = pad + (1 - (h[s + i] - mn) / rg) * ih; if (i) og.lineTo(x, y); else og.moveTo(x, y); }
    og.lineJoin = 'round'; og.strokeStyle = 'rgba(140,185,255,.28)'; og.lineWidth = 5; og.stroke(); og.strokeStyle = '#b7d0ff'; og.lineWidth = 1.5; og.stroke();
    og.lineTo(OW, OH); og.lineTo(0, OH); og.closePath(); og.fillStyle = ogFill; og.fill();
    const ly = pad + (1 - (h[h.length - 1] - mn) / rg) * ih; og.fillStyle = '#fff'; og.beginPath(); og.arc(OW - 3, ly, 2.4, 0, TAU); og.fill();
  }
  function paintFeed(f, withLat) {
    f.p.className = 'dkw-vp num ' + (f.up ? 'up ' : 'dn ') + ((f.alt ^= 1) ? 'fa' : 'fb');
    txt(f.p, fmt(f.price, 1));
    txt(f.s, J.sgn((f.price / J.market.price - 1) * 1e4, 1) + 'bp');
    if (withLat) { txt(f.u, Math.round(f.lat) + 'ms'); const c = f.lat < 40 ? '' : f.lat < 70 ? 'm' : 's'; if (f.u.className !== c) f.u.className = c; }
    let mn = 1e12, mx = -1e12; for (let i = 0; i < 12; i++) { const v = f.hist[i]; if (v < mn) mn = v; if (v > mx) mx = v; }
    const rg = mx - mn;
    const dev = (f.price / J.market.price - 1) * 1e4, hv = Math.min(1, Math.abs(dev) / 1.1), hq = Math.round(hv * 10) / 10, hs = dev >= 0 ? 'p' : 'n';
    if (hq !== f.hq) { f.hq = hq; f.el.style.setProperty('--h', hq); } if (hs !== f.hs) { f.hs = hs; f.el.dataset.hs = hs; }
    for (let i = 0; i < 12; i++) f.bars[i].style.transform = 'scaleY(' + (rg < 1e-6 ? 0.35 : 0.16 + 0.84 * ((f.hist[i] - mn) / rg)).toFixed(2) + ')';
  }
  function updateFeeds(price, paint) {
    let mn = 1e12, mx = -1e12;
    for (const f of FD) {
      f.off = f.off * 0.82 + J.gauss() * 0.32; f.prev = f.price || price; f.price = price * (1 + (f.bias + f.off) * 1e-4);
      f.up = f.price >= f.prev; f.lat = clamp(f.lat + J.gauss() * 2.2 + (f.lat0 - f.lat) * 0.08, 6, 140);
      for (let i = 0; i < 11; i++) f.hist[i] = f.hist[i + 1]; f.hist[11] = f.price;
      if (f.price < mn) mn = f.price; if (f.price > mx) mx = f.price;
    }
    if (!paint) return;
    tickN++;
    for (const f of FD) paintFeed(f, (tickN & 1) === 0);
    txt(E.disp, ((mx - mn) / price * 1e4).toFixed(1));
    const M = J.market, chg = (price / M.open - 1) * 100;
    txt(E.op, fmt(Math.floor(price))); txt(E.opd, '.' + Math.floor((price % 1) * 10));
    txt(E.oc, (chg >= 0 ? '▲ ' : '▼ ') + J.sgn(chg, 2) + '%'); const oc = 'dkw-orc ' + (chg >= 0 ? 'up' : 'dn'); if (E.oc.className !== oc) E.oc.className = oc;
    drawOracle();
  }

  // a click on a venue row marks it (on the full page it also turns the globe to that venue)
  FD.forEach((f) => f.el.addEventListener('click', () => {
    FD.forEach((x) => x.el.classList.toggle('is-f', x === f)); clearTimeout(ft); ft = setTimeout(() => f.el.classList.remove('is-f'), 4200);
  }));
  J.bus.on('tick', (m) => updateFeeds(m.price, inView));
  J.bus.on('decision', (d) => {
    if (!inView || J.S.killed) return;
    if (d.dest === 'execute') { const f = FD.find((x) => x.k === d.venue); if (f) flash(f.el); }
  });
  new IntersectionObserver((es) => { const was = inView; inView = es[es.length - 1].isIntersecting; if (inView && !was) updateFeeds(J.market.price, true); }, { rootMargin: '120px' }).observe(root);
  for (let i = 0; i < 12; i++) updateFeeds(J.market.price, false);
  updateFeeds(J.market.price, true);
  J.watch(ocv, layout);
});
