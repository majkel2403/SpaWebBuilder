  /* ---------- chips (hard rules) ---------- */
  setT($('#hr-r-loss'), J.usd(J.RULES.lossCap)); setT($('#hr-r-pos'), J.RULES.maxPos + '%');
  const killBtn = $('#hr-kill'), killTxt = $('#hr-kill-t');
  function showKill(v) {
    killed = !!v;
    killBtn.setAttribute('aria-pressed', String(killed));
    killTxt.lastChild.nodeValue = killed ? 'halted' : 'armed';
    if (jevOrb) { jevOrb.classList.toggle('red', killed); jevOrb.classList.toggle('pink', !killed); }
    buildStaticA(); armText();
  }
  killBtn.addEventListener('click', () => J.setKilled(!S.killed));

