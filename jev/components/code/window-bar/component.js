/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* used: JEV.mod, $, $$, clamp, task, watch, fit, time, S.killed, bus.on. Data: bus 'decision' (schedules the tab hops, kicks the audio bars), 'kill' (bars turn red).
 * Everything is simulated. */
JEV.mod('code-window-bar', () => {
  const J = JEV, $ = J.$, clamp = J.clamp;
  const root = $('#cx-wb'), eq = root && $('.code-eq', root);
  if (!eq) return;
  const tabs = {};
  for (const el of J.$$('.code-tab', root)) tabs[el.dataset.t] = { el, until: 0, on: false };
  const plan = []; let act = 0, last = -9;
  const tab = (k) => { const o = tabs[k]; if (!o) return; o.until = J.time + 0.75; if (!o.on) { o.on = true; o.el.classList.add('hot'); } };
  /* audio-bars glyph: breathes, jumps on every decision */
  const NB = 16, bars = new Float32Array(NB); let g = null, W = 72, H = 20, grad = null;
  J.watch(eq, () => { const f = J.fit(eq); g = f.g; W = f.W; H = f.H; grad = g.createLinearGradient(0, H, 0, 0); grad.addColorStop(0, '#ff2e6e'); grad.addColorStop(0.55, '#ff9cc4'); grad.addColorStop(1, '#ffffff'); });
  J.task(eq, (t, dt) => {
    for (let i = plan.length - 1; i >= 0; i--) if (plan[i].at <= t) { const h = plan.splice(i, 1)[0]; if (t - h.at < 1.5) tab(h.tab); }
    for (const k in tabs) { const o = tabs[k]; if (o.on && t > o.until) { o.on = false; o.el.classList.remove('hot'); } }
    if (!g) return;
    act *= Math.exp(-dt * 3.2);
    const bw = (W - (NB - 1) * 2) / NB;
    g.clearRect(0, 0, W, H); g.fillStyle = J.S.killed ? '#ff8a96' : grad;
    for (let i = 0; i < NB; i++) {
      const n = 0.5 + 0.5 * Math.sin(t * (2.1 + i * 0.41) + i * 1.9), n2 = 0.5 + 0.5 * Math.sin(t * (4.3 + i * 0.27) + i * 0.7);
      const tg = clamp(0.1 + 0.17 * n + act * (0.28 + 0.55 * n2), 0.08, 1);
      bars[i] += (tg - bars[i]) * (tg > bars[i] ? 0.5 : 0.12);
      g.fillRect(Math.round(i * (bw + 2)), H - Math.max(2, Math.round(bars[i] * H)), Math.max(1.5, bw), Math.max(2, Math.round(bars[i] * H)));
    }
  });
  J.bus.on('decision', () => {
    const t = J.time; act = Math.min(1, act + 0.7);
    if (t - last < 2.0) return; last = t;
    plan.push({ at: t, tab: 'desk' }, { at: t + 0.2, tab: 'state' }, { at: t + 0.72, tab: 'q' }, { at: t + 0.9, tab: 'queue' });
    if (plan.length > 24) plan.splice(0, plan.length - 8);
  });
  J.bus.on('kill', () => { act = 1; tab('q'); });
});
