  /* ---------- head stats + rules readouts ---------- */
  const medEl = $('#bld-s-med'), decEl = $('#bld-s-dec');
  function median(a) { const s = a.slice().sort((x, y) => x - y); return s[(s.length / 2) | 0]; }
  const decO = odo(decEl, fmt(S.count));
  function updStats() { decO.set(fmt(S.count)); setT(medEl, median(S.ms).toFixed(1) + 'ms'); }
