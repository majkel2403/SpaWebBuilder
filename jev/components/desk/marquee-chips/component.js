/* desk-marquee-chips — Marquee chips  (everything here is SIMULATED)
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* used: JEV.mod  JEV.task  JEV.fit  JEV.watch  JEV.animate  JEV.bus ('tick', 'decision', 'kill', 'floor')  JEV.market  JEV.S  JEV.C
 * Safe without the rest of the page: every DOM lookup is guarded. */
JEV.mod('desk-marquee-chips', () => {
  const J = JEV, $ = J.$, $$ = J.$$, C = J.C, S = J.S, M = J.market, TAU = J.TAU, clamp = J.clamp, fmt = J.fmt;
  const setT = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  const sgnUsd = (v) => (v >= 0 ? '+$' : '-$') + fmt(Math.abs(Math.round(v)));
  const sprite = (rgb) => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(' + rgb + ',.9)'); gr.addColorStop(.3, 'rgba(' + rgb + ',.3)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c;
  };
  const rgbOf = (h) => { const n = parseInt(h.slice(1), 16); return (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255); };
  const GRN = rgbOf(C.green), RED = rgbOf(C.red), AMB = rgbOf(C.amber);
  const HOLD = { entry: 'edge', sizer: 'kelly', guard: 'prior', router: 'taker', exit: 'closer', funding: 'prior', news: 'spotter', mm: 'taker', liq: 'closer', rebal: 'spotter' };
  const AG = {}; (J.AGENTS || []).forEach((a) => (AG[a.key] = a));
  const short = (s) => s.split('-')[0].toLowerCase();
const card = $('#dkmq'), mt = $('#dkmq-mt'), set1 = $('#dkmq-ms'); if (!card || !mt || !set1) return;
  const set2 = set1.cloneNode(true); set2.removeAttribute('id'); set2.setAttribute('aria-hidden', 'true');
  $$('[id]', set2).forEach((e) => e.removeAttribute('id')); mt.appendChild(set2);        // second copy = seamless loop (-50%)
  const kEls = {}; $$('[data-k]', mt).forEach((e) => (kEls[e.dataset.k] || (kEls[e.dataset.k] = [])).push(e));
  const chipEls = {}; $$('[data-ck]', mt).forEach((e) => (chipEls[e.dataset.ck] || (chipEls[e.dataset.ck] = [])).push(e));
  const holdChips = $$('.dkt-c', mt).filter((e) => e.querySelector('[data-k="holder"]'));
  const K = (k, s) => { const a = kEls[k]; if (a) for (let i = 0; i < a.length; i++) setT(a[i], s); };
  const chipC = (k, c) => { const a = chipEls[k]; if (a) for (let i = 0; i < a.length; i++) if (a[i].dataset.c !== c) a[i].dataset.c = c; };
  $$('.dkt-c', set1).forEach((e) => { e.tabIndex = 0; });       // keyboard: tab through chips (the marquee holds while one has focus)
  const mq = $('.dkt-mq', card);
  if (mq) mq.addEventListener('click', () => { if (matchMedia('(hover: none)').matches) mq.classList.toggle('dkt-hold'); });   // touch: tap = hold, tap again = resume
  let mqW = 0; J.watch(set1, (r) => { if (!r.width || (mqW && Math.abs(r.width - mqW) / mqW < 0.05)) return; mqW = r.width; mt.style.setProperty('--mqd', Math.round(r.width / (J.narrow() ? 36 : 46)) + 's'); });
  const st = { gap: 1, lastDec: 0, edge: 9, holder: 'kelly', d: null, tix: [4, 2, 1].map((n, i) => performance.now() - 3000 * i + n * 0), rev: [] };
  J.bus.on('decision', (d) => {
    const t = performance.now(); if (st.lastDec) st.gap += (clamp((t - st.lastDec) / 1000, 0.3, 3) - st.gap) * 0.12;
    st.lastDec = t; st.d = d; st.holder = HOLD[d.build] || 'kelly'; st.edge += (clamp(d.state.edge_bps, -40, 40) - st.edge) * 0.1;
    if (d.dest === 'review') st.rev.push(t); if (d.dest === 'execute' && (d.action === 'buy' || d.action === 'sell')) st.tix.push(t + 9000 + Math.random() * 20000);
  });
  let holderShown = '';
  function flush() {
    const t = performance.now(); while (st.rev.length && t - st.rev[0] > 30000) st.rev.shift(); st.tix = st.tix.filter((e) => e > t); if (st.tix.length > 6) st.tix.shift();
    const fairBps = st.edge * 0.3, fair = M.price * (1 + fairBps / 1e4), d = st.d;
    K('hand', String(Math.round(60 / st.gap * 1.7))); K('fair', fmt(Math.round(fair))); K('mkt', fmt(Math.round(M.price)));
    K('edge', (fairBps >= 0 ? '+' : '-') + Math.abs(fairBps).toFixed(1) + 'bps'); chipC('edge', fairBps >= 0 ? 'green' : 'red');
    K('open', String(Math.max(1, st.tix.length))); K('wait', st.rev.length + ' waiting'); K('spent', '$' + S.cost.toFixed(3)); K('floor', S.floor.toFixed(2));
    K('kill', S.killed ? 'halted' : 'armed'); chipC('kill', S.killed ? 'red' : 'green');
    if (d) { const a = d.action; K('last', (a === 'hold' ? 'hold ' + short(d.symbol) : a + ' ' + short(d.symbol) + ' ' + d.size + '%') + ' .' + String(Math.round(d.conf * 100)).padStart(2, '0') + ' · ' + d.dest); chipC('last', d.dest === 'execute' ? 'green' : d.dest === 'review' ? 'yellow' : 'gray'); }
    const ag = AG[st.holder];
    if (ag && holderShown !== st.holder) { holderShown = st.holder; K('holder', ag.name.toLowerCase()); const rgb = rgbOf(ag.col); holdChips.forEach((e) => { e.style.setProperty('--cc', ag.col); e.style.setProperty('--cc-rgb', rgb); }); }
  }
  let ac = 0; flush(); J.task(card, (t, dt) => { ac += dt; if (ac < 0.25) return; ac = 0; flush(); });
});
