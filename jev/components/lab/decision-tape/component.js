  /* ------------------------------------------------------------------ tape / mini / status ------------------------------------------------------------------ */
  function renderTape(fresh) {
    let h = '';
    tape.forEach((r, i) => {
      h += '<li' + (fresh && i === 0 ? ' class="fresh"' : '') + ' data-i="' + i + '" tabindex="0" role="button" aria-label="restore inputs of #' + hex2(r.n) + ': ' + r.action + ', ' + r.dest + '"><span>#' + hex2(r.n) + '</span><b class="lab-tp-a" data-a="' + r.action + '">' + r.action + '</b><span>' + (r.action === 'hold' ? '-' : fmtSize(r.size)) +
        '</span><span class="lab-tp-c">' + r.conf.toFixed(2) + '</span><i class="lab-tp-d" data-d="' + r.dest + '">' + r.dest + '</i><em>' + esc(r.reason) + '</em></li>';
    });
    tpEl.innerHTML = h;
    if (fresh) anim(tpEl, [{ transform: 'translateY(-28px)' }, { transform: 'none' }], { duration: 340, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
  function pushTape(d) {
    tape.unshift({ n: d.n, action: d.action, size: d.size, conf: d.conf, dest: d.dest, reason: d.reason, st: Object.assign({}, d.st), floor: d.floor });
    if (tape.length > 5) tape.pop();
  }
