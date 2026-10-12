  /* ------------------------------------------------------------------ standalone demo (not part of the section) ------------------------------------------------------------------ */
  /* a lone atom has nobody to drive it: cycle the scenarios while the lab is on screen, stop at the first pointer / key interaction */
  {
    const names = ['trend', 'stress', 'mean-revert', 'wide book', 'reversal', 'stale feed'];
    let k = 0, on = true;
    ['pointerdown', 'keydown'].forEach((ev) => root.addEventListener(ev, () => { on = false; }, { capture: true, passive: true }));
    setInterval(() => { if (!on || !lv || running || tween) return; runPreset(names[k++ % names.length], null); touched = false; }, 4600);
  }

