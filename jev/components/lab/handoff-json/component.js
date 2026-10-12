  const jS = (v) => '<span class="s">"' + esc(v) + '"</span>', jN = (v) => '<span class="n">' + v + '</span>', jB = (v) => '<span class="b">' + v + '</span>';
  function rActs(d, pop) {
    const rowsJ = [['action', jS(d.action)], ['size', jN(d.size)], ['venue', jS(d.venue)], ['conf', jN(d.conf.toFixed(2))], ['risk_ok', jB(d.riskOk)], ['reason', jS(d.reason)], ['dest', jS(d.dest)]];
    let h = '<span class="lab-jl p" style="--i:0">{</span>';
    rowsJ.forEach((r, i) => { h += '<span class="lab-jl" style="--i:' + (i + 1) + '">  <u class="k">"' + r[0] + '"</u><span class="p">:</span> ' + r[1] + (i < rowsJ.length - 1 ? '<span class="p">,</span>' : '') + '</span>'; });
    h += '<span class="lab-jl p" style="--i:8">}</span>';
    jsEl.className = 'lab-js' + (pop ? ' type' : '');
    jsEl.innerHTML = h;
    destEl.setAttribute('data-c', DC[d.dest]);
    const T = d.dest.toUpperCase();
    destT.setAttribute('data-text', T);
    if (pop) J.scramble(destT, T, 460); else setTxt(destT, T);
    setTxt(destS, d.dest === 'execute' ? 'order → ' + d.venue + ' · ' + fmtSize(d.size) : d.dest === 'review' ? '→ human review queue' : 'no order · nothing sent');
    if (pop) {
      anim(destEl, [{ transform: 'perspective(520px) rotateX(64deg) scale(1.45)', opacity: 0 }, { transform: 'perspective(520px) rotateX(0) scale(1)', opacity: 1 }], { duration: 460, easing: 'cubic-bezier(.2,1.3,.3,1)' });
      anim(destR, [{ opacity: 0.9, transform: 'scale(.9)' }, { opacity: 0, transform: 'scale(1.3)' }], { duration: 760, easing: 'ease-out' });
      if (d.killed && d.dest === 'review') anim(destEl, [{ transform: 'translateX(0)' }, { transform: 'translateX(-9px) rotate(-.6deg)' }, { transform: 'translateX(8px) rotate(.5deg)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(-2px)' }, { transform: 'none' }], { duration: 460, delay: 440, easing: 'ease-out' });
      if (d.dest === 'skip') {
        fxa(destEl, [{ filter: 'brightness(1)' }, { filter: 'brightness(.5) saturate(.3)', offset: 0.4 }, { filter: 'brightness(.8) saturate(.7)' }], { duration: 900, delay: 440, easing: 'ease-out' });
        fxa(destT, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.8, .55)', opacity: 0.25, offset: 0.4 }, { transform: 'scale(1)', opacity: 1 }], { duration: 820, delay: 440, easing: 'cubic-bezier(.3,0,.3,1)' });
      }
      if (d.dest === 'execute' && !J.reduce) {
        destEl.classList.remove('shim'); void destEl.offsetWidth; destEl.classList.add('shim');
        clearTimeout(destEl._sh); destEl._sh = setTimeout(() => destEl.classList.remove('shim'), 1500);
      }
    }
  }

