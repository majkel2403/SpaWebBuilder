/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* used: JEV.mod, $, task, time, recent, S.floor, reduce, bus.on. Data: bus 'decision' (action conf size riskOk dest id reason ms floor ...), 'kill', 'floor'.
 * Everything is simulated. */
JEV.mod('code-phosphor-log', () => {
  const J = JEV, $ = J.$, doc = document, reduce = J.reduce;
  const root = $('#cx-pl'); if (!root) return;
  const out = $('.code-out', root), nEl = $('.cx-pl-n', root);
  const q = []; let n = 0, ndec = 0;
  const STEP = 0.095, pad = (s, k) => s + ' '.repeat(Math.max(1, k - s.length));
  function format(d) {
    const L = [], a = d.action, ms = Math.max(1, Math.round(d.ms)), ms2 = Math.max(1, Math.round(d.ms * 0.62));
    L.push([['tx', 'choice='], ['t-' + a, pad(a, 8)], ['tx', 'conf='], ['t-conf', d.conf.toFixed(2)], ['td', '  ' + ms + ' ms']]);
    L.push([['tx', 'size='], ['tx', d.size + '%'], ['td', ' (score)']]);
    L.push([['tx', 'risk_ok='], [d.riskOk ? 't-ok' : 't-no', String(d.riskOk)], ['td', ' (flag)   ' + ms2 + ' ms']]);
    const r = d.reason;
    if (r === 'hold') L.push([['td', '> '], ['t-warn', 'hold -> skip, nothing to send']]);
    else if (r === 'kill switch') L.push([['td', '> '], ['t-warn', 'kill switch -> human review']]);
    else if (r === 'risk flag') L.push([['td', '> '], ['t-warn', 'risk_ok=false -> human review']]);
    else if (d.dest === 'review') L.push([['td', '> '], ['t-warn', 'below ' + d.floor.toFixed(2) + ' -> human review']]);
    L.push([['tx', 'Saved handoff: '], ['td', 'queue/'], ['t-dest code-chip-' + d.dest, d.dest], ['td', '/'], ['tx', d.id + '.json']]);
    if (++ndec % 20 === 0) L.push([['t-ps', '$ '], ['t-cmd', 'ls queue/']]);
    return L;
  }
  const caret = doc.createElement('i'); caret.className = 'code-caret'; caret.setAttribute('aria-hidden', 'true');
  function print(toks, seed) {
    const el = doc.createElement('div'); el.className = 'code-tl' + (seed || reduce ? ' seed' : '');
    for (const [c, t] of toks) { const s = doc.createElement('span'); s.className = 'code-' + c; s.textContent = t; el.appendChild(s); }
    out.appendChild(el); el.appendChild(caret);
    while (out.childNodes.length > 30) out.removeChild(out.firstChild);
    nEl.textContent = String(++n);
  }
  const push = (lines, at) => { lines.forEach((toks, i) => q.push({ at: at + i * STEP, toks })); if (q.length > 40) q.splice(0, q.length - 40); };
  print([['t-ps', '$ '], ['t-cmd', 'jev watch queue/ --sim']], true);
  print([['td', 'floor ' + J.S.floor.toFixed(2) + ' - cap $' + J.fmt(J.RULES.lossCap) + ' - max ' + J.RULES.maxPos + '% - listening']], true);
  for (const d of (J.recent || []).slice(0, 3).reverse()) format(d).forEach((t) => print(t, true));
  J.task(root, (t) => {
    let k = 0;
    while (k < q.length && q[k].at <= t) { const e = q[k++]; print(e.toks, t - e.at > 1.6); }
    if (k) q.splice(0, k);
  });
  J.bus.on('decision', (d) => push(format(d), J.time + 0.05));
  J.bus.on('kill', (on) => push([[[on ? 't-kill' : 't-arm', on ? ' KILL SWITCH - routing all to review ' : ' ARMED - gate open at floor ' + J.S.floor.toFixed(2) + ' ']]], J.time));
  J.bus.on('floor', (v) => push([[['td', '> '], ['t-warn', 'FLOOR set to ' + (+v).toFixed(2)]]], J.time));
});
