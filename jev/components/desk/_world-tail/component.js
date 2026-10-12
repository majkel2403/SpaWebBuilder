
  /* ================================================================ boot ================================================================ */
  for (let i = 0; i < 12; i++) updateFeeds(J.market.price, false);
  updateFeeds(J.market.price, true);
  adopt();
  if (killed) for (let j = 3; j < 6; j++) setStatus(j, 'halted');
  applyOn();
  J.watch(body, layout);
  J.task(body, frame);
  timer = setTimeout(runStep, 900);
});
