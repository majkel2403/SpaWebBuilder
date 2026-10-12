/* hero / question-nodes — three typed questions as glowing nodes. Each decision pulses them in sequence (choice -> score -> flag) and writes the answer next to each.
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot()
 * Data: JEV.bus 'decision' (d.action, d.size, d.riskOk, d.dest) and 'kill'. */
JEV.mod('hero-question-nodes', () => {
  'use strict';
  const J = JEV, rows = J.$$('.hqn-q');
  if (rows.length !== 3) return;
  const V = rows.map((r) => J.$('.hqn-v', r));
  function paint(d) {
    V[0].textContent = d.action; V[1].textContent = d.action === 'hold' ? '—' : (d.size < 1 ? '0.5' : d.size) + '%'; V[2].textContent = d.riskOk ? 'go' : 'no-go';
    rows.forEach((r) => r.setAttribute('data-state', d.dest));
  }
  function pulse(d) {
    paint(d);
    rows.forEach((r, i) => { clearTimeout(r._t); r.classList.remove('is-hit'); r._t = setTimeout(() => { void r.offsetWidth; r.classList.add('is-hit'); r._t = setTimeout(() => r.classList.remove('is-hit'), 1000); }, 90 + i * 170); });
  }
  const d0 = J.recent[0] || J.makeDecision(); if (d0) paint(d0);
  J.bus.on('decision', pulse);
  const b = J.$('#hqnFire'); if (b) b.addEventListener('click', () => J.fire());
});
