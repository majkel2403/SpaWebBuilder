  // (3) cost this run
  const costV = $('#bld-cost-v'), costS = $('#bld-cost-s'), costJ = $('#bld-cost-j');
  const costFmt = (v) => '$' + v.toFixed(4);
  const costO = odo(costV, costFmt(S.cost), costFmt(S.cost).replace(/[1-9]/g, '0')); let costOn = false; // starts on zeros, rolls up when the tile scrolls in
  function updCost() {
    if (costOn) costO.set(costFmt(S.cost));
    setT(costS, fmt(S.count) + ' decisions · $' + (S.cost / Math.max(1, S.count)).toFixed(6) + ' each');
    setT(costJ, '$' + S.cost.toFixed(3));
  }
  J.onView(costV, () => { costOn = true; costO.set(costFmt(S.cost), { stagger: true, quiet: true }); }, { threshold: 0.4 });

