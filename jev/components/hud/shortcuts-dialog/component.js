/* Shortcuts dialog (hud/shortcuts-dialog)
   Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
   The dialog DOM is built lazily by core.js (JEV.help()) from the registered shortcuts; base.css styles it. The '?' key and Esc are handled by core.
   Without the full HUD (no #hud element) core does not bind trigger buttons, so this module binds its own button (#kbTrigger).
   JEV.* used: JEV.help([on]) toggle/close · JEV.shortcut(key, fn, label) register a single-key shortcut (label => listed in the dialog; returns unregister fn)
               · JEV.fire() · bus 'decision'. Built-in rows: ? help, 1-5 sections, k kill, f fire, t top, esc close. */
JEV.mod('shortcuts-dialog', () => {
  const J = JEV, btn = document.getElementById('kbTrigger');
  if (btn) btn.addEventListener('click', () => J.help());
  const cnt = document.getElementById('sdCount'), ping = document.getElementById('sdPingV'), chip = document.getElementById('sdPing');
  let n = 0;
  J.bus.on('decision', () => { n++; if (cnt) cnt.textContent = n; });
  J.shortcut('p', () => { if (ping) ping.textContent = new Date().toLocaleTimeString('en-GB'); if (chip) J.animate(chip, [{ borderColor: '#ff2e6e', boxShadow: '0 0 18px rgba(255,46,110,.6)' }, { offset: 1 }], { duration: 600, easing: 'ease-out' }); }, 'custom shortcut (demo)');
});
