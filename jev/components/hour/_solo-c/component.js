  /* standalone tail: countUp lives in hour/_a-end in the section; this is the same helper */
  const countUp = (b, dur, delay, f) => setTimeout(() => {
    J.countTo(b, +b.dataset.to, { dur, fmt: f });
    if (!reduce) setTimeout(() => b.classList.add('hr-done'), dur + 60);
  }, delay);
  J.bus.on('tier', () => { if (bt) layoutC(); });
});
