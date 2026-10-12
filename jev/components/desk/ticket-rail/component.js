/* desk/ticket-rail — the ticket's six-stage rail: dots ignite one by one, the fill and marker travel, the "now" row names the working agent
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Data: bus 'decision' (restarts the rail at stage 0 and shows its numbers), 'kill' (halts, marker turns red). Without decisions it loops by itself.
 */
JEV.mod('desk-ticket-rail', () => {
  'use strict';
  const J = JEV;
  const rail = J.$('#dkw-rail');
  if (!rail) return;
  const txt = (el, v) => { if (el && el.textContent !== v) el.textContent = v; };
  const dots = J.$$('.dkw-sd', rail), now = J.$('.dkw-now'), orb = J.$('#dkw-now-o');
  const AG = [['spotter', 'scan', 'green', '46,230,166', '#2ee6a6'], ['prior', 'research', 'amber', '255,193,61', '#ffc13d'], ['edge', 'price', 'pink', '255,46,110', '#ff2e6e'],
    ['kelly', 'size', 'violet', '166,107,255', '#a66bff'], ['taker', 'fill', 'blue', '77,141,255', '#4d8dff'], ['closer', 'close', 'orange', '255,138,61', '#ff8a3d']];
  let q = 0, last = null, killed = !!J.S.killed, timer = 0;
  function extra(d, i) {
    if (!d) return ['8 books', '3 priors', 'edge n/a', 'size n/a', 'fill n/a', 'close n/a'][i];
    return [d.symbol.toLowerCase(), 'p ' + d.conf.toFixed(2), J.sgn(d.net, 1) + 'bp edge', d.size + '% of capital', J.fmt(d.state.price, 1), d.dest][i];
  }
  function paint() {
    const a = AG[q];
    rail.style.setProperty('--q', q); rail.style.setProperty('--mc', killed ? '#ff4d5e' : a[4]);
    dots.forEach((d, i) => d.classList.toggle('on', i <= q));
    now.style.setProperty('--ac-rgb', a[3]); now.style.setProperty('--ac', a[4]);
    const oc = 'orb ' + (killed ? 'red' : a[2]); if (orb.className !== oc) orb.className = oc;
    txt(J.$('#dkw-stn'), '0' + (q + 1)); txt(J.$('#dkw-stv'), killed ? 'halted' : a[1]);
    txt(J.$('#dkw-now-n'), a[0]); txt(J.$('#dkw-now-v'), killed ? 'halted' : a[1]); txt(J.$('#dkw-now-x'), extra(last, q));
  }
  function next() {
    clearTimeout(timer);
    if (!killed && !J.hidden()) { q = (q + 1) % 6; paint(); }
    timer = setTimeout(next, 1500);
  }
  J.bus.on('decision', (d) => { last = d; q = 0; paint(); clearTimeout(timer); timer = setTimeout(next, 1500); });
  J.bus.on('kill', (k) => { killed = !!k; paint(); });
  paint(); timer = setTimeout(next, 1500);
});
