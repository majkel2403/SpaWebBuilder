/* desk/activity-log — six-agent activity log, newest on top, filter chips, live/pause (prefix dkb-). Everything is SIMULATED.
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot() (the shared main.js does it).
 * JEV.* API relied on:
 *   JEV.mod, JEV.$, JEV.C, JEV.S (floor, killed), JEV.AGENTS[6] ({key,name,col,role}), JEV.market.price, JEV.recent[0], JEV.makeDecision()
 *   JEV.clamp/fmt/pick/rnd/ri, JEV.fit, JEV.watch, JEV.task, JEV.animate, JEV.reduce, JEV.tier
 *   JEV.bus: 'agentstep' ({agent, verb, pnl, text}, optional: self-synthesised when absent), 'decision', 'kill', 'pulse' (optional)
 * Swap in real data: JEV.bus.emit('agentstep', {agent:'spotter', verb:'scan', pnl:null, text:'...'}) for every agent step.
 * Everything else in the file is local to the closure. Missing optional DOM / bus events never throw. */
JEV.mod('desk-activity-log', () => {
    const J = JEV, $ = J.$, C = J.C, S = J.S, clamp = J.clamp, fmt = J.fmt, gauss = J.gauss, TAU = J.TAU;
  const lgc = $('#dkb-log');
  if (!lgc) return;
  const rgbOf = (h) => { const n = parseInt(h.slice(1), 16); return (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255); };
  const setT = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  const sgn = (v, d) => (v >= 0 ? '+' : '-') + Math.abs(v).toFixed(d == null ? 1 : d);
  const TIER = () => (J.tier || 2);
  const FX_ON = () => TIER() >= 2 && !J.reduce;
  const initLog = () => {
    const list = $('#dkb-rl'), holder = $('#dkb-rows'), chipsEl = $('#dkb-chips'), cnt = $('#dkb-cnt'), liveB = $('#dkb-live'), lv = $('#dkb-lv');
    if (!list || !holder || !chipsEl) return;
    const META = {}, ORDER = [];
    J.AGENTS.forEach((a) => { const m = { key: a.key, name: a.name, col: a.col, rgb: rgbOf(a.col), n: 0, muted: false, chip: null, nEl: null }; META[a.key] = m; META[a.name.toLowerCase()] = m; ORDER.push(m); });
    const JEVM = { key: 'jev', name: 'JEV', col: C.pink, rgb: rgbOf(C.pink) };
    const GRAY = { key: 'x', name: '?', col: '#b8b2c2', rgb: '184,178,194' };
    const more = $('#dkb-more'), tip = $('#dkb-tip'), tph = $('#dkb-tph'), tpt = $('#dkb-tpt'), rw = $('#dkb-rw') || holder.parentElement;
    let rows = [], q = [], rh = 27, rn = 12, anim = null, resolved = 27, lastReal = -1e9, lastIns = 0, nextSyn = 0, hover = false, hold = false, kbOn = false, kbIdx = 0, missed = 0, tipLi = null;
    const VENUES = ['binance', 'okx', 'bybit', 'hyperliquid', 'coinbase', 'kraken'];
    const px = () => J.pick(['btc', 'btc', 'eth', 'sol']);
    const money = (v) => (v >= 0 ? '+$' : '-$') + Math.abs(v).toFixed(2);

    // ---- chips (mute / unmute an agent) ----
    ORDER.forEach((m) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'dkb-ch'; b.setAttribute('aria-pressed', 'true'); b.title = m.name.toLowerCase() + ' · ' + (J.AGENTS.find((a) => a.key === m.key) || {}).role;
      b.style.setProperty('--a', m.col); b.style.setProperty('--ar', m.rgb);
      const i = document.createElement('i'), n = document.createElement('b'), u = document.createElement('u');
      n.textContent = m.name; u.textContent = '0'; b.append(i, n, u); m.dot = i;
      b.title += ' · click to mute · double-click to solo';
      b.addEventListener('click', () => { m.muted = !m.muted; applyMute(); });
      b.addEventListener('dblclick', () => { const solo = ORDER.every((o) => o === m ? !o.muted : o.muted); ORDER.forEach((o) => { o.muted = solo ? false : o !== m; }); applyMute(); });
      chipsEl.appendChild(b); m.chip = b; m.nEl = u;
    });

    /** filter: muted agents stop producing rows AND the rows already on screen dim out (the list never reflows) */
    const applyMute = () => {
      ORDER.forEach((m) => m.chip.setAttribute('aria-pressed', String(!m.muted)));
      rows.forEach((li) => { const m = META[li.dataset.ag]; li.classList.toggle('mute', !!(m && m.muted)); });
      q = q.filter((it) => !(it.m && it.m.muted));
    };

    // ---- synthesiser (only used while no 'agentstep' arrives) ----
    const mkt = () => Math.round(J.market.price);
    const lastD = () => J.recent[0] || null;
    const GEN = {
      spotter: [
        () => ['scan', null, 'cross-checked three feeds · ' + J.pick(VENUES) + ' leads'],
        () => ['scan', null, 'spread ' + J.rnd(0.5, 3.2).toFixed(1) + 'bps on ' + px() + ' · book ok'],
        () => ['feed', null, 'heartbeat ok · latency ' + J.ri(12, 88) + 'ms'],
        () => ['scan', null, 'imbalance ' + sgn(J.rnd(-0.6, 0.6), 2) + ' on ' + J.pick(VENUES)],
      ],
      prior: [
        () => ['prior', null, 'updated on ' + fmt(1204 + J.ri(0, 90)) + ' passes'],
        () => ['update', null, 'p(up 5m) ' + J.rnd(48, 66).toFixed(1) + '% · n=' + fmt(1204 + J.ri(0, 90))],
        () => ['prior', null, 'implied drift flat · carry does not clear fees'],
        () => ['scan', Math.random() < 0.5 ? J.rnd(8, 60) : null, 'prediction-book check · fair ' + fmt(mkt() + J.ri(-9, 14))],
      ],
      edge: [
        () => ['edge', null, sgn(J.rnd(0.5, 6), 1) + 'bps over threshold · pass to kelly'],
        () => ['fair', null, 'fair ' + fmt(mkt() + J.ri(-6, 14)) + ' vs market ' + fmt(mkt())],
        () => ['edge', null, 'net of costs ' + sgn(J.rnd(-1, 4), 1) + 'bps · thin, wait'],
        () => { const d = lastD(); return ['edge', null, d ? 'jev asked · edge ' + sgn(d.state.edge_bps, 1) + 'bps on ' + d.symbol.split('-')[0].toLowerCase() : 'no edge above the floor']; },
      ],
      kelly: [
        () => ['size', null, 'kelly ' + J.pick(['0.5', '1', '2', '1']) + '% · capped by 4% max position'],
        () => ['size', null, 'drawdown guard ' + J.rnd(0.1, 1.8).toFixed(1) + '/10 · ok'],
        () => ['size', null, 'vol ' + J.ri(48, 118) + ' · size cut to 0.5%'],
      ],
      taker: [
        () => ['cross', J.rnd(-30, 80), 'crossed spread · ' + J.pick(['bought', 'sold']) + ' ' + J.rnd(0.04, 0.4).toFixed(2) + ' btc'],
        () => ['fill', J.rnd(-20, 55), 'filled on ' + J.pick(VENUES) + ' · slip ' + J.rnd(0.1, 0.9).toFixed(1) + 'bps'],
        () => ['queue', null, 'waiting for jev to clear the ticket'],
      ],
      closer: [
        () => ['close', J.rnd(10, 90), 'target hit · closed +' + J.rnd(3, 14).toFixed(1) + 'bps'],
        () => ['stop', -J.rnd(8, 60), 'stop hit · closed -' + J.rnd(3, 11).toFixed(1) + 'bps · rule held'],
        () => ['trail', null, 'trail moved to ' + fmt(mkt() - J.ri(5, 40))],
      ],
    };
    const WGT = ['spotter', 'spotter', 'prior', 'prior', 'edge', 'edge', 'kelly', 'taker', 'taker', 'closer'];
    const synth = () => { const k = J.pick(WGT), g = J.pick(GEN[k])(); return step(META[k], g[0], g[1], g[2]); };

    // ---- items ----
    const step = (m, verb, pnl, text) => {
      m = m || GRAY; const has = typeof pnl === 'number' && isFinite(pnl) && Math.abs(pnl) >= 0.005;
      return { m, name: m.name, col: m.col, rgb: m.rgb, verb: String(verb || 'step'), val: has ? money(pnl) : '—', tone: has ? (pnl >= 0 ? 'up' : 'dn') : '', text: String(text == null ? '' : text), cls: '' };
    };
    const decItem = (d) => {
      const dest = d.dest, tone = dest === 'execute' ? 'up' : dest === 'review' ? 'am' : 'gy';
      const act = d.action, sz = act === 'hold' ? '' : ' ' + d.size + '%';
      return { m: JEVM, name: 'JEV', col: C.pink, rgb: JEVM.rgb, verb: 'choice', val: '→ ' + dest, tone, cls: 'dkb-j',
        text: act + ' ' + d.symbol.split('-')[0].toLowerCase() + sz + ' · conf ' + d.conf.toFixed(2).replace(/^0/, '') + (dest === 'execute' || act === 'hold' ? '' : ' · ' + d.reason) };
    };
    const kill = (on) => ({ m: JEVM, name: 'JEV', col: on ? C.red : C.green, rgb: on ? rgbOf(C.red) : rgbOf(C.green), verb: on ? 'kill' : 'armed', val: on ? '■ halted' : '● armed', tone: on ? 'dn' : 'up', cls: on ? 'dkb-j dkb-rk' : 'dkb-j',
      text: on ? 'kill switch thrown · every order routes to review' : 'kill switch released · gate open at ' + S.floor.toFixed(2) });

    const mk = (it) => {
      const li = document.createElement('li');
      li.className = 'dkb-r' + (it.cls ? ' ' + it.cls : '');
      li.style.setProperty('--a', it.col); li.style.setProperty('--ar', it.rgb);
      const d = document.createElement('i'); d.className = 'dkb-d';
      const b = document.createElement('b'); b.className = 'dkb-ag'; b.textContent = it.name;
      const v = document.createElement('span'); v.className = 'dkb-vb'; v.textContent = it.verb;
      const p = document.createElement('span'); p.className = 'dkb-v' + (it.tone ? ' ' + it.tone : ''); p.textContent = it.val;
      const m = document.createElement('span'); m.className = 'dkb-ms'; m.textContent = it.text;
      li.dataset.ag = it.m.key; li._it = it;
      if (it.m.muted) li.classList.add('mute');
      li.append(d, b, v, p, m);
      return li;
    };
    const count = (it, flash) => {
      const m = it.m;
      if (m && m.nEl) { m.n++; setT(m.nEl, String(m.n)); if (flash && m.dot.animate && !J.reduce) m.dot.animate([{ transform: 'scale(2.4)', opacity: 1 }, { transform: 'scale(1)', opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)' }); }
      resolved++; setT(cnt, fmt(resolved));
    };
    const trim = (extra) => { while (rows.length > rn + extra) rows.pop().remove(); };
    /** the whole list is ONE moving layer: it jumps up by one row and eases back, so rows can never overlap or tear */
    const shift = () => {
      if (J.reduce || !list.animate) return;
      if (anim) anim.cancel();
      // 520 ms with a fast-out curve: the leftover offset of the previous shift (<1px at our 400 ms spacing) is negligible, and a starved frame loop can never stack offsets
      anim = list.animate([{ transform: 'translateY(' + -rh + 'px)' }, { transform: 'translateY(0px)' }], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' });
      anim.onfinish = () => { anim = null; trim(0); };
    };
    const push = (it) => {
      const li = mk(it);
      if (!J.reduce) { li.classList.add('new'); li.addEventListener('animationend', (e) => { if (e.target === li && !e.pseudoElement) li.classList.remove('new'); }); }
      list.prepend(li); rows.unshift(li);
      shift(); trim(1); count(it, true);
    };
    const fillTo = (n) => { while (rows.length < n) { const it = synth(); const li = mk(it); list.appendChild(li); rows.push(li); count(it, false); } };
    const enqueue = (it) => {
      if (it.m && it.m.muted) return;
      q.push(it); if (q.length > 14) q.shift();
      if (paused()) { missed++; pill(); }
    };
    /** '+N' pill while the log is held: N steps arrived meanwhile, click to catch up */
    const pill = () => {
      const n = paused() ? Math.min(missed, 99) : 0, s = n ? '+' + n : '';
      if (more.hidden === !n && more.textContent === s) return;
      more.hidden = !n; setT(more, s);
    };
    const flush = () => {
      const items = q.splice(0); missed = 0;
      hideTip(); items.slice(-3).forEach(push); pill();
    };
    more.addEventListener('click', flush);
    // ---- full message card (rows stay one line; the card shows everything) ----
    const hideTip = () => { tipLi = null; tip.classList.remove('on'); tip.setAttribute('aria-hidden', 'true'); rows.forEach((r) => r.classList.remove('sel')); };
    const placeTip = () => {
      if (!tipLi || !tipLi.isConnected) return hideTip();
      const a = tipLi.getBoundingClientRect(), b = rw.getBoundingClientRect(), th = tip.offsetHeight, top = a.bottom - b.top + 4;
      tip.style.transform = ''; tip.style.top = (top + th > b.height - 2 ? a.top - b.top - th - 4 : top) + 'px';
    };
    const showTip = (li) => {
      const it = li && li._it; if (!it) return hideTip();
      const ms = li.querySelector('.dkb-ms');
      if (!kbOn && ms && ms.scrollWidth <= ms.clientWidth + 1) return hideTip();
      rows.forEach((r) => r.classList.toggle('sel', r === li));
      tip.style.setProperty('--ar', it.rgb); tph.style.color = it.col;
      setT(tph, it.name.toLowerCase() + ' · ' + it.verb + (it.val !== '—' ? ' · ' + it.val : '') + '  '); setT(tpt, it.text);
      tipLi = li; tip.classList.add('on'); tip.setAttribute('aria-hidden', 'false'); placeTip();
    };
    list.addEventListener('pointerover', (e) => { if (e.pointerType === 'mouse') showTip(e.target.closest('.dkb-r')); });
    rw.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !hold && !kbOn) hideTip(); });
    list.addEventListener('pointerup', (e) => { if (e.pointerType === 'mouse') return; const li = e.target.closest('.dkb-r'); if (li) { hold = true; sync(); showTip(li); } });
    holder.addEventListener('focus', () => { kbOn = true; kbIdx = 0; sync(); showTip(rows[0]); });
    holder.addEventListener('blur', () => { kbOn = false; hideTip(); sync(); if (!paused()) resume(); });
    holder.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { kbIdx = clamp(kbIdx + (e.key === 'ArrowDown' ? 1 : -1), 0, rows.length - 1); showTip(rows[kbIdx]); }
      else if (e.key === 'Home') { kbIdx = 0; showTip(rows[0]); } else if (e.key === 'End') { kbIdx = rows.length - 1; showTip(rows[kbIdx]); }
      else if (e.key === 'Escape') holder.blur(); else return;
      e.preventDefault();
    });

    // ---- layout vars from css (--rh / --rn change with the container width) ----
    let seeded = false;
    const readVars = () => {
      const cs = getComputedStyle(holder);
      rh = parseFloat(cs.getPropertyValue('--rh')) || 27; rn = parseInt(cs.getPropertyValue('--rn'), 10) || 12;
      trim(0); fillTo(rn);
      if (!seeded) { // a few real-looking JEV rows among the agent rows
        seeded = true;
        for (let i = 0; i < 3; i++) { const at = 1 + i * 4; if (at >= rows.length) break; const nu = mk(decItem(J.makeDecision())); rows[at].replaceWith(nu); rows[at] = nu; }
      }
    };
    J.watch(holder, readVars); J.watch(lgc, readVars);

    // ---- sources ----
    J.bus.on('agentstep', (s) => {
      if (!s) return; lastReal = performance.now();
      enqueue(step(META[String(s.agent == null ? '' : s.agent).toLowerCase()] || (s.agent ? { key: 'x', name: String(s.agent).toUpperCase().slice(0, 7), col: GRAY.col, rgb: GRAY.rgb } : GRAY), s.verb, s.pnl, s.text));
    });
    J.bus.on('decision', (d) => { if (d && d.state) enqueue(decItem(d)); });
    J.bus.on('kill', (on) => { q.length = 0; push(kill(!!on)); });

    // ---- hover / tap pauses ----
    const paused = () => hover || hold || kbOn;
    const sync = () => { const p = paused(); liveB.setAttribute('aria-pressed', String(p)); setT(lv, p ? 'paused' : 'live'); if (!p) missed = 0; pill(); };
    const resume = () => { if (q.length > 4) q.splice(0, q.length - 4); lastIns = 0; missed = 0; pill(); };
    rw.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { hover = true; sync(); } });
    rw.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { hover = false; sync(); if (!paused()) resume(); } });
    liveB.addEventListener('click', () => { hold = !hold; if (!hold) hideTip(); sync(); if (!paused()) resume(); });

    // data rain: faint falling streaks behind the rows (tier >= 2, low opacity, own gated task, DPR 1)
    const rain = $('#dkb-rain');
    if (rain) {
      const NC = 18, RX = new Float32Array(NC), RY = new Float32Array(NC), RV = new Float32Array(NC), RS = new Float32Array(NC);
      const rs = document.createElement('canvas'); rs.width = 4; rs.height = 64; { const g = rs.getContext('2d'); for (let y = 0; y < 64; y += 4) { g.fillStyle = 'rgba(255,120,170,' + ((y / 64) * (y / 64) * 0.9).toFixed(3) + ')'; g.fillRect(1, y, 2, 2.4); } g.fillStyle = 'rgba(255,220,235,.95)'; g.fillRect(0, 60, 4, 4); }
      let rw2 = 0, rh2 = 0, rg = null;
      const relay = () => { const f = J.fit(rain, 1); rg = f.g; rw2 = f.W; rh2 = f.H; for (let i = 0; i < NC; i++) { RX[i] = Math.round(((i + Math.random() * 0.8) / NC) * rw2); RY[i] = Math.random() * rh2; RV[i] = 18 + Math.random() * 40; RS[i] = 0.5 + Math.random() * 0.8; } };
      J.watch(holder, relay);
      J.task(rain, (t, dt) => {
        if (!rg || !rw2) return;
        if (TIER() < 2 || J.reduce) { rain.style.display = 'none'; return; }
        rain.style.display = '';
        rg.clearRect(0, 0, rw2, rh2); const n = TIER() >= 3 ? NC : 10;
        for (let i = 0; i < n; i++) { RY[i] += RV[i] * dt; if (RY[i] - 64 * RS[i] > rh2) { RY[i] = 0; RV[i] = 18 + Math.random() * 40; } rg.drawImage(rs, RX[i], RY[i] - 64 * RS[i], 4, 64 * RS[i]); }
      });
    }
    J.task(list, (t) => {
      const now = t * 1000;
      if (paused()) { if (tipLi) placeTip(); return; }
      if (performance.now() - lastReal > 2600 && now >= nextSyn) { enqueue(synth()); nextSyn = now + 1000 + Math.random() * 500; }
      if (q.length && now - lastIns > 400) { push(q.shift()); lastIns = now; }
    });
  };
  /* heartbeat: the card breathes a glow on every decision */
  /* heartbeat: the three cards breathe a synchronized glow on every decision / JEV.pulse (bus 'pulse' when core emits it) */
  let lastBeat = -1e9;
  const beat = (str) => {
    if (!FX_ON() || J.hidden()) return;
    const n = performance.now(); if (n - lastBeat < 260) return; lastBeat = n;
    const a = 0.12 + 0.3 * clamp(str, 0, 1), k = S.killed ? '255,77,94' : '255,46,110';
    [lgc].forEach((c) => J.animate(c, [{ boxShadow: '0 0 0 0 rgba(' + k + ',0), inset 0 0 0 rgba(' + k + ',0)' }, { boxShadow: '0 0 34px -6px rgba(' + k + ',' + a.toFixed(2) + '), inset 0 0 38px rgba(' + k + ',' + (a * 0.35).toFixed(2) + ')', offset: 0.2 }, { boxShadow: '0 0 12px -6px rgba(' + k + ',' + (a * 0.3).toFixed(2) + '), inset 0 0 14px rgba(' + k + ',' + (a * 0.1).toFixed(2) + ')', offset: 0.42 }, { boxShadow: '0 0 0 0 rgba(' + k + ',0), inset 0 0 0 rgba(' + k + ',0)' }], { duration: 1100, easing: 'ease-out' }));
  };
  J.bus.on('decision', (d) => beat(d && d.dest === 'execute' ? 0.8 : 0.4));
  J.bus.on('pulse', (s) => beat(+s || 0.5));
  initLog();
});
