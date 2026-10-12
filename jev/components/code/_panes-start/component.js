  /* ---- start / restart when a pane scrolls into view ---- */
  if ('IntersectionObserver' in window) {
    const byEl = new Map([D, S, Q].map((P) => [P.el, P]));
    const io = new IntersectionObserver((es) => {
      for (const e of es) {
        const P = byEl.get(e.target);
        if (e.intersectionRatio >= 0.3 && P.out) {
          P.out = false;
          if (P === S && latest) setModel(S, stateModel(latest));
          start(P, { delay: P.delay });
          if (P === S) lastRetype = J.time;
        } else if (e.intersectionRatio === 0) P.out = true;
      }
    }, { threshold: [0, 0.3] });
    for (const P of [D, S, Q]) io.observe(P.el);
  } else for (const P of [D, S, Q]) fillAll(P);
  if (reduce) for (const P of [D, S, Q]) fillAll(P);

