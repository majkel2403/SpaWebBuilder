  /* ================================================================ feeds (left column) ================================================================ */
  ocv = J.$('#dkw-ocv');
  const FD = FEEDS.map((f, i) => {
    const el = J.$('.dkw-v[data-k="' + f.k + '"]', feedsEl), spark = J.$('.dkw-vs', el);
    const bars = Array.from({ length: 12 }, () => { const b = document.createElement('i'); spark.appendChild(b); return b; });
    return { k: f.k, i, el, city: CIDX[f.city], bias: f.bias, lat0: f.lat0, off: 0, lat: f.lat0, price: 0, prev: 0, up: true, alt: 0, hist: new Float32Array(12), hq: -1, hs: '', bars, p: J.$('.dkw-vp', el), u: J.$('.dkw-vm u', el), s: J.$('.dkw-vm s', el), n: 0 };
  });
