  /* ================================================================ ticket in flight + the six agents ================================================================ */
  const hexRgb = (h) => { const n = parseInt(h.slice(1), 16); return (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255); };
  const T = {
    id: J.$('#dkw-tid'), tk: J.$('#dkw-tk'), side: J.$('#dkw-side'), sym: J.$('#dkw-sym'), dest: J.$('#dkw-dest'), not: J.$('#dkw-not'), edge: J.$('#dkw-edge'), sz: J.$('#dkw-sz'), px: J.$('#dkw-px'), cf: J.$('#dkw-cf'),
    rail: J.$('#dkw-rail'), tl: J.$('.dkw-tl', root), sds: J.$$('.dkw-sd', root), now: J.$('.dkw-now', root), nowO: J.$('#dkw-now-o'), nowN: J.$('#dkw-now-n'), nowV: J.$('#dkw-now-v'), nowX: J.$('#dkw-now-x'),
    cd: J.$('#dkw-cd'), cdf: J.$('#dkw-cdf'), stn: J.$('#dkw-stn'), stv: J.$('#dkw-stv'), loop: J.$('#dkw-loop'),
  };
  const TAB = {}, ROW = {};
  J.$$('.dkw-tab', tabsEl).forEach((el) => (TAB[el.dataset.k] = { el, ts: J.$('.dkw-ts', el) }));
  J.$$('.dkw-ar', root).forEach((el) => (ROW[el.dataset.k] = { el, v: J.$('.dkw-av', el), bar: J.$('.dkw-ab i', el), an: J.$('.dkw-an i', el), role: J.$('.dkw-an i', el).textContent }));
  const ST = { step: -1, loop: 14, tk: null, ttl: 104, t0: 0, dur: 1000, pnl: 0, pin: null, working: -1, status: AGK.map(() => 'idle'), alt: 0 };
  const LAST = {}, SIDE = { buy: 'buy', sell: 'sell', close: 'close', flatten: 'flat' };
  const ORBC = { spotter: 'green', prior: 'amber', edge: 'pink', kelly: 'violet', taker: 'blue', closer: 'orange' };
  const AGCOL = [4, 0, 2, 5, 3, 6], AMB_COL = [0, 1, 2, 3, 0, 2];
  const activeKey = () => ST.pin || (ST.working >= 0 ? AGK[ST.working] : null);
  const flash = (el) => { const a = el.classList.contains('ha'); el.classList.remove(a ? 'ha' : 'hb'); el.classList.add(a ? 'hb' : 'ha'); };

  /* presentation is skipped while neither the card nor the tab strip is on screen (or the tab is hidden): the state machine keeps running, `dirty` marks that
   * the DOM lags it, and resync() repaints everything from state when the strip comes back into view */
  const live = () => (cardIn || tabsIn) && !document.hidden;
  let dirty = false, nowKey = '', railN = -1;
  const PA = AGK.map(() => ({ on: null, pin: null })); // what the DOM currently shows per agent
