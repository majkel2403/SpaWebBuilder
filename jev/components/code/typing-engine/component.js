/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* used: JEV.mod, $, $$, task, reduce, bus.on. Data: bus 'decision' (d.symbol d.action d.conf d.dest d.size) - each one is typed as a new line at the end.
 * Everything is simulated. */
JEV.mod('code-typing-engine', () => {
  const J = JEV, $ = J.$, reduce = J.reduce;
  const root = $('#cx-te'); if (!root) return;
  const pane = $('.code-pane', root), body = $('.cx-te-body', root), doc = $('.cx-te-doc', root), cpsEl = $('.cx-cps', root);
  
  const KW = new Set('import from def return if elif else and or not in is as for while with pass lambda True False None true false null'.split(' '));
  const RE = /(#.*$)|(f?"(?:[^"\\]|\\.)*"?|f?'(?:[^'\\]|\\.)*'?)|(\d+(?:\.\d+)?)|([A-Za-z_]\w*)|(\s+)|(->|>=|<=|==|!=|[^\sA-Za-z_\d])/g;
  function hl(src, json) { // tiny regex tokenizer -> [{c, t}] ; c is the suffix of the css class code-<c>
    const out = []; let m, prev = '';
    RE.lastIndex = 0;
    while ((m = RE.exec(src))) {
      const s = m[0]; let c = 'o';
      if (m[1]) c = 'c';
      else if (m[2]) c = json && /^\s*:/.test(src.slice(RE.lastIndex)) ? 'jk' : 's';
      else if (m[3]) c = 'n';
      else if (m[4]) {
        const call = src.charAt(RE.lastIndex) === '(';
        if (KW.has(s)) c = 'k';
        else if (prev === 'def') c = 'fd';
        else if (/^[A-Z]/.test(s) && !/^[A-Z0-9_]+$/.test(s)) c = 'b';
        else if (call) c = 'f';
        else if (prev === '.') c = 'a';
        else if (/^[A-Z][A-Z0-9_]+$/.test(s)) c = 'ct';
        else c = 'v';
      } else if (m[5]) {
        if (out.length) { out[out.length - 1].t += s; continue; }
        c = 'w';
      }
      if (c !== 'w' && m[5] === undefined) prev = s;
      const last = out[out.length - 1];
      if (last && last.c === c && (c === 'o' || c === 'v' || c === 'w') && last.t.trim().length === last.t.length) { last.t += s; continue; }
      out.push({ c, t: s });
    }
    return out;
  }

  const SRC = '# one line at a time, token by token\nimport jev\n\nQUESTIONS = ("action", "size", "risk_ok")\n\ndef desk(state):\n    answer = jev.ask(state, QUESTIONS)\n    return answer.choice  # buy | sell | hold\n';
  const BASE = 190; let speed = 1, li = 0, ti = 0, ci = 0, carry = 0, pause = 0, mode = 'idle', tails = 0;
  const lines = [], caret = document.createElement('i');
  caret.className = 'code-caret'; caret.setAttribute('aria-hidden', 'true');
  function addLine(src, tail) {
    const el = document.createElement('div'); el.className = 'cx-te-ln' + (tail ? ' tail' : '');
    const toks = hl(src).map((m) => { const s = document.createElement('span'), tn = document.createTextNode(''); s.className = 'code-' + m.c; s.appendChild(tn); el.appendChild(s); return { tn, el: s, t: m.t }; });
    doc.appendChild(el); lines.push({ el, toks, tail }); return lines.length - 1;
  }
  function reset() {
    doc.textContent = ''; lines.length = 0; tails = 0; li = ti = ci = 0; carry = 0; pause = 0;
    SRC.replace(/\n$/, '').split('\n').forEach((l) => addLine(l));
    mode = 'type'; pane.classList.add('code-typing'); body.scrollTop = 0;
    if (reduce) fillAll();
  }
  function fillAll() { for (const L of lines) for (const k of L.toks) k.tn.nodeValue = k.t; li = lines.length; mode = 'idle'; pane.classList.remove('code-typing'); place(); }
  function place() { const L = lines[Math.min(li, lines.length - 1)]; if (!L) return; const k = L.toks[Math.max(0, Math.min(ti, L.toks.length) - 1)]; L.el.insertBefore(caret, k && ti > 0 ? k.el.nextSibling : null); }
  function step(dt) {
    if (mode !== 'type') return;
    if (pause > 0) { pause -= dt; return; }
    const b = BASE * speed * dt + carry; let n = Math.floor(b); carry = b - n; let guard = 400;
    while (n > 0 && guard-- > 0) {
      const L = lines[li];
      if (!L) { mode = 'idle'; pane.classList.remove('code-typing'); break; }
      const k = L.toks[ti];
      if (!k) { li++; ti = ci = 0; pause = (L.toks.length ? 0.05 + Math.random() * 0.08 : 0.04) / speed; place(); break; }
      if (!k.t.trim()) { k.tn.nodeValue = k.t; ti++; ci = 0; continue; }
      const take = Math.min(n, k.t.length - ci); ci += take; n -= take; k.tn.nodeValue = k.t.slice(0, ci);
      if (ci >= k.t.length) { ti++; ci = 0; }
      place();
    }
    body.scrollTop = body.scrollHeight;
  }
  let last = 0;
  J.task(root, (t) => { const dt = Math.min(0.3, t - last || 0.016); last = t; step(dt); });
  reset();
  root.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('button'); if (!b) return;
    if (b.classList.contains('cx-replay')) reset();
    else if (b.dataset.s) { speed = +b.dataset.s; cpsEl.textContent = String(BASE * speed); for (const x of J.$$('[data-s]', root)) x.setAttribute('aria-pressed', String(x === b)); }
  });
  J.bus.on('decision', (d) => {
    const s = 'jev.ask("' + d.symbol + '")  # ' + d.action + ' ' + d.conf.toFixed(2) + ' -> ' + d.dest;
    if (tails >= 3) { const old = lines.findIndex((L) => L.tail); if (old >= 0) { lines[old].el.remove(); lines.splice(old, 1); if (old < li) li--; tails--; } }
    addLine(s, true); tails++;
    if (mode === 'idle') { mode = 'type'; pane.classList.add('code-typing'); ti = ci = 0; }
    if (reduce) fillAll();
  });
});
