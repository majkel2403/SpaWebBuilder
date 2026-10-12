  /* ---------- count-ups (stats) ---------- */
  const statFmt = {
    'hr-s-time': (v) => { const s = Math.round(v); return pad2((s / 60) | 0) + ':' + pad2(s % 60); },
    'hr-s-trades': (v) => fmt(Math.round(v)), 'hr-s-year': (v) => Math.round(v) + '%', 'hr-s-cost': (v) => '$' + v.toFixed(2),
  };
  /** count-up that settles with a one-off glow (bounded timers, started from onView only) */
  const countUp = (b, dur, delay, f) => setTimeout(() => {
    J.countTo(b, +b.dataset.to, { dur, fmt: f });
    if (!reduce) setTimeout(() => b.classList.add('hr-done'), dur + 60);
  }, delay);
  J.onView($('#hr-a-stats'), () => {
    $$('b', $('#hr-a-stats')).forEach((b, i) => countUp(b, 1500, i * 120, statFmt[b.id]));
  }, { threshold: 0.5 });

