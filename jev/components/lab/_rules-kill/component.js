  killB.addEventListener('click', () => J.setKilled(!J.S.killed));
  function paintKill(on) {
    killB.classList.toggle('on', on); killB.setAttribute('aria-checked', String(on));
    setTxt(killS, on ? 'halted · every order → review' : 'armed · orders flow');
  }
  J.bus.on('floor', (v) => { paintFloor(v); schedHash(); if (!tween) { live(); scheduleCommit(420, 'floor'); } });
  J.bus.on('kill', (on) => { paintKill(on); fx.restyle(); if (!tween) { live(); scheduleCommit(90, 'kill'); } });

