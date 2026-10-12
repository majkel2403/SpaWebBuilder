  // (1) decision stream
  const dsList = $('#bld-ds'), RH = 28;
  function dsRow(d) {
    const b = B[bIdx[d.build]] || B[0], li = document.createElement('li');
    li.className = 'bld-dr'; li.dataset.d = d.dest;
    li.innerHTML = '<span class="bld-dr-b" data-p="' + b.prim + '">' + b.tag.toLowerCase() + '</span><span class="bld-dr-a">' + d.action + ' ' + short(d.symbol) + '</span><span class="bld-dr-c' + (d.conf < S.floor ? ' lo' : '') + '">' + d.conf.toFixed(2) + '</span><span class="bld-dr-d"><i></i>' + d.dest + '</span>';
    vtReg(li, () => b.name.toLowerCase() + ' · ' + d.symbol + ' · ' + d.venue + ' · ' + d.ms.toFixed(1) + ' ms · ' + (d.reason === 'ok' ? 'passed the gate' : d.reason));
    return li;
  }
  const DS_SLIDE = [{ transform: 'translateY(-' + RH + 'px)' }, { transform: 'translateY(0)' }], DS_FADE = [{ opacity: 0 }, { opacity: 1 }];
  function pushStream(d, animate) {
    const li = dsRow(d); dsList.insertBefore(li, dsList.firstChild);
    while (dsList.children.length > 7) dsList.removeChild(dsList.lastChild);
    if (animate && !reduce) {
      J.animate(dsList, DS_SLIDE, { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' });
      J.animate(li, DS_FADE, { duration: 520 });
    }
  }
  (function seed() {
    const src = J.recent.length >= 6 ? J.recent.slice(0, 6).reverse() : Array.from({ length: 6 }, () => J.makeDecision());
    src.forEach((d) => pushStream(d, false));
  })();

