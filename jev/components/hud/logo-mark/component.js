/* Logo mark (hud/logo-mark)
   Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
   Markup: .logo b tiles. Data: bus "decision", body.killed.
*/
JEV.mod('hud-logo-mark', () => {
  const J = JEV;
  const tiles = J.$$('.logo b'); if (!tiles.length) return;
  J.bus.on('decision', () => {
    for (const b of tiles) J.animate(b, [{ boxShadow: '0 0 46px rgba(255,46,110,1), inset 0 1px 0 rgba(255,255,255,.6)', transform: 'scale(1.06)' }, { offset: 1 }], { duration: 520, easing: 'ease-out' });
  });
});
