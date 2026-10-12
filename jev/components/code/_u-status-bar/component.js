  const nX = $('#code-n-x'), nR = $('#code-n-r'), nS = $('#code-n-s'), fl = $('#code-fl'), kl = $('#code-kl'), qb = J.$$('.code-qbar i', win);
  const st = { x: -1, r: -1, s: -1, f: '', k: '' };
  function status() {
    const c = J.S.dest;
    if (c.execute !== st.x) { st.x = c.execute; nX.textContent = c.execute; qb[0].style.flexGrow = Math.max(0.2, c.execute); }
    if (c.review !== st.r) { st.r = c.review; nR.textContent = c.review; qb[1].style.flexGrow = Math.max(0.2, c.review); }
    if (c.skip !== st.s) { st.s = c.skip; nS.textContent = c.skip; qb[2].style.flexGrow = Math.max(0.2, c.skip); }
    const f = J.S.floor.toFixed(2); if (f !== st.f) { st.f = f; fl.textContent = f; }
    const k = J.S.killed ? 'THROWN' : 'armed'; if (k !== st.k) { st.k = k; kl.textContent = k; }
  }
  function meta(P, t) {
    const typing = P.mode === 'type';
    const ln = String(P.cur + 1), ts = typing ? (P.base + Math.sin(t * 3.1) * 0.45 + Math.sin(t * 7.3) * 0.25).toFixed(1) : '0.0';
    if (ln !== P.mLnV) { P.mLnV = ln; P.mLn.textContent = ln; }
    if (ts !== P.mTsV) { P.mTsV = ts; P.mTs.textContent = ts; }
  }
  function zMeta(t) {
    const ln = String(Z.n), act = t - Z.lastPrint < 1.4, ts = act ? (7.7 + Math.sin(t * 3.7) * 0.5 + Math.sin(t * 9.1) * 0.2).toFixed(1) : '0.0';
    if (ln !== Z.mLnV) { Z.mLnV = ln; Z.mLn.textContent = ln; }
    if (ts !== Z.mTsV) { Z.mTsV = ts; Z.mTs.textContent = ts; }
  }

