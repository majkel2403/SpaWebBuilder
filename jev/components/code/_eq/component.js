  /* audio-bars glyph: breathes, jumps on every decision, rides the typing */
  const eq = $('#code-eq'), NB = 16, bars = new Float32Array(NB); let eg = null, ew = 72, eh = 20, egr = null;
  J.watch(eq, () => { const f = J.fit(eq); eg = f.g; ew = f.W; eh = f.H; egr = eg.createLinearGradient(0, eh, 0, 0); egr.addColorStop(0, '#ff2e6e'); egr.addColorStop(0.55, '#ff9cc4'); egr.addColorStop(1, '#ffffff'); });
  J.task(eq, (t, dt) => {
    if (!eg) return;
    const typing = (D.mode === 'type' ? 1 : 0) + (S.mode === 'type' ? 1 : 0) + (Q.mode === 'type' ? 1 : 0);
    eqAct *= Math.exp(-dt * 3.2);
    const act = Math.min(1, eqAct + typing * 0.22), bw = (ew - (NB - 1) * 2) / NB;
    eg.clearRect(0, 0, ew, eh);
    eg.fillStyle = J.S.killed ? '#ff8a96' : egr;
    for (let i = 0; i < NB; i++) {
      const n = 0.5 + 0.5 * Math.sin(t * (2.1 + i * 0.41) + i * 1.9), n2 = 0.5 + 0.5 * Math.sin(t * (4.3 + i * 0.27) + i * 0.7);
      const tg = clamp(0.1 + 0.17 * n + act * (0.28 + 0.55 * n2), 0.08, 1);
      bars[i] += (tg - bars[i]) * (tg > bars[i] ? 0.5 : 0.12);
      const h = Math.max(2, Math.round(bars[i] * eh)), x = Math.round(i * (bw + 2));
      eg.fillRect(x, eh - h, Math.max(1.5, bw), h);
    }
  });


