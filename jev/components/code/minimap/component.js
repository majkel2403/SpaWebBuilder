/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* used: JEV.mod, $, clamp, watch, fit, bus.on. Data: bus 'decision' - the cursor tick hops to the gate lines. Minimap pitch: 4 px per line, 0.5 px per character.
 * Everything is simulated. */
JEV.mod('code-minimap', () => {
  const J = JEV, $ = J.$, clamp = J.clamp;
  const root = $('#cx-mm'); if (!root) return;
  const body = $('.cx-mm-body', root), docEl = $('.cx-mm-doc', root), band = $('.code-band', root), mmW = $('.code-mm', root), cv = $('canvas', mmW), vp = $('.cx-mm-vp', mmW), tick = $('.cx-mm-tick', mmW), lnEl = $(".cx-mm-cur", root);
  
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

  const SRC = "# hard rules live in code, not in the model.\nfrom pathlib import Path\nfrom jev import choice, score, flag\n\nQUESTIONS = {\n    \"action\": choice(\"buy\", \"sell\", \"hold\", \"close\", \"flatten\"),\n    \"size\": score(0.5, 1, 2, 4),            # % of capital\n    \"risk_ok\": flag(\"spread, latency, loss, feed age\"),\n}\n\nFLOOR = 0.85                  # below this a human looks first\nDAILY_LOSS_CAP = 2000         # usd, then the desk stops\nMAX_POSITION = 0.04           # 4% of capital\nKILL_FILE = Path(\"KILL\")      # one file halts the desk\n\ndef gate(answer):\n    if KILL_FILE.exists() or answer.daily_pnl <= -DAILY_LOSS_CAP:\n        return False\n    return answer.size / 100 <= MAX_POSITION\n\ndef desk(intent, state):\n    answer = jev.ask(state, questions=QUESTIONS)\n    reduces = answer.choice in (\"close\", \"flatten\")\n    ok = answer.confidence >= FLOOR and (answer.risk_ok or reduces)\n    dest = \"execute\" if ok and gate(answer) else \"review\"\n    if answer.choice == \"hold\":\n        dest = \"skip\"\n    return dest";
  const PAL = { k: '#ff6fa5', s: '#5fe3b0', n: '#ffb86b', c: '#6f6680', f: '#7aa7ff', fd: '#7aa7ff', b: '#c39bff', ct: '#ffa56b', a: '#b6aec2', o: '#ff9cc4', v: '#b6aec2', w: '#000' };
  const LH = 19, models = SRC.split('\n').map((l) => hl(l));
  let gm = null, cur = 0;
  models.forEach((toks, i) => {
    const el = document.createElement('div'), no = document.createElement('u'); el.className = 'cx-mm-ln'; no.textContent = String(i + 1); el.appendChild(no);
    for (const m of toks) { const s = document.createElement('span'); s.className = 'code-' + m.c; s.textContent = m.t; el.appendChild(s); }
    docEl.appendChild(el);
  });
  function draw() {
    if (!gm) return; const g = gm.g; g.clearRect(0, 0, gm.W, gm.H);
    models.forEach((toks, i) => { let x = 3; for (const k of toks) { const w = k.t.length * 0.5; if (k.c !== 'w' && k.t.trim()) { g.fillStyle = PAL[k.c] || PAL.v; g.fillRect(x, 4 + i * 4, Math.max(0.6, Math.min(w, gm.W - x - 1)), 1.8); } x += w; if (x > gm.W) break; } });
  }
  function sync() { // viewport window follows the scroll position
    vp.style.height = Math.min(models.length * 4 + 2, (body.clientHeight / LH) * 4 + 2) + 'px';
    vp.style.transform = 'translate3d(0,' + (4 + (body.scrollTop / LH) * 4).toFixed(2) + 'px,0)';
  }
  function go(i, follow) { // move the cursor line: band + gutter tick + minimap tick
    cur = clamp(i, 0, models.length - 1);
    band.style.transform = 'translate3d(0,' + cur * LH + 'px,0)'; tick.style.transform = 'translate3d(0,' + (4 + cur * 4) + 'px,0)'; lnEl.textContent = String(cur + 1);
    if (follow) { const y = 8 + cur * LH; if (y < body.scrollTop + LH) body.scrollTop = y - LH * 2; else if (y + LH > body.scrollTop + body.clientHeight - LH) body.scrollTop = y + LH * 3 - body.clientHeight; }
  }
  J.watch(mmW, () => { gm = J.fit(cv); draw(); sync(); });
  body.addEventListener('scroll', sync, { passive: true });
  let down = false;
  const seek = (e) => { const line = (e.clientY - mmW.getBoundingClientRect().top - 4) / 4; body.scrollTop = clamp((line - body.clientHeight / LH / 2) * LH, 0, body.scrollHeight); };
  mmW.addEventListener('pointerdown', (e) => { down = true; try { mmW.setPointerCapture(e.pointerId); } catch (_) { /* ok */ } mmW.classList.add('drag'); seek(e); e.preventDefault(); });
  mmW.addEventListener('pointermove', (e) => { if (down) seek(e); });
  const up = () => { down = false; mmW.classList.remove('drag'); };
  mmW.addEventListener('pointerup', up); mmW.addEventListener('pointercancel', up);
  const GATE = [19, 20, 23, 26, 27]; let gi = 0;
  J.bus.on('decision', () => { go(GATE[gi++ % GATE.length], true); });
  go(18, true); sync();
});
