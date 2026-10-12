  // (5) where it runs
  const runEl = $('#bld-run');
  const RUNS = [['api · typed answers', 8, C.pink], ['your laptop (hermes)', 1, C.green], ['gpu box (dots)', 1, C.amber]];
  let apiSq = [];
  RUNS.forEach(([label, n, col], r) => {
    const li = document.createElement('li'); li.className = 'bld-rr'; li.style.setProperty('--bc', col);
    let sq = ''; for (let i = 0; i < 10; i++) sq += '<i class="' + (i < n ? 'on' : '') + '" style="--n:' + i + '"></i>';
    li.innerHTML = '<div class="l"><span>' + label + '</span><b>' + n + '</b></div><div class="bld-sg">' + sq + '</div>';
    runEl.appendChild(li); if (!r) apiSq = $$('.bld-sg i.on', li);
    vtReg(li, () => label + ' · ' + n + ' of 10 builds');
  });
  let runCur = 0;
  const PING = [{ offset: 0, filter: 'brightness(2.2)', transform: 'scale(1.35)' }];
  function pingRun() { const e = apiSq[runCur++ % apiSq.length]; if (e && !reduce) J.animate(e, PING, { duration: 700, easing: 'ease-out' }); }

