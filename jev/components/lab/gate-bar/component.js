  /* ------------------------------------------------------------------ stage 3 : the gate ------------------------------------------------------------------ */
  function paintFloor(v) {
    v = +v; const t = v.toFixed(2);
    if (+floorR.input.value !== v) floorR.input.value = v;
    paintRow(floorR, v);
    gt.style.setProperty('--f', v);
    setTxt(flv, t);
    fl.setAttribute('aria-valuenow', t); fl.setAttribute('aria-valuetext', 'floor ' + t);
  }
  function rGate(d, pop) {
    const pass = d.conf >= d.floor, v = d.killed ? 'halt' : pass ? 'pass' : 'below';
    if (pop) {
      const col = v === 'pass' ? '46,230,166' : v === 'halt' ? '255,77,94' : '255,193,61';
      fxa(gt, [{ boxShadow: '0 0 0 0 rgba(' + col + ',.0), inset 0 0 0 0 rgba(' + col + ',0)' }, { boxShadow: '0 0 0 3px rgba(' + col + ',.55), 0 0 34px rgba(' + col + ',.55), inset 0 0 22px rgba(' + col + ',.35)', offset: 0.28 }, { boxShadow: '0 0 0 0 rgba(' + col + ',0), inset 0 0 0 0 rgba(' + col + ',0)' }], { duration: 900, delay: 520, easing: 'ease-out' });
      fxa($('.lab-cf-o', cf), [{ transform: 'scale(1)' }, { transform: 'scale(1.7)', offset: 0.22 }, { transform: 'scale(.88)', offset: 0.5 }, { transform: 'scale(1)' }], { duration: 640, delay: 560, easing: 'ease-out' });
      fxa(verdict, [{ transform: 'scale(1)' }, { transform: 'scale(1.22)', offset: 0.3 }, { transform: 'scale(1)' }], { duration: 520, delay: 560, easing: 'cubic-bezier(.2,1.6,.4,1)' });
      if (v === 'below' && tierN() >= 2) {
        fxa(gt, [{ transform: 'translateX(0)', filter: 'none' }, { transform: 'translateX(-5px)', filter: 'drop-shadow(4px 0 0 rgba(255,77,94,.85)) drop-shadow(-4px 0 0 rgba(0,229,255,.7))', offset: 0.14 }, { transform: 'translateX(6px)', offset: 0.3 }, { transform: 'translateX(-3px)', filter: 'drop-shadow(-3px 0 0 rgba(255,77,94,.8)) drop-shadow(3px 0 0 rgba(0,229,255,.6))', offset: 0.5 }, { transform: 'translateX(2px)', offset: 0.75 }, { transform: 'none', filter: 'none' }], { duration: 520, delay: 560, easing: 'steps(9, jump-none)' });
        fxa(verdict, [{ clipPath: 'inset(0 0 0 0)', transform: 'translateX(0)' }, { clipPath: 'inset(8% 0 58% 0)', transform: 'translateX(-7px)', offset: 0.16 }, { clipPath: 'inset(56% 0 6% 0)', transform: 'translateX(6px)', offset: 0.34 }, { clipPath: 'inset(0 0 0 0)', transform: 'translateX(-3px)', offset: 0.55 }, { clipPath: 'inset(30% 0 30% 0)', transform: 'translateX(4px)', offset: 0.7 }, { clipPath: 'inset(0 0 0 0)', transform: 'none' }], { duration: 480, delay: 560, easing: 'steps(8, jump-none)' });
      } else if (v === 'below') fxa(gt, [{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { duration: 300, delay: 560, easing: 'ease-out' });
      if (v === 'halt') fxa(gt, [{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(2px)' }, { transform: 'none' }], { duration: 420, delay: 560, easing: 'ease-out' });
    }
    cf.style.left = (d.conf * 100).toFixed(2) + '%'; cf.setAttribute('data-v', v);
    setTxt(cfv, d.conf.toFixed(2));
    tail.style.transform = 'scaleX(' + d.conf.toFixed(3) + ')';
    setTxt(verdict, v === 'halt' ? 'KILL SWITCH' : pass ? 'PASS' : 'BELOW FLOOR'); verdict.setAttribute('data-v', v);
    why.innerHTML = 'reason <b>' + esc(d.reason) + '</b> &rarr; <u style="color:' + DHEX[d.dest] + '">' + d.dest + '</u>';
  }

