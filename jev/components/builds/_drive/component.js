  /* harness (NOT part of the section): the section's bus handler drives all parts at once; a standalone page drives just the parts it contains */
  const driveTick = (d) => {
    if (typeof pushStream === 'function') pushStream(d, true);
    if (typeof updCost === 'function') updCost();
    if (typeof updMix === 'function') updMix();
    if (typeof pingRun === 'function') pingRun();
    if (typeof updStats === 'function') updStats();
  };
  J.bus.on('decision', driveTick);
  if (typeof updStats === 'function') updStats();
  if (typeof updMix === 'function') updMix();
  if (typeof updCost === 'function') updCost();
