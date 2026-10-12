  // identifier linking: hover (or tap) FLOOR / gate / dest / "execute" ... and every other use lights up across the four panes
  const IDC = /(?:^|\s)code-(?:v|ct|f|fa|fd|a|b|jk|s|t-dest|t-buy|t-sell|t-hold|t-close|t-flatten)(?:\s|$)/, LKS = '.code-doc span, .code-out span';
  const stT = $('#code-st-t'), stTxt = stT ? stT.textContent : '';
  let lkKey = '', lkOn = [];
  function keyOf(el) {
    if (!el || el.tagName !== 'SPAN' || !IDC.test(el.className)) return '';
    const t = el.textContent.trim().replace(/^f?["']|["']$/g, '');
    return /^[A-Za-z_][\w-]{1,24}$/.test(t) && !KW.has(t) ? t : '';
  }
  function link(el) {
    const raw = keyOf(el), key = raw.toLowerCase();
    if (key === lkKey) return;
    for (const e of lkOn) e.classList.remove('code-lk');
    lkOn = []; lkKey = key;
    if (!key) { if (stT) stT.textContent = stTxt; return; }
    const seen = new Set();
    for (const e of win.querySelectorAll(LKS)) if (e.firstChild && keyOf(e).toLowerCase() === key) { e.classList.add('code-lk'); lkOn.push(e); seen.add(e.closest('.code-pane')); }
    if (stT) stT.textContent = raw + ' · ' + lkOn.length + (lkOn.length === 1 ? ' ref' : ' refs') + ' · ' + seen.size + (seen.size === 1 ? ' pane' : ' panes');
  }
  win.addEventListener('pointerover', (e) => link(e.target));
  win.addEventListener('pointerleave', () => link(null));

