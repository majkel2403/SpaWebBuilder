  /* ------------------------------------------------------------------ copy link / copy handoff json ------------------------------------------------------------------ */
  function copyText(txt) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt).catch(() => legacyCopy(txt));
    return legacyCopy(txt);
  }
  function legacyCopy(txt) {
    return new Promise((res, rej) => {
      const ta = document.createElement('textarea');
      ta.value = txt; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove(); ok ? res() : rej(new Error('copy'));
    });
  }
  function handoffJson() {
    const d = cur; if (!d) return '{}';
    return JSON.stringify({ action: d.action, size: d.action === 'hold' ? null : d.size, venue: d.venue, conf: +d.conf.toFixed(2), risk_ok: d.riskOk, floor: +d.floor.toFixed(2), reason: d.reason, dest: d.dest, simulated: true }, null, 2);
  }
  function wireCopy(btn, make, msg) {
    const lab = $('span:last-child', btn), orig = lab.textContent;
    btn.addEventListener('click', () => {
      copyText(make()).then(() => {
        btn.classList.add('ok'); lab.textContent = 'copied';
        if (J.toast) J.toast(msg, 'ok');
        clearTimeout(btn._t); btn._t = setTimeout(() => { btn.classList.remove('ok'); lab.textContent = orig; }, 1500);
      }).catch(() => { if (J.toast) J.toast('copy blocked by the browser', 'info'); });
    });
  }
  wireCopy($('#lab-cp-link'), () => { const base0 = location.href.split('#')[0]; return base0 + hashStr(); }, 'scenario link copied · simulated inputs');
  wireCopy($('#lab-cp-json'), handoffJson, 'handoff json copied · simulated');

