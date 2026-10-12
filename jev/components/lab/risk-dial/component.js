  const ckHost = $('#lab-ck'), ckRows = {};
  [['spread', 'spread'], ['latency', 'latency'], ['age', 'age'], ['loss', 'loss'], ['dd', 'drawdown'], ['vol', 'vol'], ['kill', 'kill']].forEach((c) => {
    const li = document.createElement('li');
    li.innerHTML = '<span>' + c[1] + '</span><u></u>';
    ckHost.appendChild(li);
    ckRows[c[0]] = { li, u: $('u', li) };
  });
