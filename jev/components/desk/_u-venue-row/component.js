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
