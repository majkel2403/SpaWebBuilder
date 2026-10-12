  /* ------------------------------------------------------------------ interaction ------------------------------------------------------------------ */
  const presetBtns = $$('.lab-sc');
  const setActive = (btn) => presetBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
  function randomState() {
    let s = null;
    try { s = EN.sampleState(() => J.market.price).state; } catch (e) { s = null; }
    const o = {};
    FIELDS.forEach((f) => { let v = s ? s[f.k] : null; if (v == null || isNaN(v)) v = lerp(f.min, f.max, Math.random()); o[f.k] = snap(f, clamp(v, f.min, f.max)); });
    return o;
  }
  function glide(to, dur, stag) {
    touch();
    clearTimeout(ct);
    if (J.reduce) { FIELDS.forEach((f) => setVal(f, to[f.k])); commit('preset'); return; }
    tween = { t0: now(), from: Object.assign({}, V), to, dur: dur || 560, stag: stag == null ? 38 : stag };
  }
  function runPreset(name, btn) {
    setActive(btn);
    const to = {};
    if (name === 'random') Object.assign(to, randomState()); else FIELDS.forEach((f, i) => (to[f.k] = PRESETS[name][i]));
    glide(to);
  }
