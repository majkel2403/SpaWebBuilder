  /* ------------------------------------------------------------------ init ------------------------------------------------------------------ */
  stg.forEach((s) => { const sc = document.createElement('i'); sc.className = 'lab-scan'; sc.setAttribute('aria-hidden', 'true'); s.appendChild(sc); });
  paintFloor(J.S.floor != null ? J.S.floor : J.RULES.floor);
  paintKill(!!J.S.killed);
  restored = readHash();
  // earlier lab decisions, so the tape and the queue are alive before the first touch
  ['trend', 'wide book', 'mean-revert'].forEach((name) => {
    const st = {}; FIELDS.forEach((f, i) => (st[f.k] = PRESETS[name][i]));
    const d = decideState(st);
    d.n = ++seq; d.file = hex2(d.n) + rhex(6) + '.json';
    files[d.dest].unshift(d.file); fcount[d.dest]++; pushTape(d); lastC = d;
  });
  ['execute', 'review', 'skip'].forEach((k) => renderFolder(k, false));
  renderTape(false);
  cur = decideState(stateNow());
  rAll(cur, false);
  setStat(restored ? 'shared scenario loaded' : 'ready');
  if (restored) setTimeout(() => {
    const y = root.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hud-h')) || 64) + 8;
    scrollTo({ top: Math.max(0, y), behavior: J.reduce ? 'auto' : 'smooth' });
    if (J.toast) J.toast('shared scenario loaded \u00b7 simulated', 'info');
  }, 900);
  // keep sliders' danger flags + readouts correct if the floor/kill state was changed before init
  new IntersectionObserver((es) => { lv = es[0].isIntersecting; }, { rootMargin: '80px 0px' }).observe(root);
  new IntersectionObserver((es) => {
    pv = es[0].isIntersecting;
    if (!pv) return;
    if (!committed) commit('view');
    else if (pending) { pending = false; commit('replay'); }
  }, { threshold: 0.1 }).observe(pipe);
  J.task(ctl, tweenStep);
  J.task(pipe, (t, dt) => { fx.frame(t, dt); tickNums(); });
  J.watch(pipe, () => fx.resize());
  // desktop: the controls column is sticky; if it is taller than the viewport, pin it by its bottom edge so STATE + hard rules + tape stay reachable
  const left = $('.lab-left');
  if (left) { const stick = () => { const h = left.offsetHeight; left.style.top = (h ? Math.min(76, innerHeight - h - 16) : 76) + 'px'; }; J.watch(left, stick); addEventListener('resize', stick, { passive: true }); }
});
