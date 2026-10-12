  // (2) latency by build
  const latEl = $('#bld-lat'), latT = $('#bld-t-lat'), MAXMS = 9;
  const latRows = B.map((b, i) => {
    const li = document.createElement('li'); li.className = 'bld-lr'; li.dataset.i = i; li.style.setProperty('--bc', PCOL[b.prim]);
    li.innerHTML = '<span>' + b.tag.toLowerCase() + '</span><div class="tr"><i></i></div><b>' + b.ms.toFixed(1) + '</b>';
    latEl.appendChild(li); const o = { li, fill: $('.tr i', li), val: $('b', li), base: b.ms, cur: b.ms };
    vtReg(li, () => b.tag.toLowerCase() + ' · ' + o.cur.toFixed(1) + ' ms · ' + Math.round(o.cur / MAXMS * 100) + '% of the ' + MAXMS + ' ms scale');
    return o;
  });
  function jitterLat() { latRows.forEach((r) => { const v = r.base * (0.86 + Math.random() * 0.3); r.cur = v; r.fill.style.transform = 'scaleX(' + clamp(v / MAXMS, 0.03, 1).toFixed(3) + ')'; setT(r.val, v.toFixed(1)); }); vtRefresh(); }
  jitterLat();
  let latLast = 0;
  J.task(latT, (t) => { if (t - latLast < 0.7) return; latLast = t; jitterLat(); });

