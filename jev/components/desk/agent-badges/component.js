/* desk/agent-badges — badge kit for the six agents; the badges of the agent that just acted flash (everything here is SIMULATED)
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot()
 * JEV.* used: JEV.mod $ C S AGENTS pick task animate reduce; JEV.bus 'agentstep' ({agent}), 'decision'
 * Safe without the rest of the page: every DOM lookup is guarded. */
JEV.mod('desk-agent-badges', () => {
  const J = JEV, $ = J.$, C = J.C;
  const card = $('#dkab'), dots = $('#dkab-dots'), tags = $('#dkab-tags'), chips = $('#dkab-chips'), pills = $('#dkab-pills'); if (!card) return;
  const rgbOf = (h) => { const n = parseInt(h.slice(1), 16); return (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255); };
  const by = {};
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const paint = (e, a) => { e.style.setProperty('--a', a.col); e.style.setProperty('--ar', rgbOf(a.col)); return e; };
  J.AGENTS.forEach((a) => {
    const list = (by[a.key] = []);
    if (dots) { const d = paint(el('i', 'dkb-d'), a); d.title = a.name.toLowerCase(); dots.appendChild(d); list.push(d); }
    if (tags) { const t = paint(el('b', 'dkb-ag', a.name), a); tags.appendChild(t); list.push(t); }
    if (chips) { const c = paint(el('span', 'dkb-ch'), a); c.append(el('i'), el('b', '', a.name)); chips.appendChild(c); list.push(c); }
    if (pills) { const p = paint(el('span', 'dkab-pill'), a); p.append(el('i', 'dkb-d'), el('b', '', a.name), el('span', '', a.role)); pills.appendChild(p); list.push(p); }
  });
  const flash = (key) => (by[key] || []).forEach((e) => { if (J.reduce) return; e.classList.remove('dkb-flash'); void e.offsetWidth; e.classList.add('dkb-flash'); });
  J.bus.on('agentstep', (s) => { if (s && s.agent) flash(String(s.agent).toLowerCase()); });
  // no 'agentstep' source on this page: a light timer plays one agent after another
  let lastReal = -1e9, nextSyn = 0;
  J.bus.on('agentstep', () => { lastReal = performance.now(); });
  J.task(card, (t) => { const now = t * 1000; if (performance.now() - lastReal > 2600 && now >= nextSyn) { flash(J.pick(J.AGENTS).key); nextSyn = now + 700 + Math.random() * 600; } });
});
