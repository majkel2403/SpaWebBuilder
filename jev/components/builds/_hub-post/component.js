  /* wordmark tilt (cached values, writes only when it moved) */
  const wmw = $('#bld-wmw') || wm;
  let tx = 0, ty = 0, cx0 = 0, cy0 = 0;
  function tiltTo(rx, ry) {
    tx += (rx - tx) * 0.1; ty += (ry - ty) * 0.1;
    if (Math.abs(tx - cx0) + Math.abs(ty - cy0) < 0.04) return;
    cx0 = tx; cy0 = ty; wmw.style.setProperty('--rx', tx.toFixed(2) + 'deg'); wmw.style.setProperty('--ry', ty.toFixed(2) + 'deg');
    coreBox.style.setProperty('--cpx', (50 + ty / 13 * 40).toFixed(1) + '%'); coreBox.style.setProperty('--cpy', (40 - tx / 9 * 40).toFixed(1) + '%'); // caustic light follows the pointer
  }

  /* ---------- timeline of one decision through the hub ---------- */
  const Q = [];
  const later = (ms, f) => { if (reduce) { f(); return; } if (J.hidden()) return; if (Q.length > 60) Q.shift().f(); Q.push({ at: performance.now() + ms, f }); };
  function runQ() { if (!Q.length) return; if (J.hidden()) { Q.length = 0; return; } const now = performance.now(); for (let i = 0; i < Q.length;) { if (Q[i].at <= now) { const q = Q.splice(i, 1)[0]; q.f(); } else i++; } }

  const DEC_FROM = [[0, 2], [1], [0], [0, 2], [2]]; // which primitives feed enter / size / route / exit / flatten
  function activeDecs(d) {
    const a = d.action;
    if (a === 'hold') return [0];
    if (a === 'buy' || a === 'sell') return [0, 1, 2];
    if (a === 'close') return [3, 2];
    return [4, 2]; // flatten
  }
  /* Each step writes the card text/bars first (`fx` false = text only: used by the catch-up when a zone scrolls back into view), then the flash + stream boost. */
  function stepBuild(d, fx) {
    const i = bIdx[d.build]; if (i == null) return;
    const c = bCard[i];
    setT(c.v, ans(d.build, d)); setConf(c, d.conf);
    if (c.lastId !== d.id) { c.lastId = d.id; c.ld = d; pushSpark(c, d.conf); }
    if (tipI === i) tipFill(i, fx);
    if (!fx) return;
    flashCard(c);
    const r = latRows[i].li; r.classList.add('hit'); setTimeout(() => r.classList.remove('hit'), 900);
    boostR(R_BUILD + i, 1, 34); pulse(R_BUILD + i, 1, 0.52);
  }
  const FL_CORE = [{ offset: 0, filter: 'brightness(1.5) saturate(1.25)' }], FL_WM = [{ offset: 0, textShadow: '0 0 14px #fff, 0 0 46px #ff5a96, 0 0 90px #ff2e6e' }], FL_DOT = [{ offset: 0, opacity: 1, scale: '1.9' }], FL_FADE = [{ opacity: 0.95 }, { opacity: 0 }], CHIP_POP = [{ offset: 0, scale: '1.35', filter: 'brightness(1.8)' }];
  function stepCore(d, fx) {
    setT(lastEl, d.symbol + ' · ' + d.action + ' · ' + d.conf.toFixed(2) + ' → ' + d.dest); lastEl.dataset.d = d.dest;
    const k = clamp((d.conf - 0.5) / 0.5, 0, 1); // halo breathes harder (bigger, brighter) on a confident answer
    coreEl.style.setProperty('--hi', (0.8 + 0.5 * k).toFixed(2)); coreEl.style.setProperty('--hs', (0.88 + 0.2 * k).toFixed(2));
    if (chipEl.dataset.a !== d.action) { chipEl.dataset.a = d.action; chipEl.textContent = d.action; if (fx && !reduce) J.animate(chipEl, CHIP_POP, { duration: 520, easing: 'cubic-bezier(.3,1.6,.5,1)' }); }
    if (!fx) return;
    if (!reduce) {
      J.animate(flashEl, FL_FADE, { duration: 900, easing: 'ease-out' });
      J.animate(coreBox, FL_CORE, { duration: 700, easing: 'ease-out' });
      J.animate(wm, FL_WM, { duration: 800, easing: 'ease-out' });
      dotEls.forEach((e) => J.animate(e, FL_DOT, { duration: 650, easing: 'ease-out' }));
    }
    pulse(R_CORE, 0.9, 0.55); pulse(R_CORE + 1, 0.9, 0.55); pulse(R_CORE + 2, 0.9, 0.55);
    boostR(R_CORE, 1, 40); boostR(R_CORE + 1, d.action === 'hold' ? 0.5 : 1, d.action === 'hold' ? 8 : 34); boostR(R_CORE + 2, 1, 34);
  }
  function stepPrims(d, fx) {
    setT(pCard[0].v, d.action); setConf(pCard[0], d.conf);
    setT(pCard[1].v, d.size + '%'); setConf(pCard[1], maxOf(d.sizes));
    setT(pCard[2].v, d.riskOk ? 'yes' : 'no'); setConf(pCard[2], d.pRisk);
    if (!fx) return;
    pCard.forEach(flashCard);
    const act = activeDecs(d);
    for (const m of act) for (const j of DEC_FROM[m]) { boostR(R_PD + j * 5 + m, 1, 18); pulse(R_PD + j * 5 + m, 0.8, 0.5); }
  }
  function stepDecs(d, fx) {
    const a = d.action, e = dCard[0], z = dCard[1], r = dCard[2], x = dCard[3], f = dCard[4];
    setT(e.v, a === 'hold' ? 'hold' : a === 'buy' || a === 'sell' ? a : 'hold'); setConf(e, d.conf);
    setT(z.v, d.size + '%'); setConf(z, maxOf(d.sizes));
    setT(r.v, d.venue); setT(r.c, d.dest); r.c.dataset.d = d.dest;
    setT(x.v, a === 'close' ? 'close' : 'hold'); setConf(x, d.p.close);
    setT(f.v, a === 'flatten' ? 'yes' : 'no'); setConf(f, d.p.flatten);
    if (!fx) return;
    const act = activeDecs(d);
    for (const m of act) { flashCard(dCard[m]); if (d.dest !== 'skip') { boostR(R_DR + m, 1, 22); pulse(R_DR + m, 0.9, 0.5); } }
  }
  const FL_RULES = [{ offset: 0, filter: 'brightness(1.12)' }];
  const FL_RC_BAD = [{ offset: 0, background: 'rgba(255,193,61,.4)' }], FL_RC_OK = [{ offset: 0, background: 'rgba(46,230,166,.28)' }];
  function stepRules(d) {
    if (reduce) return;
    if (d.dest === 'execute') shock(0.55 + 0.45 * clamp((d.conf - 0.5) / 0.5, 0, 1));
    let key = null;
    if (d.reason === 'kill switch') key = 'kill'; else if (d.reason === 'risk flag') key = 'cap'; else if (d.reason.indexOf('conf') === 0) key = 'floor'; else if (d.size >= 4) key = 'pos';
    if (key && rcEls[key]) J.animate(rcEls[key], d.dest !== 'execute' ? FL_RC_BAD : FL_RC_OK, { duration: 1100, easing: 'ease-out' });
    flv[FI_RULES] = 1; J.animate(rulesEl, FL_RULES, { duration: 900, easing: 'ease-out' });
  }

  /* ---------- build cards: tilt + glare, tooltip card, stream focus (hover / keyboard / pin) ---------- */
  const tip = $('#bld-tip'), tipEls = { n: $('#bld-tip-n'), p: $('#bld-tip-p'), a: $('#bld-tip-a'), c: $('#bld-tip-c'), m: $('#bld-tip-m'), g: $('#bld-tip-g') };
  let hovI = -1, focI = -1, pinI = -1, tipI = -1, tipOn = false;
  const isHot = (i) => i === hovI || i === focI || i === pinI;
  function tipFill(i, pulse) {
    const c = bCard[i], b = B[i], d = c.ld;
    tip.dataset.c = b.col;
    setT(tipEls.n, b.name); setT(tipEls.p, b.prim);
    setT(tipEls.a, c.v.textContent); setT(tipEls.m, (d ? d.ms : b.ms).toFixed(1) + ' ms'); setT(tipEls.g, d ? d.dest : 'n/a');
    tipEls.g.dataset.d = d ? d.dest : '';
    const cs = c.c.textContent;
    if (tipEls.c.textContent !== cs) { setT(tipEls.c, cs); if (pulse && !reduce) J.animate(tipEls.c, TICK, { duration: 600, easing: 'ease-out' }); }
    tipEls.c.classList.toggle('lo', parseFloat(cs) < S.floor);
  }
  function tipPlace(i) {
    const sr = stage.getBoundingClientRect(), r = bCard[i].el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    let x, y;
    if (!mq.matches) { x = i < 5 ? r.right - sr.left + 14 : r.left - sr.left - w - 14; y = r.top - sr.top + r.height / 2 - h / 2; }
    else { x = r.left - sr.left + r.width / 2 - w / 2; y = r.top - sr.top - h - 10; if (y < 0) y = r.bottom - sr.top + 10; }
    x = clamp(x, 0, Math.max(0, sr.width - w)); y = clamp(y, 0, Math.max(0, sr.height - h));
    tip.style.transform = 'translate(' + x.toFixed(0) + 'px,' + y.toFixed(0) + 'px)';
  }
  function applyFocus() {
    const act = hovI >= 0 ? hovI : focI >= 0 ? focI : pinI;
    for (let i = 0; i < B.length; i++) {
      const hot = isHot(i), c = bCard[i];
      hovT[R_BUILD + i] = hot ? 1 : 0;
      c.el.classList.toggle('bld-hot', hot); c.el.classList.toggle('bld-pin', i === pinI);
      const pr = i === pinI ? 'true' : 'false'; if (c.el.getAttribute('aria-pressed') !== pr) c.el.setAttribute('aria-pressed', pr);
    }
    dimT = act >= 0 ? 1 : 0; stage.classList.toggle('bld-focus', act >= 0);
    if (act < 0) { tipI = -1; tipOn = false; tip.classList.remove('on'); tip.setAttribute('aria-hidden', 'true'); return; }
    const first = !tipOn || tipI !== act; tipI = act; tipFill(act, false);
    if (!tipOn) { tip.style.transition = 'none'; tipPlace(act); void tip.offsetWidth; tip.style.transition = ''; } else if (first) tipPlace(act);
    tipOn = true; tip.classList.add('on'); tip.setAttribute('aria-hidden', 'false');
  }
  function togglePin(i) {
    pinI = pinI === i ? -1 : i;
    if (pinI >= 0 && !reduce) spawn(R_BUILD + i, 26);
    applyFocus();
  }
  function buildInteract() {
    bCard.forEach((c, i) => {
      const el = c.el; let rect = null;
      el.addEventListener('pointerenter', (e) => {
        if (e.pointerType === 'touch') return;
        hovI = i; applyFocus();
        if (!reduce && e.pointerType === 'mouse' && fine.matches) { rect = el.getBoundingClientRect(); el.classList.remove('bld-settle'); el.classList.add('bld-tilt'); }
      });
      el.addEventListener('pointermove', (e) => {
        if (!rect || e.pointerType !== 'mouse') return;
        const px = (e.clientX - rect.left) / rect.width, py = (e.clientY - rect.top) / rect.height, st = el.style;
        st.setProperty('--tx', ((0.5 - py) * 12).toFixed(2) + 'deg'); st.setProperty('--ty', ((px - 0.5) * 16).toFixed(2) + 'deg'); st.setProperty('--ts', '1.025');
        st.setProperty('--gx', (px * 100).toFixed(1) + '%'); st.setProperty('--gy', (py * 100).toFixed(1) + '%'); st.setProperty('--ga', '1');
      });
      el.addEventListener('pointerleave', (e) => {
        if (e.pointerType === 'touch') return;
        if (hovI === i) { hovI = -1; applyFocus(); }
        if (el.classList.contains('bld-tilt')) {
          rect = null; el.classList.add('bld-settle'); const st = el.style;
          st.setProperty('--tx', '0deg'); st.setProperty('--ty', '0deg'); st.setProperty('--ts', '1'); st.setProperty('--ga', '0');
        }
      });
      el.addEventListener('transitionend', (e) => { if (e.target === el && e.propertyName === 'transform' && el.classList.contains('bld-settle')) el.classList.remove('bld-tilt', 'bld-settle'); });
      el.addEventListener('pointerdown', () => { const u = performance.now() + 1500; hovUntil[R_BUILD + i] = u; if (!reduce) spawn(R_BUILD + i, 20); });
      el.addEventListener('click', () => togglePin(i));
      el.addEventListener('focus', () => { if (el.matches(':focus-visible')) { focI = i; applyFocus(); } });
      el.addEventListener('blur', () => { if (focI === i) { focI = -1; applyFocus(); } });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePin(i); }
        else if (e.key === 'Escape' && pinI >= 0) { pinI = -1; applyFocus(); }
      });
    });
    document.addEventListener('pointerdown', (e) => { if (pinI >= 0 && e.pointerType === 'touch' && !(e.target.closest && e.target.closest('.bld-b'))) { pinI = -1; applyFocus(); } });
    J.bus.on('floor', floorLines);
  }

  /* ---------- hover / tap boosts a card's streams ---------- */
  function linkCard(el, slots) {
    const on = () => slots.forEach((s) => (hovT[s] = 1)), off = () => slots.forEach((s) => (hovT[s] = 0));
    el.addEventListener('pointerenter', () => { on(); el.classList.add('bld-hot'); });
    el.addEventListener('pointerleave', () => { off(); el.classList.remove('bld-hot'); });
    el.addEventListener('pointerdown', () => { const u = performance.now() + 1500; slots.forEach((s) => { hovUntil[s] = u; if (!reduce) spawn(s, 20); }); });
  }
  buildInteract();
  pCard.forEach((c, j) => linkCard(c.el, [R_CORE + j, R_PD + j * 5, R_PD + j * 5 + 1, R_PD + j * 5 + 2, R_PD + j * 5 + 3, R_PD + j * 5 + 4]));
  dCard.forEach((c, m) => linkCard(c.el, [R_PD + m, R_PD + 5 + m, R_PD + 10 + m, R_DR + m]));
  linkCard(rulesEl, [R_DR, R_DR + 1, R_DR + 2, R_DR + 3, R_DR + 4]);
  linkCard(coreEl, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

