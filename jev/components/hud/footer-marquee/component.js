/* Footer marquee (hud/footer-marquee)
   Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
   Data: JEV.S.floor / killed, JEV.recent. Hooks: .foot-fl, .foot-kill, .hx-tape (live tape children).
*/
JEV.mod('hud-footer-marquee', () => {
  const J = JEV;
  const fl = () => J.$$('.foot-fl').forEach((e) => { e.textContent = 'floor ' + J.S.floor.toFixed(2); });
  const ki = () => J.$$('.foot-kill').forEach((e) => { e.textContent = J.S.killed ? 'kill switch HALTED' : 'kill switch armed'; e.classList.toggle('hx-bad', J.S.killed); });
  J.bus.on('floor', fl); J.bus.on('kill', ki); fl(); ki();
  const tapes = J.$$('.hx-tape'); if (!tapes.length) return;
  const build = () => {
    const rec = (J.recent || []).slice(0, 8); if (!rec.length) return;
    const frag = rec.map((d) => '<span><b>' + d.symbol + '</b> ' + d.action + ' → ' + d.dest + ' · conf ' + d.conf.toFixed(2) + '</span>').join('');
    for (const t of tapes) t.innerHTML = frag;
  };
  let n = 0; J.bus.on('decision', () => { if (n++ % 2 === 0 || n < 4) build(); });
  build();
});
