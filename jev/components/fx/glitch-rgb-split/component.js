/* fx / glitch-rgb-split - Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot()
 * Provides JEV.glitch(el): adds .fx-glitch to the .fx-gl container for 380 ms. Reacts to bus 'kill' (glitch when halted).
 * Data: none - call it from any alarm. */
JEV.mod('fx-glitch-rgb-split', () => {
  const J = JEV, box = J.$('#fxdGl');
  const timers = new WeakMap();
  function glitch(el) {
    el = el || box;
    if (!el || J.reduce) return;
    clearTimeout(timers.get(el)); el.classList.remove('fx-glitch');
    requestAnimationFrame(() => { el.classList.add('fx-glitch'); timers.set(el, setTimeout(() => el.classList.remove('fx-glitch'), 380)); });
  }
  J.glitch = glitch;
  const gb = J.$('#fxdGo'), kb = J.$('#fxdKill');
  if (gb) gb.addEventListener('click', () => glitch());
  if (kb) kb.addEventListener('click', () => { if (J.setKilled) J.setKilled(!J.S.killed); });
  J.bus.on('kill', (on) => { if (kb) kb.setAttribute('aria-pressed', String(!!on)); if (on) glitch(); });
});
