  /* =====================================================================================
   * status ticker
   * ===================================================================================== */
  const mt = $('#dkt-mt'), set1 = $('#dkt-ms');
  const set2 = set1.cloneNode(true); set2.removeAttribute('id'); set2.setAttribute('aria-hidden', 'true');
  $$('[id]', set2).forEach((e) => e.removeAttribute('id')); mt.appendChild(set2);
  const kEls = {}; $$('[data-k]', mt).forEach((e) => (kEls[e.dataset.k] || (kEls[e.dataset.k] = [])).push(e));
  const chipEls = {}; $$('[data-ck]', mt).forEach((e) => (chipEls[e.dataset.ck] || (chipEls[e.dataset.ck] = [])).push(e));
  const holdChips = $$('.dkt-c', mt).filter((e) => e.querySelector('[data-k="holder"]'));
  const K = (k, s) => { const a = kEls[k]; if (a) for (let i = 0; i < a.length; i++) setT(a[i], s); };
  const chipC = (k, c) => { const a = chipEls[k]; if (a) for (let i = 0; i < a.length; i++) if (a[i].dataset.c !== c) a[i].dataset.c = c; };
  $$('.dkt-c', set1).forEach((e) => { e.tabIndex = 0; });       // keyboard: tab through the chips (the marquee holds while one has focus); the clone stays out of the tab order
  const mq = $('.dkt-mq', bar);
  if (mq) {                                                      // touch: tap the strip to hold it, tap again to resume
    mq.addEventListener('click', () => { if (matchMedia('(hover: none)').matches) mq.classList.toggle('dkt-hold'); });
  }
  let mqW = 0;
  J.watch(set1, (r) => {
    if (!r.width || (mqW && Math.abs(r.width - mqW) / mqW < 0.05)) return;
    mqW = r.width; mt.style.setProperty('--mqd', Math.round(r.width / (J.narrow() ? 36 : 46)) + 's');
  });
