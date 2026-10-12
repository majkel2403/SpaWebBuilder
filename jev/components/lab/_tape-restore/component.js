  // tape row -> put that decision's inputs (and floor) back
  function restoreRow(i) {
    const r = tape[i]; if (!r) return;
    setActive(null);
    glide(Object.assign({}, r.st));
    if (r.floor != null && Math.abs(r.floor - J.S.floor) > 0.0001) J.setFloor(r.floor);
    setStat('restoring #' + hex2(r.n) + ' inputs');
    fxa($('.lab-ctl'), [{ boxShadow: '0 0 0 0 rgba(255,46,110,0)' }, { boxShadow: '0 0 0 2px rgba(255,46,110,.55), 0 0 40px rgba(255,46,110,.35)' }, { boxShadow: '0 0 0 0 rgba(255,46,110,0)' }], { duration: 700, easing: 'ease-out' });
  }
  tpEl.addEventListener('click', (e) => { const li = e.target.closest('li[data-i]'); if (li) restoreRow(+li.getAttribute('data-i')); });
  tpEl.addEventListener('keydown', (e) => { if (e.key !== 'Enter' && e.key !== ' ') return; const li = e.target.closest('li[data-i]'); if (li) { e.preventDefault(); restoreRow(+li.getAttribute('data-i')); } });
