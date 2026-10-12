/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* used: JEV.mod, $, $$. Optional: JEV.toast (fx module). Data: none - the text to copy is the data-copy attribute of the <pre> next to each button.
 * Everything is simulated. */
JEV.mod('code-copy-button', () => {
  const J = JEV, $ = J.$, doc = document;
  const root = $('#cx-cp'); if (!root) return;
  const st = $('.cx-cp-st', root);
  function clip(txt) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt);
    return new Promise((ok, no) => {
      const ta = doc.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      doc.body.appendChild(ta); ta.select(); let r = false; try { r = doc.execCommand('copy'); } catch (_) { /* blocked */ } ta.remove(); r ? ok() : no();
    });
  }
  root.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('.code-cp'); if (!btn || !root.contains(btn)) return;
    const src = $('.cx-cp-src', btn.closest('.code-pane')), txt = src.dataset.copy, name = btn.dataset.cp, n = txt.split('\n').length;
    const done = (ok) => {
      clearTimeout(btn._t); btn.classList.toggle('done', ok); btn.setAttribute('aria-label', (ok ? 'copied ' : 'copy ') + name);
      if (ok) btn._t = setTimeout(() => { btn.classList.remove('done'); btn.setAttribute('aria-label', 'copy ' + name + ' (illustrative sample)'); }, 1700);
      st.textContent = ok ? name + ' copied · ' + n + (n === 1 ? ' line' : ' lines') + ' · illustrative sample' : 'copy blocked · select the text instead';
      if (J.toast) J.toast(st.textContent, ok ? 'ok' : 'info');
    };
    clip(txt).then(() => done(true), () => done(false));
  });
});
