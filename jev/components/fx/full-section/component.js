/* fx / full-section - the complete fx module on a demo page.
 * Reuse: copy this folder (fx.css, fx.js, component.html with the fx markup at the top) + engine.js + core.js + base.css; call JEV.boot().
 * fx.js is an unmodified copy of src/js/fx.js: it provides JEV.toast / JEV.pulse and reacts to JEV.bus 'kill' 'decision' 'tick' 'floor' 'tint' 'tier'.
 * Optional DOM it uses when present: #hud / #killBtn (shock origin), .nav a[href^="#"] (active-section underline + progress ticks), .rv, .h2, .card, .orb.
 * Swap in real data by emitting the bus events (JEV.bus.emit('decision', d), 'tick', 'kill').
 * This file only wires the demo buttons. */
JEV.mod('fx-full-section', () => {
  const J = JEV, doc = document, on = (id, fn) => { const b = doc.getElementById(id); if (b) b.addEventListener('click', fn); };
  on('fxfFire', () => J.fire());
  on('fxfToast', () => J.toast('hello from the fx layer - simulated', 'info'));
  on('fxfKill', () => {
    J.setKilled(!J.S.killed);
    const b = doc.getElementById('fxfKill'), t = doc.getElementById('fxfKillTxt');
    if (b) b.setAttribute('aria-pressed', String(J.S.killed));
    if (t) t.textContent = J.S.killed ? 'HALTED' : 'ARMED';
  });
});
