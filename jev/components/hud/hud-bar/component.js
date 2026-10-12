/* HUD bar (hud/hud-bar)
   Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
   The bar itself is driven by the shared runtime: JEV.boot() wires #killBtn, the odometers (#mDec #mCost), #mMed, #mFloor, the tooltips (.m[data-tip]),
   the scroll hairline and the #helpBtn shortcuts dialog as soon as an element with id="hud" exists. Keep the ids in component.html.
   JEV.* used: JEV.S {count,cost,ms[],floor,killed} · JEV.setKilled(bool) · JEV.setFloor(v) · JEV.help() · bus 'decision' 'kill' 'floor' · JEV.hud() (re-render).
   This module only adds demo glue: it prints the last decision in the placeholder page and hides nav links whose section does not exist on your page. */
JEV.mod('hud-bar', () => {
  const J = JEV;
  for (const a of J.$$('#hud .nav a')) { const id = (a.getAttribute('href') || '').slice(1); if (id && !document.getElementById(id)) a.hidden = true; }
  const last = document.getElementById('hudxLast');
  if (last) J.bus.on('decision', (d) => { last.textContent = d.symbol + ' ' + d.action + ' ' + d.size + '% conf ' + d.conf.toFixed(2) + ' -> ' + d.dest + (d.reason !== 'ok' ? ' (' + d.reason + ')' : ''); });
});
