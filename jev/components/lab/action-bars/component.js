  /* ------------------------------------------------------------------ stage 2 : typed questions ------------------------------------------------------------------ */
  const pbHost = $('#lab-pb'), pbRows = {};
  ACTIONS.forEach((a, i) => {
    const li = document.createElement('li');
    li.setAttribute('data-a', a);
    li.innerHTML = '<span>' + a + '</span><i class="lab-bar"><u style="--d:' + (i * 0.06).toFixed(2) + 's"></u></i><em>0%</em>';
    pbHost.appendChild(li);
    pbRows[a] = { li, u: $('u', li), em: $('em', li) };
  });
