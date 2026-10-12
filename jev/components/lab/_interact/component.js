  function tweenStep() {
    if (!tween) return;
    const n = now() - tween.t0; let done = true;
    FIELDS.forEach((f, i) => {
      const p = clamp((n - i * tween.stag) / tween.dur, 0, 1);
      if (p < 1) done = false;
      setVal(f, p >= 1 ? tween.to[f.k] : snap(f, lerp(tween.from[f.k], tween.to[f.k], eio(p))));
    });
    if (done) { tween = null; commit('preset'); } else live();
  }
  function onChange() {
    touch(); setActive(null);
    if (auto) { live(); scheduleCommit(560, 'input'); } else { cancelRun(); setDirty(true); }
  }
  FIELDS.forEach((f) => {
    const r = rows[f.k];
    r.input.addEventListener('input', () => { tween = null; V[f.k] = +r.input.value; if (r.lq !== V[f.k]) { r.lq = V[f.k]; spark(r); } paintRow(r, V[f.k]); onChange(); });
    r.input.addEventListener('change', () => { if (auto) scheduleCommit(90, 'input'); });
  });
  floorR.input.addEventListener('input', () => { touch(); spark(floorR); J.setFloor(+floorR.input.value); });
  presetBtns.forEach((b) => b.addEventListener('click', () => runPreset(b.getAttribute('data-p'), b)));
