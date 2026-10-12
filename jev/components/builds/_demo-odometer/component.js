  if (!J.odo) J.odo = odo;
  const el = {}; $$('[data-odo]').forEach((e) => (el[e.dataset.odo] = e));
  const median = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[(s.length / 2) | 0] : 0; };
  const f = { count: () => fmt(S.count), cost: () => '$' + S.cost.toFixed(4), med: () => median(S.ms).toFixed(1) + 'ms' };
  const o = {};
  Object.keys(f).forEach((k) => { if (el[k]) { const t = f[k](); o[k] = odo(el[k], t, t.replace(/[1-9]/g, '0')); J.onView(el[k], () => o[k].set(f[k](), { stagger: true, quiet: true }), { threshold: 0.4 }); } });
  let on = false; if (el.count) J.onView(el.count, () => { on = true; }, { threshold: 0.4, once: true });
  J.bus.on('decision', () => { if (on) Object.keys(o).forEach((k) => o[k].set(f[k]())); });
  // manual
  let n = 1200; const man = el.manual ? odo(el.manual, fmt(n)) : null;
  $$('[data-step]').forEach((b) => b.addEventListener('click', () => { n = Math.max(0, n + (+b.dataset.step)); man.set(fmt(n)); }));
