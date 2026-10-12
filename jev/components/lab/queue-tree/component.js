  /* ------------------------------------------------------------------ stage 4 : code acts ------------------------------------------------------------------ */
  const treeEl = $('#lab-tree'), folders = {};
  treeEl.innerHTML = '<div class="lab-tr-h">queue/</div>';
  ['execute', 'review', 'skip'].forEach((k) => {
    const fo = document.createElement('div');
    fo.className = 'lab-fo'; fo.setAttribute('data-c', DC[k]); fo.setAttribute('data-d', k);
    fo.innerHTML = '<div class="lab-fo-h"><b>' + k + '/</b><em>0</em></div><div class="lab-fi-l"></div>';
    treeEl.appendChild(fo);
    folders[k] = { el: fo, em: $('em', fo), list: $('.lab-fi-l', fo) };
  });
  const flyDelay = () => (J.reduce || tierN() < 2 ? 0 : 430);
  function renderFolder(k, fresh) {
    const f = folders[k], a = files[k];
    setTxt(f.em, String(fcount[k]));
    let h = '';
    for (let i = 0; i < 2; i++) h += a[i] ? '<div class="lab-fi' + (fresh && i === 0 ? ' new' : '') + '"' + (fresh && i === 0 && flyDelay() ? ' style="animation-delay:' + flyDelay() + 'ms"' : '') + '>' + a[i] + '</div>' : '<div class="lab-fi ghost">-</div>';
    f.list.innerHTML = h;
  }
  function landFile(d, pop) {
    const k = d.dest;
    files[k].unshift(d.file); if (files[k].length > 2) files[k].length = 2;
    fcount[k]++;
    renderFolder(k, pop);
    if (pop) { folders[k].el.classList.add('hit'); setTimeout(() => folders[k].el.classList.remove('hit'), 1700); }
  }
