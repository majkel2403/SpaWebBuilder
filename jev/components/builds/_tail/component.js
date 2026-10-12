  /* ---------- off-screen gate ---------- */
  /* A decision arrives every ~1 s whether or not anyone is looking: with the section off-screen the old pipeline still ran ~12 Element.animate calls (box-shadow + filter on
     cards nobody sees), ~27 DOM mutations and a 60-slot timeline queue per decision. Now the three parts of the section (hub / head stats / tiles) are written only while within
     160px of the viewport (same margin as J.task); when one comes back into view it is repainted ONCE from J.recent (final values, no flashes). */
  const zone = { stage: false, head: false, tiles: false };
  const zoneEl = [[stage, 'stage'], [$('.bld-stats', root), 'head'], [$('.bld-tiles', root), 'tiles']];
  function catchUp(z) {
    const rec = J.recent; if (!rec.length) return;
    if (z === 'stage') {
      const seen = {};
      for (let i = 0; i < rec.length; i++) { const d = rec[i]; if (seen[d.build]) continue; seen[d.build] = 1; stepBuild(d, false); } // every build card shows its latest answer
      stepCore(rec[0], false); stepPrims(rec[0], false); stepDecs(rec[0], false);
    } else if (z === 'head') updStats();
    else {
      dsList.textContent = ''; rec.slice(0, 7).reverse().forEach((d) => pushStream(d, false));
      updCost(); updMix();
    }
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => {
      for (const e of es) {
        const z = zoneEl.find((x) => x[0] === e.target)[1], v = e.isIntersecting;
        if (zone[z] === v) continue;
        zone[z] = v;
        if (v) catchUp(z); else if (z === 'stage') Q.length = 0; // the timeline of a half-played decision is moot once the hub is gone
      }
    }, { rootMargin: '160px 0px' });
    zoneEl.forEach((x) => x[0] && io.observe(x[0]));
  } else { zone.stage = zone.head = zone.tiles = true; }

  /* ---------- bus ---------- */
  J.bus.on('decision', (d) => {
    if (zone.stage) {
      stepBuild(d, true);
      later(520, () => stepCore(d, true));
      later(1040, () => stepPrims(d, true));
      later(1520, () => stepDecs(d, true));
      later(1980, () => stepRules(d));
    }
    if (zone.tiles) { pushStream(d, true); updCost(); updMix(); pingRun(); }
    if (zone.head) updStats();
  });
  J.bus.on('kill', (k) => { kT = k ? 1 : 0; updRules(); if (reduce) { kk = kT; recolor(); draw(performance.now() / 1000, 0.016, true); } });
  J.bus.on('floor', () => { updRules(); [...bCard, ...pCard, ...dCard].forEach((c) => c.c.classList.toggle('lo', parseFloat(c.c.textContent) < S.floor && !isNaN(parseFloat(c.c.textContent)))); });
