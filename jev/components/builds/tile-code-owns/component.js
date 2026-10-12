  // (6) what code owns
  const ownEl = $('#bld-own');
  [['the menu', 96, C.pink, ''], ['thresholds', 92, C.pink, ''], ['orders', 84, C.pink2, ''], ['the stop', 100, C.amber, 'stop'], ['the log', 70, '#ffd4e4', '']].forEach(([label, w, col, cl], n) => {
    const li = document.createElement('li'); li.className = 'bld-or ' + cl; li.style.setProperty('--bc', col); li.style.setProperty('--w', (w / 100).toFixed(2)); li.style.setProperty('--n', String(n));
    li.innerHTML = '<i></i><span>' + label + '</span><div class="tr"><i></i></div><em>code</em>'; ownEl.appendChild(li);
    vtReg(li, () => label + ' · held by code · ' + w + '/100, illustrative');
  });

