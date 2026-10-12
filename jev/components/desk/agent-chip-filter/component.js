/* desk/agent-chip-filter — six agent chips with live counters, click = mute, double-click = solo (everything here is SIMULATED)
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot()
 * JEV.* used: JEV.mod $ C S AGENTS fmt pick rnd ri market recent task animate reduce; JEV.bus 'agentstep' ({agent, verb, pnl, text}) and 'decision' in; emits 'agentfilter' ({muted:[agent keys], on:[agent keys]}) out
 * Safe without the rest of the page: every DOM lookup is guarded. */
JEV.mod('desk-agent-chip-filter', () => {
  const J = JEV, $ = J.$, C = J.C, S = J.S, clamp = J.clamp, fmt = J.fmt, gauss = J.gauss, TAU = J.TAU;
  const MONO = "'JetBrains Mono', ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, Consolas, monospace";
  const setT = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  const sgn = (v, d) => (v >= 0 ? '+' : '-') + Math.abs(v).toFixed(d == null ? 1 : d);
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  /** soft additive glow sprite (drawn with 'lighter'; replaces shadowBlur) */
  const sprite = (rgb) => {
    const c = document.createElement('canvas'); c.width = c.height = 48;
    const g = c.getContext('2d'), gr = g.createRadialGradient(24, 24, 0, 24, 24, 24);
    gr.addColorStop(0, 'rgba(' + rgb + ',1)'); gr.addColorStop(.28, 'rgba(' + rgb + ',.35)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, 48, 48); return c;
  };
  /** bake a pill label to a tiny sprite (text is the costly part of a canvas frame; re-baked only when the label changes) */
  const bake = (cv, txt, w, h, fill, stroke, color, font) => {
    cv.width = Math.round(w * J.DPR); cv.height = Math.round(h * J.DPR);
    const g = cv.getContext('2d'); g.setTransform(J.DPR, 0, 0, J.DPR, 0, 0);
    rr(g, 0.5, 0.5, w - 1, h - 1, 4); g.fillStyle = fill; g.fill(); g.strokeStyle = stroke; g.lineWidth = 1; g.stroke();
    g.font = font; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = color; g.fillText(txt, w / 2, h / 2 + 3.4);
  };
  const onFonts = []; // canvas text needs the web font loaded; redraw static layers once it is
  try { if (document.fonts && document.fonts.load) Promise.all([document.fonts.load("700 9px 'JetBrains Mono'"), document.fonts.load("9px 'JetBrains Mono'")]).then(() => onFonts.forEach((f) => f())).catch(() => {}); } catch (e) { /* ignore */ }
  const erf = (x) => { const sg = x < 0 ? -1 : 1, a = Math.abs(x), t = 1 / (1 + 0.3275911 * a); return sg * (1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) * Math.exp(-a * a)); };
  const TIER = () => (J.tier || 2);
  const FX_ON = () => TIER() >= 2 && !J.reduce;
  const DASH = [3, 4], DOT = [1.5, 3.5], NODASH = [], F_TAG = '700 9px ' + MONO;
  /** cards reveal with a small scale (.rv): re-fit once the reveal settles */
  const afterReveal = (card, fn) => { card.addEventListener('transitionend', (e) => { if (e.target === card && e.propertyName === 'transform') fn(); }); J.onView(card, () => setTimeout(fn, 1300), { threshold: 0.05 }); };
  const rgbOf = (h) => { const n = parseInt(h.slice(1), 16); return (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255); };
  const META = {}, ORDER = [];
  J.AGENTS.forEach((a) => { const m = { key: a.key, name: a.name, role: a.role, col: a.col, rgb: rgbOf(a.col), n: 0, muted: false }; META[a.key] = m; ORDER.push(m); });
  const JEVM = { key: 'jev', name: 'JEV', col: C.pink, rgb: rgbOf(C.pink) };
  const VENUES = ['binance', 'okx', 'bybit', 'hyperliquid', 'coinbase', 'kraken'];
  const px = () => J.pick(['btc', 'btc', 'eth', 'sol']);
  const money = (v) => (v >= 0 ? '+$' : '-$') + Math.abs(v).toFixed(2);
  const mkt = () => Math.round(J.market.price);
  /** a step item: { m: agent meta, name, col, rgb, verb, val, tone, text, cls } — the shape every log row is made from */
  const step = (m, verb, pnl, text) => {
    const has = typeof pnl === 'number' && isFinite(pnl) && Math.abs(pnl) >= 0.005;
    return { m, name: m.name, col: m.col, rgb: m.rgb, verb: String(verb || 'step'), val: has ? money(pnl) : '—', tone: has ? (pnl >= 0 ? 'up' : 'dn') : '', text: String(text == null ? '' : text), cls: '' };
  };
  /** a JEV decision becomes a pink row; tone follows the gate result */
  const decItem = (d) => {
    const dest = d.dest, tone = dest === 'execute' ? 'up' : dest === 'review' ? 'am' : 'gy', act = d.action, sz = act === 'hold' ? '' : ' ' + d.size + '%';
    return { m: JEVM, name: 'JEV', col: C.pink, rgb: JEVM.rgb, verb: 'choice', val: '→ ' + dest, tone, cls: 'dkb-j',
      text: act + ' ' + d.symbol.split('-')[0].toLowerCase() + sz + ' · conf ' + d.conf.toFixed(2).replace(/^0/, '') + (dest === 'execute' || act === 'hold' ? '' : ' · ' + d.reason) };
  };
  const killItem = (on) => ({ m: JEVM, name: 'JEV', col: on ? C.red : C.green, rgb: on ? rgbOf(C.red) : rgbOf(C.green), verb: on ? 'kill' : 'armed', val: on ? '■ halted' : '● armed', tone: on ? 'dn' : 'up', cls: on ? 'dkb-j dkb-rk' : 'dkb-j',
    text: on ? 'kill switch thrown · every order routes to review' : 'kill switch released · gate open at ' + S.floor.toFixed(2) });
  /** self-synthesised agent steps (used while no 'agentstep' event arrives): swap for your real agent events */
  const GEN = {
    spotter: [() => ['scan', null, 'cross-checked three feeds · ' + J.pick(VENUES) + ' leads'], () => ['scan', null, 'spread ' + J.rnd(0.5, 3.2).toFixed(1) + 'bps on ' + px() + ' · book ok'], () => ['feed', null, 'heartbeat ok · latency ' + J.ri(12, 88) + 'ms'], () => ['scan', null, 'imbalance ' + sgn(J.rnd(-0.6, 0.6), 2) + ' on ' + J.pick(VENUES)]],
    prior: [() => ['prior', null, 'updated on ' + fmt(1204 + J.ri(0, 90)) + ' passes'], () => ['update', null, 'p(up 5m) ' + J.rnd(48, 66).toFixed(1) + '% · n=' + fmt(1204 + J.ri(0, 90))], () => ['prior', null, 'implied drift flat · carry does not clear fees']],
    edge: [() => ['edge', null, sgn(J.rnd(0.5, 6), 1) + 'bps over threshold · pass to kelly'], () => ['fair', null, 'fair ' + fmt(mkt() + J.ri(-6, 14)) + ' vs market ' + fmt(mkt())], () => ['edge', null, 'net of costs ' + sgn(J.rnd(-1, 4), 1) + 'bps · thin, wait']],
    kelly: [() => ['size', null, 'kelly ' + J.pick(['0.5', '1', '2', '1']) + '% · capped by 4% max position'], () => ['size', null, 'drawdown guard ' + J.rnd(0.1, 1.8).toFixed(1) + '/10 · ok'], () => ['size', null, 'vol ' + J.ri(48, 118) + ' · size cut to 0.5%']],
    taker: [() => ['cross', J.rnd(-30, 80), 'crossed spread · ' + J.pick(['bought', 'sold']) + ' ' + J.rnd(0.04, 0.4).toFixed(2) + ' btc'], () => ['fill', J.rnd(-20, 55), 'filled on ' + J.pick(VENUES) + ' · slip ' + J.rnd(0.1, 0.9).toFixed(1) + 'bps'], () => ['queue', null, 'waiting for jev to clear the ticket']],
    closer: [() => ['close', J.rnd(10, 90), 'target hit · closed +' + J.rnd(3, 14).toFixed(1) + 'bps'], () => ['stop', -J.rnd(8, 60), 'stop hit · closed -' + J.rnd(3, 11).toFixed(1) + 'bps · rule held'], () => ['trail', null, 'trail moved to ' + fmt(mkt() - J.ri(5, 40))]],
  };
  const WGT = ['spotter', 'spotter', 'prior', 'prior', 'edge', 'edge', 'kelly', 'taker', 'taker', 'closer'];
  const synth = (k) => { k = k || J.pick(WGT); const g = J.pick(GEN[k])(); return step(META[k], g[0], g[1], g[2]); };
  /** one log row (li.dkb-r): dot · agent tag · verb · value · message */
  const mk = (it) => {
    const li = document.createElement('li'); li.className = 'dkb-r' + (it.cls ? ' ' + it.cls : '');
    li.style.setProperty('--a', it.col); li.style.setProperty('--ar', it.rgb);
    const d = document.createElement('i'); d.className = 'dkb-d';
    const b = document.createElement('b'); b.className = 'dkb-ag'; b.textContent = it.name;
    const v = document.createElement('span'); v.className = 'dkb-vb'; v.textContent = it.verb;
    const p = document.createElement('span'); p.className = 'dkb-v' + (it.tone ? ' ' + it.tone : ''); p.textContent = it.val;
    const m = document.createElement('span'); m.className = 'dkb-ms'; m.textContent = it.text;
    li.dataset.ag = it.m.key; li.append(d, b, v, p, m); return li;
  };
  const card = $('#dkcf'), chipsEl = $('#dkcf-chips'); if (!card || !chipsEl) return;
  const eOn = $('#dkcf-on'), eCnt = $('#dkcf-cnt');
  let total = 0, lastReal = -1e9, nextSyn = 0;
  const applyMute = () => {
    ORDER.forEach((m) => m.chip.setAttribute('aria-pressed', String(!m.muted)));
    const on = ORDER.filter((m) => !m.muted);
    setT(eOn, String(on.length));
    if (eOn && eOn.nextSibling) eOn.nextSibling.textContent = ' of ' + ORDER.length + ' listening';
    J.bus.emit('agentfilter', { muted: ORDER.filter((m) => m.muted).map((m) => m.key), on: on.map((m) => m.key) });
  };
  ORDER.forEach((m) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'dkb-ch'; b.setAttribute('aria-pressed', 'true');
    b.title = m.name.toLowerCase() + ' · ' + m.role + ' · click to mute · double-click to solo';
    b.style.setProperty('--a', m.col); b.style.setProperty('--ar', m.rgb);
    const i = document.createElement('i'), n = document.createElement('b'), u = document.createElement('u');
    n.textContent = m.name; u.textContent = '0'; b.append(i, n, u); m.dot = i; m.nEl = u; m.chip = b;
    b.addEventListener('click', () => { m.muted = !m.muted; applyMute(); });
    b.addEventListener('dblclick', () => { const solo = ORDER.every((o) => (o === m ? !o.muted : o.muted)); ORDER.forEach((o) => { o.muted = solo ? false : o !== m; }); applyMute(); });
    chipsEl.appendChild(b);
  });
  /** a step arrived: muted agents are dropped, the others count up and their dot pops */
  const count = (m) => {
    if (!m || !m.nEl || m.muted) return;
    m.n++; total++; setT(m.nEl, String(m.n)); setT(eCnt, fmt(total));
    J.animate(m.dot, [{ transform: 'scale(2.4)' }, { transform: 'scale(1)' }], { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)' });
  };
  J.bus.on('agentstep', (s) => { if (!s) return; lastReal = performance.now(); count(META[String(s.agent == null ? '' : s.agent).toLowerCase()]); });
  J.bus.on('decision', () => { if (J.AGENTS[0]) count(META.edge); });
  // no 'agentstep' source on this page: a light timer plays one agent after another
  J.task(card, (t) => {
    const now = t * 1000;
    if (performance.now() - lastReal > 2600 && now >= nextSyn) { count(META[J.pick(WGT)]); nextSyn = now + 600 + Math.random() * 600; }
  });
});
