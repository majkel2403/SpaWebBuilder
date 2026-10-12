  // copy: per pane, check-mark morph + toast
  const CPN = { 'desk.py': D, 'state.json': S, 'questions.py': Q };
  function paneText(k) {
    if (k === 'zsh') return Z.hist.map((t) => t.map((x) => x[1]).join('').replace(/\s+$/, '')).join('\n');
    return CPN[k].lines.map((L) => L.toks.map((x) => x.t).join('').replace(/\s+$/, '')).join('\n');
  }
  function clip(txt) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt);
    return new Promise((ok, no) => {
      const ta = doc.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      doc.body.appendChild(ta); ta.select(); let r = false; try { r = doc.execCommand('copy'); } catch (_) { /* blocked */ } ta.remove(); r ? ok() : no();
    });
  }
  function copyPane(k) {
    const btn = $('.code-cp[data-cp="' + k + '"]', win), txt = paneText(k), n = txt ? txt.split('\n').length : 0;
    const done = (ok) => {
      if (btn) { clearTimeout(btn._t); btn.classList.toggle('done', ok); btn.setAttribute('aria-label', (ok ? 'copied ' : 'copy ') + k); if (ok) btn._t = setTimeout(() => { btn.classList.remove('done'); btn.setAttribute('aria-label', 'copy ' + k + ' (illustrative sample)'); }, 1700); }
      if (J.toast) J.toast(ok ? k + ' copied · ' + n + ' lines · illustrative sample' : 'copy blocked · select the text instead', ok ? 'ok' : 'info');
    };
    clip(txt).then(() => done(true), () => done(false));
  }
  win.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('.code-cp'); if (b && win.contains(b)) copyPane(b.dataset.cp); });

