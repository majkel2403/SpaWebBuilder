  const fnodes = J.$$('.code-fn', root).map((el) => ({ el, until: 0, on: false, b: el.querySelector('b'), d: el.dataset.d || '' }));
  function fnode(i, d) {
    const o = fnodes[i]; if (!o) return;
    if (d) { o.b.textContent = d.dest; if (o.d !== d.dest) { o.d = d.dest; o.el.setAttribute('data-d', d.dest); } }
    o.until = J.time + 0.8; if (!o.on) { o.on = true; o.el.classList.add('on'); }
  }
