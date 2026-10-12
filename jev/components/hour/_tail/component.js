  /* ---------- bus: kill switch + decisions ---------- */
  J.bus.on('kill', (v) => showKill(v));
  J.bus.on('floor', armText);
  J.bus.on('tier', () => { buildStaticA(); if (bt) layoutC(); });
  showKill(S.killed);
  if (reduce) { mode = 'static'; renderB(true, 0); updArm(); }
  else { mode = 'static'; }
});
