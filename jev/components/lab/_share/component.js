  /* ------------------------------------------------------------------ shareable state : location.hash ------------------------------------------------------------------ */
  let touched = false;
  function touch() { touched = true; }
  const HK = FIELDS.map((f) => f.chip);
  function hashStr() {
    const q = [];
    const src = tween ? tween.to : V;
    FIELDS.forEach((f) => { if (Math.abs(src[f.k] - f.v) > f.step / 2) q.push(f.chip + '=' + +src[f.k].toFixed(3)); });
    const fv = J.S.floor != null ? J.S.floor : J.RULES.floor;
    if (Math.abs(fv - J.RULES.floor) > 0.004) q.push('floor=' + fv.toFixed(2));
    return '#lab' + (q.length ? '?' + q.join('&') : '');
  }
  function schedHash() {
    if (!touched) return;
    clearTimeout(hashT);
    hashT = setTimeout(() => { try { const h = hashStr(); if (location.hash !== h) history.replaceState(null, '', h); } catch (e) { /* sandboxed */ } }, 450);
  }
  function readHash() {
    let h = ''; try { h = location.hash; } catch (e) { return false; }
    if (h.indexOf('#lab?') !== 0) return false;
    let any = false;
    h.slice(5).split('&').forEach((kv) => {
      const i = kv.indexOf('='), k = kv.slice(0, i), v = parseFloat(kv.slice(i + 1));
      if (!isFinite(v)) return;
      const fi = HK.indexOf(k);
      if (fi >= 0) { const f = FIELDS[fi]; setVal(f, snap(f, clamp(v, f.min, f.max))); any = true; }
      else if (k === 'floor') { J.setFloor(clamp(Math.round(v * 100) / 100, FLOOR.min, FLOOR.max)); any = true; }
    });
    return any;
  }

