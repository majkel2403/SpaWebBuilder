  function paintBad(d) {
    riskChecks(d.st, d.killed).forEach((c) => {
      const f = FIELDS.find((x) => x.risk === c.id);
      if (!f) return;
      const row = rows[f.k].row, was = row.classList.contains('bad');
      if (was !== c.bad) {
        row.classList.toggle('bad', c.bad);
        if (c.bad && lv) fxa($('output', row), [{ transform: 'scale(1.4)', filter: 'brightness(1.8)' }, { transform: 'scale(1)', filter: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,1.6,.4,1)' });
      }
    });
  }
  /* ---- what changed since the previous decision (baseline = last committed one) ---- */
  const diffEl = $('#lab-diff');
  function rDiff(d) {
    const o = base;
    CH.forEach((c) => {
      const v = c.derived ? d.net : d.st[c.k], w = !o ? v : c.derived ? o.net : o.st[c.k];
      const ch = !!o && Math.abs(v - w) > (c.derived ? 0.05 : (c.f.step || 0.01) * 0.5);
      if (c.el.classList.contains('chg') !== ch) c.el.classList.toggle('chg', ch);
    });
    if (!o) { setTxt(diffEl, 'first decision \u00b7 nothing to compare yet'); return; }
    const bits = [];
    if (o.action !== d.action) bits.push('action ' + o.action + ' \u2192 ' + d.action);
    if (o.size !== d.size && d.action !== 'hold') bits.push('size ' + fmtSize(o.size) + ' \u2192 ' + fmtSize(d.size));
    if (Math.abs(o.conf - d.conf) >= 0.005) bits.push('conf ' + (d.conf > o.conf ? '+' : '\u2212') + Math.abs(d.conf - o.conf).toFixed(2));
    if (o.dest !== d.dest) bits.push('dest ' + o.dest + ' \u2192 ' + d.dest);
    if (o.riskOk !== d.riskOk) bits.push('risk_ok ' + o.riskOk + ' \u2192 ' + d.riskOk);
    setTxt(diffEl, 'vs #' + hex2(o.n || 0) + ' \u00b7 ' + (bits.length ? bits.join(' \u00b7 ') : 'no change'));
    diffEl.classList.toggle('nc', !bits.length);
  }
  const rAll = (d, pop) => { rEncode(d, pop); rQuestions(d, pop); rGate(d); rActs(d, pop); rMini(d); paintBad(d); rDiff(d); };

