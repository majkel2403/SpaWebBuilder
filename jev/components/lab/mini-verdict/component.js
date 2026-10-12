  function rMini(d) {
    miniEl.setAttribute('data-d', d.dest);
    setTxt(miA, d.action); setTxt(miS, d.action === 'hold' ? '-' : fmtSize(d.size)); setTxt(miC, d.conf.toFixed(2)); setTxt(miD, d.dest);
  }
