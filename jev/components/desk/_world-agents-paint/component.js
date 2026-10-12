
  function paintStatus(i) {
    const k = AGK[i], s = ST.status[i], tb = TAB[k].el;
    if (tb.dataset.st !== s) { tb.dataset.st = s; ROW[k].el.dataset.st = s; }
    txt(TAB[k].ts, s);
  }
  function setStatus(i, s) {
    if (ST.status[i] === s) return;
    ST.status[i] = s;
    if (live()) paintStatus(i); else dirty = true;
  }
  function paintNow() {
    const key = activeKey() || AGK[0], i = AGI[key], ev = LAST[key];
    const cn = 'orb ' + ORBC[key]; if (T.nowO.className !== cn) T.nowO.className = cn;
    if (nowKey !== key) { nowKey = key; T.now.style.setProperty('--ac-rgb', hexRgb(AG[i].col)); }
    txt(T.nowN, key); txt(T.nowV, ST.status[i] === 'halted' ? 'halted · read-only' : ev ? VERB[i].toLowerCase() : 'idle'); txt(T.nowX, ev ? ev.chip : '—');
  }
  /** highlight / pin state: only the agents whose state changed since the last paint touch the DOM */
  function applyOn() {
    const on = activeKey();
    for (let i = 0; i < AGK.length; i++) {
      const k = AGK[i], isOn = k === on, pinned = ST.pin === k, p = PA[i];
      if (p.on !== isOn) { p.on = isOn; TAB[k].el.classList.toggle('is-on', isOn); ROW[k].el.classList.toggle('is-on', isOn); OBK[k].el.classList.toggle('is-on', isOn); }
      if (p.pin !== pinned) { p.pin = pinned; const v = String(pinned); TAB[k].el.classList.toggle('is-pin', pinned); TAB[k].el.setAttribute('aria-pressed', v); ROW[k].el.setAttribute('aria-pressed', v); }
    }
    paintNow();
  }
  function togglePin(k) { ST.pin = ST.pin === k ? null : k; applyOn(); }
