  const szHost = $('#lab-sz'), szCols = [];
  SIZES.forEach((s, i) => {
    const el = document.createElement('div');
    el.className = 'lab-szc';
    el.innerHTML = '<em>0%</em><i class="lab-col"><u style="--d:' + (i * 0.07).toFixed(2) + 's"></u></i><span>' + fmtSize(s) + '</span>';
    szHost.appendChild(el);
    szCols.push({ el, u: $('u', el), em: $('em', el) });
  });
