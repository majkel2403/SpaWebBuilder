  function bestFeed(sell) { let b = FD[0]; for (let i = 1; i < FD.length; i++) if (sell ? FD[i].price > b.price : FD[i].price < b.price) b = FD[i]; return b; }

  /** what each agent says about the current ticket (simulated, terse, lowercase) */
  function describe(i, kd) {
    const d = ST.tk;
    if (!d) return { text: 'warming up the books', chip: '—' };
    const s = d.state, sym = d.symbol.toLowerCase(), sd = SIDE[d.action] || d.action, sell = d.action === 'sell', f = bestFeed(sell);
    switch (i) {
      case 0: return { text: kd ? 'scan only · kill switch holds every order' : 'scanned 8 books · best ' + (sell ? 'bid ' : 'ask ') + f.k + ' ' + fmt(f.price, 1), chip: CITIES[f.city].c, city: f.city };
      case 1: { const p = clamp(0.5 + ((d.p[d.action] || d.conf) - 0.5) * 0.42 + J.gauss() * 0.015, 0.52, 0.9); return { text: kd ? 'prior refreshed · nothing sent' : 'prior ' + d.action + ' p ' + p.toFixed(2) + ' · ' + fmt(J.ri(420, 1840)) + ' similar books', chip: p.toFixed(2).replace('0.', '.') }; }
      case 2: { const n = Math.abs(d.net || 0); return { text: kd ? 'edge priced · routed to human review' : 'edge +' + n.toFixed(1) + 'bps net of costs · ' + s.regime, chip: '+' + n.toFixed(1) }; }
      case 3: return { text: 'size ' + d.size + '% of capital · cap ' + J.RULES.maxPos + '% · risk_ok ' + (d.riskOk ? 'yes' : 'no'), chip: d.size + '%' };
      case 4: { const slip = 0.15 + s.spread_bps * 0.25 + Math.random() * 0.2; return { text: 'crossed ' + s.spread_bps.toFixed(1) + 'bps spread · ' + sd + ' ' + d.size + '% ' + sym + ' on ' + f.k, chip: slip.toFixed(1) + 'bp', city: f.city }; }
      default: { const p = ST.pnl; return { text: 'closed ' + sym + ' at ' + (p >= 0 ? 'target' : 'stop') + ' · ' + (p >= 0 ? '+' : '') + J.usd(p, 2), chip: (p >= 0 ? '+' : '-') + '$' + Math.abs(Math.round(p)), pnl: p, city: f.city }; }
    }
  }
  function unbar(k) { const t = TAB[k].el, r = ROW[k].bar; t.style.removeProperty('--v'); t.style.removeProperty('--d'); r.style.removeProperty('--v'); r.style.removeProperty('--d'); }
  function runBar(k, ms) { const d = Math.round(ms) + 'ms'; TAB[k].el.style.setProperty('--d', d); TAB[k].el.style.setProperty('--v', '1'); ROW[k].bar.style.setProperty('--d', d); ROW[k].bar.style.setProperty('--v', '1'); }
  function paintRow(k) { const ev = LAST[k]; if (!ev) return; const r = ROW[k]; txt(r.v, ev.chip); txt(r.an, ev.text); if (r.an.title !== ev.text) r.an.title = ev.text; }
