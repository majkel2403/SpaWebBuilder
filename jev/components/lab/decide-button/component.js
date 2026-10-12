  function setDirty(on) {
    if (dirty === on) return;
    dirty = on; go.classList.toggle('dirty', on);
    if (on) setStat('inputs changed · press decide');
  }
