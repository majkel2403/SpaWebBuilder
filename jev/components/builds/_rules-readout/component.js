  const rEls = ['floor', 'cap', 'pos', 'kill'].map((k) => $('#bld-r-' + k)), coreSt = $('#bld-core-st'), liveT = $('#bld-live-t');
  function updRules() {
    const k = S.killed ? 'halted' : 'armed';
    setT(rEls[0], S.floor.toFixed(2)); setT(rEls[1], J.usd(J.RULES.lossCap)); setT(rEls[2], J.RULES.maxPos + '%'); setT(rEls[3], k); setT(coreSt, k); setT(liveT, S.killed ? 'halted' : 'live');
  }

