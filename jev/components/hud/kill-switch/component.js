/* Kill switch (hud/kill-switch)
   Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
   JEV.boot() binds the click on #killBtn (toggles JEV.setKilled), keeps #killTxt / aria-pressed in sync (JEV.hud) and base.css paints
   body.killed (red vignette, red button). The 'k' key is a core shortcut. Keep the ids #killBtn and #killTxt.
   JEV.* used: JEV.S.killed · JEV.S.dest · JEV.setKilled(bool) · bus 'kill' (bool) · bus 'decision' (d.dest, d.action, d.symbol, d.conf, d.reason).
   To wire real orders: on bus 'kill' true stop sending orders yourself; the decision records already carry dest 'review' while killed. */
JEV.mod('kill-switch', () => {
  const J = JEV, $ = (id) => document.getElementById(id);
  const st = $('ksState'), ex = $('ksExec'), rv = $('ksRev'), sk = $('ksSkip'), log = $('ksLog');
  const paint = () => {
    if (st) st.textContent = J.S.killed ? 'halted' : 'armed';
    if (ex) ex.textContent = J.fmt(J.S.dest.execute);
    if (rv) rv.textContent = J.fmt(J.S.dest.review);
    if (sk) sk.textContent = J.fmt(J.S.dest.skip);
  };
  J.bus.on('kill', paint);
  J.bus.on('decision', (d) => {
    paint();
    if (!log) return;
    const row = document.createElement('div'), e = document.createElement('em'), t = document.createElement('span');
    e.className = 'ks-' + d.dest; e.textContent = d.dest;
    t.textContent = d.symbol + ' ' + d.action + ' ' + d.size + '%  conf ' + d.conf.toFixed(2) + (d.reason !== 'ok' ? '  ' + d.reason : '');
    row.append(e, t); log.prepend(row);
    while (log.children.length > 6) log.lastChild.remove();
  });
  paint();
});
