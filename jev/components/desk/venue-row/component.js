/* desk/venue-row — venue feed rows: price rolling on every tick, 12 spark bars, latency, bps vs oracle, deviation heat
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Data: bus 'tick' (4 Hz) + JEV.market.price (the oracle). Each row simulates its own book: oracle * (1 + (bias + noise) bp). Per-row data-bias (bp) / data-lat (ms).
 */
JEV.mod('desk-venue-row', () => {
  'use strict';
  const J = JEV, clamp = J.clamp, fmt = J.fmt;
  const rows = J.$$('.dkw-v');
  if (!rows.length) return;
  const txt = (el, v) => { if (el && el.textContent !== v) el.textContent = v; };
  const FD = rows.map((el) => {
    const spark = J.$('.dkw-vs', el), lat0 = +el.dataset.lat || 30;
    const bars = Array.from({ length: 12 }, () => { const b = document.createElement('i'); spark.appendChild(b); return b; });
    return { el, bias: +el.dataset.bias || 0, lat0, lat: lat0, off: 0, price: 0, prev: 0, up: true, alt: 0, hist: new Float32Array(12), hq: -1, hs: '', bars, p: J.$('.dkw-vp', el), u: J.$('.dkw-vm u', el), s: J.$('.dkw-vm s', el) };
  });
  let tickN = 0;
  function paint(f, withLat) {
    f.p.className = 'dkw-vp num ' + (f.up ? 'up ' : 'dn ') + ((f.alt ^= 1) ? 'fa' : 'fb');
    txt(f.p, fmt(f.price, 1));
    const dev = (f.price / J.market.price - 1) * 1e4;
    txt(f.s, J.sgn(dev, 1) + 'bp');
    if (withLat) { txt(f.u, Math.round(f.lat) + 'ms'); const c = f.lat < 40 ? '' : f.lat < 70 ? 'm' : 's'; if (f.u.className !== c) f.u.className = c; }
    let mn = 1e12, mx = -1e12; for (let i = 0; i < 12; i++) { const v = f.hist[i]; if (v < mn) mn = v; if (v > mx) mx = v; }
    const rg = mx - mn, hq = Math.round(Math.min(1, Math.abs(dev) / 1.1) * 10) / 10, hs = dev >= 0 ? 'p' : 'n';
    if (hq !== f.hq) { f.hq = hq; f.el.style.setProperty('--h', hq); } if (hs !== f.hs) { f.hs = hs; f.el.dataset.hs = hs; }
    for (let i = 0; i < 12; i++) f.bars[i].style.transform = 'scaleY(' + (rg < 1e-6 ? 0.35 : 0.16 + 0.84 * ((f.hist[i] - mn) / rg)).toFixed(2) + ')';
  }
  function step(price, doPaint) {
    for (const f of FD) {
      f.off = f.off * 0.82 + J.gauss() * 0.32; f.prev = f.price || price; f.price = price * (1 + (f.bias + f.off) * 1e-4);
      f.up = f.price >= f.prev; f.lat = clamp(f.lat + J.gauss() * 2.2 + (f.lat0 - f.lat) * 0.08, 6, 140);
      for (let i = 0; i < 11; i++) f.hist[i] = f.hist[i + 1]; f.hist[11] = f.price;
    }
    if (doPaint) { tickN++; for (const f of FD) paint(f, (tickN & 1) === 0); }
  }
  for (let i = 0; i < 12; i++) step(J.market.price, i === 11);
  J.bus.on('tick', () => { if (!J.hidden()) step(J.market.price, true); else step(J.market.price, false); });
});
