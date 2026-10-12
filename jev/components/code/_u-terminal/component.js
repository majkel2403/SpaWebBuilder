  /* =====================================================================
   * 3. zsh : real decisions from the bus, ~900 ms behind so each lands as the hero's code-act card fires
   * ===================================================================== */
  const zel = $('.code-pane[data-k="zsh"]', win), zout = $('.code-out', zel), zbody = $('.code-term', zel), zmmW = $('.code-mm', zel), zmmC = $('canvas', zmmW), zmmV = $('i', zmmW);
  const Z = { q: [], hist: [], n: 0, ndec: 0, off: 0, lh: 19, rows: 14, caret: doc.createElement('i'), gm: null, hold: false, lastPrint: -9, mLn: $('.code-ln-n', zel), mTs: $('.code-ts-n', zel), mLnV: '', mTsV: '', dirty: false, hover: false, pin: false, back: 0, bsy: 0, ly: 0, pill: $('.code-lv', zel), pt: $('.code-lv-t', zel), pn: $('.code-lv-n', zel), ps: '', pc: -1 };
  Z.caret.className = 'code-caret'; Z.caret.setAttribute('aria-hidden', 'true');
  const DELAY = 0.9, STEP = 0.095;
  const pad = (s, n) => s + ' '.repeat(Math.max(1, n - s.length));
  function zFormat(d) {
    const L = [], a = d.action, ms = Math.max(1, Math.round(d.ms)), ms2 = Math.max(1, Math.round(d.ms * 0.62));
    L.push([['tx', 'choice='], ['t-' + a, pad(a, 8)], ['tx', 'conf='], ['t-conf', d.conf.toFixed(2)], ['td', '  ' + ms + ' ms']]);
    L.push([['tx', 'size='], ['tx', d.size + '%'], ['td', ' (score)']]);
    L.push([['tx', 'risk_ok='], [d.riskOk ? 't-ok' : 't-no', String(d.riskOk)], ['td', ' (flag)   ' + ms2 + ' ms']]);
    const r = d.reason;
    if (r === 'hold') L.push([['td', '> '], ['t-warn', 'hold -> skip, nothing to send']]);
    else if (r === 'kill switch') L.push([['td', '> '], ['t-warn', 'kill switch -> human review']]);
    else if (r === 'risk flag') L.push([['td', '> '], ['t-warn', 'risk_ok=false -> human review']]);
    else if (d.dest === 'review') L.push([['td', '> '], ['t-warn', 'below ' + d.floor.toFixed(2) + ' -> human review']]);
    const sv = [['tx', 'Saved handoff: '], ['td', 'queue/'], ['t-dest code-chip-' + d.dest, d.dest], ['td', '/'], ['tx', d.id + '.json']]; sv.fx = d.dest;
    L.push(sv); L.dec = true; // L.dec: this block is one decision (counted by the '+N new' pill)
    if (++Z.ndec % 20 === 0) {
      L.push([['t-ps', '$ '], ['t-cmd', 'ls queue/']]);
      L.push([['t-dest code-chip-execute', 'execute/'], ['tx', ' '], ['t-dest code-chip-review', 'review/'], ['tx', ' '], ['t-dest code-chip-skip', 'skip/']]);
    }
    return L;
  }
  function zPush(lines, at, seed) { lines.forEach((toks, i) => Z.q.push({ at: at + i * STEP, toks, seed: !!seed, dec: !!lines.dec && i === 0 })); if (Z.q.length > 44) Z.q.splice(0, Z.q.length - 44); }
  function zPrint(e, instant) {
    const el = doc.createElement('div');
    el.className = 'code-tl' + (instant || e.seed || reduce ? ' seed' : '');
    for (const [c, t] of e.toks) { const s = doc.createElement('span'); s.className = 'code-' + c; s.textContent = t; el.appendChild(s); }
    zout.appendChild(el); el.appendChild(Z.caret);
    while (zout.childNodes.length > 40) zout.removeChild(zout.firstChild);
    Z.hist.push(e.toks); if (Z.hist.length > 60) Z.hist.shift();
    Z.n++; Z.dirty = true; Z.lastPrint = J.time; if (e.dec && !instant && !e.seed) Zp.okAt = J.time + 0.35;
    if (e.toks.fx && !instant && !e.seed && !reduce) land(e.toks.fx);
    if (!instant && !e.seed && !reduce) Z.off = Math.min(Z.off + Z.lh, Z.lh * 3);
  }
  const ZC = { 't-buy': '#2ee6a6', 't-sell': '#ff4d5e', 't-hold': '#b6aec2', 't-close': '#ff8a3d', 't-flatten': '#a66bff', 't-conf': '#ffc13d', 't-ok': '#2ee6a6', 't-no': '#ff4d5e', 't-dest': '#ff7ab3', 't-warn': '#ff7ab3', 't-ps': '#ff2e6e', 't-cmd': '#f4eef6', 'tx': '#cfc6d8', 'td': '#6f6680', 'tm': '#8d8499', 't-kill': '#ff4d5e', 't-arm': '#2ee6a6', 't-dest code-chip-execute': '#2ee6a6', 't-dest code-chip-review': '#ffc13d', 't-dest code-chip-skip': '#b6aec2' };
  function zVp() { // viewport window mirrors the real (smoothed) scroll position of the log
    const nd = zout.childNodes.length, first = Math.max(0, Math.max(0, nd - Z.rows) - Z.bsy / Z.lh);
    zmmV.style.transform = 'translate3d(0,' + (4 + first * 4).toFixed(2) + 'px,0)'; zmmV.style.height = (Math.min(nd, Z.rows) * 4 + 2) + 'px';
  }
  function zMm() {
    const m = Z.gm; if (!m) return;
    const g = m.g; g.clearRect(0, 0, m.W, m.H);
    const n = Math.min(Z.hist.length, zout.childNodes.length), o = Z.hist.length - n;
    for (let i = 0; i < n; i++) {
      let x = 3;
      for (const [c, t] of Z.hist[o + i]) { const w = t.length * 0.5; if (t.trim()) { g.fillStyle = ZC[c] || '#cfc6d8'; g.fillRect(x, 4 + i * 4, Math.max(0.6, Math.min(w, m.W - x - 1)), 1.8); } x += w; if (x > m.W) break; }
    }
    zVp();
  }
  J.watch(zmmW, () => { Z.gm = J.fit(zmmC); zMm(); });
  J.watch(zbody, () => { const cs = getComputedStyle(win); Z.lh = parseFloat(cs.getPropertyValue('--code-lh')) || 19; Z.rows = parseFloat(cs.getPropertyValue('--code-rows')) || 14; Z.cw = (parseFloat(cs.getPropertyValue('--code-fs')) || 12) * 0.6; });
  // seed: the prompt, then whatever the engine already decided
  zPush([[['t-ps', '$ '], ['t-cmd', 'jev watch queue/ --sim']], [['td', 'floor ' + J.S.floor.toFixed(2) + ' - cap $' + J.fmt(J.RULES.lossCap) + ' - max ' + J.RULES.maxPos + '% - listening']]], 0, true);
  for (const d of J.recent.slice(0, 3).reverse()) zPush(zFormat(d), 0, true);
  { const first = Z.q.splice(0); first.forEach((e) => zPrint(e, true)); Z.off = 0; }
