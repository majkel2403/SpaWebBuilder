JEV.mod('fx-ambient-backdrop', () => {
  const J = JEV;
  const kb = J.$('#fxdKill');
  if (kb) kb.addEventListener('click', () => { if (J.setKilled) J.setKilled(!J.S.killed); });
  J.bus.on('kill', (on) => { if (kb) kb.setAttribute('aria-pressed', String(!!on)); });
});
