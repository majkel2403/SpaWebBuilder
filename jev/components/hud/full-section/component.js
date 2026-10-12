/* HUD section, complete (hud/full-section): the sticky bar exactly as on the page, plus a placeholder page with five anchored sections.
   Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
   Everything in the bar is driven by core.js through the ids #hud #mDec #mCost #mMed #mFloor #helpBtn #killBtn #killTxt (JEV.boot wires clicks, tooltips, odometers,
   the shortcuts dialog and the scroll hairline). JEV.* used: JEV.S · JEV.setKilled · JEV.setFloor · JEV.help · JEV.shortcut · bus 'decision' 'kill' 'floor'.
   This module only prints the last decision into the placeholder page and hides nav links whose section is missing. */
JEV.mod('hud-full-section', () => {
  const J = JEV;
  for (const a of J.$$('#hud .nav a')) { const id = (a.getAttribute('href') || '').slice(1); if (id && !document.getElementById(id)) a.hidden = true; }
  const last = document.getElementById('hudxLast');
  if (last) J.bus.on('decision', (d) => { last.textContent = d.symbol + ' ' + d.action + ' ' + d.size + '% conf ' + d.conf.toFixed(2) + ' -> ' + d.dest + (d.reason !== 'ok' ? ' (' + d.reason + ')' : ''); });
});
