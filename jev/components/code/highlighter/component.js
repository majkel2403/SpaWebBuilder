/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* used: JEV.mod, $, $$, bus.on, recent. Data: bus 'decision' (optional, for the "latest decision" button).
 * Everything is simulated. */
JEV.mod('code-highlighter', () => {
  const J = JEV, $ = J.$;
  const root = $('#cx-hl'); if (!root) return;
  const pane = $('.code-pane', root), ta = $('.cx-in', root), out = $('.cx-out', root);
  
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

  const PY = '# hermes wrote the intent. jev answers it. code decides.\nFLOOR = 0.85\n\ndef gate(answer):\n    reduces = answer.choice in ("close", "flatten")\n    if answer.conf >= FLOOR and (answer.risk_ok or reduces):\n        return "execute"\n    return "review"\n';
  let lang = 'py', latest = J.recent && J.recent[0];
  const json = (d) => JSON.stringify({ id: d.id, symbol: d.symbol, answers: { action: { choice: d.action, conf: +d.conf.toFixed(2) }, size: { pct: d.size }, risk_ok: d.riskOk }, dest: d.dest, why: d.reason, ms: +d.ms.toFixed(1) }, null, 2);
  const src = { py: PY, json: latest ? json(latest) : '{\n  "choice": "buy",\n  "conf": 0.93,\n  "dest": "execute",\n  "risk_ok": true,\n  "note": null\n}' };
  function paint() {
    const frag = document.createDocumentFragment();
    ta.value.split('\n').forEach((line, i, a) => {
      for (const k of hl(line, lang === 'json')) { const s = document.createElement('span'); s.className = 'code-' + k.c; s.textContent = k.t; frag.appendChild(s); }
      if (i < a.length - 1) frag.appendChild(document.createTextNode('\n'));
    });
    out.textContent = ''; out.appendChild(frag);
  }
  function setLang(l) {
    src[lang] = ta.value; lang = l; ta.value = src[l]; paint();
    for (const b of J.$$('[data-l]', root)) b.setAttribute('aria-pressed', String(b.dataset.l === l));
  }
  ta.value = src.py; paint();
  ta.addEventListener('input', paint);
  ta.addEventListener('scroll', () => { out.scrollTop = ta.scrollTop; out.scrollLeft = ta.scrollLeft; });
  root.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('button'); if (!b || !root.contains(b)) return;
    if (b.dataset.l) setLang(b.dataset.l);
    else if (b.dataset.sk) {
      pane.classList.remove('code-dark', 'code-light', 'code-hot'); pane.classList.add('code-' + b.dataset.sk);
      for (const x of J.$$('[data-sk]', root)) x.setAttribute('aria-pressed', String(x === b));
    } else if (b.classList.contains('cx-load') && latest) { src.json = json(latest); setLang('json'); }
  });
  J.bus.on('decision', (d) => { latest = d; });
});
