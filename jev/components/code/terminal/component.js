/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* APIs relied on (all from core.js): JEV.mod, $, $$, clamp, reduce, tier, time, task, watch, fit, animate, hidden, bus.on, S, recent, fire
 * Data: bus 'decision' (d.action d.conf d.size d.sizes d.riskOk d.pRisk d.dest d.reason d.ms d.id d.symbol d.floor d.killed d.state{...}), 'kill'(bool), 'floor'(number).
 * Optional: JEV.toast (fx module) is used for the copy toast when present. Everything is simulated. */
JEV.mod('code-terminal', () => {
  const J = JEV, $ = J.$, clamp = J.clamp, reduce = J.reduce, T = () => J.tier || 2;
  const win = $('#code-one'); if (!win) return;
  const doc = document;

  const zel = $('.code-pane[data-k="zsh"]', win), zout = $('.code-out', zel), zbody = $('.code-term', zel), zmmW = $('.code-mm', zel), zmmC = $('canvas', zmmW), zmmV = $('i', zmmW);
  const Z = { q: [], hist: [], n: 0, ndec: 0, off: 0, lh: 19, rows: 14, caret: doc.createElement('i'), gm: null, hold: false, lastPrint: -9, mLn: $('.code-ln-n', zel), mTs: $('.code-ts-n', zel), mLnV: '', mTsV: '', dirty: false, hover: false, pin: false, back: 0, bsy: 0, ly: 0, pill: $('.code-lv', zel), pt: $('.code-lv-t', zel), pn: $('.code-lv-n', zel), ps: '', pc: -1 };
  Z.caret.className = 'code-caret'; Z.caret.setAttribute('aria-hidden', 'true');
  const DELAY = 0.9, STEP = 0.095;
  const Zp = { led: J.$$('.code-led i', zel), ledv: [0, 0, 0], okAt: 0, txAt: 0, rip: $('.code-rip', zel) };

  /* terminal matrix rain: heads only are drawn (pre-rendered glyph atlas), a 20 Hz destination-out fade makes the trails; tier >= 2 */
  const rc = $('.code-rain', zel), RCW = 9, RCH = 13, RG = '0123456789abcdef$%+-<>/=#{}', atl = doc.createElement('canvas');
  atl.width = RCW * RG.length; atl.height = RCH;
  { const g = atl.getContext('2d'); g.font = '700 11px ui-monospace, Menlo, Consolas, monospace'; g.textBaseline = 'middle'; g.fillStyle = '#ff8fbd'; for (let i = 0; i < RG.length; i++) g.fillText(RG[i], i * RCW + 1, RCH / 2 + 0.5); }
  let rg = null, rW = 0, rH = 0, ry = new Float32Array(0), rs = new Float32Array(0), rOn = false, rFade = 0, rBoost = 0;
  if (rc && !reduce) J.watch(rc, () => {
    const f = J.fit(rc, 1); rg = f.g; rW = f.W; rH = f.H; const n = Math.max(1, Math.floor(rW / RCW));
    ry = new Float32Array(n); rs = new Float32Array(n);
    for (let i = 0; i < n; i++) { ry[i] = -Math.random() * (rH / RCH); rs[i] = 5 + Math.random() * 9; }
  });
  function rainStep(dt) {
    if (!rg) return;
    if (T() < 2) { if (rOn) { rOn = false; rg.clearRect(0, 0, rW, rH); } return; }
    rOn = true; rBoost *= Math.exp(-dt * 2.2);
    rFade += dt;
    if (rFade >= 0.05) { rg.globalCompositeOperation = 'destination-out'; rg.fillStyle = 'rgba(0,0,0,' + (1 - Math.exp(-rFade * 1.5)).toFixed(3) + ')'; rg.fillRect(0, 0, rW, rH); rg.globalCompositeOperation = 'source-over'; rFade = 0; }
    const k = (1 + rBoost * 2.2) * dt, rows = rH / RCH;
    for (let i = 0; i < ry.length; i++) {
      const p = ry[i] | 0; ry[i] += rs[i] * k;
      if ((ry[i] | 0) !== p && ry[i] > 0) rg.drawImage(atl, ((Math.random() * RG.length) | 0) * RCW, 0, RCW, RCH, i * RCW, (ry[i] | 0) * RCH, RCW, RCH);
      if (ry[i] > rows + 2) { ry[i] = -Math.random() * 18; rs[i] = 5 + Math.random() * 9; }
    }
  }

  /* a decision that executes / goes to review lights the terminal and rains faster */
  const rips = [], RIPM = { execute: '#2ee6a6', review: '#ffc13d' };
  function ripple(dest, t) { if (T() < 2 || reduce || J.hidden() || !RIPM[dest] || rips.length > 10) return; rips.push({ at: t, P: Zp, col: RIPM[dest] }); }
  function land(dest) { rBoost = 1; ripple(dest, J.time); }
  function runRips(t) {
    for (let i = rips.length - 1; i >= 0; i--) {
      const r = rips[i]; if (r.at > t) continue;
      rips.splice(i, 1);
      if (t - r.at > 1.2 || !r.P.rip) continue;
      r.P.rip.style.setProperty('--rip', r.col); r.P.txAt = t + 0.8; r.P.okAt = Math.max(r.P.okAt, t + 0.5);
      J.animate(r.P.rip, [{ opacity: 0 }, { opacity: 1, offset: 0.16 }, { opacity: 0 }], { duration: 780, easing: 'ease-out' });
    }
  }
  function ledSet(P, i, on) { const b = on ? 1 : 0; if (P.ledv[i] === b) return; P.ledv[i] = b; P.led[i].classList.toggle('on', !!b); }
  function ledStep(t) { ledSet(Zp, 0, Z.hold || t - Z.lastPrint < 0.22 && Math.sin(t * 47) > -0.2); ledSet(Zp, 1, t < Zp.okAt); ledSet(Zp, 2, t < Zp.txAt); }

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
  const zMax = () => Math.max(0, (zout.childNodes.length - Z.rows) * Z.lh);
  function zUi() { // the sticky LIVE pill: live / paused (hover, scroll-back) / pinned, with a '+N new' tally while held
    const st = Z.pin ? 'pin' : Z.back > 4 ? 'scroll' : Z.hover ? 'hover' : 'live';
    if (st !== Z.ps) { Z.ps = st; Z.pill.setAttribute('data-s', st); Z.pill.setAttribute('aria-pressed', Z.pin ? 'true' : 'false'); Z.pt.textContent = st === 'live' ? 'live' : st === 'pin' ? 'pinned' : 'paused'; }
    const n = Z.hold ? Z.q.reduce((a, e) => a + (e.dec && e.at <= J.time ? 1 : 0), 0) : 0;
    if (n !== Z.pc) { Z.pc = n; Z.pn.hidden = !n; Z.pn.textContent = '+' + n + ' new'; }
  }
  function zResume() { Z.pin = false; Z.back = 0; if (reduce) Z.bsy = 0; }
  if (zel) {
    const fine = (e) => e.pointerType === 'mouse';
    zbody.addEventListener('pointerenter', (e) => { if (fine(e)) Z.hover = true; }); // hover the log to freeze it; the header (and the run button) never freeze it
    zbody.addEventListener('pointerleave', (e) => { if (fine(e)) { Z.hover = false; if (!Z.pin && Z.back <= 4) Z.back = 0; } });
    $('.code-run', zel).addEventListener('click', () => { J.fire(); });
    Z.pill.addEventListener('click', () => { if (Z.hold) zResume(); else Z.pin = true; });
    zbody.addEventListener('keydown', (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const mx = zMax(), pg = Math.max(1, Z.rows - 2) * Z.lh; let b = Z.back, k = e.key;
      if (k === 'Enter') { e.preventDefault(); if (Z.hold) zResume(); else Z.pin = true; return; }
      if (k === 'Escape') { if (Z.hold) { zResume(); e.preventDefault(); } return; }
      if (k === 'c') { copyPane(); return; }
      if (k === 'ArrowUp') b += Z.lh * 2; else if (k === 'ArrowDown') b -= Z.lh * 2; else if (k === 'PageUp') b += pg; else if (k === 'PageDown') b -= pg; else if (k === 'Home') b = mx; else if (k === 'End') b = 0; else return;
      b = clamp(b, 0, mx); if (Math.abs(b - Z.back) < 0.5) return;
      e.preventDefault(); Z.back = b;
    });
    zbody.addEventListener('wheel', (e) => { // only once the log has focus: otherwise the page keeps its wheel
      if (doc.activeElement !== zbody) return;
      const mx = zMax(), b = clamp(Z.back - e.deltaY * (e.deltaMode === 1 ? Z.lh : 1), 0, mx);
      if (Math.abs(b - Z.back) < 0.5) return;
      e.preventDefault(); Z.back = b;
    }, { passive: false });
  }
  function zFlush(t, dt) {
    if (Z.off > 0.05) Z.off *= Math.exp(-dt * 13); else Z.off = 0;
    const mx = zMax(); if (Z.back > mx) Z.back = mx;
    let moved = false;
    if (reduce) { if (Z.bsy !== Z.back) { Z.bsy = Z.back; moved = true; } }
    else if (Math.abs(Z.back - Z.bsy) > 0.05) { Z.bsy += (Z.back - Z.bsy) * (1 - Math.exp(-dt * 11)); moved = true; } else if (Z.bsy !== Z.back) { Z.bsy = Z.back; moved = true; }
    const y = Z.off + Z.bsy;
    if (Math.abs(y - Z.ly) > 0.02) { Z.ly = y; zout.style.transform = y > 0.02 ? 'translate3d(0,' + y.toFixed(2) + 'px,0)' : ''; }
    if (moved) zVp();
    Z.hold = Z.hover || Z.pin || Z.back > 4;
    if (!Z.hold) {
      let k = 0;
      while (k < Z.q.length && Z.q[k].at <= t) { const e = Z.q[k++]; if (t - e.at > 1.6) e.seed = true; zPrint(e, false); }
      if (k) { Z.q.splice(0, k); }
      if (Z.dirty) { Z.dirty = false; zMm(); }
    }
    if (Z.hold || Z.ps !== 'live' || Z.pc) zUi();
  }

  function zMeta(t) {
    const ln = String(Z.n), act = t - Z.lastPrint < 1.4, ts = act ? (7.7 + Math.sin(t * 3.7) * 0.5 + Math.sin(t * 9.1) * 0.2).toFixed(1) : '0.0';
    if (ln !== Z.mLnV) { Z.mLnV = ln; Z.mLn.textContent = ln; }
    if (ts !== Z.mTsV) { Z.mTsV = ts; Z.mTs.textContent = ts; }
  }

  // identifier linking: hover (or tap) FLOOR / gate / dest / "execute" ... and every other use lights up across the pane
  const IDC = /(?:^|\s)code-(?:v|ct|f|fa|fd|a|b|jk|s|t-dest|t-buy|t-sell|t-hold|t-close|t-flatten)(?:\s|$)/, LKS = '.code-out span';
  let lkKey = '', lkOn = [];
  function keyOf(el) {
    if (!el || el.tagName !== 'SPAN' || !IDC.test(el.className)) return '';
    const t = el.textContent.trim().replace(/^f?["']|["']$/g, '');
    return /^[A-Za-z_][\w-]{1,24}$/.test(t) && !KW.has(t) ? t : '';
  }
  function link(el) {
    const raw = keyOf(el), key = raw.toLowerCase();
    if (key === lkKey) return;
    for (const e of lkOn) e.classList.remove('code-lk');
    lkOn = []; lkKey = key;
    if (!key) return;
    for (const e of win.querySelectorAll(LKS)) if (e.firstChild && keyOf(e).toLowerCase() === key) { e.classList.add('code-lk'); lkOn.push(e); }
  }
  win.addEventListener('pointerover', (e) => link(e.target));
  win.addEventListener('pointerleave', () => link(null));
  // copy: check-mark morph + toast (toast only when the fx module exists)
  const paneText = () => Z.hist.map((t) => t.map((x) => x[1]).join('').replace(/\s+$/, '')).join('\n');
  function clip(txt) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt);
    return new Promise((ok, no) => {
      const ta = doc.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      doc.body.appendChild(ta); ta.select(); let r = false; try { r = doc.execCommand('copy'); } catch (_) { /* blocked */ } ta.remove(); r ? ok() : no();
    });
  }
  function copyPane() {
    const k = 'zsh', btn = $('.code-cp', win), txt = paneText(), n = txt ? txt.split('\n').length : 0;
    const done = (ok) => {
      if (btn) { clearTimeout(btn._t); btn.classList.toggle('done', ok); btn.setAttribute('aria-label', (ok ? 'copied ' : 'copy ') + k); if (ok) btn._t = setTimeout(() => { btn.classList.remove('done'); btn.setAttribute('aria-label', 'copy ' + k + ' (illustrative sample)'); }, 1700); }
      if (J.toast) J.toast(ok ? k + ' copied · ' + n + ' lines · illustrative sample' : 'copy blocked · select the text instead', ok ? 'ok' : 'info');
    };
    clip(txt).then(() => done(true), () => done(false));
  }
  win.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('.code-cp'); if (b && win.contains(b)) copyPane(); });
  function mmDrag(w, fn) {
    let down = false;
    const go = (e) => fn((e.clientY - w.getBoundingClientRect().top - 4) / 4);
    w.addEventListener('pointerdown', (e) => { down = true; try { w.setPointerCapture(e.pointerId); } catch (_) { /* ok */ } w.classList.add('drag'); go(e); e.preventDefault(); });
    w.addEventListener('pointermove', (e) => { if (down) go(e); });
    const up = () => { down = false; w.classList.remove('drag'); };
    w.addEventListener('pointerup', up); w.addEventListener('pointercancel', up);
  }
  mmDrag(zmmW, (line) => {
    const nd = zout.childNodes.length, first = clamp(line - Z.rows / 2, 0, Math.max(0, nd - Z.rows));
    Z.back = (Math.max(0, nd - Z.rows) - first) * Z.lh;
  });

  let lastMeta = 0, lastT = 0;
  J.task(win, (t) => {
    const dt = Math.min(0.3, t - lastT || 0.016); lastT = t;
    zFlush(t, dt); ledStep(t); runRips(t); rainStep(dt);
    if (t - lastMeta > 0.25) { lastMeta = t; zMeta(t); }
  });

  J.bus.on('decision', (d) => { zPush(zFormat(d), J.time + DELAY, false); });
  J.bus.on('kill', (on) => {
    zPush([[[on ? 't-kill' : 't-arm', on ? ' KILL SWITCH - routing all to review ' : ' ARMED - gate open at floor ' + J.S.floor.toFixed(2) + ' ']]], J.time, false);
  });
  J.bus.on('floor', (v) => { zPush([[['td', '> '], ['t-warn', 'FLOOR set to ' + (+v).toFixed(2)]]], J.time, false); });
});
