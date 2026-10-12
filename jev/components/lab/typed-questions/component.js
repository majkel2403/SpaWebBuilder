  const nums = [];
  function numTo(el, to, animate) {
    for (let i = nums.length - 1; i >= 0; i--) if (nums[i].el === el) nums.splice(i, 1);
    const from = parseFloat(el.textContent) || 0;
    if (!animate || Math.abs(from - to) < 0.004) { setTxt(el, to.toFixed(2)); return; }
    nums.push({ el, from, to, t0: now(), dur: 650 });
  }
  function tickNums() {
    if (!nums.length) return;
    const n = now();
    for (let i = nums.length - 1; i >= 0; i--) {
      const k = nums[i], p = clamp((n - k.t0) / k.dur, 0, 1);
      setTxt(k.el, lerp(k.from, k.to, ease3(p)).toFixed(2));
      if (p >= 1) nums.splice(i, 1);
    }
  }
  function rQuestions(d, pop) {
    ACTIONS.forEach((a) => {
      const r = pbRows[a], p = d.p[a];
      r.u.style.transform = 'scaleX(' + Math.max(0.015, p).toFixed(3) + ')';
      setTxt(r.em, fmtP(p));
      r.li.classList.toggle('win', a === d.action);
    });
    ring.style.setProperty('--lab-v', d.conf.toFixed(3)); ring.style.setProperty('--rc', ACOL[d.action]);
    numTo(confEl, d.conf, pop);
    pickEl.textContent = d.action; pickEl.parentNode.setAttribute('data-a', d.action);
    SIZES.forEach((s, i) => {
      const c = szCols[i];
      c.u.style.transform = 'scaleY(' + Math.max(0.03, d.sizes[i]).toFixed(3) + ')';
      setTxt(c.em, fmtP(d.sizes[i]));
      c.el.classList.toggle('on', i === d.sizeIdx);
    });
    qb.classList.toggle('na', d.action === 'hold');
    pickS.innerHTML = d.action === 'hold' ? '&rarr; <b>no order</b> &middot; hold' : '&rarr; <b>' + fmtSize(d.size) + '</b> of capital';
    gva.style.strokeDashoffset = (100 * (1 - d.pRisk)).toFixed(1);
    gnd.style.transform = 'rotate(' + ((d.pRisk - 0.5) * 180).toFixed(1) + 'deg)';
    setTxt(yn, d.riskOk ? 'YES' : 'NO'); yn.classList.toggle('no', !d.riskOk);
    setTxt(yp, 'p ' + d.pRisk.toFixed(2));
    riskChecks(d.st, d.killed).forEach((c) => { const r = ckRows[c.id]; r.li.classList.toggle('bad', c.bad); setTxt(r.u, c.val); });
    setTxt(msEl, d.ms.toFixed(1) + ' ms');
  }

