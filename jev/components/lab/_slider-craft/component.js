  /* ------------------------------------------------------------------ slider craft : bubble · shift-nudge · reset ------------------------------------------------------------------ */
  function poke(r, ms) {
    r.row.classList.add('drag'); clearTimeout(r.hold);
    r.hold = setTimeout(() => r.row.classList.remove('drag'), ms);
  }
  function wireRow(r, reset) {
    const inp = r.input, f = r.f;
    inp.addEventListener('pointerdown', () => { clearTimeout(r.hold); r.row.classList.add('drag'); });
    const rel = () => poke(r, 520);
    inp.addEventListener('pointerup', rel); inp.addEventListener('pointercancel', rel);
    inp.addEventListener('keydown', (e) => {
      const dir = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
      if (!dir) return;
      if (e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) { // shift = x10
        e.preventDefault();
        const v = clamp(snap(f, +inp.value + dir * f.step * 10), f.min, f.max);
        inp.value = v; inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true }));
      }
      poke(r, 900);
    });
    r.rng.addEventListener('dblclick', (e) => { e.preventDefault(); reset(); poke(r, 700); });
  }
  FIELDS.forEach((f) => wireRow(rows[f.k], () => {
    if (Math.abs(V[f.k] - f.v) < f.step / 2) return;
    setActive(null);
    glide(Object.assign({}, V, { [f.k]: f.v }), 380, 0);
    setStat('reset ' + f.chip + ' · ' + fmtV(f, f.v));
  }));
  wireRow(floorR, () => { touch(); J.setFloor(J.RULES.floor); setStat('reset floor · ' + J.RULES.floor.toFixed(2)); });

