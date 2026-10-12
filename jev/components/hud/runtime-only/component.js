/* Runtime-only (hud/runtime-only): a blank stage that tails the live data bus as JSON; handy to test a bus feed or a swapped-in data source.
   Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
   JEV.* used: JEV.S {killed,floor,count,cost,ms[],counts,dest} · JEV.market {price,open,hist[]} · JEV.recent[] (newest first) · JEV.fmt · bus 'decision' 'tick' 'kill' 'floor'.
   Decision fields shown: id, symbol, action, size, conf, dest, reason, ms. */
JEV.mod('runtime-only', () => {
  const J = JEV, $ = (id) => document.getElementById(id);
  const st = $('rtState'), mk = $('rtMarket'), tail = $('rtTail'), rate = $('rtRate');
  if (!st && !mk && !tail) return;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const val = (v) => typeof v === 'number' ? '<span class="rt-n">' + v + '</span>' : typeof v === 'boolean' ? '<span class="rt-b">' + v + '</span>' : '<span class="rt-s">' + esc(JSON.stringify(v)) + '</span>';
  const obj = (o) => '{\n' + Object.keys(o).map((k) => '  <span class="rt-k">' + k + '</span>: ' + val(o[k])).join(',\n') + '\n}';
  const paintState = () => {
    if (!st) return;
    const S = J.S, med = S.ms.slice().sort((a, b) => a - b)[(S.ms.length / 2) | 0];
    st.innerHTML = obj({ killed: S.killed, floor: +S.floor.toFixed(2), count: S.count, cost: +S.cost.toFixed(5), median_ms: +med.toFixed(1) })
      + '\n<span class="rt-k">dest</span> ' + esc(JSON.stringify(S.dest)) + '\n<span class="rt-k">counts</span> ' + esc(JSON.stringify(S.counts));
  };
  const paintMarket = () => {
    if (!mk) return;
    const M = J.market;
    mk.innerHTML = obj({ price: +M.price.toFixed(2), open: M.open, change_pct: +(((M.price / M.open) - 1) * 100).toFixed(3), hist_len: M.hist.length });
  };
  const line = (d, fresh) => {
    const r = document.createElement('span'); r.className = 'rt-l rt-' + d.dest + (fresh ? ' new' : '');
    r.textContent = JSON.stringify({ id: d.id, symbol: d.symbol, action: d.action, size: d.size, conf: +d.conf.toFixed(2), dest: d.dest, reason: d.reason, ms: +d.ms.toFixed(1) });
    return r;
  };
  let times = [];
  J.bus.on('decision', (d) => {
    paintState();
    if (tail) { tail.prepend(line(d, !J.reduce)); while (tail.children.length > 40) tail.lastChild.remove(); }
    const now = performance.now(); times.push(now); times = times.filter((x) => now - x < 10000);
    if (rate) rate.textContent = (times.length / Math.min(10, Math.max(1, (now - times[0]) / 1000))).toFixed(1) + ' dec/s';
  });
  J.bus.on('tick', paintMarket);
  J.bus.on('kill', paintState); J.bus.on('floor', paintState);
  if (tail) for (const d of J.recent.slice().reverse()) tail.prepend(line(d, false));
  paintState(); paintMarket();
});
