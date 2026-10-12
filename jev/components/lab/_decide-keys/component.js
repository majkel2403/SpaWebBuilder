  function decideNow(x, y) {
    if (tween) { FIELDS.forEach((f) => setVal(f, tween.to[f.k])); tween = null; }
    if (HAS_WA && !J.reduce && !J.hidden()) {
      const r = go.getBoundingClientRect(), rip = document.createElement('i');
      rip.className = 'lab-rip'; rip.style.left = (x == null ? r.width / 2 : x - r.left) + 'px'; rip.style.top = (y == null ? r.height / 2 : y - r.top) + 'px'; go.appendChild(rip);
      const a = rip.animate([{ transform: 'scale(.4)', opacity: 0.7 }, { transform: 'scale(14)', opacity: 0 }], { duration: 650, easing: 'ease-out' });
      a.onfinish = () => rip.remove();
    }
    touch();
    commit('decide');
  }
  go.addEventListener('click', (e) => decideNow(e.detail !== 0 ? e.clientX : null, e.detail !== 0 ? e.clientY : null));
  // keyboard: Enter = DECIDE (anywhere while the lab is on screen, unless a button / link has the focus), R = random scenario
  addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.defaultPrevented || e.repeat || e.ctrlKey || e.metaKey || e.altKey || !lv || document.getElementById('fx-boot')) return;
    const t = e.target, tag = t && t.tagName;
    if (/^(A|TEXTAREA|SELECT|SUMMARY)$/.test(tag) || (tag === 'BUTTON' && t.getAttribute('role') !== 'slider') || (t && t.closest && t.closest('dialog,[role=dialog],li[data-i]'))) return;
    e.preventDefault(); decideNow();
    go.classList.add('kp'); setTimeout(() => go.classList.remove('kp'), 160);
  });
  J.shortcut('r', () => { if (lv) { const b = $('.lab-sc-r'); runPreset('random', b); } }, 'lab: random scenario');
