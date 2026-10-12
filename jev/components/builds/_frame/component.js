  /* ---------- entrance + frame task + layout watch ---------- */
  J.onView(stage, () => { live = true; measure(); }, { threshold: 0, rootMargin: '700px 0px' });
  J.onView(stage, () => { stage.classList.remove('bld-pre'); [250, 1500].forEach((ms) => setTimeout(measure, ms)); }, { threshold: 0.05 });
  setTimeout(() => stage.classList.remove('bld-pre'), 9000); // failsafe: never leave the hub hidden
  let cost = 0, nf = 0;
  J.task(stage, (t, dt) => {
    const a = performance.now(); runQ(); draw(t, dt, false); cost += performance.now() - a;
    if (++nf === 90) { if (cost / nf > 6.5 && QF > 0.5) { QF *= 0.75; lastSig = ''; measure(); } cost = 0; nf = 0; } // adaptive: slow device -> fewer particles
  });
  requestAnimationFrame(() => J.watch(stage, measureSoon));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureSoon);
  window.addEventListener('load', measureSoon, { once: true });
  if (mq.addEventListener) mq.addEventListener('change', measureSoon);
