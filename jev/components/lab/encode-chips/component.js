  /* ------------------------------------------------------------------ stage 1 : encode chips ------------------------------------------------------------------ */
  const CH = FIELDS.map((f) => ({ k: f.k, n: f.chip, cc: f.cc, f, bi: !!f.bi })).concat([{ k: 'net', n: 'net_edge', cc: 'pink', bi: true, derived: true, f: { dec: 1, sign: 1, min: -40, max: 40 } }]);
  const ftsEl = $('#lab-fts');
  CH.forEach((c, i) => {
    const el = document.createElement('div');
    el.className = 'lab-ft' + (c.bi ? ' bi' : '') + (c.derived ? ' drv' : '');
    el.setAttribute('data-c', c.cc); el.style.setProperty('--d', (i * 0.03).toFixed(2) + 's');
    el.innerHTML = '<span>' + c.n + '</span><b>0</b><i class="lab-cb"><u></u></i>';
    ftsEl.appendChild(el);
    c.el = el; c.val = $('b', el); c.u = $('u', el);
  });
  const norm = (c, v) => {
    const f = c.f;
    if (c.bi) return clamp(v / Math.max(Math.abs(f.min), Math.abs(f.max)), -1, 1);
    return clamp((v - f.min) / (f.max - f.min), 0, 1);
  };
  function rEncode(d, pop) {
    const bad = {};
    riskChecks(d.st, d.killed).forEach((c) => (bad[c.id] = c.bad));
    CH.forEach((c, i) => {
      const v = c.derived ? d.net : d.st[c.k];
      setTxt(c.val, c.derived ? J.sgn(v, 1) : fmtV(c.f, v));
      c.u.style.setProperty('--v', norm(c, v).toFixed(3));
      c.el.classList.toggle('neg', c.bi && v < 0);
      c.el.classList.toggle('bad', !!(c.f.risk && bad[c.f.risk]));
      if (pop) anim(c.el, [{ opacity: 0, transform: 'translateY(9px) scale(.78)' }, { opacity: 1, transform: 'none' }], { duration: 300, delay: i * 26, easing: 'cubic-bezier(.2,1.5,.3,1)', fill: 'backwards' });
    });
  }

