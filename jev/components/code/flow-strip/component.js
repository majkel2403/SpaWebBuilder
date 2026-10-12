/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* used: JEV.mod, $, $$, task, time, bus.on. Data: bus 'decision' (d.dest names the last node: execute | review | skip).
 * Everything is simulated. */
JEV.mod('code-flow-strip', () => {
  const J = JEV, $ = J.$;
  const root = $('#cx-fs'); if (!root) return;
  const nodes = J.$$('.code-fn', root).map((el) => ({ el, until: 0, on: false, b: el.querySelector('b'), d: el.dataset.d || '' }));
  const plan = [];
  function light(i, d) {
    const o = nodes[i]; if (!o) return;
    if (d) { o.b.textContent = d.dest; if (o.d !== d.dest) { o.d = d.dest; o.el.setAttribute('data-d', d.dest); } }
    o.until = J.time + 0.8; if (!o.on) { o.on = true; o.el.classList.add('on'); }
  }
  J.task(root, (t) => {
    for (let i = plan.length - 1; i >= 0; i--) { const h = plan[i]; if (h.at > t) continue; plan.splice(i, 1); if (t - h.at < 1.5) light(h.i, h.d); }
    for (const o of nodes) if (o.on && t > o.until) { o.on = false; o.el.classList.remove('on'); }
  });
  J.bus.on('decision', (d) => {
    const t = J.time; if (plan.length > 40) plan.splice(0, plan.length - 12);
    plan.push({ at: t, i: 0 }, { at: t + 0.2, i: 1 }, { at: t + 0.5, i: 2 }, { at: t + 0.9, i: 3, d });
  });
});
