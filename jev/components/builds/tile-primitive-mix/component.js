  // (4) primitive mix
  const mixEl = $('#bld-mix'), mixT = $('#bld-mix-t');
  const MIXC = [['choice', C.pink], ['flag', C.pink2], ['score', '#ffd4e4']];
  const mixRows = MIXC.map(([k, col]) => {
    const li = document.createElement('li'); li.className = 'bld-mr'; li.style.setProperty('--bc', col);
    li.innerHTML = '<div class="l"><span>' + k + '</span><b><span class="n">0</span><em>0%</em></b></div><div class="tr"><i></i></div>';
    mixEl.appendChild(li);
    const o = { k, n: odo($('.n', li), '0'), p: $('em', li), bar: $('.tr i', li) };
    vtReg(li, () => { const c = S.counts, tot = Math.max(1, c.choice + c.flag + c.score); return k + ' · ' + fmt(c[k]) + ' answers · ' + (c[k] / tot * 100).toFixed(1) + '% of the mix'; });
    return o;
  });
  const mixO = odo(mixT, '0');
  function updMix() {
    const c = S.counts, tot = c.choice + c.flag + c.score;
    mixRows.forEach((r) => { const v = c[r.k]; r.n.set(fmt(v)); setT(r.p, Math.round((v / tot) * 100) + '%'); r.bar.style.transform = 'scaleX(' + (v / tot * 1.5).toFixed(3) + ')'; });
    mixO.set(fmt(tot)); vtRefresh();
  }

